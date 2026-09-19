import pool from "../config/db.js";

const AbsenteeAlertsModel = {
  // Get all absentee alerts with filters
  async getAll(filters = {}) {
    let query = `
      SELECT 
        aa.*,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        u.email,
        CASE 
          WHEN aa.user_type = 'student' THEN sd.student_number
          WHEN aa.user_type IN ('faculty', 'staff') THEN ed.employee_id
          ELSE NULL
        END AS user_identifier,
        ap.school_year,
        ap.semester,
        c.code AS course_code,
        c.title AS course_title,
        CONCAT(n.first_name, ' ', n.last_name) AS notified_to_name,
        CONCAT(ack.first_name, ' ', ack.last_name) AS acknowledged_by_name
      FROM absentee_alerts aa
      INNER JOIN users u ON aa.user_id = u.user_id
      LEFT JOIN student_details sd ON aa.user_id = sd.user_id
      LEFT JOIN employee_details ed ON aa.user_id = ed.user_id
      LEFT JOIN academic_periods ap ON aa.period_id = ap.period_id
      LEFT JOIN courses c ON aa.course_id = c.course_id
      LEFT JOIN users n ON aa.notified_to = n.user_id
      LEFT JOIN users ack ON aa.acknowledged_by = ack.user_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.user_id) {
      query += " AND aa.user_id = ?";
      params.push(filters.user_id);
    }

    if (filters.user_type) {
      query += " AND aa.user_type = ?";
      params.push(filters.user_type);
    }

    if (filters.alert_type) {
      query += " AND aa.alert_type = ?";
      params.push(filters.alert_type);
    }

    if (filters.status) {
      query += " AND aa.status = ?";
      params.push(filters.status);
    }

    if (filters.priority) {
      query += " AND aa.priority = ?";
      params.push(filters.priority);
    }

    if (filters.period_id) {
      query += " AND aa.period_id = ?";
      params.push(filters.period_id);
    }

    if (filters.date_from) {
      query += " AND aa.alert_date >= ?";
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += " AND aa.alert_date <= ?";
      params.push(filters.date_to);
    }

    query += " ORDER BY aa.priority DESC, aa.alert_date DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get absentee alert by ID
  async getById(id) {
    const query = `
      SELECT 
        aa.*,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        u.email,
        CASE 
          WHEN aa.user_type = 'student' THEN sd.student_number
          WHEN aa.user_type IN ('faculty', 'staff') THEN ed.employee_id
          ELSE NULL
        END AS user_identifier,
        ap.school_year,
        ap.semester,
        c.code AS course_code,
        c.title AS course_title,
        CONCAT(n.first_name, ' ', n.last_name) AS notified_to_name,
        CONCAT(ack.first_name, ' ', ack.last_name) AS acknowledged_by_name
      FROM absentee_alerts aa
      INNER JOIN users u ON aa.user_id = u.user_id
      LEFT JOIN student_details sd ON aa.user_id = sd.user_id
      LEFT JOIN employee_details ed ON aa.user_id = ed.user_id
      LEFT JOIN academic_periods ap ON aa.period_id = ap.period_id
      LEFT JOIN courses c ON aa.course_id = c.course_id
      LEFT JOIN users n ON aa.notified_to = n.user_id
      LEFT JOIN users ack ON aa.acknowledged_by = ack.user_id
      WHERE aa.alert_id = ?
    `;

    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

  // Create absentee alert
  async create(data) {
    const query = `
      INSERT INTO absentee_alerts (
        user_id, user_type, alert_type, period_id, course_id,
        absence_count, threshold_exceeded, alert_date, priority,
        status, message, notified_to
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.user_id,
      data.user_type,
      data.alert_type,
      data.period_id || null,
      data.course_id || null,
      data.absence_count,
      data.threshold_exceeded || null,
      data.alert_date,
      data.priority || "medium",
      data.status || "pending",
      data.message || null,
      data.notified_to || null,
    ];

    const [result] = await pool.query(query, params);
    return result.insertId;
  },

  // Update absentee alert
  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.status) {
      fields.push("status = ?");
      params.push(data.status);
    }

    if (data.priority) {
      fields.push("priority = ?");
      params.push(data.priority);
    }

    if (data.message !== undefined) {
      fields.push("message = ?");
      params.push(data.message);
    }

    if (data.notified_to !== undefined) {
      fields.push("notified_to = ?");
      params.push(data.notified_to);
    }

    if (data.notified_to !== undefined) {
      fields.push("notified_at = NOW()");
    }

    if (data.acknowledged_by !== undefined) {
      fields.push("acknowledged_by = ?");
      params.push(data.acknowledged_by);
      fields.push("acknowledged_at = NOW()");
    }

    if (data.resolution_notes !== undefined) {
      fields.push("resolution_notes = ?");
      params.push(data.resolution_notes);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    params.push(id);
    const query = `UPDATE absentee_alerts SET ${fields.join(
      ", "
    )} WHERE alert_id = ?`;

    const [result] = await pool.query(query, params);
    return result.affectedRows;
  },

  // Delete absentee alert
  async delete(id) {
    const query = "DELETE FROM absentee_alerts WHERE alert_id = ?";
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  },

  // Get alert statistics
  async getStatistics(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) AS total_alerts,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_alerts,
        SUM(CASE WHEN status = 'acknowledged' THEN 1 ELSE 0 END) AS acknowledged_alerts,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_alerts,
        SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) AS critical_alerts,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) AS high_alerts
      FROM absentee_alerts
      WHERE 1=1
    `;

    const params = [];

    if (filters.period_id) {
      query += " AND period_id = ?";
      params.push(filters.period_id);
    }

    if (filters.user_type) {
      query += " AND user_type = ?";
      params.push(filters.user_type);
    }

    const [rows] = await pool.query(query, params);
    return rows[0];
  },

  // Get absence count for a student in a course
  async getAbsenceCount(studentId, courseId, periodId) {
    const query = `
      SELECT COUNT(*) AS absence_count
      FROM student_attendance
      WHERE student_id = ? AND course_id = ? AND period_id = ? AND status = 'absent'
    `;

    const [rows] = await pool.query(query, [studentId, courseId, periodId]);
    return rows[0]?.absence_count || 0;
  },

  // Get consecutive absences for a student
  async getConsecutiveAbsences(studentId, courseId, periodId) {
    const query = `
      SELECT COUNT(*) AS consecutive_count
      FROM student_attendance
      WHERE student_id = ? AND course_id = ? AND period_id = ? AND status = 'absent'
      AND attendance_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY attendance_date DESC
      LIMIT 10
    `;

    const [rows] = await pool.query(query, [studentId, courseId, periodId]);
    // Count consecutive absences from most recent
    let consecutive = 0;
    const today = new Date();

    if (rows.length > 0) {
      for (let i = 0; i < rows.length; i++) {
        consecutive++;
        // If gap found, break
        if (i > 0) {
          const prevDate = new Date(rows[i - 1].attendance_date);
          const currDate = new Date(rows[i].attendance_date);
          const dayDiff = (prevDate - currDate) / (1000 * 60 * 60 * 24);
          if (dayDiff > 1) break;
        }
      }
    }

    return consecutive;
  },

  // Check if alert already exists for today
  async checkExistingAlert(studentId, courseId, periodId, attendanceDate) {
    const query = `
      SELECT alert_id FROM absentee_alerts
      WHERE user_id = ? AND course_id = ? AND period_id = ? 
      AND DATE(alert_date) = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [
      studentId,
      courseId,
      periodId,
      attendanceDate,
    ]);
    return rows[0] || null;
  },
};

export default AbsenteeAlertsModel;
