-- Migration: Add repayment fields to loans and create/alter loan_installments and support_tickets
-- Safe, idempotent script using information_schema checks and prepared statements.
-- Run this script against the application's database (make a backup first).

-- Verify current database
SELECT DATABASE() AS _using_database;

-- Check if loans table exists
SELECT COUNT(*) INTO @loans_exists FROM information_schema.tables
 WHERE table_schema = DATABASE() AND table_name = 'loans';

-- Add loans columns if missing (per-column checks to be compatible with older MySQL)
SELECT COUNT(*) INTO @cnt FROM information_schema.columns
 WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'status';
SET @sql = IF(@loans_exists = 1 AND @cnt = 0,
  'ALTER TABLE loans ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT ''pending''',
  'SELECT ''skip_status''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @cnt FROM information_schema.columns
 WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'repayment_months';
SET @sql = IF(@loans_exists = 1 AND @cnt = 0,
  'ALTER TABLE loans ADD COLUMN repayment_months INT NULL',
  'SELECT ''skip_repayment_months''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @cnt FROM information_schema.columns
 WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'monthly_installment';
SET @sql = IF(@loans_exists = 1 AND @cnt = 0,
  'ALTER TABLE loans ADD COLUMN monthly_installment DECIMAL(13,2) NULL',
  'SELECT ''skip_monthly_installment''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @cnt FROM information_schema.columns
 WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'disbursement_date';
SET @sql = IF(@loans_exists = 1 AND @cnt = 0,
  'ALTER TABLE loans ADD COLUMN disbursement_date DATETIME NULL',
  'SELECT ''skip_disbursement_date''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @cnt FROM information_schema.columns
 WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'next_due_date';
SET @sql = IF(@loans_exists = 1 AND @cnt = 0,
  'ALTER TABLE loans ADD COLUMN next_due_date DATETIME NULL',
  'SELECT ''skip_next_due_date''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @cnt FROM information_schema.columns
 WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'final_due_date';
SET @sql = IF(@loans_exists = 1 AND @cnt = 0,
  'ALTER TABLE loans ADD COLUMN final_due_date DATETIME NULL',
  'SELECT ''skip_final_due_date''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @cnt FROM information_schema.columns
 WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'outstanding_balance';
SET @sql = IF(@loans_exists = 1 AND @cnt = 0,
  'ALTER TABLE loans ADD COLUMN outstanding_balance DECIMAL(13,2) NULL',
  'SELECT ''skip_outstanding_balance''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @cnt FROM information_schema.columns
 WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'repayment_status';
SET @sql = IF(@loans_exists = 1 AND @cnt = 0,
  'ALTER TABLE loans ADD COLUMN repayment_status VARCHAR(50) NULL',
  'SELECT ''skip_repayment_status''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @cnt FROM information_schema.columns
 WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'auto_deduction_enabled';
SET @sql = IF(@loans_exists = 1 AND @cnt = 0,
  'ALTER TABLE loans ADD COLUMN auto_deduction_enabled TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT ''skip_auto_deduction_enabled''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @cnt FROM information_schema.columns
 WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'rejection_reason';
SET @sql = IF(@loans_exists = 1 AND @cnt = 0,
  'ALTER TABLE loans ADD COLUMN rejection_reason TEXT NULL',
  'SELECT ''skip_rejection_reason''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Create loan_installments table if missing (includes user_id and installment_number)
SELECT COUNT(*) INTO @tbl FROM information_schema.tables
 WHERE table_schema = DATABASE() AND table_name = 'loan_installments';
SET @create_li = CONCAT(
  'CREATE TABLE loan_installments (',
  'id BIGINT AUTO_INCREMENT PRIMARY KEY,',
  'loan_id INT NOT NULL,',
  'user_id INT NULL,',
  'installment_number INT NULL,',
  'due_date DATETIME NOT NULL,',
  'amount DECIMAL(13,2) NOT NULL,',
  'paid_amount DECIMAL(13,2) DEFAULT 0,',
  'status ENUM(''pending'',''processing'',''paid'',''failed'',''overdue'') DEFAULT ''pending'',',
  'paid_at DATETIME NULL,',
  'created_at DATETIME DEFAULT CURRENT_TIMESTAMP,',
  'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
  'CONSTRAINT fk_li_loan FOREIGN KEY (loan_id) REFERENCES loans(loan_id) ON DELETE CASCADE,',
  'CONSTRAINT fk_li_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,',
  'INDEX idx_loan_installments_due (due_date, status),',
  'INDEX idx_loan_installments_loan (loan_id),',
  'INDEX idx_loan_installments_user (user_id)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);
SET @sql = IF(@tbl = 0, @create_li, 'SELECT ''skip_create_loan_installments''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure indexes exist (if the table was pre-existing without indexes)
SELECT COUNT(*) INTO @idx FROM information_schema.statistics
 WHERE table_schema = DATABASE() AND table_name = 'loan_installments' AND index_name = 'idx_loan_installments_due';
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_loan_installments_due ON loan_installments (due_date, status)', 'SELECT ''idx_exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @idx FROM information_schema.statistics
 WHERE table_schema = DATABASE() AND table_name = 'loan_installments' AND index_name = 'idx_loan_installments_loan';
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_loan_installments_loan ON loan_installments (loan_id)', 'SELECT ''idx_exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @idx FROM information_schema.statistics
 WHERE table_schema = DATABASE() AND table_name = 'loan_installments' AND index_name = 'idx_loan_installments_user';
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_loan_installments_user ON loan_installments (user_id)', 'SELECT ''idx_exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Create support_tickets table if missing (safety net)
SELECT COUNT(*) INTO @tbl2 FROM information_schema.tables
 WHERE table_schema = DATABASE() AND table_name = 'support_tickets';
SET @create_st = CONCAT(
  'CREATE TABLE support_tickets (',
  'id INT NOT NULL AUTO_INCREMENT,',
  'user_id INT NULL DEFAULT NULL,',
  'subject VARCHAR(255) NOT NULL,',
  'category VARCHAR(255) NOT NULL,',
  'message TEXT NOT NULL,',
  'status ENUM(''open'',''closed'',''pending'') NULL DEFAULT ''open'',',
  'priority ENUM(''Low'',''Medium'',''High'') NULL DEFAULT ''Medium'',',
  'attachment VARCHAR(255) NULL DEFAULT NULL,',
  'created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,',
  'updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
  'PRIMARY KEY (id),',
  'INDEX user_id (user_id),',
  'CONSTRAINT support_tickets_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);
SET @sql = IF(@tbl2 = 0, @create_st, 'SELECT ''skip_create_support_tickets''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- End of migration
