-- Migration: Add model_answer_file_url column to lms_assignments
-- This column stores an optional uploaded file URL for the model answer
SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lms_assignments'
    AND COLUMN_NAME = 'model_answer_file_url'
);

SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE lms_assignments ADD COLUMN model_answer_file_url TEXT NOT NULL AFTER model_answer',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;