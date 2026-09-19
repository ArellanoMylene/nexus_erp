// models/academicPeriods.model.js
import db from "../config/db.js";

// Get all academic periods
export const getAllAcademicPeriods = async () => {
  const [rows] = await db.query(
    `SELECT 
        period_id AS id,
        school_year,
        semester,
        start_date,
        end_date,
        is_active,
        status,
        created_at
     FROM academic_periods
     ORDER BY school_year DESC, 
              FIELD(semester, '1st Semester', '2nd Semester', 'Summer')`
  );
  return rows;
};

// Get single academic period by ID
export const getAcademicPeriodById = async (id) => {
  const [rows] = await db.query(
    `SELECT 
        period_id AS id,
        school_year,
        semester,
        start_date,
        end_date,
        is_active,
        status,
        created_at
     FROM academic_periods
     WHERE period_id = ?`,
    [id]
  );
  return rows[0];
};

// Get active academic period
export const getActiveAcademicPeriod = async () => {
  const [rows] = await db.query(
    `SELECT 
        period_id AS id,
        school_year,
        semester,
        start_date,
        end_date,
        is_active,
        status,
        created_at
     FROM academic_periods
     WHERE is_active = TRUE
     LIMIT 1`
  );
  return rows[0];
};

// Create new academic period
export const createAcademicPeriod = async ({
  school_year,
  semester,
  start_date,
  end_date,
  is_active,
  status,
}) => {
  // If setting as active, deactivate all others first
  if (is_active) {
    await db.query(`UPDATE academic_periods SET is_active = FALSE`);
  }

  const [result] = await db.query(
    `INSERT INTO academic_periods (school_year, semester, start_date, end_date, is_active, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [school_year, semester, start_date, end_date, is_active, status]
  );

  return {
    id: result.insertId,
    school_year,
    semester,
    start_date,
    end_date,
    is_active,
    status,
  };
};

// Update academic period
export const updateAcademicPeriod = async (
  id,
  { school_year, semester, start_date, end_date, is_active, status }
) => {
  // If setting as active, deactivate all others first
  if (is_active) {
    await db.query(
      `UPDATE academic_periods SET is_active = FALSE WHERE period_id != ?`,
      [id]
    );
  }

  await db.query(
    `UPDATE academic_periods 
     SET school_year = ?, semester = ?, start_date = ?, end_date = ?, is_active = ?, status = ?
     WHERE period_id = ?`,
    [school_year, semester, start_date, end_date, is_active, status, id]
  );

  return getAcademicPeriodById(id);
};

// Delete academic period
export const deleteAcademicPeriod = async (id) => {
  await db.query(`DELETE FROM academic_periods WHERE period_id = ?`, [id]);
  return true;
};

// Set active period
export const setActivePeriod = async (id) => {
  // Deactivate all periods
  await db.query(`UPDATE academic_periods SET is_active = FALSE`);

  // Activate the selected period and set status to Active
  await db.query(
    `UPDATE academic_periods SET is_active = TRUE, status = 'Active' WHERE period_id = ?`,
    [id]
  );

  return getAcademicPeriodById(id);
};
