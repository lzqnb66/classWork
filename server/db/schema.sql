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

-- Optional: create a default admin (update password manually later)
-- INSERT INTO users (username, password_hash, is_admin) VALUES ('admin', '$2a$10$hash_here', 1);