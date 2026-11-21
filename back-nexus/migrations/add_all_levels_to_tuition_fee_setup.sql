-- Allow one fee setup to cover every year level for a program and period.
ALTER TABLE tuition_fee_setup
  MODIFY COLUMN year_level ENUM(
    'All Levels',
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    '5th Year'
  ) NOT NULL;
