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

// Get user detail
router.get('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT id, username, is_admin, created_at FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user permission
router.patch('/users/:id/permission', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_admin } = req.body;
  
  if (typeof is_admin !== 'boolean') {
    return res.status(400).json({ message: 'is_admin 参数必须为布尔值' });
  }
  
  try {
    // 检查用户是否存在
    const userRows = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 更新权限
    await query('UPDATE users SET is_admin = ? WHERE id = ?', [is_admin ? 1 : 0, id]);
    
    res.json({ 
      success: true, 
      message: `用户权限已${is_admin ? '授予' : '撤销'}管理员权限` 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误，权限更新失败' });
  }
});

// Update user information
router.put('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, is_admin } = req.body;
  
  if (!username) {
    return res.status(400).json({ message: '用户名不能为空' });
  }
  
  try {
    // 检查用户名是否已存在（排除当前用户）
    const existRows = await query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
    if (existRows.length > 0) {
      return res.status(409).json({ message: '用户名已存在' });
    }
    
    // 更新用户信息
    await query('UPDATE users SET username = ?, is_admin = ? WHERE id = ?', [
      username, 
      is_admin ? 1 : 0, 
      id
    ]);
    
    res.json({ success: true, message: '用户信息更新成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误，用户信息更新失败' });
  }
});

// Delete user
router.delete('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // 检查用户是否存在
    const userRows = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 删除用户相关记录
    await query('DELETE FROM records WHERE user_id = ?', [id]);
    
    // 删除用户
    await query('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ success: true, message: '用户删除成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误，用户删除失败' });
  }
});

// List records with admin filters
router.get('/records', async (req: Request, res: Response) => {
  const { userId, startDate, endDate, type } = req.query;
  const conditions = [];
  const params: any[] = [];
  if (userId) { conditions.push('user_id = ?'); params.push(userId); }
  if (type) { conditions.push('record_type = ?'); params.push(type); }
  if (startDate) { conditions.push('date >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('date <= ?'); params.push(endDate); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const rows = await query(
      `SELECT id, user_id, record_type AS type, date, steps, sleep_hours, food_name, calories, created_at, updated_at FROM records ${where} ORDER BY date DESC, id DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误，查询记录失败' });
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