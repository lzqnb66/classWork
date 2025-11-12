-- 健康管理系统数据库扩展方案
-- 在原有 users 和 records 表基础上进行扩展

-- 用户资料表 (已实现)
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    fullname VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    postcode VARCHAR(20),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_id (user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_email (email)
);

-- 食物数据库表 (支持智能食物建议)
CREATE TABLE IF NOT EXISTS foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT '其他',
    calories DECIMAL(8,2) NOT NULL,
    protein DECIMAL(8,2) DEFAULT 0,
    carbs DECIMAL(8,2) DEFAULT 0,
    fat DECIMAL(8,2) DEFAULT 0,
    fiber DECIMAL(8,2) DEFAULT 0,
    sugar DECIMAL(8,2) DEFAULT 0,
    sodium DECIMAL(8,2) DEFAULT 0,
    unit VARCHAR(20) DEFAULT '100g',
    is_common BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_food_name (name),
    INDEX idx_food_category (category),
    INDEX idx_food_calories (calories),
    INDEX idx_is_common (is_common)
);

-- 健康目标表
CREATE TABLE IF NOT EXISTS health_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_type ENUM('steps', 'calories', 'sleep', 'weight') NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_goal (user_id, goal_type),
    INDEX idx_goal_dates (start_date, end_date)
);

-- 插入初始食物数据
INSERT IGNORE INTO foods (name, category, calories, protein, carbs, fat, fiber, sugar, sodium, unit, is_common) VALUES
('鸡胸肉', '肉类', 165.00, 31.00, 0.00, 3.60, 0.00, 0.00, 74.00, '100g', TRUE),
('米饭', '主食', 130.00, 2.70, 28.00, 0.30, 0.40, 0.10, 1.00, '100g', TRUE),
('鸡蛋', '蛋类', 155.00, 13.00, 1.10, 11.00, 0.00, 1.10, 124.00, '个', TRUE),
('牛奶', '奶制品', 61.00, 3.30, 4.80, 3.30, 0.00, 5.10, 40.00, '100ml', TRUE),
('苹果', '水果', 52.00, 0.30, 14.00, 0.20, 2.40, 10.40, 1.00, '个', TRUE),
('香蕉', '水果', 89.00, 1.10, 23.00, 0.30, 2.60, 12.20, 1.00, '个', TRUE),
('牛肉', '肉类', 250.00, 26.00, 0.00, 15.00, 0.00, 0.00, 72.00, '100g', TRUE),
('鱼肉', '海鲜', 206.00, 22.00, 0.00, 13.00, 0.00, 0.00, 61.00, '100g', TRUE),
('面包', '主食', 265.00, 9.00, 49.00, 3.20, 2.70, 6.00, 491.00, '片', TRUE),
('燕麦', '主食', 389.00, 16.90, 66.00, 6.90, 10.60, 0.00, 2.00, '100g', TRUE),
('西兰花', '蔬菜', 34.00, 2.80, 7.00, 0.40, 2.60, 1.70, 33.00, '100g', TRUE),
('胡萝卜', '蔬菜', 41.00, 0.90, 10.00, 0.20, 2.80, 4.70, 69.00, '100g', TRUE),
('土豆', '蔬菜', 77.00, 2.00, 17.00, 0.10, 2.20, 0.80, 6.00, '100g', TRUE),
('番茄', '蔬菜', 18.00, 0.90, 3.90, 0.20, 1.20, 2.60, 5.00, '100g', TRUE),
('黄瓜', '蔬菜', 15.00, 0.70, 3.60, 0.10, 0.50, 1.70, 2.00, '100g', TRUE);

-- 记录表扩展注释说明
-- records 表已包含以下字段，支持多种健康数据类型：
-- type: 'steps'（步数）, 'sleep'（睡眠）, 'diet'（饮食）, 'weight'（体重）
-- 对应字段说明：
-- steps: 步数记录
-- sleep_hours: 睡眠时长（小时）
-- food_name: 食物名称（饮食记录）
-- calories: 热量（卡路里）
-- weight: 体重（kg）
-- 其他字段可根据具体类型灵活使用

-- 索引优化建议
ALTER TABLE records 
    ADD INDEX idx_user_type_date (user_id, type, date),
    ADD INDEX idx_date_type (date, type),
    ADD INDEX idx_user_date (user_id, date);