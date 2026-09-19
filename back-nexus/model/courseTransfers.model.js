// model/courseTransfers.model.js
import db from "../config/db.js";

// Get all transfers
export const getAllTransfers = async () => {
  const [rows] = await db.query(
    `SELECT 
        ct.*,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        sd.student_number,
        CONCAT(r.first_name, ' ', r.last_name) AS reviewed_by_name,
        ap.school_year, ap.semester
     FROM course_transfers ct
     JOIN users s ON ct.student_id = s.user_id
     LEFT JOIN student_details sd ON ct.student_id = sd.user_id
     LEFT JOIN users r ON ct.reviewed_by = r.user_id
     LEFT JOIN academic_periods ap ON ct.effective_period_id = ap.period_id
     ORDER BY ct.created_at DESC`
  );
  return rows;
};

// Get transfers by student
export const getTransfersByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT ct.*, ap.school_year, ap.semester,
            CONCAT(r.first_name, ' ', r.last_name) AS reviewed_by_name
     FROM course_transfers ct
     LEFT JOIN academic_periods ap ON ct.effective_period_id = ap.period_id
     LEFT JOIN users r ON ct.reviewed_by = r.user_id
     WHERE ct.student_id = ?
     ORDER BY ct.created_at DESC`,
    [studentId]
  );
  return rows;
};

// Get single transfer
export const getTransferById = async (id) => {
  const [rows] = await db.query(
    `SELECT ct.*, 
            CONCAT(s.first_name, ' ', s.last_name) AS student_name,
            sd.student_number,
            CONCAT(r.first_name, ' ', r.last_name) AS reviewed_by_name,
            ap.school_year, ap.semester
     FROM course_transfers ct
     JOIN users s ON ct.student_id = s.user_id
     LEFT JOIN student_details sd ON ct.student_id = sd.user_id
     LEFT JOIN users r ON ct.reviewed_by = r.user_id
     LEFT JOIN academic_periods ap ON ct.effective_period_id = ap.period_id
     WHERE ct.transfer_id = ?`,
    [id]
  );
  return rows[0];
};

// Create transfer request
export const createTransfer = async (data) => {
  const [result] = await db.query(
    `INSERT INTO course_transfers 
     (student_id, current_program, target_program, reason, request_date, status,
      reviewed_by, review_date, review_notes, effective_period_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.student_id,
      data.current_program,
      data.target_program,
      data.reason,
      data.request_date,
      data.status || "Pending",
      data.reviewed_by,
      data.review_date,
      data.review_notes,
      data.effective_period_id,
    ]
  );
  return getTransferById(result.insertId);
};

// Update transfer
export const updateTransfer = async (id, data) => {
  await db.query(
    `UPDATE course_transfers SET
      current_program = ?, target_program = ?, reason = ?, request_date = ?,
      status = ?, reviewed_by = ?, review_date = ?, review_notes = ?, effective_period_id = ?
     WHERE transfer_id = ?`,
    [
      data.current_program,
      data.target_program,
      data.reason,
      data.request_date,
      data.status,
      data.reviewed_by,
      data.review_date,
      data.review_notes,
      data.effective_period_id,
      id,
    ]
  );
  return getTransferById(id);
};

// Delete transfer
export const deleteTransfer = async (id) => {
  await db.query(`DELETE FROM course_transfers WHERE transfer_id = ?`, [id]);
  return true;
};
