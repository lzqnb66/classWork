import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import "reflect-metadata";
dotenv.config();

import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import profileRoutes from './routes/profile';
import healthRoutes from './routes/health';
import dietRoutes from './routes/diet';
import stepsRoutes from './routes/steps';
import sleepRoutes from './routes/sleep';
import queryRoutes from './routes/query';
import { testConnection } from './data-source';

const app = express();

// Basic middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/')) {
    console.info(`[api] ${req.method} ${req.path}`);
  }
  next();
});

// Static for uploads
import path from 'path';
app.use('/uploads', express.static(path.resolve(process.cwd(), 'server', 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/steps', stepsRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/query', queryRoutes);

// Global error handler (simple)
app.use((err: Error | any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 3000;

// 启动服务器并初始化数据库
async function startServer() {
  try {
    // 测试数据库连接并自动同步表结构
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`✅ Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();