import pool from "../config/db.js";

const StaffAttendanceModel = {
  // Get all staff attendance records with filters
  async getAll(filters = {}) {
    let query = `
      SELECT 
        sa.*,
        CONCAT(u.first_name, ' ', u.last_name) AS staff_name,
        u.role,
        ed.employee_id,
        ed.department,
        rc.card_number AS rfid_card,
        CONCAT(v.first_name, ' ', v.last_name) AS verified_by_name
      FROM staff_attendance sa
      INNER JOIN users u ON sa.user_id = u.user_id
      LEFT JOIN employee_details ed ON sa.user_id = ed.user_id
      LEFT JOIN rfid_cards rc ON sa.rfid_card_id = rc.rfid_id
      LEFT JOIN users v ON sa.verified_by = v.user_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.user_id) {
      query += " AND sa.user_id = ?";
      params.push(filters.user_id);
    }

    if (filters.status) {
      query += " AND sa.status = ?";
      params.push(filters.status);
    }

    if (filters.date_from) {
      query += " AND sa.attendance_date >= ?";
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += " AND sa.attendance_date <= ?";
      params.push(filters.date_to);
    }

    if (filters.department) {
      query += " AND ed.department = ?";
      params.push(filters.department);
    }

    query += " ORDER BY sa.attendance_date DESC, sa.time_in DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get staff attendance by ID
  async getById(id) {
    const query = `
      SELECT 
        sa.*,
        CONCAT(u.first_name, ' ', u.last_name) AS staff_name,
        u.role,
        ed.employee_id,
        ed.department,
        rc.card_number AS rfid_card,
        CONCAT(v.first_name, ' ', v.last_name) AS verified_by_name
      FROM staff_attendance sa
      INNER JOIN users u ON sa.user_id = u.user_id
      LEFT JOIN employee_details ed ON sa.user_id = ed.user_id
      LEFT JOIN rfid_cards rc ON sa.rfid_card_id = rc.rfid_id
      LEFT JOIN users v ON sa.verified_by = v.user_id
      WHERE sa.attendance_id = ?
    `;

    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

  // Create staff attendance record
  async create(data) {
    const query = `
      INSERT INTO staff_attendance (
        user_id, attendance_date, time_in, time_out, status,
        attendance_method, rfid_card_id, location, remarks, verified_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.user_id,
      data.attendance_date,
      data.time_in || null,
      data.time_out || null,
      data.status || "present",
      data.attendance_method || "manual",
      data.rfid_card_id || null,
      data.location || null,
      data.remarks || null,
      data.verified_by || null,
    ];

    const [result] = await pool.query(query, params);
    return result.insertId;
  },

  // Update staff attendance record
  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.time_in !== undefined) {
      fields.push("time_in = ?");
      params.push(data.time_in);
    }

    if (data.time_out !== undefined) {
      fields.push("time_out = ?");
      params.push(data.time_out);
    }

    if (data.status) {
      fields.push("status = ?");
      params.push(data.status);
    }

    if (data.attendance_method) {
      fields.push("attendance_method = ?");
      params.push(data.attendance_method);
    }

    if (data.location !== undefined) {
      fields.push("location = ?");
      params.push(data.location);
    }

    if (data.remarks !== undefined) {
      fields.push("remarks = ?");
      params.push(data.remarks);
    }

    if (data.verified_by !== undefined) {
      fields.push("verified_by = ?");
      params.push(data.verified_by);
    }

    if (data.verified_by !== undefined) {
      fields.push("verified_at = NOW()");
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    params.push(id);
    const query = `UPDATE staff_attendance SET ${fields.join(
      ", "
    )} WHERE attendance_id = ?`;

    const [result] = await pool.query(query, params);
    return result.affectedRows;
  },

  // Delete staff attendance record
  async delete(id) {
    const query = "DELETE FROM staff_attendance WHERE attendance_id = ?";
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  },

  // Get attendance summary for a staff member
  async getSummary(user_id, date_from, date_to) {
    const query = `
      SELECT 
        COUNT(*) AS total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_days,
        SUM(CASE WHEN status = 'half-day' THEN 1 ELSE 0 END) AS half_days,
        SUM(CASE WHEN status = 'on-leave' THEN 1 ELSE 0 END) AS leave_days
      FROM staff_attendance
      WHERE user_id = ?
        AND attendance_date BETWEEN ? AND ?
    `;

    const [rows] = await pool.query(query, [user_id, date_from, date_to]);
    return rows[0];
  },
};

export default StaffAttendanceModel;
