import express, { Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// List users (basic info)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const rows = await query('SELECT id, username, is_admin, created_at FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// List records with admin filters
router.get('/records', async (req: Request, res: Response) => {
  const { userId, startDate, endDate, type } = req.query;
  const conditions = [];
  const params: any[] = [];
  if (userId) { conditions.push('user_id = ?'); params.push(userId); }
  if (type) { conditions.push('type = ?'); params.push(type); }
  if (startDate) { conditions.push('date >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('date <= ?'); params.push(endDate); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const rows = await query(
      `SELECT id, user_id, type, date, steps, sleep_hours, food_name, calories, created_at, updated_at FROM records ${where} ORDER BY date DESC, id DESC`,
      params
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin delete
router.delete('/records/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM records WHERE id = ?', [id]);
    res.json({ message: 'Record deleted by admin' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;