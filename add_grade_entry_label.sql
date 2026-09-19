-- Migration: Add label column to grade_entries table to prevent data redundancy
-- Purpose: Track which grading period (midterm/tentative_final/final) each entry belongs to
--          and prevent duplicate entries and editing of locked grades

-- Step 1: Add the new columns first (without unique constraint)
ALTER TABLE grade_entries 
ADD COLUMN label ENUM('midterm', 'tentative_final', 'final') DEFAULT 'midterm' AFTER period_id,
ADD COLUMN is_locked BOOLEAN DEFAULT FALSE AFTER label;

-- Step 2: Remove duplicate entries (keep only the latest one for each combination)
-- This removes older duplicates and keeps the most recent entry
DELETE FROM grade_entries 
WHERE entry_id NOT IN (
  SELECT MAX(entry_id) 
  FROM (
    SELECT MAX(entry_id) as entry_id
    FROM grade_entries
    GROUP BY student_id, course_id, period_id, component_type, component_name
  ) AS latest
);

-- Step 3: Modify label to NOT NULL after duplicates are removed
ALTER TABLE grade_entries 
MODIFY COLUMN label ENUM('midterm', 'tentative_final', 'final') NOT NULL;

-- Step 4: Now add the unique constraint (duplicates are cleaned up)
ALTER TABLE grade_entries 
ADD UNIQUE KEY unique_grade_entry (student_id, course_id, period_id, component_type, component_name, label);

-- Step 5: Create indexes for faster lookups by period label
CREATE INDEX idx_label_period ON grade_entries(label, period_id);
CREATE INDEX idx_student_course_label ON grade_entries(student_id, course_id, label);
