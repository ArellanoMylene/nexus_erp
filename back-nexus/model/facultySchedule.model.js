import db from "../config/db.js";

const FacultySchedule = {
  getAll: () => {
    return db.query(`
      SELECT fs.*,
             u.first_name, u.last_name, ed.employee_id,
             c.code as course_code, c.title as course_title,
             ap.school_year, ap.semester
      FROM faculty_schedules fs
      INNER JOIN users u ON fs.faculty_user_id = u.user_id
      INNER JOIN employee_details ed ON u.user_id = ed.user_id
      LEFT JOIN courses c ON fs.course_id = c.course_id
      INNER JOIN academic_periods ap ON fs.academic_period_id = ap.period_id
      ORDER BY fs.day_of_week, fs.time_start
    `);
  },

  getByFacultyId: (facultyUserId, academicPeriodId = null) => {
    let query = `
      SELECT fs.*,
             c.code as course_code, c.title as course_title,
             ap.school_year, ap.semester
      FROM faculty_schedules fs
      LEFT JOIN courses c ON fs.course_id = c.course_id
      INNER JOIN academic_periods ap ON fs.academic_period_id = ap.period_id
      WHERE fs.faculty_user_id = ?
    `;

    const params = [facultyUserId];

    if (academicPeriodId) {
      query += " AND fs.academic_period_id = ?";
      params.push(academicPeriodId);
    }

    query += " ORDER BY fs.day_of_week, fs.time_start";

    return db.query(query, params);
  },

  getByAcademicPeriod: (periodId) => {
    return db.query(
      `
      SELECT fs.*,
             u.first_name, u.last_name, ed.employee_id,
             c.code as course_code, c.title as course_title
      FROM faculty_schedules fs
      INNER JOIN users u ON fs.faculty_user_id = u.user_id
      INNER JOIN employee_details ed ON u.user_id = ed.user_id
      LEFT JOIN courses c ON fs.course_id = c.course_id
      WHERE fs.academic_period_id = ?
      ORDER BY u.last_name, fs.day_of_week, fs.time_start
    `,
      [periodId]
    );
  },

  getById: (scheduleId) => {
    return db.query(
      `
      SELECT fs.*,
             u.first_name, u.last_name, ed.employee_id,
             c.code as course_code, c.title as course_title,
             ap.school_year, ap.semester
      FROM faculty_schedules fs
      INNER JOIN users u ON fs.faculty_user_id = u.user_id
      INNER JOIN employee_details ed ON u.user_id = ed.user_id
      LEFT JOIN courses c ON fs.course_id = c.course_id
      INNER JOIN academic_periods ap ON fs.academic_period_id = ap.period_id
      WHERE fs.schedule_id = ?
    `,
      [scheduleId]
    );
  },

  create: (scheduleData) => {
    return db.query(
      `INSERT INTO faculty_schedules
       (faculty_user_id, academic_period_id, day_of_week, time_start, time_end,
        activity_type, course_id, section, room, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        scheduleData.faculty_user_id,
        scheduleData.academic_period_id,
        scheduleData.day_of_week,
        scheduleData.time_start,
        scheduleData.time_end,
        scheduleData.activity_type || "teaching",
        scheduleData.course_id,
        scheduleData.section,
        scheduleData.room,
        scheduleData.notes,
        scheduleData.status || "active",
      ]
    );
  },

  update: (scheduleId, scheduleData) => {
    return db.query(
      `UPDATE faculty_schedules SET
       faculty_user_id = ?, academic_period_id = ?, day_of_week = ?,
       time_start = ?, time_end = ?, activity_type = ?, course_id = ?,
       section = ?, room = ?, notes = ?, status = ?
       WHERE schedule_id = ?`,
      [
        scheduleData.faculty_user_id,
        scheduleData.academic_period_id,
        scheduleData.day_of_week,
        scheduleData.time_start,
        scheduleData.time_end,
        scheduleData.activity_type,
        scheduleData.course_id,
        scheduleData.section,
        scheduleData.room,
        scheduleData.notes,
        scheduleData.status,
        scheduleId,
      ]
    );
  },

  delete: (scheduleId) => {
    return db.query("DELETE FROM faculty_schedules WHERE schedule_id = ?", [
      scheduleId,
    ]);
  },

  checkConflict: (
    facultyUserId,
    academicPeriodId,
    dayOfWeek,
    timeStart,
    timeEnd,
    excludeScheduleId = null
  ) => {
    let query = `
      SELECT * FROM faculty_schedules
      WHERE faculty_user_id = ? AND academic_period_id = ? AND day_of_week = ?
      AND status = 'active'
      AND (
        (time_start < ? AND time_end > ?)
        OR (time_start < ? AND time_end > ?)
        OR (time_start >= ? AND time_end <= ?)
      )
    `;

    const params = [
      facultyUserId,
      academicPeriodId,
      dayOfWeek,
      timeEnd,
      timeStart,
      timeEnd,
      timeStart,
      timeStart,
      timeEnd,
    ];

    if (excludeScheduleId) {
      query += " AND schedule_id != ?";
      params.push(excludeScheduleId);
    }

    return db.query(query, params);
  },

  getWeeklySchedule: (facultyUserId, academicPeriodId) => {
    return db.query(
      `
      SELECT fs.*,
             c.code as course_code, c.title as course_title
      FROM faculty_schedules fs
      LEFT JOIN courses c ON fs.course_id = c.course_id
      WHERE fs.faculty_user_id = ? AND fs.academic_period_id = ? AND fs.status = 'active'
      ORDER BY 
        FIELD(fs.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        fs.time_start
    `,
      [facultyUserId, academicPeriodId]
    );
  },
};

export default FacultySchedule;
