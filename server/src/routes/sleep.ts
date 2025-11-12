import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { AppDataSource } from '../data-source';
import { SleepRecord } from '../entities/SleepRecord';
import { User } from '../entities/User';

const router = express.Router();

// 计算睡眠持续时间（小时）
function calculateSleepDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  let startTotalMinutes = startHours * 60 + startMinutes;
  let endTotalMinutes = endHours * 60 + endMinutes;
  
  // 处理跨天睡眠（结束时间小于开始时间）
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60; // 加上一天的分钟数
  }
  
  const durationMinutes = endTotalMinutes - startTotalMinutes;
  return Math.round((durationMinutes / 60) * 10) / 10; // 保留1位小数
}

// 获取睡眠记录列表
router.get('/records', authMiddleware, async (req, res) => {
  try {
    const authUser = (req as any).user || {};
    const isAdmin = !!authUser.is_admin;
    const {
      page = 1,
      limit = 20,
      userId,
      date,
      startDate,
      endDate,
      minHours,
      maxHours
    } = req.query as any;

    const pageNum = Number(page) || 1;
    const size = Number(limit) || 20;

    const qb = AppDataSource.getRepository(SleepRecord)
      .createQueryBuilder('record')
      .orderBy('record.date', 'DESC')
      .addOrderBy('record.startTime', 'DESC')
      .skip((pageNum - 1) * size)
      .take(size);

    const targetUserId = isAdmin && userId ? Number(userId) : authUser.id;
    qb.where('record.userId = :userId', { userId: targetUserId });

    if (date) {
      qb.andWhere('record.date = :date', { date });
    }
    if (startDate) {
      qb.andWhere('record.date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('record.date <= :endDate', { endDate });
    }

    const minH = minHours !== undefined && minHours !== '' ? Number(minHours) : undefined;
    const maxH = maxHours !== undefined && maxHours !== '' ? Number(maxHours) : undefined;
    if (minH !== undefined) {
      qb.andWhere('record.duration >= :minH', { minH });
    }
    if (maxH !== undefined) {
      qb.andWhere('record.duration <= :maxH', { maxH });
    }

    const [records, total] = await qb.getManyAndCount();

    res.json({
      success: true,
      data: {
        records,
        pagination: { page: pageNum, limit: size, total, pages: Math.ceil(total / size) }
      }
    });
  } catch (error) {
    console.error('获取睡眠记录失败:', error);
    res.status(500).json({ success: false, message: '获取睡眠记录失败' });
  }
});

// 创建睡眠记录
router.post('/records', authMiddleware, async (req, res) => {
  try {
    const authUser = (req as any).user || {};
    const isAdmin = !!authUser.is_admin;

    const targetUserId = isAdmin && req.body.userId ? Number(req.body.userId) : authUser.id;
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: targetUserId } });
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    const {
      startTime,
      endTime,
      date,
      quality,
      notes,
      deepSleepMinutes,
      lightSleepMinutes,
      remSleepMinutes,
      wakeTimes
    } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: '请提供开始时间与结束时间' });
    }

    // 计算睡眠持续时间
    const duration = calculateSleepDuration(String(startTime), String(endTime));

    const recordData = {
      startTime: String(startTime),
      endTime: String(endTime),
      duration,
      date: date || new Date().toISOString().split('T')[0],
      quality: quality || '一般',
      notes: notes || '',
      deepSleepMinutes: Number(deepSleepMinutes ?? 0),
      lightSleepMinutes: Number(lightSleepMinutes ?? 0),
      remSleepMinutes: Number(remSleepMinutes ?? 0),
      wakeTimes: Number(wakeTimes ?? 0),
      source: '手动记录',
      userId: user.id
    };

    const record = AppDataSource.getRepository(SleepRecord).create(recordData);
    await AppDataSource.getRepository(SleepRecord).save(record);

    res.status(201).json({ success: true, data: record, message: '睡眠记录创建成功' });
  } catch (error) {
    console.error('创建睡眠记录失败:', error);
    res.status(500).json({ success: false, message: '创建睡眠记录失败' });
  }
});

