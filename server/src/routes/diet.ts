import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { AppDataSource } from '../data-source';
import { DietRecord } from '../entities/DietRecord';
import { User } from '../entities/User';

const router = express.Router();

// 获取饮食记录列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUser: any = (req as any).user;
    const { page = '1', limit = '20', userId, foodName, startDate, endDate } = req.query as any;

    // 仅管理员可通过查询参数指定 userId，否则使用当前登录用户
    const targetUserId = (currentUser?.is_admin && userId) ? parseInt(userId) : currentUser.id;

    const pageNum = parseInt(page);
    const size = parseInt(limit);
    const qb = AppDataSource.getRepository(DietRecord)
      .createQueryBuilder('diet')
      .where('diet.userId = :userId', { userId: targetUserId });

    if (foodName) {
      qb.andWhere('diet.foodName LIKE :foodName', { foodName: `%${String(foodName).trim()}%` });
    }
    if (startDate) {
      qb.andWhere('diet.date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('diet.date <= :endDate', { endDate });
    }

    qb.orderBy('diet.date', 'DESC').addOrderBy('diet.time', 'DESC');

    const [records, total] = await qb.skip((pageNum - 1) * size).take(size).getManyAndCount();

    res.json({
      success: true,
      data: {
        records,
        pagination: { page: pageNum, limit: size, total, pages: Math.ceil(total / size) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取饮食记录失败' });
  }
});

// 创建饮食记录
router.post('/', authMiddleware, async (req, res) => {
  try {
    const currentUser: any = (req as any).user;
    const requestedUserId = req.body.userId;
    const targetUserId = (currentUser?.is_admin && requestedUserId) ? parseInt(requestedUserId) : currentUser.id;

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: targetUserId } });
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    const recordData = {
      ...req.body,
      calories: +req.body.calories,
      protein: req.body.protein !== undefined ? +req.body.protein : 0,
      carbs: req.body.carbs !== undefined ? +req.body.carbs : 0,
      fat: req.body.fat !== undefined ? +req.body.fat : 0,
      quantity: req.body.quantity ? +req.body.quantity : 1,
      date: req.body.date || new Date().toISOString().split('T')[0],
      time: req.body.time || new Date().toTimeString().split(' ')[0],
      unit: req.body.unit || '份',
      userId: user.id
    };
    
    const record = AppDataSource.getRepository(DietRecord).create(recordData);
    await AppDataSource.getRepository(DietRecord).save(record);
    
    res.status(201).json({ success: true, data: record, message: '饮食记录创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建饮食记录失败' });
  }
});

// 删除饮食记录
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const record = await AppDataSource.getRepository(DietRecord).findOne({
      where: { id: +req.params.id, userId }
    });
    
    if (!record) return res.status(404).json({ success: false, message: '饮食记录不存在' });
    
    await AppDataSource.getRepository(DietRecord).remove(record);
    res.json({ success: true, message: '饮食记录删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除饮食记录失败' });
  }
});

// 获取饮食统计
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const currentUser: any = (req as any).user;
    const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const { userId } = req.query as any;
    const targetUserId = (currentUser?.is_admin && userId) ? parseInt(userId) : currentUser.id;

    const records = await AppDataSource.getRepository(DietRecord)
      .createQueryBuilder('record')
      .where('record.userId = :userId AND record.date = :targetDate', { userId: targetUserId, targetDate })
      .getMany();

    const totalStats = {
      totalCalories: records.reduce((sum, record) => sum + (record.calories || 0), 0),
      totalProtein: records.reduce((sum, record) => sum + Number(record.protein || 0), 0),
      totalCarbs: records.reduce((sum, record) => sum + Number(record.carbs || 0), 0),
      totalFat: records.reduce((sum, record) => sum + Number(record.fat || 0), 0)
    };

    res.json({ success: true, data: { date: targetDate, totalStats, records } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取饮食统计失败' });
  }
});

export default router;