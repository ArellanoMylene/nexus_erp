import db from "../config/db.js";

const FacultyAdvisory = {
  getAll: () => {
    return db.query(`
      SELECT faa.*, 
             CONCAT(f.first_name, ' ', f.last_name) AS faculty_name, 
             CONCAT(s.first_name, ' ', s.last_name) AS student_name, 
             faa.advisory_type,
             fed.employee_id,
             p.name as program_name, p.code as program_code,
             ap.school_year, ap.semester
      FROM faculty_advisory_assignments faa
      INNER JOIN users f ON faa.faculty_user_id = f.user_id
      INNER JOIN employee_details fed ON f.user_id = fed.user_id
      INNER JOIN users s ON faa.student_id = s.user_id
      LEFT JOIN programs p ON faa.program_id = p.program_id
      INNER JOIN academic_periods ap ON faa.academic_period_id = ap.period_id
      ORDER BY faa.created_at DESC
    `);
  },

  getByFacultyId: (facultyUserId) => {
    return db.query(
      `
      SELECT faa.*,
             s.first_name as student_first_name, s.last_name as student_last_name, s.email as student_email,
             p.name as program_name, p.code as program_code,
             ap.school_year, ap.semester
      FROM faculty_advisory_assignments faa
      INNER JOIN users s ON faa.student_id = s.user_id
      LEFT JOIN programs p ON faa.program_id = p.program_id
      INNER JOIN academic_periods ap ON faa.academic_period_id = ap.period_id
      WHERE faa.faculty_user_id = ? AND faa.status = 'active'
      ORDER BY s.last_name, s.first_name
    `,
      [facultyUserId],
    );
  },

  getByStudentId: (studentId) => {
    return db.query(
      `
      SELECT faa.*,
             f.first_name as faculty_first_name, f.last_name as faculty_last_name,
             fed.employee_id, f.email as faculty_email, f.phone,
             p.name as program_name,
             ap.school_year, ap.semester
      FROM faculty_advisory_assignments faa
      INNER JOIN users f ON faa.faculty_user_id = f.user_id
      INNER JOIN employee_details fed ON f.user_id = fed.user_id
      LEFT JOIN programs p ON faa.program_id = p.program_id
      INNER JOIN academic_periods ap ON faa.academic_period_id = ap.period_id
      WHERE faa.student_id = ? AND faa.status = 'active'
      ORDER BY faa.created_at DESC
    `,
      [studentId],
    );
  },

  getById: (advisoryId) => {
    return db.query(
      `
      SELECT faa.*,
             f.first_name as faculty_first_name, f.last_name as faculty_last_name, fed.employee_id,
             s.first_name as student_first_name, s.last_name as student_last_name,
             p.name as program_name, p.code as program_code,
             ap.school_year, ap.semester
      FROM faculty_advisory_assignments faa
      INNER JOIN users f ON faa.faculty_user_id = f.user_id
      INNER JOIN employee_details fed ON f.user_id = fed.user_id
      INNER JOIN users s ON faa.student_id = s.user_id
      LEFT JOIN programs p ON faa.program_id = p.program_id
      INNER JOIN academic_periods ap ON faa.academic_period_id = ap.period_id
      WHERE faa.advisory_id = ?
    `,
      [advisoryId],
    );
  },

  create: (advisoryData) => {
    return db.query(
      `INSERT INTO faculty_advisory_assignments
       (faculty_user_id, student_id, advisory_type, program_id, year_level, academic_period_id, 
        assignment_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        advisoryData.faculty_user_id,
        advisoryData.student_id,
        advisoryData.advisory_type || "Academic",
        advisoryData.program_id,
        advisoryData.year_level,
        advisoryData.academic_period_id,
        advisoryData.assignment_date || new Date(),
        advisoryData.status || "active",
        advisoryData.notes,
      ],
    );
  },

  update: (advisoryId, advisoryData) => {
    return db.query(
      `UPDATE faculty_advisory_assignments SET
       faculty_user_id = ?, student_id = ?, advisory_type = ?, program_id = ?, year_level = ?,
       academic_period_id = ?, status = ?, notes = ?
       WHERE advisory_id = ?`,
      [
        advisoryData.faculty_user_id,
        advisoryData.student_id,
        advisoryData.advisory_type || "Academic",
        advisoryData.program_id,
        advisoryData.year_level,
        advisoryData.academic_period_id,
        advisoryData.status,
        advisoryData.notes,
        advisoryId,
      ],
    );
  },

  delete: (advisoryId) => {
    return db.query(
      "DELETE FROM faculty_advisory_assignments WHERE advisory_id = ?",
      [advisoryId],
    );
  },

  getAdvisoryLoad: (facultyUserId, academicPeriodId) => {
    return db.query(
      `
      SELECT COUNT(*) as advisee_count
      FROM faculty_advisory_assignments
      WHERE faculty_user_id = ? AND academic_period_id = ? AND status = 'active'
    `,
      [facultyUserId, academicPeriodId],
    );
  },

  getStudentsWithoutAdvisors: (academicPeriodId) => {
    return db.query(
      `
      SELECT u.user_id, u.first_name, u.last_name, u.email,
             sd.year_level,
             p.name as program_name, p.code as program_code
      FROM users u
      INNER JOIN student_details sd ON u.user_id = sd.user_id
      INNER JOIN enrollments e ON u.user_id = e.student_id
      LEFT JOIN programs p ON sd.course = p.name
      LEFT JOIN faculty_advisory_assignments faa ON u.user_id = faa.student_id 
        AND faa.academic_period_id = ? AND faa.status = 'active'
      WHERE u.role = 'Student' AND faa.advisory_id IS NULL
      AND e.period_id = ?
      GROUP BY u.user_id
    `,
      [academicPeriodId, academicPeriodId],
    );
  },
};

export default FacultyAdvisory;