// 删除睡眠记录（管理员可删除任何记录，普通用户仅可删除自己的）
router.delete('/records/:id', authMiddleware, async (req, res) => {
  try {
    const authUser = (req as any).user || {};
    const isAdmin = !!authUser.is_admin;
    const recordRepo = AppDataSource.getRepository(SleepRecord);

    const record = await recordRepo.findOne({ where: { id: +req.params.id } });
    if (!record) return res.status(404).json({ success: false, message: '睡眠记录不存在' });

    if (!isAdmin && record.userId !== authUser.id) {
      return res.status(403).json({ success: false, message: '无权限删除该记录' });
    }

    await recordRepo.remove(record);
    res.json({ success: true, message: '睡眠记录删除成功' });
  } catch (error) {
    console.error('删除睡眠记录失败:', error);
    res.status(500).json({ success: false, message: '删除睡眠记录失败' });
  }
});

// 获取睡眠统计摘要（管理员可指定 userId）
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const authUser = (req as any).user || {};
    const isAdmin = !!authUser.is_admin;

    const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const targetUserId = isAdmin && req.query.userId ? Number(req.query.userId) : authUser.id;

    const records = await AppDataSource.getRepository(SleepRecord)
      .createQueryBuilder('record')
      .where('record.userId = :userId AND record.date = :targetDate', { userId: targetUserId, targetDate })
      .getMany();

    const totalDuration = records.reduce((sum, record) => sum + record.duration, 0);
    const avgDuration = records.length > 0 ? totalDuration / records.length : 0;

    const qualityCounts = {
      '极好': 0,
      '良好': 0,
      '一般': 0,
      '较差': 0,
      '很差': 0
    } as Record<string, number>;

    records.forEach(record => {
      if (qualityCounts.hasOwnProperty(record.quality)) {
        qualityCounts[record.quality]++;
      }
    });

    res.json({ 
      success: true, 
      data: { 
        date: targetDate, 
        totalDuration: Math.round(totalDuration * 10) / 10,
        avgDuration: Math.round(avgDuration * 10) / 10,
        recordCount: records.length,
        qualityCounts,
        records 
      } 
    });
  } catch (error) {
    console.error('获取睡眠统计失败:', error);
    res.status(500).json({ success: false, message: '获取睡眠统计失败' });
  }
});

// 获取睡眠趋势数据（最近7-30天，管理员可指定 userId）
router.get('/stats/trend', authMiddleware, async (req, res) => {
  try {
    const authUser = (req as any).user || {};
    const isAdmin = !!authUser.is_admin;
    const days = req.query.days ? Math.min(+req.query.days, 30) : 7;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    const targetUserId = isAdmin && req.query.userId ? Number(req.query.userId) : authUser.id;

    const records = await AppDataSource.getRepository(SleepRecord)
      .createQueryBuilder('record')
      .select(['record.date', 'SUM(record.duration) as totalDuration'])
      .where('record.userId = :userId AND record.date BETWEEN :startDate AND :endDate', 
        { userId: targetUserId, 
          startDate: startDate.toISOString().split('T')[0], 
          endDate: endDate.toISOString().split('T')[0] })
      .groupBy('record.date')
      .orderBy('record.date', 'ASC')
      .getRawMany();

    const dateRange: any[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const record = records.find(r => {
        let recordDate;
        if (r.record_date instanceof Date) {
          recordDate = new Date(r.record_date.getTime() + 8 * 60 * 60 * 1000);
        } else if (typeof r.record_date === 'string') {
          const utcDate = new Date(r.record_date);
          recordDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
        } else {
          recordDate = new Date(r.record_date);
        }
        const recordDateStr = recordDate.toISOString().split('T')[0];
        return recordDateStr === dateStr;
      });

      dateRange.push({
        date: dateStr,
        duration: record ? parseFloat(record.totalDuration || record.sum || record.totalduration || 0) : 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ success: true, data: dateRange });
  } catch (error) {
    console.error('获取睡眠趋势失败:', error);
    res.status(500).json({ success: false, message: '获取睡眠趋势失败' });
  }
});

export default router;