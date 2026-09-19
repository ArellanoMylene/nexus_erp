import pool from "../config/db.js";

const StudentAttendanceModel = {
  // Get all student attendance records with filters
  async getAll(filters = {}) {
    let query = `
      SELECT 
        sa.*,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        sd.student_number,
        c.code AS course_code,
        c.title AS course_title,
        sec.section_name,
        ap.school_year,
        ap.semester,
        rc.card_number AS rfid_card,
        CONCAT(f.first_name, ' ', f.last_name) AS marked_by_name
      FROM student_attendance sa
      INNER JOIN users u ON sa.student_id = u.user_id
      LEFT JOIN student_details sd ON sa.student_id = sd.user_id
      INNER JOIN courses c ON sa.course_id = c.course_id
      LEFT JOIN sections sec ON sa.section_id = sec.section_id
      INNER JOIN academic_periods ap ON sa.period_id = ap.period_id
      LEFT JOIN rfid_cards rc ON sa.rfid_card_id = rc.rfid_id
      LEFT JOIN users f ON sa.marked_by = f.user_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.student_id) {
      query += " AND sa.student_id = ?";
      params.push(filters.student_id);
    }

    if (filters.course_id) {
      query += " AND sa.course_id = ?";
      params.push(filters.course_id);
    }

    if (filters.section_id) {
      query += " AND sa.section_id = ?";
      params.push(filters.section_id);
    }

    if (filters.period_id) {
      query += " AND sa.period_id = ?";
      params.push(filters.period_id);
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

    query += " ORDER BY sa.attendance_date DESC, sa.time_in DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get student attendance by ID
  async getById(id) {
    const query = `
      SELECT 
        sa.*,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        sd.student_number,
        c.code AS course_code,
        c.title AS course_title,
        sec.section_name,
        ap.school_year,
        ap.semester,
        rc.card_number AS rfid_card,
        CONCAT(f.first_name, ' ', f.last_name) AS marked_by_name
      FROM student_attendance sa
      INNER JOIN users u ON sa.student_id = u.user_id
      LEFT JOIN student_details sd ON sa.student_id = sd.user_id
      INNER JOIN courses c ON sa.course_id = c.course_id
      LEFT JOIN sections sec ON sa.section_id = sec.section_id
      INNER JOIN academic_periods ap ON sa.period_id = ap.period_id
      LEFT JOIN rfid_cards rc ON sa.rfid_card_id = rc.rfid_id
      LEFT JOIN users f ON sa.marked_by = f.user_id
      WHERE sa.attendance_id = ?
    `;

    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

  // Create student attendance record
  async create(data) {
    const query = `
      INSERT INTO student_attendance (
        student_id, course_id, section_id, period_id, attendance_date,
        time_in, status, attendance_method, rfid_card_id, marked_by, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.student_id,
      data.course_id,
      data.section_id || null,
      data.period_id,
      data.attendance_date,
      data.time_in || null,
      data.status || "present",
      data.attendance_method || "manual",
      data.rfid_card_id || null,
      data.marked_by || null,
      data.remarks || null,
    ];

    const [result] = await pool.query(query, params);
    return result.insertId;
  },

  // Update student attendance record
  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.time_in !== undefined) {
      fields.push("time_in = ?");
      params.push(data.time_in);
    }

    if (data.status) {
      fields.push("status = ?");
      params.push(data.status);
    }

    if (data.attendance_method) {
      fields.push("attendance_method = ?");
      params.push(data.attendance_method);
    }

    if (data.remarks !== undefined) {
      fields.push("remarks = ?");
      params.push(data.remarks);
    }

    if (data.marked_by !== undefined) {
      fields.push("marked_by = ?");
      params.push(data.marked_by);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    params.push(id);
    const query = `UPDATE student_attendance SET ${fields.join(
      ", "
    )} WHERE attendance_id = ?`;

    const [result] = await pool.query(query, params);
    return result.affectedRows;
  },

  // Delete student attendance record
  async delete(id) {
    const query = "DELETE FROM student_attendance WHERE attendance_id = ?";
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  },

  // Get attendance summary for a student in a course
  async getSummary(student_id, course_id, period_id) {
    const query = `
      SELECT 
        COUNT(*) AS total_sessions,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) AS excused_count,
        ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS attendance_percentage
      FROM student_attendance
      WHERE student_id = ?
        AND course_id = ?
        AND period_id = ?
    `;

    const [rows] = await pool.query(query, [student_id, course_id, period_id]);
    return rows[0];
  },

  // Bulk mark attendance for a class
  async bulkCreate(attendanceRecords) {
    const query = `
      INSERT INTO student_attendance (
        student_id, course_id, section_id, period_id, attendance_date,
        time_in, status, attendance_method, marked_by, remarks
      ) VALUES ?
    `;

    const values = attendanceRecords.map((record) => [
      record.student_id,
      record.course_id,
      record.section_id || null,
      record.period_id,
      record.attendance_date,
      record.time_in || null,
      record.status || "present",
      record.attendance_method || "manual",
      record.marked_by || null,
      record.remarks || null,
    ]);

    const [result] = await pool.query(query, [values]);
    return result.affectedRows;
  },
};

export default StudentAttendanceModel;
