-- MySQL schema for Intelligent Personal Health Management System

CREATE DATABASE IF NOT EXISTS `health_app` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `health_app`;

-- Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `is_admin` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Records
CREATE TABLE IF NOT EXISTS `records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('steps','sleep','diet') NOT NULL,
  `date` DATE NOT NULL,
  `steps` INT NULL,
  `sleep_hours` DECIMAL(5,2) NULL,
  `food_name` VARCHAR(100) NULL,
  `calories` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_records_user_date` (`user_id`, `date`),
  CONSTRAINT `fk_records_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Diet Records (详细饮食记录)
CREATE TABLE IF NOT EXISTS `diet_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `food_name` VARCHAR(100) NOT NULL,
  `calories` INT NOT NULL,
  `protein` DECIMAL(5,2) DEFAULT 0,
  `carbs` DECIMAL(5,2) DEFAULT 0,
  `fat` DECIMAL(5,2) DEFAULT 0,
  `meal_type` VARCHAR(20) DEFAULT 'other',
  `quantity` DECIMAL(6,2) DEFAULT 1,
  `unit` VARCHAR(20) DEFAULT '份',
  `date` DATE NOT NULL,
  `time` TIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_diet_user_date` (`user_id`, `date`),
  INDEX `idx_diet_meal_type` (`meal_type`),
  CONSTRAINT `fk_diet_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Steps Records (详细步数记录)
CREATE TABLE IF NOT EXISTS `steps_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `steps` INT NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NULL,
  `source` VARCHAR(50) DEFAULT '手动记录',
  `notes` VARCHAR(200) NULL,
  `calories_burned` DECIMAL(8,2) DEFAULT 0,
  `distance_km` DECIMAL(6,2) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_steps_user_date` (`user_id`, `date`),
  INDEX `idx_steps_date` (`date`),
  CONSTRAINT `fk_steps_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sleep Records (详细睡眠记录)
CREATE TABLE IF NOT EXISTS `sleep_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `duration` DECIMAL(5,2) NOT NULL,
  `quality` ENUM('极好', '良好', '一般', '较差', '很差') NOT NULL,
  `deep_sleep_minutes` INT DEFAULT 0,
  `light_sleep_minutes` INT DEFAULT 0,
  `rem_sleep_minutes` INT DEFAULT 0,
  `wake_times` INT DEFAULT 0,
  `notes` VARCHAR(500) NULL,
  `source` VARCHAR(50) DEFAULT '手动记录',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sleep_user_date` (`user_id`, `date`),
  INDEX `idx_sleep_date` (`date`),
  INDEX `idx_sleep_quality` (`quality`),
  CONSTRAINT `fk_sleep_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Optional: create a default admin (update password manually later)
-- INSERT INTO users (username, password_hash, is_admin) VALUES ('admin', '$2a$10$hash_here', 1);