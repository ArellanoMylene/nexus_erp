// model/clearances.model.js
import db from "../config/db.js";

// Get all clearances
export const getAllClearances = async () => {
  const [rows] = await db.query(
    `SELECT 
        c.*,
        c.overall_status AS status,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        sd.student_number,
        ap.school_year AS academic_year,
        ap.semester
     FROM clearances c
     JOIN users u ON c.student_id = u.user_id
     LEFT JOIN student_details sd ON c.student_id = sd.user_id
     JOIN academic_periods ap ON c.period_id = ap.period_id
     ORDER BY c.created_at DESC`,
  );
  return rows;
};

// Get clearances by student
export const getClearancesByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT c.*, ap.school_year, ap.semester
     FROM clearances c
     JOIN academic_periods ap ON c.period_id = ap.period_id
     WHERE c.student_id = ?
     ORDER BY ap.start_date DESC`,
    [studentId],
  );
  return rows;
};

// Get single clearance
export const getClearanceById = async (id) => {
  const [rows] = await db.query(
    `SELECT c.*,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            sd.student_number,
            ap.school_year, ap.semester
     FROM clearances c
     JOIN users u ON c.student_id = u.user_id
     LEFT JOIN student_details sd ON c.student_id = sd.user_id
     JOIN academic_periods ap ON c.period_id = ap.period_id
     WHERE c.clearance_id = ?`,
    [id],
  );
  return rows[0];
};

// Create clearance
export const createClearance = async (data) => {
  const [result] = await db.query(
    `INSERT INTO clearances 
     (student_id, period_id, library_cleared, registrar_cleared, accounting_cleared,
      dean_cleared, guidance_cleared, student_affairs_cleared, library_remarks,
      registrar_remarks, accounting_remarks, dean_remarks, guidance_remarks,
      student_affairs_remarks, overall_status, cleared_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.student_id,
      data.period_id,
      data.library_cleared || false,
      data.registrar_cleared || false,
      data.accounting_cleared || false,
      data.dean_cleared || false,
      data.guidance_cleared || false,
      data.student_affairs_cleared || false,
      data.library_remarks,
      data.registrar_remarks,
      data.accounting_remarks,
      data.dean_remarks,
      data.guidance_remarks,
      data.student_affairs_remarks,
      data.overall_status || "Incomplete",
      data.cleared_date,
    ],
  );
  return getClearanceById(result.insertId);
};

// Update clearance
export const updateClearance = async (id, data) => {
  await db.query(
    `UPDATE clearances SET
      library_cleared = ?, registrar_cleared = ?, accounting_cleared = ?,
      dean_cleared = ?, guidance_cleared = ?, student_affairs_cleared = ?,
      library_remarks = ?, registrar_remarks = ?, accounting_remarks = ?,
      dean_remarks = ?, guidance_remarks = ?, student_affairs_remarks = ?,
      overall_status = ?, cleared_date = ?
     WHERE clearance_id = ?`,
    [
      data.library_cleared,
      data.registrar_cleared,
      data.accounting_cleared,
      data.dean_cleared,
      data.guidance_cleared,
      data.student_affairs_cleared,
      data.library_remarks,
      data.registrar_remarks,
      data.accounting_remarks,
      data.dean_remarks,
      data.guidance_remarks,
      data.student_affairs_remarks,
      data.overall_status,
      data.cleared_date,
      id,
    ],
  );
  return getClearanceById(id);
};

// Delete clearance
export const deleteClearance = async (id) => {
  await db.query(`DELETE FROM clearances WHERE clearance_id = ?`, [id]);
  return true;
};

// Check if clearance exists
export const checkClearanceExists = async (studentId, periodId) => {
  const [rows] = await db.query(
    `SELECT clearance_id FROM clearances WHERE student_id = ? AND period_id = ?`,
    [studentId, periodId],
  );
  return rows.length > 0;
};
