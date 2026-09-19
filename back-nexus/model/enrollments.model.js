// model/enrollments.model.js
import db from "../config/db.js";

// Get all enrollments with student, course, and period details
export const getAllEnrollments = async (filters = {}) => {
  const { course_id, period_id, section_id, student_id, program_id } = filters;

  let query = `SELECT 
        e.enrollment_id,
        e.student_id,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        u.first_name,
        u.last_name,
        sd.student_number,
        COALESCE(e.year_level, sd.year_level) AS year_level,
        sd.course AS student_course,
        stp.program_id AS student_program_id,
        stp.code AS student_program_code,
        stp.name AS student_program_name,
        
        e.course_id,
        e.section_id,
        s.section_name,
        s.program_id AS section_program_id,
        sp.code AS section_program_code,
        sp.name AS section_program_name,
        c.code AS course_code,
        c.title AS course_title,
        c.units,
        
        e.period_id,
        ap.school_year,
        ap.semester,
        
        e.enrollment_date,
        e.status,
        e.midterm_grade,
        e.final_grade,
        e.remarks,
        e.created_at,
        e.updated_at
     FROM enrollments e
     JOIN users u ON e.student_id = u.user_id
     LEFT JOIN student_details sd ON e.student_id = sd.user_id
     LEFT JOIN programs stp ON (sd.course = stp.code OR sd.course = stp.name)
     JOIN courses c ON e.course_id = c.course_id
     LEFT JOIN sections s ON e.section_id = s.section_id
     LEFT JOIN programs sp ON s.program_id = sp.program_id
     JOIN academic_periods ap ON e.period_id = ap.period_id`;

  const params = [];
  const constraints = [];

  if (course_id) {
    constraints.push("e.course_id = ?");
    params.push(course_id);
  }
  if (period_id) {
    constraints.push("e.period_id = ?");
    params.push(period_id);
  }
  if (section_id) {
    constraints.push("e.section_id = ?");
    params.push(section_id);
  }
  if (student_id) {
    constraints.push("e.student_id = ?");
    params.push(student_id);
  }
  if (program_id) {
    constraints.push("(s.program_id = ? OR stp.program_id = ?)");
    params.push(program_id, program_id);
  }

  if (constraints.length > 0) {
    query += " WHERE " + constraints.join(" AND ");
  }

  query += ` ORDER BY e.created_at DESC`;

  const [rows] = await db.query(query, params);
  return rows;
};

// Get enrollments by student
export const getEnrollmentsByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT 
        e.enrollment_id,
        e.course_id,
        e.section_id,
        c.code AS course_code,
        c.title AS course_title,
        c.units,
        
        e.period_id,
        ap.school_year,
        ap.semester,
        
        e.enrollment_date,
        e.status,
        e.midterm_grade,
        e.final_grade,
        e.remarks,
        e.created_at,
        e.updated_at,
        
        s.section_name,
        s.room,
        s.schedule_day,
        s.schedule_time_start,
        s.schedule_time_end,
        
        CONCAT(fu.first_name, ' ', fu.last_name) AS instructor_name,
        
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'schedule_day', COALESCE(fas.schedule_day, s.schedule_day, ''),
            'schedule_time_start', COALESCE(fas.schedule_time_start, s.schedule_time_start, ''),
            'schedule_time_end', COALESCE(fas.schedule_time_end, s.schedule_time_end, '')
          )
        ) AS schedules
     FROM enrollments e
     JOIN courses c ON e.course_id = c.course_id
     JOIN academic_periods ap ON e.period_id = ap.period_id
     LEFT JOIN sections s ON e.section_id = s.section_id
     LEFT JOIN faculty_course_assignments fca 
       ON e.course_id = fca.course_id AND e.period_id = fca.academic_period_id
     LEFT JOIN faculty_assignment_schedules fas ON fca.assignment_id = fas.assignment_id
     LEFT JOIN users fu ON fca.faculty_user_id = fu.user_id
     WHERE e.student_id = ?
     GROUP BY 
        e.enrollment_id,
        e.course_id,
        e.section_id,
        c.code,
        c.title,
        c.units,
        e.period_id,
        ap.school_year,
        ap.semester,
        e.enrollment_date,
        e.status,
        e.midterm_grade,
        e.final_grade,
        e.remarks,
        e.created_at,
        e.updated_at,
        s.section_name,
        s.room,
        s.schedule_day,
        s.schedule_time_start,
        s.schedule_time_end,
        fu.first_name,
        fu.last_name
     ORDER BY e.created_at DESC`,
    [studentId],
  );
  return rows;
};

// Get single enrollment by ID
export const getEnrollmentById = async (id) => {
  const [rows] = await db.query(
    `SELECT 
        e.*,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        c.code AS course_code,
        c.title AS course_title,
        ap.school_year,
        ap.semester
     FROM enrollments e
     JOIN users u ON e.student_id = u.user_id
     JOIN courses c ON e.course_id = c.course_id
     JOIN academic_periods ap ON e.period_id = ap.period_id
     WHERE e.enrollment_id = ?`,
    [id],
  );
  return rows[0];
};

// Create new enrollment
// NOTE: section_id is NOT collected at enrollment time anymore. Enrolling
// just means "this student is taking this subject this period" - it
// always starts with section_id = null. Sectioning (grouping students
// into sections) is now a separate batch step that runs AFTER enrollment,
// see getUnsectionedEnrollments / setEnrollmentSection below and
// enrollments.service.js -> runSectioning().
export const createEnrollment = async ({
  student_id,
  course_id,
  period_id,
  section_id = null,
  year_level = null,
  enrollment_date,
  status = "Enrolled",
  midterm_grade = null,
  final_grade = null,
  remarks = null,
}) => {
  const [result] = await db.query(
    `INSERT INTO enrollments 
     (student_id, course_id, period_id, section_id, year_level, enrollment_date, status, midterm_grade, final_grade, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      student_id,
      course_id,
      period_id,
      section_id,
      year_level,
      enrollment_date,
      status,
      midterm_grade,
      final_grade,
      remarks,
    ],
  );

  return getEnrollmentById(result.insertId);
};

