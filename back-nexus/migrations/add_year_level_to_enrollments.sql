-- Migration: Add year_level column to enrollments table
-- Purpose: Track which academic year (1st-4th Year) students are in when enrolling

ALTER TABLE enrollments 
ADD COLUMN year_level VARCHAR(20) AFTER period_id;

-- Optional: Add comment to the column
ALTER TABLE enrollments 
MODIFY COLUMN year_level VARCHAR(20) COMMENT 'Student year level: 1st Year, 2nd Year, 3rd Year, 4th Year';
