智能个人健康管理系统 - 后端

1. 技术栈
- Node.js + Express
- MySQL (mysql2/promise)
- JWT 认证（jsonwebtoken）
- 密码加密（bcryptjs）

2. 环境配置
- 复制 .env.example 为 .env，并根据实际数据库配置修改：
  - PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET

3. 数据库初始化
- 使用 MySQL 执行 db/schema.sql：
  - 创建数据库 health_app
  - 创建 users 与 records 表

4. 启动
- 安装依赖：已在根目录 server 中执行 npm i
- 开发启动：npm run dev
- 生产启动：npm start
- 默认端口：http://localhost:3789