// Update enrollment
export const updateEnrollment = async (
  id,
  {
    course_id,
    period_id,
    section_id,
    year_level,
    enrollment_date,
    status,
    midterm_grade,
    final_grade,
    remarks,
  },
) => {
  await db.query(
    `UPDATE enrollments 
     SET course_id = ?, period_id = ?, section_id = ?, year_level = ?, enrollment_date = ?, status = ?, 
         midterm_grade = ?, final_grade = ?, remarks = ?
     WHERE enrollment_id = ?`,
    [
      course_id,
      period_id,
      section_id,
      year_level,
      enrollment_date,
      status,
      midterm_grade,
      final_grade,
      remarks,
      id,
    ],
  );

  return getEnrollmentById(id);
};

// Delete enrollment
export const deleteEnrollment = async (id) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Kunin muna yung section_id bago i-delete, kailangan natin para sa decrement
    const [rows] = await conn.query(
      `SELECT section_id FROM enrollments WHERE enrollment_id = ?`,
      [id],
    );
    if (!rows.length) {
      await conn.rollback();
      return false; // walang ganung enrollment
    }
    const { section_id } = rows[0];

    // 2. Idelete yung enrollment record
    await conn.query(`DELETE FROM enrollments WHERE enrollment_id = ?`, [id]);

    // 3. I-decrement yung current_enrolled ng section (section_id pwedeng null kung walang section pa)
    if (section_id) {
      await conn.query(
        `UPDATE sections 
         SET current_enrolled = GREATEST(current_enrolled - 1, 0),
             status = CASE 
                        WHEN status = 'full' AND current_enrolled - 1 < max_capacity 
                        THEN 'active' 
                        ELSE status 
                      END
         WHERE section_id = ?`,
        [section_id],
      );
    }

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Check if enrollment exists (prevent duplicates)
// Scoped to student + course + period ONLY - not section. A student can
// only be enrolled once in a given course for a given period; section is
// assigned afterward by the sectioning step, so it can never be part of
// the uniqueness key at enrollment time.
export const checkEnrollmentExists = async (
  student_id,
  course_id,
  period_id,
) => {
  const [rows] = await db.query(
    `SELECT enrollment_id FROM enrollments 
     WHERE student_id = ? AND course_id = ? AND period_id = ?`,
    [student_id, course_id, period_id],
  );
  return rows.length > 0;
};

// Get enrollment_id + student_id for students enrolled in a period (and optionally course/program)
// who do NOT have a section yet (section_id IS NULL).
export const getUnsectionedEnrollments = async (course_id, period_id, program_id = null) => {
  let query = `
    SELECT e.enrollment_id, e.student_id, e.course_id, e.period_id,
           sd.course AS student_course,
           p.program_id, p.code AS program_code, p.name AS program_name
    FROM enrollments e
    LEFT JOIN student_details sd ON e.student_id = sd.user_id
    LEFT JOIN programs p ON (sd.course = p.code OR sd.course = p.name)
    WHERE e.period_id = ? AND e.section_id IS NULL
  `;
  const params = [period_id];

  if (course_id) {
    query += " AND e.course_id = ?";
    params.push(course_id);
  }

  if (program_id) {
    query += " AND (p.program_id = ? OR sd.course = ?)";
    params.push(program_id, program_id);
  }

  const [rows] = await db.query(query, params);
  return rows;
};

// Attach a section to an already-existing enrollment row. This does NOT
// touch sections.current_enrolled itself - the caller (service layer,
// during runSectioning) is responsible for incrementing that alongside
// this call, same bookkeeping pattern used everywhere else in this file.
export const setEnrollmentSection = async (enrollment_id, section_id) => {
  await db.query(
    `UPDATE enrollments SET section_id = ? WHERE enrollment_id = ?`,
    [section_id, enrollment_id],
  );
  return getEnrollmentById(enrollment_id);
};

// Get enrolled students by faculty assignment ID
export const getStudentsByAssignment = async (assignmentId) => {
  const [rows] = await db.query(
    `SELECT 
        e.enrollment_id,
        e.student_id,
        sd.student_number AS student_id,
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        u.email,
        u.phone AS phone,
        e.status
     FROM enrollments e
     JOIN faculty_course_assignments fca ON e.course_id = fca.course_id 
         AND e.period_id = fca.academic_period_id
     JOIN sections s ON e.section_id = s.section_id AND s.section_name = fca.section
     JOIN users u ON e.student_id = u.user_id
     LEFT JOIN student_details sd ON e.student_id = sd.user_id
     WHERE fca.assignment_id = ?
     ORDER BY sd.student_number ASC`,
    [assignmentId],
  );
  return rows;
};