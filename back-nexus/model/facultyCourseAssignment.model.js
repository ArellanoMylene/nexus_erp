import db from "../config/db.js";

const FacultyCourseAssignment = {
  // Get all course assignments
  getAll: () => {
    return db.query(`
            SELECT fca.*, 
              CONCAT(u.first_name, ' ', u.last_name) AS faculty_name, u.first_name, u.last_name, ed.employee_id,
              c.code as course_code, c.title as course_title, c.units,
              ap.school_year, ap.semester, ap.status as period_status,
              fas.schedule_day, fas.schedule_time_start, fas.schedule_time_end
      FROM faculty_course_assignments fca
      INNER JOIN users u ON fca.faculty_user_id = u.user_id
      INNER JOIN employee_details ed ON u.user_id = ed.user_id
      INNER JOIN courses c ON fca.course_id = c.course_id
      INNER JOIN academic_periods ap ON fca.academic_period_id = ap.period_id
      LEFT JOIN faculty_assignment_schedules fas ON fca.assignment_id = fas.assignment_id
      ORDER BY fca.created_at DESC
    `);
  },

  // Get assignments by faculty ID
  getByFacultyId: (facultyUserId) => {
    return db.query(
      `
            SELECT fca.*, 
              CONCAT(u.first_name, ' ', u.last_name) AS faculty_name, u.first_name, u.last_name, ed.employee_id,
              c.code as course_code, c.title as course_title, c.units,
              ap.school_year, ap.semester,
              fas.schedule_day, fas.schedule_time_start, fas.schedule_time_end,
              s.section_id,
              (SELECT COUNT(*)
 FROM enrollments e
 JOIN sections s ON e.section_id = s.section_id
 WHERE e.period_id = fca.academic_period_id
 AND s.section_name = fca.section
 AND e.status = 'Enrolled'
) AS current_enrolled
            FROM faculty_course_assignments fca
            INNER JOIN users u ON fca.faculty_user_id = u.user_id
            INNER JOIN employee_details ed ON u.user_id = ed.user_id
            INNER JOIN courses c ON fca.course_id = c.course_id
            INNER JOIN academic_periods ap ON fca.academic_period_id = ap.period_id
         LEFT JOIN sections s
ON fca.academic_period_id = s.period_id
AND fca.section = s.section_name
            LEFT JOIN faculty_assignment_schedules fas ON fca.assignment_id = fas.assignment_id
            WHERE fca.faculty_user_id = ?
            ORDER BY ap.school_year DESC, ap.semester DESC
    `,
      [facultyUserId],
    );
  },

  // Get assignments by academic period
  getByAcademicPeriod: (periodId) => {
    return db.query(
      `
            SELECT fca.*, 
              CONCAT(u.first_name, ' ', u.last_name) AS faculty_name, u.first_name, u.last_name, ed.employee_id,
              c.code as course_code, c.title as course_title, c.units,
              fas.schedule_day, fas.schedule_time_start, fas.schedule_time_end
            FROM faculty_course_assignments fca
            INNER JOIN users u ON fca.faculty_user_id = u.user_id
            INNER JOIN employee_details ed ON u.user_id = ed.user_id
            INNER JOIN courses c ON fca.course_id = c.course_id
            LEFT JOIN faculty_assignment_schedules fas ON fca.assignment_id = fas.assignment_id
            WHERE fca.academic_period_id = ?
            ORDER BY c.code, fca.section
    `,
      [periodId],
    );
  },

  // Get assignment by ID
  getById: (assignmentId) => {
    return db.query(
      `
            SELECT fca.*, 
              CONCAT(u.first_name, ' ', u.last_name) AS faculty_name, u.first_name, u.last_name, u.email, ed.employee_id,
              c.code as course_code, c.title as course_title, c.units,
              ap.school_year, ap.semester,
              fas.schedule_day, fas.schedule_time_start, fas.schedule_time_end
            FROM faculty_course_assignments fca
            INNER JOIN users u ON fca.faculty_user_id = u.user_id
            INNER JOIN employee_details ed ON u.user_id = ed.user_id
            INNER JOIN courses c ON fca.course_id = c.course_id
            INNER JOIN academic_periods ap ON fca.academic_period_id = ap.period_id
            LEFT JOIN faculty_assignment_schedules fas ON fca.assignment_id = fas.assignment_id
            WHERE fca.assignment_id = ?
    `,
      [assignmentId],
    );
  },

  // Create new assignment
  create: async (assignmentData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insert into faculty_course_assignments
      const [result] = await connection.query(
        `INSERT INTO faculty_course_assignments 
         (faculty_user_id, course_id, academic_period_id, section, room, max_students, 
          current_enrolled, assignment_status, assigned_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assignmentData.faculty_user_id,
          assignmentData.course_id,
          assignmentData.academic_period_id,
          assignmentData.section,
          assignmentData.room,
          assignmentData.max_students,
          assignmentData.current_enrolled || 0,
          assignmentData.assignment_status || "active",
          assignmentData.assigned_date || new Date(),
        ],
      );

      const assignmentId = result.insertId;

      // Insert schedule if provided
      if (
        assignmentData.schedule_day &&
        assignmentData.schedule_time_start &&
        assignmentData.schedule_time_end
      ) {
        await connection.query(
          `INSERT INTO faculty_assignment_schedules 
           (assignment_id, schedule_day, schedule_time_start, schedule_time_end)
           VALUES (?, ?, ?, ?)`,
          [
            assignmentId,
            assignmentData.schedule_day,
            assignmentData.schedule_time_start,
            assignmentData.schedule_time_end,
          ],
        );
      }

      await connection.commit();
      return [result];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update assignment
  update: async (assignmentId, assignmentData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Update faculty_course_assignments
      await connection.query(
        `UPDATE faculty_course_assignments SET
         faculty_user_id = ?, course_id = ?, academic_period_id = ?, section = ?,
         room = ?, max_students = ?, current_enrolled = ?, assignment_status = ?
         WHERE assignment_id = ?`,
        [
          assignmentData.faculty_user_id,
          assignmentData.course_id,
          assignmentData.academic_period_id,
          assignmentData.section,
          assignmentData.room,
          assignmentData.max_students,
          assignmentData.current_enrolled,
          assignmentData.assignment_status,
          assignmentId,
        ],
      );

      // Update schedule if provided
      if (
        assignmentData.schedule_day &&
        assignmentData.schedule_time_start &&
        assignmentData.schedule_time_end
      ) {
        // Check if schedule exists
        const [existing] = await connection.query(
          `SELECT id FROM faculty_assignment_schedules WHERE assignment_id = ?`,
          [assignmentId],
        );

        if (existing.length > 0) {
          // Update existing schedule
          await connection.query(
            `UPDATE faculty_assignment_schedules 
             SET schedule_day = ?, schedule_time_start = ?, schedule_time_end = ?
             WHERE assignment_id = ?`,
            [
              assignmentData.schedule_day,
              assignmentData.schedule_time_start,
              assignmentData.schedule_time_end,
              assignmentId,
            ],
          );
        } else {
          // Insert new schedule
          await connection.query(
            `INSERT INTO faculty_assignment_schedules 
             (assignment_id, schedule_day, schedule_time_start, schedule_time_end)
             VALUES (?, ?, ?, ?)`,
            [
              assignmentId,
              assignmentData.schedule_day,
              assignmentData.schedule_time_start,
              assignmentData.schedule_time_end,
            ],
          );
        }
      }

      await connection.commit();
      return [{ affectedRows: 1 }];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Delete assignment
  delete: (assignmentId) => {
    return db.query(
      "DELETE FROM faculty_course_assignments WHERE assignment_id = ?",
      [assignmentId],
    );
  },

  // Check for schedule conflicts
  checkConflict: (
    facultyUserId,
    academicPeriodId,
    scheduleDay,
    timeStart,
    timeEnd,
    excludeAssignmentId = null,
  ) => {
    let query = `
      SELECT fca.*, fas.schedule_day, fas.schedule_time_start, fas.schedule_time_end
      FROM faculty_course_assignments fca
      INNER JOIN faculty_assignment_schedules fas ON fca.assignment_id = fas.assignment_id
      WHERE fca.faculty_user_id = ? AND fca.academic_period_id = ? AND fas.schedule_day = ?
      AND fca.assignment_status = 'active'
      AND (
        (fas.schedule_time_start < ? AND fas.schedule_time_end > ?)
        OR (fas.schedule_time_start < ? AND fas.schedule_time_end > ?)
        OR (fas.schedule_time_start >= ? AND fas.schedule_time_end <= ?)
      )
    `;

    const params = [
      facultyUserId,
      academicPeriodId,
      scheduleDay,
      timeEnd,
      timeStart,
      timeEnd,
      timeStart,
      timeStart,
      timeEnd,
    ];

    if (excludeAssignmentId) {
      query += " AND fca.assignment_id != ?";
      params.push(excludeAssignmentId);
    }

    return db.query(query, params);
  },
};

export default FacultyCourseAssignment;
