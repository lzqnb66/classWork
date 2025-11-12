import express, { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';
import { AppDataSource } from '../data-source';
import { DietRecord } from '../entities/DietRecord';
import { SleepRecord } from '../entities/SleepRecord';
import { StepsRecord } from '../entities/StepsRecord';

const router = express.Router();

router.use(authMiddleware);

// 高级查询接口
router.get('/advanced', async (req: Request, res: Response) => {
  const {
    dataType,
    startDate,
    endDate,
    startTime,
    endTime,
    sortOrder,
    keyword,
    page = '1',
    pageSize = '20'
  } = req.query;

  try {
    const userId = req.user!.id;
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const offset = (pageNum - 1) * size;

    // 确定要查询的表
    const tablesToQuery: string[] = [];
    if (!dataType || dataType === '全部') {
      tablesToQuery.push('diet', 'sleep', 'steps');
    } else {
      switch (dataType) {
        case '饮食记录':
          tablesToQuery.push('diet');
          break;
        case '睡眠记录':
          tablesToQuery.push('sleep');
          break;
        case '步数记录':
          tablesToQuery.push('steps');
          break;
        default:
          tablesToQuery.push('diet', 'sleep', 'steps');
      }
    }

    // 分别查询每个表
    const allResults: any[] = [];
    let totalCount = 0;

    for (const tableType of tablesToQuery) {
      let queryBuilder;
      
      switch (tableType) {
        case 'diet':
          queryBuilder = AppDataSource.getRepository(DietRecord)
            .createQueryBuilder('diet')
            .where('diet.userId = :userId', { userId });
          break;
        case 'sleep':
          queryBuilder = AppDataSource.getRepository(SleepRecord)
            .createQueryBuilder('sleep')
            .where('sleep.userId = :userId', { userId });
          break;
        case 'steps':
          queryBuilder = AppDataSource.getRepository(StepsRecord)
            .createQueryBuilder('steps')
            .where('steps.userId = :userId', { userId });
          break;
        default:
          // 跳过未知类型
          continue;
      }

      // 日期范围筛选
      if (startDate) {
        queryBuilder = queryBuilder.andWhere('date >= :startDate', { startDate });
      }
      if (endDate) {
        queryBuilder = queryBuilder.andWhere('date <= :endDate', { endDate });
      }

      // 关键词搜索
      if (keyword) {
        const keywordParam = `%${keyword}%`;
        switch (tableType) {
          case 'diet':
            queryBuilder = queryBuilder.andWhere('(foodName LIKE :keyword OR notes LIKE :keyword)', { keyword: keywordParam });
            break;
          case 'sleep':
            queryBuilder = queryBuilder.andWhere('notes LIKE :keyword', { keyword: keywordParam });
            break;
          case 'steps':
            queryBuilder = queryBuilder.andWhere('notes LIKE :keyword', { keyword: keywordParam });
            break;
        }
      }

      // 获取总数
      const count = await queryBuilder.getCount();
      totalCount += count;

      // 构建排序
      if (sortOrder) {
        switch (sortOrder) {
          case '时间升序':
            queryBuilder = queryBuilder.orderBy('date', 'ASC').addOrderBy('id', 'ASC');
            break;
          case '时间降序':
            queryBuilder = queryBuilder.orderBy('date', 'DESC').addOrderBy('id', 'DESC');
            break;
          case '数值升序':
            if (tableType === 'diet') {
              queryBuilder = queryBuilder.orderBy('calories', 'ASC');
            } else if (tableType === 'sleep') {
              queryBuilder = queryBuilder.orderBy('duration', 'ASC');
            } else if (tableType === 'steps') {
              queryBuilder = queryBuilder.orderBy('steps', 'ASC');
            }
            break;
          case '数值降序':
            if (tableType === 'diet') {
              queryBuilder = queryBuilder.orderBy('calories', 'DESC');
            } else if (tableType === 'sleep') {
              queryBuilder = queryBuilder.orderBy('duration', 'DESC');
            } else if (tableType === 'steps') {
              queryBuilder = queryBuilder.orderBy('steps', 'DESC');
            }
            break;
        }
      } else {
        // 默认排序
        queryBuilder = queryBuilder.orderBy('date', 'DESC').addOrderBy('id', 'DESC');
      }

      // 分页查询
      const results = await queryBuilder
        .skip(offset)
        .take(size)
        .getMany();

      // 格式化结果
      const formattedResults = results.map((record: any) => {
        switch (tableType) {
          case 'diet':
            return {
              id: record.id,
              type: '饮食记录',
              date: record.date,
              time: record.time || '',
              value: record.calories,
              unit: '卡路里',
              food: record.foodName,
              source: record.source,
              notes: record.notes,
              createdAt: record.createdAt,
              updatedAt: record.updatedAt
            };
          case 'sleep':
            return {
              id: record.id,
              type: '睡眠记录',
              date: record.date,
              time: record.startTime,
              value: record.duration,
              unit: '小时',
              food: '',
              source: record.source,
              notes: record.notes,
              createdAt: record.createdAt,
              updatedAt: record.updatedAt
            };
          case 'steps':
            return {
              id: record.id,
              type: '步数记录',
              date: record.date,
              time: record.time || '',
              value: record.steps,
              unit: '步',
              food: '',
              source: record.source,
              notes: record.notes,
              createdAt: record.createdAt,
              updatedAt: record.updatedAt
            };
          default:
            return null;
        }
      }).filter(Boolean);

      allResults.push(...formattedResults);
    }

    // 对所有结果进行排序
    if (sortOrder) {
      allResults.sort((a, b) => {
        switch (sortOrder) {
          case '时间升序':
            return new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id;
          case '时间降序':
            return new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id;
          case '数值升序':
            return (a.value || 0) - (b.value || 0);
          case '数值降序':
            return (b.value || 0) - (a.value || 0);
          default:
            return 0;
        }
      });
    }

    // 应用分页
    const paginatedResults = allResults.slice(offset, offset + size);

    res.json({
      data: paginatedResults,
      pagination: {
        page: pageNum,
        pageSize: size,
        total: totalCount,
        totalPages: Math.ceil(totalCount / size)
      }
    });

  } catch (e) {
    console.error('查询错误:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取统计数据
router.get('/stats', async (req: Request, res: Response) => {
  const { startDate, endDate, dataType } = req.query;

  try {
    const conditions: string[] = ['user_id = ?'];
    const params: any[] = [req.user!.id];

    if (dataType && dataType !== '全部') {
      conditions.push('type = ?');
      params.push(dataType === '饮食记录' ? 'diet' : 
                 dataType === '步数记录' ? 'steps' : 
                 dataType === '睡眠记录' ? 'sleep' : dataType);
    }

    if (startDate) {
      conditions.push('date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询各类型记录数量
    const typeStatsSql = `
      SELECT record_type as type, COUNT(*) as count
      FROM records
      ${whereClause}
      GROUP BY record_type
    `;

    const typeStats = await query(typeStatsSql, params);

    // 查询数值统计
    const valueStatsSql = `
      SELECT 
        record_type as type,
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN record_type = 'diet' THEN calories 
                          WHEN record_type = 'steps' THEN steps 
                          WHEN record_type = 'sleep' THEN sleep_hours END), 0) as total_value,
        COALESCE(AVG(CASE WHEN record_type = 'diet' THEN calories 
                         WHEN record_type = 'steps' THEN steps 
                         WHEN record_type = 'sleep' THEN sleep_hours END), 0) as avg_value
      FROM records
      ${whereClause}
      GROUP BY record_type
    `;

    const valueStats = await query(valueStatsSql, params);

    // 日期范围统计
    const dateRangeSql = `
      SELECT 
        MIN(date) as min_date,
        MAX(date) as max_date,
        COUNT(DISTINCT date) as days_count
      FROM records
      ${whereClause}
    `;

    const dateRange = await query(dateRangeSql, params);

    res.json({
      type_stats: typeStats,
      value_stats: valueStats,
      date_range: dateRange[0] || { min_date: null, max_date: null, days_count: 0 }
    });

  } catch (e) {
    console.error('统计查询错误:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;