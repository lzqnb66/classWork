import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { DietRecord } from '../entities/DietRecord';
import { SleepRecord } from '../entities/SleepRecord';
import { StepsRecord } from '../entities/StepsRecord';
import { authMiddleware } from '../middleware/auth';
import { Between } from 'typeorm';

const router = Router();

// 获取用户健康数据统计
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: '需要提供开始日期和结束日期' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // 获取指定日期范围内的所有记录
    const [dietRecords, sleepRecords, stepsRecords] = await Promise.all([
      AppDataSource.getRepository(DietRecord).find({
        where: { userId: userId, date: Between(start, end) },
        order: { date: 'ASC' }
      }),
      AppDataSource.getRepository(SleepRecord).find({
        where: { userId: userId, date: Between(start, end) },
        order: { date: 'ASC' }
      }),
      AppDataSource.getRepository(StepsRecord).find({
        where: { userId: userId, date: Between(start, end) },
        order: { date: 'ASC' }
      })
    ]);

    // 按类型分类统计
    const stats = {
      steps: {
        total: 0,
        average: 0,
        days: 0
      },
      sleep: {
        total: 0,
        average: 0,
        days: 0
      },
      diet: {
        totalCalories: 0,
        averageCalories: 0,
        days: 0
      }
    };

    // 计算步数统计
    if (stepsRecords.length > 0) {
      stats.steps.total = stepsRecords.reduce((sum, r) => sum + (r.steps || 0), 0);
      stats.steps.average = Math.round(stats.steps.total / stepsRecords.length);
      stats.steps.days = stepsRecords.length;
    }

    // 计算睡眠统计
    if (sleepRecords.length > 0) {
      stats.sleep.total = sleepRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
      stats.sleep.average = parseFloat((stats.sleep.total / sleepRecords.length).toFixed(1));
      stats.sleep.days = sleepRecords.length;
    }

    // 计算饮食统计
    if (dietRecords.length > 0) {
      stats.diet.totalCalories = dietRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
      stats.diet.averageCalories = Math.round(stats.diet.totalCalories / dietRecords.length);
      stats.diet.days = dietRecords.length;
    }

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        stats,
        recordCounts: {
          total: dietRecords.length + sleepRecords.length + stepsRecords.length,
          steps: stepsRecords.length,
          sleep: sleepRecords.length,
          diet: dietRecords.length
        }
      }
    });

  } catch (error) {
    console.error('获取健康统计错误:', error);
    res.status(500).json({ error: '获取健康统计数据失败' });
  }
});

// 获取健康数据趋势
router.get('/trends', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type, days = 7 } = req.query;
    
    if (!type || !['steps', 'sleep', 'diet'].includes(type as string)) {
      return res.status(400).json({ error: '需要提供有效的类型参数: steps, sleep, 或 diet' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    let trends: any[] = [];
    let summary = { total: 0, average: 0, days: 0 };

    if (type === 'steps') {
      const records = await AppDataSource.getRepository(StepsRecord).find({
        where: { userId: userId, date: Between(daysAgo, new Date()) },
        order: { date: 'ASC' }
      });

      trends = records.map(record => ({
        date: record.date.toISOString().split('T')[0],
        value: record.steps || 0
      }));

      summary = {
        total: trends.reduce((sum, t) => sum + t.value, 0),
        average: trends.length > 0 ? Math.round(trends.reduce((sum, t) => sum + t.value, 0) / trends.length) : 0,
        days: trends.length
      };
    } else if (type === 'sleep') {
      const records = await AppDataSource.getRepository(SleepRecord).find({
        where: { userId: userId, date: Between(daysAgo, new Date()) },
        order: { date: 'ASC' }
      });

      trends = records.map(record => ({
        date: record.date.toISOString().split('T')[0],
        value: record.duration || 0
      }));

      summary = {
        total: trends.reduce((sum, t) => sum + t.value, 0),
        average: trends.length > 0 ? parseFloat((trends.reduce((sum, t) => sum + t.value, 0) / trends.length).toFixed(1)) : 0,
        days: trends.length
      };
    } else if (type === 'diet') {
      const records = await AppDataSource.getRepository(DietRecord).find({
        where: { userId: userId, date: Between(daysAgo, new Date()) },
        order: { date: 'ASC' }
      });

      trends = records.map(record => ({
        date: record.date.toISOString().split('T')[0],
        value: record.calories || 0
      }));

      summary = {
        total: trends.reduce((sum, t) => sum + t.value, 0),
        average: trends.length > 0 ? Math.round(trends.reduce((sum, t) => sum + t.value, 0) / trends.length) : 0,
        days: trends.length
      };
    }

    res.json({
      success: true,
      data: {
        type,
        period: days,
        trends,
        summary
      }
    });

  } catch (error) {
    console.error('获取健康趋势错误:', error);
    res.status(500).json({ error: '获取健康趋势数据失败' });
  }
});

