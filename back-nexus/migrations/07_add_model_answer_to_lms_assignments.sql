-- Migration: Add model_answer column to lms_assignments
-- This column stores the faculty's expected/passing answer used by the AI checker
ALTER TABLE lms_assignments
  ADD COLUMN IF NOT EXISTS model_answer TEXT NULL AFTER instructions;
