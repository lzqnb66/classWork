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
- 默认端口：http://localhost:3000

5. REST API 简要
- Auth
  - POST /api/auth/register {username, password}
  - POST /api/auth/login {username, password} -> {token, user}
- Records（需 Bearer Token）
  - POST /api/records 新增（传 type、date 及对应字段）
  - GET /api/records?startDate&endDate&type 列表
  - PUT /api/records/:id 更新（仅本人）
  - DELETE /api/records/:id 删除（仅本人）
  - GET /api/records/analysis/weekly-steps 周步数趋势（7天）
  - GET /api/records/analysis/daily-calories?date=YYYY-MM-DD 日饮食热量分布
  - GET /api/records/analysis/steps-average?startDate&endDate&threshold=10000 日均步数是否达标
- Admin（需 Bearer Token 且 is_admin=1）
  - GET /api/admin/users 用户列表
  - GET /api/admin/records 管理数据列表（可筛选）
  - DELETE /api/admin/records/:id 管理删除

6. 说明
- 本后端为简单可用框架，便于前端进行功能实现与联调，未包含复杂医疗诊断逻辑。
- 管理员账号可通过注册后在数据库将 is_admin 字段置为 1。