// 获取健康建议
router.get('/recommendations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // 获取最近7天的数据
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const [dietRecords, sleepRecords, stepsRecords] = await Promise.all([
      AppDataSource.getRepository(DietRecord).find({
        where: { userId: userId, date: Between(weekAgo, new Date()) }
      }),
      AppDataSource.getRepository(SleepRecord).find({
        where: { userId: userId, date: Between(weekAgo, new Date()) }
      }),
      AppDataSource.getRepository(StepsRecord).find({
        where: { userId: userId, date: Between(weekAgo, new Date()) }
      })
    ]);

    const recommendations = [];

    // 步数建议
    if (stepsRecords.length > 0) {
      const avgSteps = stepsRecords.reduce((sum, r) => sum + (r.steps || 0), 0) / stepsRecords.length;
      
      if (avgSteps < 8000) {
        recommendations.push({
          category: '运动',
          message: `您最近的平均步数为 ${Math.round(avgSteps)} 步，建议每天增加2000步以达到10000步的健康目标`,
          priority: 'medium'
        });
      }
    }

    // 睡眠建议
    if (sleepRecords.length > 0) {
      const avgSleep = sleepRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / sleepRecords.length;
      
      if (avgSleep < 7) {
        recommendations.push({
          category: '睡眠',
          message: `您最近的平均睡眠时长为 ${avgSleep.toFixed(1)} 小时，建议保证每天7-9小时的充足睡眠`,
          priority: 'high'
        });
      } else if (avgSleep > 9) {
        recommendations.push({
          category: '睡眠',
          message: `您最近的平均睡眠时长为 ${avgSleep.toFixed(1)} 小时，建议保持规律作息，避免过度睡眠`,
          priority: 'low'
        });
      }
    }

    // 饮食建议
    if (dietRecords.length > 0) {
      const totalCalories = dietRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
      const avgDailyCalories = totalCalories / dietRecords.length;
      
      if (avgDailyCalories < 1200) {
        recommendations.push({
          category: '饮食',
          message: `您最近的平均每日热量摄入为 ${Math.round(avgDailyCalories)} 卡路里，建议适当增加营养摄入`,
          priority: 'medium'
        });
      } else if (avgDailyCalories > 2500) {
        recommendations.push({
          category: '饮食',
          message: `您最近的平均每日热量摄入为 ${Math.round(avgDailyCalories)} 卡路里，建议适当控制饮食`,
          priority: 'medium'
        });
      }
    }

    // 如果没有数据，提供通用建议
    if (recommendations.length === 0) {
      recommendations.push({
        category: '通用',
        message: '继续保持良好的健康习惯！建议定期记录您的健康数据以获得个性化建议',
        priority: 'low'
      });
    }

    res.json({
      success: true,
      data: {
        recommendations,
        summary: {
          totalRecords: dietRecords.length + sleepRecords.length + stepsRecords.length,
          analysisPeriod: '最近7天'
        }
      }
    });

  } catch (error) {
    console.error('获取健康建议错误:', error);
    res.status(500).json({ error: '获取健康建议失败' });
  }
});

export default router;