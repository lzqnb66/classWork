import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
router.use(authMiddleware);

// Ensure table exists
async function ensureProfileTable() {
  const sql = `CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT NOT NULL PRIMARY KEY,
    fullname VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    address VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    postcode VARCHAR(20) NULL,
    avatar_path VARCHAR(255) NULL,
    gender ENUM('male', 'female', 'other') NULL,
    birthday DATE NULL,
    height DECIMAL(5,2) NULL,
    weight DECIMAL(5,2) NULL,
    emergency_contact VARCHAR(20) NULL,
    emergency_phone VARCHAR(20) NULL,
    blood_type ENUM('A', 'B', 'AB', 'O') NULL,
    allergies TEXT NULL,
    medical_conditions TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_profiles_email (email)
  ) ENGINE=InnoDB;`;
  try { await query(sql); } catch (e) { console.error('[profile] ensure table error', e); }
}
ensureProfileTable();

// GET profile
router.get('/', async (req: Request, res: Response) => {
  try {
    const rows = await query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user!.id]);
    const base = await query('SELECT id, username FROM users WHERE id = ?', [req.user!.id]);
    const p = rows[0] || {};
    const user = base[0] || {};
    const avatar_url = p.avatar_path ? `${req.protocol}://${req.get('host')}/uploads/${p.avatar_path}` : '';
    return res.json({
      username: user.username || '',
      fullname: p.fullname || '',
      phone: p.phone || '',
      email: p.email || '',
      address: p.address || '',
      city: p.city || '',
      postcode: p.postcode || '',
      gender: p.gender || '',
      birthday: p.birthday || '',
      height: p.height || '',
      weight: p.weight || '',
      emergency_contact: p.emergency_contact || '',
      emergency_phone: p.emergency_phone || '',
      blood_type: p.blood_type || '',
      allergies: p.allergies || '',
      medical_conditions: p.medical_conditions || '',
      avatar_url
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT profile
router.put('/', async (req: Request, res: Response) => {
  const { 
    fullname, phone, email, address, city, postcode, 
    gender, birthday, height, weight, emergency_contact, 
    emergency_phone, blood_type, allergies, medical_conditions 
  } = req.body || {};
  
  // 服务器端验证
  if (phone && !/^\d{6,20}$/.test(String(phone))) return res.status(400).json({ message: '手机号格式不正确' });
  if (email && !/^\S+@\S+\.\S+$/.test(String(email))) return res.status(400).json({ message: '邮箱格式不正确' });
  if (postcode && !/^\d{4,10}$/.test(String(postcode))) return res.status(400).json({ message: '邮编格式不正确' });
  if (emergency_phone && !/^\d{6,20}$/.test(String(emergency_phone))) return res.status(400).json({ message: '紧急联系人电话格式不正确' });
  if (height && (height < 50 || height > 250)) return res.status(400).json({ message: '身高应在50-250cm之间' });
  if (weight && (weight < 20 || weight > 300)) return res.status(400).json({ message: '体重应在20-300kg之间' });
  
  try {
    const exist = await query('SELECT user_id FROM user_profiles WHERE user_id = ?', [req.user!.id]);
    if (exist.length > 0) {
      await query(
        `UPDATE user_profiles SET 
          fullname=?, phone=?, email=?, address=?, city=?, postcode=?,
          gender=?, birthday=?, height=?, weight=?, emergency_contact=?,
          emergency_phone=?, blood_type=?, allergies=?, medical_conditions=?
        WHERE user_id=?`,
        [
          fullname || null, phone || null, email || null, address || null, city || null, postcode || null,
          gender || null, birthday || null, height || null, weight || null, emergency_contact || null,
          emergency_phone || null, blood_type || null, allergies || null, medical_conditions || null,
          req.user!.id
        ]
      );
    } else {
      await query(
        `INSERT INTO user_profiles (
          user_id, fullname, phone, email, address, city, postcode,
          gender, birthday, height, weight, emergency_contact,
          emergency_phone, blood_type, allergies, medical_conditions
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          req.user!.id, fullname || null, phone || null, email || null, address || null, city || null, postcode || null,
          gender || null, birthday || null, height || null, weight || null, emergency_contact || null,
          emergency_phone || null, blood_type || null, allergies || null, medical_conditions || null
        ]
      );
    }
    return res.json({ message: '个人资料已保存' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '服务器错误' });
  }
});

// ---- Avatar upload ----
const uploadsRoot = path.resolve(process.cwd(), 'server', 'uploads');
const avatarDir = path.join(uploadsRoot, 'avatars');
fs.mkdirSync(avatarDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }
    cb(null, avatarDir);
  },
  filename: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user!.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传JPEG、JPG、PNG格式的图片文件'));
    }
  }
});

router.post('/avatar', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const filename = path.basename(req.file!.filename);
    const relativePath = `avatars/${filename}`;
    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
    
    // 检查是否已有用户资料
    const exist = await query('SELECT user_id, avatar_path FROM user_profiles WHERE user_id = ?', [req.user!.id]);

    // 删除旧头像文件（如果存在）
    if (exist.length > 0 && exist[0].avatar_path) {
      const oldAvatarPath = path.join(uploadsRoot, exist[0].avatar_path);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    if (exist.length > 0) {
      await query('UPDATE user_profiles SET avatar_path=? WHERE user_id=?', [relativePath, req.user!.id]);
    } else {
      await query('INSERT INTO user_profiles (user_id, avatar_path) VALUES (?, ?)', [req.user!.id, relativePath]);
    }
    return res.json({ message: 'Avatar updated', avatar_url: avatarUrl });
  } catch (e) {
    console.error(e);
    // 清理上传的文件（如果发生错误）
    if (req.file) {
      const filePath = path.join(avatarDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return res.status(500).json({ message: (e as Error)?.message || 'Upload failed' });
  }
});

// 修改密码接口
router.post('/change-password', async (req: Request, res: Response) => {
  const { old_password, new_password } = req.body || {};
  
  // 兼容前端参数命名
  const oldPassword = old_password;
  const newPassword = new_password;
  
  // 验证输入
  if (!oldPassword || !newPassword ) {
    return res.status(400).json({ message: '所有密码字段都必须填写' });
  }
  
  // 密码复杂度验证
  if (newPassword.length < 8) {
    return res.status(400).json({ message: '新密码长度至少需要8个字符' });
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(newPassword)) {
    return res.status(400).json({ message: '新密码必须包含大小写字母、数字和特殊字符' });
  }
  
  try {
    // 验证旧密码
    const userRows = await query('SELECT password_hash FROM users WHERE id = ?', [req.user!.id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    const user = userRows[0];
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    
    if (!isOldPasswordValid) {
      return res.status(401).json({ message: '旧密码不正确' });
    }
    
    // 更新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, req.user!.id]);
    
    return res.json({ message: '密码修改成功' });
  } catch (e) {
    console.error('密码修改错误:', e);
    return res.status(500).json({ message: '服务器错误' });
  }
});

export default router;