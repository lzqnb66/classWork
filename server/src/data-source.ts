import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "health_app",
    synchronize: true, // 自动同步数据库结构
    logging: true, // 启用SQL日志
    entities: [
        __dirname + "/entities/*.ts"
    ],
    migrations: [
        __dirname + "/migrations/*.ts"
    ],
    subscribers: [],
    poolSize: 10,
    connectorPackage: "mysql2",
    extra: {
        connectionLimit: 10
    }
});

// 测试数据库连接
export async function testConnection() {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        console.log("✅ MySQL数据库连接成功 (TypeORM)");
        return true;
    } catch (error) {
        console.error("❌ 无法连接到数据库:", error);
        return false;
    }
}