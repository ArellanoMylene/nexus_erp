import db from "../config/db.js";

const StaffLeave = {
  // Create leave request
  create: async (leaveData) => {
    const query = `
      INSERT INTO staff_leave (
        employee_id, leave_type, start_date, end_date, reason,
        status, supporting_document_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      leaveData.employee_id,
      leaveData.leave_type,
      leaveData.start_date,
      leaveData.end_date,
      leaveData.reason,
      leaveData.status || "Pending",
      leaveData.supporting_document_url,
    ]);
    return result;
  },

  // Get all leave requests with employee details
  getAll: async (filters) => {
    let query = `
      SELECT sl.*, er.employee_number, er.department, er.position,
             u.first_name, u.middle_name, u.last_name,
             approver.first_name as approver_first_name,
             approver.last_name as approver_last_name
      FROM staff_leave sl
      INNER JOIN employee_records er ON sl.employee_id = er.employee_id
      INNER JOIN users u ON er.user_id = u.user_id
      LEFT JOIN users approver ON sl.approved_by = approver.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.employee_id) {
      query += " AND sl.employee_id = ?";
      params.push(filters.employee_id);
    }

    if (filters.status) {
      query += " AND sl.status = ?";
      params.push(filters.status);
    }

    if (filters.leave_type) {
      query += " AND sl.leave_type = ?";
      params.push(filters.leave_type);
    }

    if (filters.start_date && filters.end_date) {
      query += " AND sl.start_date >= ? AND sl.end_date <= ?";
      params.push(filters.start_date, filters.end_date);
    }

    query += " ORDER BY sl.created_at DESC";

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get leave by ID
  getById: async (id) => {
    const query = `
      SELECT sl.*, er.employee_number, er.department, er.position,
             u.first_name, u.middle_name, u.last_name
      FROM staff_leave sl
      INNER JOIN employee_records er ON sl.employee_id = er.employee_id
      INNER JOIN users u ON er.user_id = u.user_id
      WHERE sl.leave_id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Update leave request
  update: async (id, leaveData) => {
    const query = `
      UPDATE staff_leave SET
        leave_type = ?, start_date = ?, end_date = ?,
        reason = ?, status = ?, supporting_document_url = ?
      WHERE leave_id = ?
    `;

    const [result] = await db.query(query, [
      leaveData.leave_type,
      leaveData.start_date,
      leaveData.end_date,
      leaveData.reason,
      leaveData.status,
      leaveData.supporting_document_url,
      id,
    ]);
    return result;
  },

  // Approve leave
  approve: async (id, approvedBy) => {
    const query = `
      UPDATE staff_leave SET
        status = 'Approved',
        approved_by = ?,
        approved_date = CURRENT_TIMESTAMP
      WHERE leave_id = ?
    `;
    const [result] = await db.query(query, [approvedBy, id]);
    return result;
  },

  // Reject leave
  reject: async (id, approvedBy, rejectionReason) => {
    const query = `
      UPDATE staff_leave SET
        status = 'Rejected',
        approved_by = ?,
        approved_date = CURRENT_TIMESTAMP,
        rejection_reason = ?
      WHERE leave_id = ?
    `;
    const [result] = await db.query(query, [
      approvedBy,
      rejectionReason,
      id,
    ]);
    return result;
  },

  // Delete leave request
  delete: async (id) => {
    const [result] = await db.query(
      "DELETE FROM staff_leave WHERE leave_id = ?",
      [id]
    );
    return result;
  },

  // Get leave summary
  getSummary: async (filters) => {
    let query = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'Approved' THEN total_days ELSE 0 END) as total_days_approved
      FROM staff_leave
      WHERE 1=1
    `;
    const params = [];

    if (filters.start_date && filters.end_date) {
      query += " AND start_date >= ? AND end_date <= ?";
      params.push(filters.start_date, filters.end_date);
    }

    const [rows] = await db.query(query, params);
    return rows;
  },
};

export default StaffLeave;
