-- Migration: Add email verification columns to users table
-- Compatible with all MySQL / MariaDB versions

ALTER TABLE users 
ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
ADD COLUMN verification_code VARCHAR(6) NULL DEFAULT NULL AFTER is_verified,
ADD COLUMN verification_expires_at DATETIME NULL DEFAULT NULL AFTER verification_code,
ADD COLUMN email_verified_at DATETIME NULL DEFAULT NULL AFTER verification_expires_at;

-- Mark all pre-existing active users as verified so existing accounts are not locked out
UPDATE users 
SET is_verified = 1, email_verified_at = CURRENT_TIMESTAMP 
WHERE (is_verified IS NULL OR is_verified = 0) AND status = 'Active';
