// model/academicHistory.model.js
import db from "../config/db.js";

// Get all academic history records
export const getAllAcademicHistory = async () => {
  const [rows] = await db.query(
    `SELECT 
        ah.*,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        sd.student_number,
        ap.school_year, ap.semester
     FROM academic_history ah
     JOIN users u ON ah.student_id = u.user_id
     LEFT JOIN student_details sd ON ah.student_id = sd.user_id
     JOIN academic_periods ap ON ah.period_id = ap.period_id
     ORDER BY ah.created_at DESC`,
  );
  return rows;
};

// Get history by student
export const getHistoryByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT ah.*, ap.school_year, ap.semester
     FROM academic_history ah
     JOIN academic_periods ap ON ah.period_id = ap.period_id
     WHERE ah.student_id = ?
     ORDER BY ap.start_date DESC`,
    [studentId],
  );
  return rows;
};

// Get single history record
export const getHistoryById = async (id) => {
  const [rows] = await db.query(
    `SELECT ah.*,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            sd.student_number,
            ap.school_year, ap.semester
     FROM academic_history ah
     JOIN users u ON ah.student_id = u.user_id
     LEFT JOIN student_details sd ON ah.student_id = sd.user_id
     JOIN academic_periods ap ON ah.period_id = ap.period_id
     WHERE ah.history_id = ?`,
    [id],
  );
  return rows[0];
};

// Create history record
export const createHistory = async (data) => {
  const [result] = await db.query(
    `INSERT INTO academic_history 
     (student_id, period_id, year_level, semester_gpa, cumulative_gpa, units_taken,
      units_passed, academic_status, honors, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.student_id,
      data.period_id,
      data.year_level,
      data.semester_gpa,
      data.cumulative_gpa,
      data.units_taken,
      data.units_passed,
      data.academic_status || "Regular",
      data.honors,
      data.remarks,
    ],
  );
  return getHistoryById(result.insertId);
};

// Update history
export const updateHistory = async (id, data) => {
  await db.query(
    `UPDATE academic_history SET
      year_level = ?, semester_gpa = ?, cumulative_gpa = ?, units_taken = ?,
      units_passed = ?, academic_status = ?, honors = ?, remarks = ?
     WHERE history_id = ?`,
    [
      data.year_level,
      data.semester_gpa,
      data.cumulative_gpa,
      data.units_taken,
      data.units_passed,
      data.academic_status,
      data.honors,
      data.remarks,
      id,
    ],
  );
  return getHistoryById(id);
};

// Delete history
export const deleteHistory = async (id) => {
  await db.query(`DELETE FROM academic_history WHERE history_id = ?`, [id]);
  return true;
};

// Check if history exists for student+period
export const checkHistoryExists = async (studentId, periodId) => {
  const [rows] = await db.query(
    `SELECT history_id FROM academic_history WHERE student_id = ? AND period_id = ?`,
    [studentId, periodId],
  );
  return rows.length > 0;
};
