-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema vuka
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema vuka
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `vuka` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `vuka` ;

-- -----------------------------------------------------
-- Table `vuka`.`expenses`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`expenses` (
  `expense_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL DEFAULT NULL,
  `expense_type` VARCHAR(250) NOT NULL,
  `amount` DECIMAL(10,0) NOT NULL,
  `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('pending', 'approved', 'disapproved', '') NOT NULL DEFAULT 'pending',
  `date_issued` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`expense_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 20
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`guarantors`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`guarantors` (
  `ID` INT NOT NULL,
  `loan_id` INT NOT NULL,
  `guarantor_id` INT NOT NULL,
  `total_savings` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `phone` VARCHAR(20) NULL DEFAULT NULL,
  `email` VARCHAR(100) NULL DEFAULT NULL,
  `national_id` VARCHAR(20) NULL DEFAULT NULL,
  `first_name` VARCHAR(50) NULL DEFAULT NULL,
  `last_name` VARCHAR(50) NULL DEFAULT NULL,
  `address` VARCHAR(255) NULL DEFAULT NULL,
  `gender` VARCHAR(45) NOT NULL,
  `ID_image` BLOB NULL DEFAULT NULL,
  `password` VARCHAR(100) NULL DEFAULT NULL,
  `status` ENUM('approved', 'pending', 'disapproved', '') NOT NULL DEFAULT 'pending',
  `reset_token` VARCHAR(255) NULL DEFAULT NULL,
  `reset_token_expires` BIGINT NULL DEFAULT NULL,
  `role_id` INT NULL DEFAULT NULL,
  `role_name` VARCHAR(50) NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 288
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`matatus`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`matatus` (
  `owner_id` INT NULL DEFAULT NULL,
  `matatu_id` INT NOT NULL AUTO_INCREMENT,
  `driver_id` INT NULL DEFAULT NULL,
  `number_plate` VARCHAR(255) NULL DEFAULT NULL,
  `status` ENUM('active', 'assigned', 'inactive', 'suspended') NOT NULL DEFAULT 'inactive',
  `log_book` BLOB NULL DEFAULT NULL,
  `driver_license_number` VARCHAR(255) NULL DEFAULT NULL,
  `vehicle_type` VARCHAR(50) NOT NULL,
  `seating_capacity` INT NOT NULL,
  `chassis_number` INT NOT NULL,
  `year` INT NOT NULL,
  `route_id` INT NOT NULL,
  PRIMARY KEY USING BTREE (`matatu_id`),
  INDEX `owner_id` (`owner_id` ASC) VISIBLE,
  INDEX `driver_id` (`driver_id` ASC) VISIBLE,
  CONSTRAINT `driver_id`
    FOREIGN KEY (`driver_id`)
    REFERENCES `vuka`.`users` (`user_id`),
  CONSTRAINT `owner_id`
    FOREIGN KEY (`owner_id`)
    REFERENCES `vuka`.`users` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 354
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`insurance`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`insurance` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `payments_id` INT NULL DEFAULT NULL,
  `matatu_id` INT NULL DEFAULT NULL,
  `amount` DECIMAL(10,2) NULL DEFAULT NULL,
  `insurance_company` VARCHAR(255) NULL DEFAULT NULL,
  `policy_number` VARCHAR(255) NULL DEFAULT NULL,
  `insurance_expiry` DATE NULL DEFAULT NULL,
  PRIMARY KEY (`ID`),
  INDEX `matatu_id` (`matatu_id` ASC) VISIBLE,
  CONSTRAINT `insurance_ibfk_1`
    FOREIGN KEY (`matatu_id`)
    REFERENCES `vuka`.`matatus` (`matatu_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 20
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`loans`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`loans` (
  `loan_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `matatu_id` INT NULL DEFAULT NULL,
  `amount_applied` DECIMAL(10,2) NOT NULL,
  `amount_issued` INT NULL DEFAULT '0',
  `amount_due` DECIMAL(10,2) NOT NULL,
  `loan_type` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`loan_id`),
  INDEX `matatu_id` (`matatu_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 308
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`mpesastk`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`mpesastk` (
  `mpesastk_id` INT NOT NULL AUTO_INCREMENT,
  `mpesastk_status` VARCHAR(50) NOT NULL,
  `ResultCode` VARCHAR(10) NULL DEFAULT NULL,
  `ResultDesc` VARCHAR(255) NULL DEFAULT NULL,
  `MpesaReceiptNumber` VARCHAR(50) NULL DEFAULT NULL,
  `mpesastk_appid` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`mpesastk_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 21
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`payments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`payments` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `payment_id` VARCHAR(50) NOT NULL,
  `user_id` INT NOT NULL,
  `matatu_id` INT NULL DEFAULT NULL,
  `amount_paid` DECIMAL(10,2) NOT NULL,
  `transaction_code` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `loan` DECIMAL(10,2) NULL DEFAULT NULL,
  `insurance` DECIMAL(10,2) NULL DEFAULT NULL,
  `operations` DECIMAL(10,2) NOT NULL,
  `savings` DECIMAL(10,2) NULL DEFAULT '0.00',
  `CheckoutRequestID` VARCHAR(50) NULL DEFAULT NULL,
  `payment_type` ENUM('shareholder', 'matatu') NOT NULL DEFAULT 'shareholder',
  `status` ENUM('pending', 'success', 'failed') NULL DEFAULT 'pending',
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `payment_id` (`payment_id` ASC) VISIBLE,
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  INDEX `payments_ibfk_3` (`matatu_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 378
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`roles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`roles` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `role_id` INT NULL DEFAULT NULL,
  `role_name` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `role_id` (`role_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 206
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`permissions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`permissions` (
  `permission_id` INT NOT NULL AUTO_INCREMENT,
  `roleI_id` INT NULL DEFAULT NULL,
  `permission_name` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`permission_id`),
  INDEX `roleI_id` (`roleI_id` ASC) VISIBLE,
  CONSTRAINT `permissions_ibfk_1`
    FOREIGN KEY (`roleI_id`)
    REFERENCES `vuka`.`roles` (`role_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 305
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`savings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`savings` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL DEFAULT NULL,
  `payment_id` BIGINT NOT NULL,
  `matatu_id` INT NULL DEFAULT NULL,
  `amount` INT NULL DEFAULT NULL,
  PRIMARY KEY (`ID`),
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  INDEX `matatu_id` (`matatu_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 361
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`sessions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`sessions` (
  `session_id` VARCHAR(128) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_bin' NOT NULL,
  `expires` INT UNSIGNED NOT NULL,
  `data` MEDIUMTEXT CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_bin' NULL DEFAULT NULL,
  PRIMARY KEY (`session_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `vuka`.`staffdetails`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`staffdetails` (
  `user_id` INT NULL DEFAULT NULL,
  `position` VARCHAR(50) NULL DEFAULT NULL,
  `bank_name` VARCHAR(255) NULL DEFAULT NULL,
  `bank_account_number` VARCHAR(50) NOT NULL,
  `nhif_number` VARCHAR(50) NULL DEFAULT NULL,
  `passport_photo` VARCHAR(255) NULL DEFAULT NULL,
  `salary` DECIMAL(10,0) NULL DEFAULT NULL,
  `branch` VARCHAR(45) NOT NULL,
  `kra_pin` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`bank_account_number`),
  INDEX `user_id` (`user_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `vuka`.`support_tickets`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`support_tickets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL DEFAULT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('open', 'closed', 'pending') NULL DEFAULT 'open',
  `priority` ENUM('Low', 'Medium', 'High') NULL DEFAULT 'Medium',
  `attachment` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  CONSTRAINT `support_tickets_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `vuka`.`users` (`user_id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `vuka`.`user_role`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vuka`.`user_role` (
  `user_id` INT NOT NULL,
  `role_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  INDEX `role_id` (`role_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
