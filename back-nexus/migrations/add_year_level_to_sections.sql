-- Store the class year on each section so sectioning only uses sections
-- that match the selected course year level.
ALTER TABLE sections
  ADD COLUMN year_level VARCHAR(20) NULL AFTER section_name;

-- Backfill section labels that end with a familiar year-and-letter suffix.
UPDATE sections
SET year_level = CASE
  WHEN UPPER(TRIM(section_name)) REGEXP '(^|[- ])1[A-Z]$' THEN '1st Year'
  WHEN UPPER(TRIM(section_name)) REGEXP '(^|[- ])2[A-Z]$' THEN '2nd Year'
  WHEN UPPER(TRIM(section_name)) REGEXP '(^|[- ])3[A-Z]$' THEN '3rd Year'
  WHEN UPPER(TRIM(section_name)) REGEXP '(^|[- ])4[A-Z]$' THEN '4th Year'
  WHEN UPPER(TRIM(section_name)) REGEXP '(^|[- ])5[A-Z]$' THEN '5th Year'
  ELSE NULL
END
WHERE year_level IS NULL;
