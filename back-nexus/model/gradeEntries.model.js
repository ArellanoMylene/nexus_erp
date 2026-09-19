import pool from "../config/db.js";

const GradeEntriesModel = {
  // Get all grade entries with filters
  getAll: async (filters = {}) => {
    let query = `
      SELECT 
        ge.*,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        sd.student_number,
        c.code AS course_code,
        c.title AS course_name,
        sec.section_name,
        ap.school_year,
        ap.semester,
        f.first_name AS faculty_first_name,
        f.last_name AS faculty_last_name,
        a.first_name AS approver_first_name,
        a.last_name AS approver_last_name
      FROM grade_entries ge
      INNER JOIN users s ON ge.student_id = s.user_id
      LEFT JOIN student_details sd ON s.user_id = sd.user_id
      INNER JOIN courses c ON ge.course_id = c.course_id
      LEFT JOIN sections sec ON ge.section_id = sec.section_id
      INNER JOIN academic_periods ap ON ge.period_id = ap.period_id
      INNER JOIN users f ON ge.submitted_by = f.user_id
      LEFT JOIN users a ON ge.approved_by = a.user_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.student_id) {
      query += " AND ge.student_id = ?";
      params.push(filters.student_id);
    }

    if (filters.course_id) {
      query += " AND ge.course_id = ?";
      params.push(filters.course_id);
    }

    if (filters.section_id) {
      query += " AND ge.section_id = ?";
      params.push(filters.section_id);
    }

    if (filters.period_id) {
      query += " AND ge.period_id = ?";
      params.push(filters.period_id);
    }

    if (filters.submitted_by) {
      query += " AND ge.submitted_by = ?";
      params.push(filters.submitted_by);
    }

    if (filters.approval_status) {
      query += " AND ge.approval_status = ?";
      params.push(filters.approval_status);
    }

    if (filters.component_type) {
      query += " AND ge.component_type = ?";
      params.push(filters.component_type);
    }

    query += " ORDER BY ge.submitted_at DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get grade entry by ID
  getById: async (entryId) => {
    const query = `
      SELECT 
        ge.*,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        sd.student_number,
        c.code AS course_code,
        c.title AS course_name,
        sec.section_name,
        e.exam_name
      FROM grade_entries ge
      INNER JOIN users s ON ge.student_id = s.user_id
      LEFT JOIN student_details sd ON s.user_id = sd.user_id
      INNER JOIN courses c ON ge.course_id = c.course_id
      LEFT JOIN sections sec ON ge.section_id = sec.section_id
      LEFT JOIN exams e ON ge.exam_id = e.exam_id
      WHERE ge.entry_id = ?
    `;
    const [rows] = await pool.query(query, [entryId]);
    return rows[0];
  },

  // Create new grade entry
  create: async (entryData) => {
    const query = `
      INSERT INTO grade_entries (
        student_id, course_id, section_id, period_id, exam_id,
        component_name, component_type, raw_score, max_score,
        percentage, weight, weighted_score, remarks, submitted_by, label, is_locked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      entryData.student_id,
      entryData.course_id,
      entryData.section_id || null,
      entryData.period_id,
      entryData.exam_id || null,
      entryData.component_name,
      entryData.component_type || "other",
      entryData.raw_score || null,
      entryData.max_score || null,
      entryData.percentage || null,
      entryData.weight || null,
      entryData.weighted_score || null,
      entryData.remarks || null,
      entryData.submitted_by,
      entryData.label || "midterm",
      entryData.is_locked || false,
    ];

    const [result] = await pool.query(query, params);
    return result.insertId;
  },

  // Update grade entry
  update: async (entryId, entryData) => {
    const query = `
      UPDATE grade_entries SET
        student_id = ?,
        course_id = ?,
        section_id = ?,
        period_id = ?,
        exam_id = ?,
        component_name = ?,
        component_type = ?,
        raw_score = ?,
        max_score = ?,
        percentage = ?,
        weight = ?,
        weighted_score = ?,
        remarks = ?,
        label = ?,
        is_locked = ?
      WHERE entry_id = ?
    `;

    const params = [
      entryData.student_id,
      entryData.course_id,
      entryData.section_id || null,
      entryData.period_id,
      entryData.exam_id || null,
      entryData.component_name,
      entryData.component_type,
      entryData.raw_score || null,
      entryData.max_score || null,
      entryData.percentage || null,
      entryData.weight || null,
      entryData.weighted_score || null,
      entryData.remarks || null,
      entryData.label || "midterm",
      entryData.is_locked || false,
      entryId,
    ];

    const [result] = await pool.query(query, params);
    return result.affectedRows;
  },

  // Delete grade entry
  delete: async (entryId) => {
    const query = "DELETE FROM grade_entries WHERE entry_id = ?";
    const [result] = await pool.query(query, [entryId]);
    return result.affectedRows;
  },

  // Approve grade entry
  approve: async (entryId, approvedBy) => {
    const query = `
      UPDATE grade_entries SET
        approval_status = 'approved',
        approved_by = ?,
        approved_at = CURRENT_TIMESTAMP
      WHERE entry_id = ?
    `;
    const [result] = await pool.query(query, [approvedBy, entryId]);
    return result.affectedRows;
  },

  // Reject grade entry
  reject: async (entryId, approvedBy, rejectionReason) => {
    const query = `
      UPDATE grade_entries SET
        approval_status = 'rejected',
        approved_by = ?,
        approved_at = CURRENT_TIMESTAMP,
        rejection_reason = ?
      WHERE entry_id = ?
    `;
    const [result] = await pool.query(query, [
      approvedBy,
      rejectionReason,
      entryId,
    ]);
    return result.affectedRows;
  },

  // Get pending approvals count
  getPendingCount: async () => {
    const query =
      "SELECT COUNT(*) as count FROM grade_entries WHERE approval_status = 'pending'";
    const [rows] = await pool.query(query);
    return rows[0].count;
  },
};

export default GradeEntriesModel;
