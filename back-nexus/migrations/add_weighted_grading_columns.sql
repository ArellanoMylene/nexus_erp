-- Migration: Add weighted grading columns to support campus grading structure
-- This migration adds columns to support the campus's grading system with
-- Written Output (30%), Performance Tasks (30%), and Midterm Exam (40%)

ALTER TABLE grades 
ADD COLUMN IF NOT EXISTS letter_grade VARCHAR(2),
ADD COLUMN IF NOT EXISTS final_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weighted_output_score DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS weighted_performance_score DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS midterm_exam_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS components_json JSON COMMENT 'Stores detailed scores for Written Output and Performance Tasks';

-- Add an index for faster queries
CREATE INDEX IF NOT EXISTS idx_grades_status_course ON grades(status, course_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_course ON grades(student_user_id, course_id);

-- Update status enum to include 'submitted'
ALTER TABLE grades MODIFY COLUMN status ENUM('draft', 'submitted', 'approved') DEFAULT 'submitted';

-- Add trigger to automatically calculate final_score when other fields are updated
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS grades_calculate_final_score 
BEFORE INSERT ON grades
FOR EACH ROW
BEGIN
    IF NEW.weighted_output_score IS NOT NULL AND NEW.weighted_performance_score IS NOT NULL AND NEW.midterm_exam_score IS NOT NULL THEN
        SET NEW.final_score = NEW.weighted_output_score + NEW.weighted_performance_score + (NEW.midterm_exam_score * 0.4);
        
        -- Assign letter grade based on final score
        IF NEW.final_score >= 90 THEN
            SET NEW.letter_grade = 'A';
        ELSEIF NEW.final_score >= 80 THEN
            SET NEW.letter_grade = 'B';
        ELSEIF NEW.final_score >= 70 THEN
            SET NEW.letter_grade = 'C';
        ELSEIF NEW.final_score >= 60 THEN
            SET NEW.letter_grade = 'D';
        ELSE
            SET NEW.letter_grade = 'F';
        END IF;
    END IF;
END$$

CREATE TRIGGER IF NOT EXISTS grades_calculate_final_score_update 
BEFORE UPDATE ON grades
FOR EACH ROW
BEGIN
    IF NEW.weighted_output_score IS NOT NULL AND NEW.weighted_performance_score IS NOT NULL AND NEW.midterm_exam_score IS NOT NULL THEN
        SET NEW.final_score = NEW.weighted_output_score + NEW.weighted_performance_score + (NEW.midterm_exam_score * 0.4);
        
        -- Assign letter grade based on final score
        IF NEW.final_score >= 90 THEN
            SET NEW.letter_grade = 'A';
        ELSEIF NEW.final_score >= 80 THEN
            SET NEW.letter_grade = 'B';
        ELSEIF NEW.final_score >= 70 THEN
            SET NEW.letter_grade = 'C';
        ELSEIF NEW.final_score >= 60 THEN
            SET NEW.letter_grade = 'D';
        ELSE
            SET NEW.letter_grade = 'F';
        END IF;
    END IF;
END$$

DELIMITER ;
