import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { AppDataSource } from '../data-source';
import { StepsRecord } from '../entities/StepsRecord';
import { User } from '../entities/User';

const router = express.Router();

// 获取步数记录列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const requester = (req as any).user || {};
    const {
      page = 1,
      limit = 20,
      date,
      startDate,
      endDate,
      minSteps,
      maxSteps,
      userId
    } = req.query as any;

    const effectiveUserId = requester?.is_admin && userId ? +userId : requester?.id;
    if (!effectiveUserId) {
      return res.status(400).json({ success: false, message: '用户校验失败' });
    }

    const qb = AppDataSource.getRepository(StepsRecord)
      .createQueryBuilder('record')
      .where('record.userId = :userId', { userId: effectiveUserId });

    // 日期过滤：优先使用精确 date；否则使用 startDate/endDate 范围
    if (date) {
      qb.andWhere('record.date = :date', { date });
    } else if (startDate && endDate) {
      qb.andWhere('record.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    } else if (startDate) {
      qb.andWhere('record.date >= :startDate', { startDate });
    } else if (endDate) {
      qb.andWhere('record.date <= :endDate', { endDate });
    }

    // 步数范围过滤
    if (minSteps) {
      qb.andWhere('record.steps >= :minSteps', { minSteps: +minSteps });
    }
    if (maxSteps) {
      qb.andWhere('record.steps <= :maxSteps', { maxSteps: +maxSteps });
    }

    qb.orderBy('record.date', 'DESC').addOrderBy('record.time', 'DESC')
      .skip((+page - 1) * +limit)
      .take(+limit);

    const [records, total] = await qb.getManyAndCount();

    return res.json({
      success: true,
      data: {
        records,
        pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '获取步数记录失败' });
  }
});

// 创建步数记录
router.post('/', authMiddleware, async (req, res) => {
  try {
    const requester = (req as any).user || {};
    const body = req.body || {};

    const effectiveUserId = requester?.is_admin && body.userId ? +body.userId : requester?.id;
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: effectiveUserId } });
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    const steps = Number(body.steps);
    if (!Number.isFinite(steps) || steps < 0) {
      return res.status(400).json({ success: false, message: '步数无效' });
    }

    // 计算卡路里消耗（每步约0.04卡路里）和距离（每步约0.0008公里）
    const caloriesBurned = steps * 0.04;
    const distanceKm = steps * 0.0008;

    const now = new Date();
    const defaultDate = now.toISOString().split('T')[0];
    const defaultTime = now.toTimeString().split(' ')[0];

    const recordData: Partial<StepsRecord> = {
      steps,
      caloriesBurned,
      distanceKm,
      date: body.date || defaultDate,
      time: body.time || defaultTime,
      source: body.source || '手动记录',
      notes: body.notes || '',
      userId: user.id
    };

    const record = AppDataSource.getRepository(StepsRecord).create(recordData as any);
    await AppDataSource.getRepository(StepsRecord).save(record);

    return res.status(201).json({ success: true, data: record, message: '步数记录创建成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '创建步数记录失败' });
  }
});

// 删除步数记录
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const record = await AppDataSource.getRepository(StepsRecord).findOne({
      where: { id: +req.params.id, userId }
    });
    
    if (!record) return res.status(404).json({ success: false, message: '步数记录不存在' });
    
    await AppDataSource.getRepository(StepsRecord).remove(record);
    res.json({ success: true, message: '步数记录删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除步数记录失败' });
  }
});

// 获取步数统计
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const requester = (req as any).user || {};
    const { date, userId } = req.query as any;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const effectiveUserId = requester?.is_admin && userId ? +userId : requester?.id;

    const records = await AppDataSource.getRepository(StepsRecord)
      .createQueryBuilder('record')
      .where('record.userId = :userId AND record.date = :targetDate', { userId: effectiveUserId, targetDate })
      .getMany();

    const totalSteps = records.reduce((sum, record) => sum + (record.steps || 0), 0);
    const totalCalories = records.reduce((sum, record) => sum + (record.caloriesBurned || 0), 0);
    const totalDistance = records.reduce((sum, record) => sum + (record.distanceKm || 0), 0);

    return res.json({
      success: true,
      data: {
        date: targetDate,
        totalSteps,
        totalCalories: Math.round(totalCalories * 100) / 100,
        totalDistance: Math.round(totalDistance * 100) / 100,
        records
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '获取步数统计失败' });
  }
});

// 获取步数趋势数据（最近7天）
router.get('/stats/trend', authMiddleware, async (req, res) => {
  try {
    const requester = (req as any).user || {};
    const { days, startDate, endDate, userId } = req.query as any;

    const effectiveUserId = requester?.is_admin && userId ? +userId : requester?.id;
    const maxDays = days ? Math.min(+days, 30) : 7;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) start.setDate(start.getDate() - maxDays + 1);

    const records = await AppDataSource.getRepository(StepsRecord)
      .createQueryBuilder('record')
      .select(['record.date', 'SUM(record.steps) as totalSteps'])
      .where('record.userId = :userId AND record.date BETWEEN :startDate AND :endDate', {
        userId: effectiveUserId,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      })
      .groupBy('record.date')
      .orderBy('record.date', 'ASC')
      .getRawMany();

    const dateRange: Array<{ date: string; steps: number }> = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const record = records.find((r: any) => {
        let recordDate: Date;
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
        steps: record ? parseInt(record.totalSteps || record.sum || record.totalsteps || 0) : 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return res.json({ success: true, data: dateRange });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '获取步数趋势失败' });
  }
});

export default router;