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
        s.room AS section_room,
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
     LEFT JOIN programs stp ON (
       LOWER(TRIM(sd.course)) = LOWER(TRIM(stp.code))
       OR LOWER(TRIM(sd.course)) = LOWER(TRIM(stp.name))
       OR LOWER(TRIM(sd.course)) LIKE CONCAT(LOWER(TRIM(stp.code)), ' - %')
     )
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

export const createEnrollments = async (enrollments) => {
  if (!enrollments.length) return [];
  const connection = await db.getConnection();
  const values = [];
  const placeholders = enrollments.map((enrollment) => {
    values.push(
      enrollment.student_id,
      enrollment.course_id,
      enrollment.period_id,
      enrollment.section_id,
      enrollment.year_level,
      enrollment.enrollment_date,
      enrollment.status,
      enrollment.midterm_grade,
      enrollment.final_grade,
      enrollment.remarks,
    );
    return "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  });
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO enrollments
       (student_id, course_id, period_id, section_id, year_level, enrollment_date, status, midterm_grade, final_grade, remarks)
       VALUES ${placeholders.join(", ")}`,
      values,
    );
    await connection.commit();
    const studentIds = [...new Set(enrollments.map(({ student_id }) => student_id))];
    const courseIds = [...new Set(enrollments.map(({ course_id }) => course_id))];
    const studentPlaceholders = studentIds.map(() => "?").join(", ");
    const coursePlaceholders = courseIds.map(() => "?").join(", ");
    const [rows] = await connection.query(
      `SELECT e.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name,
              c.code AS course_code, c.title AS course_title,
              ap.school_year, ap.semester
       FROM enrollments e
       JOIN users u ON e.student_id = u.user_id
       JOIN courses c ON e.course_id = c.course_id
       JOIN academic_periods ap ON e.period_id = ap.period_id
       WHERE e.period_id = ?
         AND e.student_id IN (${studentPlaceholders})
         AND e.course_id IN (${coursePlaceholders})
       ORDER BY e.enrollment_id`,
      [
        enrollments[0].period_id,
        ...studentIds,
        ...courseIds,
      ],
    );
    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

// Update selected fields on existing student/course enrollments in one term.
// Target matching is by the chosen students and courses; no rows are inserted.
export const bulkUpdateEnrollments = async ({ student_ids, course_ids, period_id, updates }) => {
  const studentIds = [...new Set((student_ids || []).filter(Boolean))];
  const courseIds = [...new Set((course_ids || []).filter(Boolean))];
  if (!studentIds.length || !courseIds.length || !period_id) return 0;

  const allowedColumns = new Set([
    "enrollment_date",
    "status",
    "midterm_grade",
    "final_grade",
    "remarks",
  ]);
  const entries = Object.entries(updates || {}).filter(([column, value]) =>
    allowedColumns.has(column) && value !== undefined,
  );
  if (!entries.length) return 0;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT enrollment_id FROM enrollments
       WHERE period_id = ?
         AND student_id IN (${studentIds.map(() => "?").join(", ")})
         AND course_id IN (${courseIds.map(() => "?").join(", ")})`,
      [period_id, ...studentIds, ...courseIds],
    );
    const enrollmentIds = rows.map((row) => row.enrollment_id);
    if (!enrollmentIds.length) {
      await connection.commit();
      return 0;
    }

    const setClause = entries.map(([column]) => `${column} = ?`).join(", ");
    await connection.query(
      `UPDATE enrollments SET ${setClause}
       WHERE enrollment_id IN (${enrollmentIds.map(() => "?").join(", ")})`,
      [...entries.map(([, value]) => value), ...enrollmentIds],
    );
    await connection.commit();
    return enrollmentIds.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

export const findExistingEnrollments = async (studentIds, courseIds, periodId) => {
  if (!studentIds.length || !courseIds.length) return [];
  const studentPlaceholders = studentIds.map(() => "?").join(", ");
  const coursePlaceholders = courseIds.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT student_id, course_id FROM enrollments
     WHERE period_id = ?
       AND student_id IN (${studentPlaceholders})
       AND course_id IN (${coursePlaceholders})`,
    [periodId, ...studentIds, ...courseIds],
  );
  return rows;
};

// Get enrollment_id + student_id for students enrolled in a period (and optionally course/program)
// who do NOT have a section yet (section_id IS NULL).
export const getUnsectionedEnrollments = async (
  course_ids,
  period_id,
  program_id = null,
  year_level = null,
  curriculum_type = null,
) => {
  let query = `
    SELECT e.enrollment_id, e.student_id, e.course_id, e.period_id, e.section_id,
           COALESCE(NULLIF(e.year_level, ''), sd.year_level) AS year_level,
           c.year_level AS course_year_level,
           sd.course AS student_course,
           p.program_id, p.code AS program_code, p.name AS program_name
    FROM enrollments e
    LEFT JOIN student_details sd ON e.student_id = sd.user_id
    LEFT JOIN programs p ON (
      LOWER(TRIM(sd.course)) = LOWER(TRIM(p.code))
      OR LOWER(TRIM(sd.course)) LIKE CONCAT(LOWER(TRIM(p.code)), ' - %')
      OR LOWER(TRIM(sd.course)) = LOWER(TRIM(p.name))
      OR (p.code = 'BAH' AND LOWER(TRIM(sd.course)) = 'bachelor of arts in history')
      OR (p.code = 'BPA' AND LOWER(TRIM(sd.course)) IN (
        'bachelor of public administration',
        'bachelor of public administration  year: 1'
      ))
      OR (p.code = 'BTVTED' AND LOWER(TRIM(sd.course)) =
        'bachelor of technical vocational teacher education major in computer hardware servicing')
    )
    LEFT JOIN courses c ON c.course_id = e.course_id
    WHERE e.period_id = ?
  `;
  const params = [period_id];

  const courseIds = Array.isArray(course_ids)
    ? course_ids.filter((id) => id !== null && id !== undefined && String(id).trim() !== "")
    : course_ids ? [course_ids] : [];
  if (courseIds.length) {
    query += ` AND e.course_id IN (${courseIds.map(() => "?").join(", ")})`;
    params.push(...courseIds);
  }

  if (program_id) {
    query += " AND p.program_id = ?";
    params.push(program_id);
  }

  if (year_level) {
    query += ` AND TRIM(COALESCE(
      NULLIF(e.year_level, ''),
      NULLIF(c.year_level, ''),
      NULLIF(sd.year_level, ''),
      ''
    )) = TRIM(?)`;
    params.push(year_level);
  }

  // An empty course list represents "All Courses". In that mode, the picker
  // uses curriculum_type to show the program's curriculum, while sectioning
  // must also include shared courses whose course row has a different or
  // missing curriculum label.
  if (curriculum_type && courseIds.length) {
    query += " AND LOWER(TRIM(COALESCE(c.curriculum_type, ''))) = LOWER(TRIM(?))";
    params.push(curriculum_type);
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

export const setEnrollmentSections = async (assignments, periodId) => {
  if (!assignments.length) return;
  const connection = await db.getConnection();
  const enrollmentIds = assignments.map(({ enrollment_id }) => enrollment_id);
  const enrollmentCase = assignments.map(() => "WHEN ? THEN ?").join(" ");
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE enrollments
       SET section_id = CASE enrollment_id ${enrollmentCase} ELSE section_id END
       WHERE enrollment_id IN (${enrollmentIds.map(() => "?").join(", ")})`,
      [
        ...assignments.flatMap(({ enrollment_id, section_id }) => [enrollment_id, section_id]),
        ...enrollmentIds,
      ],
    );
    await connection.query(
      `UPDATE sections
       SET current_enrolled = (
         SELECT COUNT(DISTINCT e.student_id)
         FROM enrollments e
         WHERE e.section_id = sections.section_id
           AND e.period_id = sections.period_id
       )
       WHERE period_id = ?`,
      [periodId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
