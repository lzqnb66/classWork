import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const router = express.Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'username & password required' });
  }
  try {
    const exist = await query('SELECT id FROM users WHERE username = ?', [username]);
    if (exist.length > 0) return res.status(409).json({ message: 'Username exists' });
    const hash = await bcrypt.hash(password, 10);
    await query('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 0)', [username, hash]);
    return res.json({ message: 'Registered successfully' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }
  try {
    const rows = await query('SELECT id, username, password_hash, is_admin FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(200).json({ success: false, message: '用户名或密码错误' });
    const user = rows[0];
    // Guard missing password (e.g., legacy users)
    if (!user.password_hash || typeof user.password_hash !== 'string') {
      console.warn('[auth] Missing password_hash column for user', username);
      return res.status(200).json({ success: false, message: '用户名或密码错误' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(200).json({ success: false, message: '用户名或密码错误' });
    const token = jwt.sign({ id: user.id, username: user.username, is_admin: !!user.is_admin }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    return res.json({ success: true, token, user: { id: user.id, username: user.username, is_admin: !!user.is_admin } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
  }
});

export default router;