const jwt = require('jsonwebtoken');

// 使用与服务器相同的密钥
const secret = process.env.JWT_SECRET || 'dev_secret';

// 生成一个有效的token
const payload = {
  id: 1,
  username: 'testuser',
  is_admin: false,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24小时过期
};

const token = jwt.sign(payload, secret);
console.log('有效Token:', token);
console.log('Authorization Header:', `Bearer ${token}`);