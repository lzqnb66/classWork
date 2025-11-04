import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import "reflect-metadata";
dotenv.config();

import authRoutes from './routes/auth';
import recordsRoutes from './routes/records';
import adminRoutes from './routes/admin';
import { testConnection } from './data-source.js';

const app = express();

// Basic middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/admin', adminRoutes);

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