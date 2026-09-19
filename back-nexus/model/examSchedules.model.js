import pool from "../config/db.js";

const ExamSchedulesModel = {
  // Get all exam schedules with filters
  getAll: async (filters = {}) => {
    let query = `
      SELECT 
        es.*,
        e.exam_name,
        e.exam_type,
        c.code AS course_code,
        c.title AS course_name,
        s.section_name,
        u.first_name AS proctor_first_name,
        u.last_name AS proctor_last_name
      FROM exam_schedules es
      INNER JOIN exams e ON es.exam_id = e.exam_id
      INNER JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN sections s ON es.section_id = s.section_id
      LEFT JOIN users u ON es.proctor_id = u.user_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.exam_id) {
      query += " AND es.exam_id = ?";
      params.push(filters.exam_id);
    }

    if (filters.section_id) {
      query += " AND es.section_id = ?";
      params.push(filters.section_id);
    }

    if (filters.exam_date) {
      query += " AND es.exam_date = ?";
      params.push(filters.exam_date);
    }

    if (filters.status) {
      query += " AND es.status = ?";
      params.push(filters.status);
    }

    if (filters.date_from && filters.date_to) {
      query += " AND es.exam_date BETWEEN ? AND ?";
      params.push(filters.date_from, filters.date_to);
    }

    query += " ORDER BY es.exam_date ASC, es.start_time ASC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get schedule by ID
  getById: async (scheduleId) => {
    const query = `
      SELECT 
        es.*,
        e.exam_name,
        e.exam_type,
        e.total_points,
        e.exam_duration,
        c.code AS course_code,
        c.title AS course_name,
        s.section_name
      FROM exam_schedules es
      INNER JOIN exams e ON es.exam_id = e.exam_id
      INNER JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN sections s ON es.section_id = s.section_id
      WHERE es.schedule_id = ?
    `;
    const [rows] = await pool.query(query, [scheduleId]);
    return rows[0];
  },

  // Create new exam schedule
  create: async (scheduleData) => {
    const query = `
      INSERT INTO exam_schedules (
        exam_id, section_id, exam_date, start_time, end_time,
        venue, room_id, proctor_id, max_capacity, special_instructions, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      scheduleData.exam_id,
      scheduleData.section_id || null,
      scheduleData.exam_date,
      scheduleData.start_time,
      scheduleData.end_time,
      scheduleData.venue || null,
      scheduleData.room_id || null,
      scheduleData.proctor_id || null,
      scheduleData.max_capacity || null,
      scheduleData.special_instructions || null,
      scheduleData.status || "scheduled",
    ];

    const [result] = await pool.query(query, params);
    return result.insertId;
  },

  // Update exam schedule
  update: async (scheduleId, scheduleData) => {
    const query = `
      UPDATE exam_schedules SET
        exam_id = ?,
        section_id = ?,
        exam_date = ?,
        start_time = ?,
        end_time = ?,
        venue = ?,
        room_id = ?,
        proctor_id = ?,
        max_capacity = ?,
        special_instructions = ?,
        status = ?
      WHERE schedule_id = ?
    `;

    const params = [
      scheduleData.exam_id,
      scheduleData.section_id || null,
      scheduleData.exam_date,
      scheduleData.start_time,
      scheduleData.end_time,
      scheduleData.venue || null,
      scheduleData.room_id || null,
      scheduleData.proctor_id || null,
      scheduleData.max_capacity || null,
      scheduleData.special_instructions || null,
      scheduleData.status,
      scheduleId,
    ];

    const [result] = await pool.query(query, params);
    return result.affectedRows;
  },

  // Delete exam schedule
  delete: async (scheduleId) => {
    const query = "DELETE FROM exam_schedules WHERE schedule_id = ?";
    const [result] = await pool.query(query, [scheduleId]);
    return result.affectedRows;
  },

  // Get schedules by proctor
  getByProctor: async (proctorId) => {
    const query = `
      SELECT 
        es.*,
        e.exam_name,
        e.exam_type,
        c.course_code,
        s.section_name
      FROM exam_schedules es
      INNER JOIN exams e ON es.exam_id = e.exam_id
      INNER JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN sections s ON es.section_id = s.section_id
      WHERE es.proctor_id = ?
      ORDER BY es.exam_date ASC, es.start_time ASC
    `;
    const [rows] = await pool.query(query, [proctorId]);
    return rows;
  },

  // Check venue conflicts
  checkVenueConflict: async (
    venue,
    examDate,
    startTime,
    endTime,
    excludeScheduleId = null,
  ) => {
    let query = `
      SELECT schedule_id
      FROM exam_schedules
      WHERE venue = ?
        AND exam_date = ?
        AND status != 'cancelled'
        AND (
          (start_time <= ? AND end_time > ?) OR
          (start_time < ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
    `;

    const params = [
      venue,
      examDate,
      startTime,
      startTime,
      endTime,
      endTime,
      startTime,
      endTime,
    ];

    if (excludeScheduleId) {
      query += " AND schedule_id != ?";
      params.push(excludeScheduleId);
    }

    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  },
};

export default ExamSchedulesModel;
