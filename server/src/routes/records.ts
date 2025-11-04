import express, { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

// Create record
router.post('/', async (req: Request, res: Response) => {
  const { type, date, steps, sleep_hours, food_name, calories } = req.body || {};
  const allowed = ['steps', 'sleep', 'diet'];
  if (!type || !allowed.includes(type) || !date) {
    return res.status(400).json({ message: 'type and date required (type in steps|sleep|diet)' });
  }
  try {
    const sql = `INSERT INTO records (user_id, type, date, steps, sleep_hours, food_name, calories)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await query(sql, [req.user!.id, type, date, steps || null, sleep_hours || null, food_name || null, calories || null]);
    return res.json({ message: 'Record created' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// List records with filters
router.get('/', async (req: Request, res: Response) => {
  const { startDate, endDate, type } = req.query;
  const conditions = ['user_id = ?'];
  const params: any[] = [req.user!.id];
  if (type) { conditions.push('type = ?'); params.push(type); }
  if (startDate) { conditions.push('date >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('date <= ?'); params.push(endDate); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const rows = await query(`SELECT id, type, date, steps, sleep_hours, food_name, calories, created_at, updated_at FROM records ${where} ORDER BY date DESC, id DESC`, params);
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update record (own record only)
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, date, steps, sleep_hours, food_name, calories } = req.body || {};
  try {
    const own = await query('SELECT id FROM records WHERE id = ? AND user_id = ?', [id, req.user!.id]);
    if (own.length === 0) return res.status(404).json({ message: 'Record not found' });
    const sql = `UPDATE records SET type = ?, date = ?, steps = ?, sleep_hours = ?, food_name = ?, calories = ? WHERE id = ?`;
    await query(sql, [type || null, date || null, steps || null, sleep_hours || null, food_name || null, calories || null, id]);
    return res.json({ message: 'Record updated' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete record (own record only)
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const own = await query('SELECT id FROM records WHERE id = ? AND user_id = ?', [id, req.user!.id]);
    if (own.length === 0) return res.status(404).json({ message: 'Record not found' });
    await query('DELETE FROM records WHERE id = ?', [id]);
    return res.json({ message: 'Record deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---- Analysis Endpoints ----
// Weekly steps trend (last 7 days including today)
router.get('/analysis/weekly-steps', async (req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT date, COALESCE(SUM(steps), 0) AS total_steps
       FROM records
       WHERE user_id = ? AND type = 'steps' AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY date
       ORDER BY date ASC`,
      [req.user!.id]
    );
    // Ensure we return exactly 7 days (fill missing days)
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const found = rows.find(r => new Date(r.date).toISOString().slice(0,10) === iso);
      result.push({ date: iso, total_steps: found ? Number(found.total_steps) : 0 });
    }
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Daily calories distribution
router.get('/analysis/daily-calories', async (req: Request, res: Response) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'date required (YYYY-MM-DD)' });
  try {
    const rows = await query(
      `SELECT id, food_name, COALESCE(calories, 0) AS calories
       FROM records WHERE user_id = ? AND type = 'diet' AND date = ?
       ORDER BY id ASC`,
      [req.user!.id, date]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Average steps and goal check
router.get('/analysis/steps-average', async (req: Request, res: Response) => {
  const { startDate, endDate, threshold } = req.query;
  if (!startDate || !endDate) return res.status(400).json({ message: 'startDate & endDate required' });
  const goal = Number(threshold || 10000);
  try {
    const rows = await query(
      `SELECT AVG(steps) AS avg_steps FROM records
       WHERE user_id = ? AND type = 'steps' AND date BETWEEN ? AND ?`,
      [req.user!.id, startDate, endDate]
    );
    const avg = rows[0]?.avg_steps ? Number(rows[0].avg_steps) : 0;
    res.json({ average_steps: avg, threshold: goal, meet_goal: avg >= goal });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;