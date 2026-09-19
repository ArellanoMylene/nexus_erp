-- Migration: Add section_id to enrollments table
ALTER TABLE enrollments ADD COLUMN section_id INT NULL AFTER enrollment_id;
ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_section FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL;