// model/enrollments.model.js
import db from "../config/db.js";

// Get all enrollments with student, course, and period details
export const getAllEnrollments = async (filters = {}) => {
  const { course_id, period_id, section_id, student_id, program_id } = filters;

  let query = `SELECT 
        e.enrollment_id,
        e.student_id,
        CONCAT_WS(' ', u.first_name, NULLIF(TRIM(u.middle_name), ''), u.last_name, NULLIF(TRIM(u.suffix), '')) AS student_name,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.suffix,
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
        c.year_level AS course_year_level,
        c.curriculum_type AS course_curriculum_type,
        c.semester_offer AS course_semester_offer,
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

export const transferStudentSection = async ({ student_id, period_id, program_id, year_level, section_id }) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [sectionRows] = await connection.query(
      `SELECT section_id, period_id, program_id, year_level, max_capacity
       FROM sections WHERE section_id = ? FOR UPDATE`,
      [section_id],
    );
    const target = sectionRows[0];
    if (!target) throw new Error("Selected section does not exist");
    if (String(target.period_id) !== String(period_id)
      || String(target.program_id) !== String(program_id)
      || String(target.year_level || "").trim().toLowerCase() !== String(year_level).trim().toLowerCase()) {
      throw new Error("Section must match the student’s academic period, program, and year level");
    }

    const [rows] = await connection.query(
      `SELECT e.enrollment_id
       FROM enrollments e
       JOIN courses c ON c.course_id = e.course_id
       JOIN academic_periods ap ON ap.period_id = e.period_id
       LEFT JOIN student_details sd ON sd.user_id = e.student_id
       LEFT JOIN programs p ON (
         LOWER(TRIM(sd.course)) = LOWER(TRIM(p.code))
         OR LOWER(TRIM(sd.course)) LIKE CONCAT(LOWER(TRIM(p.code)), ' - %')
         OR LOWER(TRIM(sd.course)) = LOWER(TRIM(p.name))
         OR (p.code = 'BAH' AND LOWER(TRIM(sd.course)) = 'bachelor of arts in history')
         OR (p.code = 'BPA' AND LOWER(TRIM(sd.course)) IN ('bachelor of public administration', 'bachelor of public administration  year: 1'))
         OR (p.code = 'BTVTED' AND LOWER(TRIM(sd.course)) = 'bachelor of technical vocational teacher education major in computer hardware servicing')
       )
       WHERE e.student_id = ? AND e.period_id = ? AND p.program_id = ?
         AND TRIM(COALESCE(NULLIF(e.year_level, ''), NULLIF(c.year_level, ''), NULLIF(sd.year_level, ''), '')) = TRIM(?)
         AND LOWER(REPLACE(TRIM(COALESCE(c.semester_offer, '')), ' ', ''))
           = LOWER(REPLACE(TRIM(COALESCE(ap.semester, '')), ' ', ''))`,
      [student_id, period_id, program_id, year_level],
    );
    const enrollmentIds = rows.map((row) => row.enrollment_id);
    if (!enrollmentIds.length) throw new Error("No matching student subject enrollments were found");

    const [occupancyRows] = await connection.query(
      `SELECT COUNT(DISTINCT student_id) AS occupied
       FROM enrollments WHERE section_id = ? AND period_id = ? AND student_id <> ?`,
      [section_id, period_id, student_id],
    );
    const occupied = Number(occupancyRows[0]?.occupied) || 0;
    const capacity = Number(target.max_capacity) || 40;
    if (occupied >= capacity) throw new Error("Selected section is full");

    await connection.query(
      `UPDATE enrollments SET section_id = ?
       WHERE enrollment_id IN (${enrollmentIds.map(() => "?").join(", ")})`,
      [section_id, ...enrollmentIds],
    );
    await connection.query(
      `UPDATE sections SET current_enrolled = (
         SELECT COUNT(DISTINCT e.student_id) FROM enrollments e
         WHERE e.section_id = sections.section_id AND e.period_id = sections.period_id
       ) WHERE period_id = ?`,
      [period_id],
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

export const deleteStudentPeriodEnrollments = async (student_id, period_id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      "DELETE FROM enrollments WHERE student_id = ? AND period_id = ?",
      [student_id, period_id],
    );
    await connection.query(
      `UPDATE sections SET current_enrolled = (
         SELECT COUNT(DISTINCT e.student_id) FROM enrollments e
         WHERE e.section_id = sections.section_id AND e.period_id = sections.period_id
       ) WHERE period_id = ?`,
      [period_id],
    );
    await connection.commit();
    return result.affectedRows || 0;
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

// Get enrollment rows in a period that match the selected filters. Existing
// rows are included so rerunning sectioning can repair a split cohort.
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
    JOIN academic_periods ap ON ap.period_id = e.period_id
    WHERE e.period_id = ?
      AND LOWER(REPLACE(TRIM(COALESCE(c.semester_offer, '')), ' ', ''))
        = LOWER(REPLACE(TRIM(COALESCE(ap.semester, '')), ' ', ''))
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

  // Apply the selected curriculum even when "All Courses" is used; an empty
  // course list means all subjects for this program/year/semester/curriculum.
  if (curriculum_type) {
    query += " AND LOWER(TRIM(COALESCE(NULLIF(c.curriculum_type, ''), 'Old'))) = LOWER(TRIM(?))";
    params.push(curriculum_type);
  }

  const [rows] = await db.query(query, params);
  return rows;
};

// Get every existing course row for these students in the same
// program/year/semester cohort so sectioning can update the whole cohort.
export const getExistingSectionAssignments = async (
  student_ids,
  period_id,
  program_id,
  year_level,
) => {
  if (!student_ids.length) return [];
  const params = [period_id, ...student_ids, year_level];
  let query = `
    SELECT e.enrollment_id, e.student_id, e.section_id, s.section_name,
           COALESCE(NULLIF(c.curriculum_type, ''), 'Old') AS curriculum_type
    FROM enrollments e
    JOIN courses c ON c.course_id = e.course_id
    LEFT JOIN sections s ON s.section_id = e.section_id AND s.period_id = e.period_id
    JOIN academic_periods ap ON ap.period_id = e.period_id
    LEFT JOIN student_details sd ON sd.user_id = e.student_id
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
    WHERE e.period_id = ?
      AND e.student_id IN (${student_ids.map(() => "?").join(", ")})
      AND TRIM(COALESCE(NULLIF(e.year_level, ''), NULLIF(c.year_level, ''), NULLIF(sd.year_level, ''), '')) = TRIM(?)
      AND LOWER(REPLACE(TRIM(COALESCE(c.semester_offer, '')), ' ', ''))
        = LOWER(REPLACE(TRIM(COALESCE(ap.semester, '')), ' ', ''))`;
  if (program_id) {
    query += " AND p.program_id = ?";
    params.push(program_id);
  }
  query += " ORDER BY e.student_id, e.enrollment_id ASC";
  const [rows] = await db.query(query, params);
  return rows;
};

export const getSectioningCourseIds = async (
  program_id, student_ids, period_id, year_level, curriculum_type, requested_course_ids = [],
) => {
  if (!student_ids.length) return [];
  const params = [program_id, period_id, year_level, curriculum_type, ...student_ids];
  let query = `
    SELECT DISTINCT c.course_id
    FROM courses c
    JOIN programs p ON p.program_id = ?
    JOIN academic_periods ap ON ap.period_id = ?
    WHERE TRIM(COALESCE(c.year_level, '')) = TRIM(?)
      AND LOWER(TRIM(COALESCE(NULLIF(c.curriculum_type, ''), 'Old'))) = LOWER(TRIM(?))
      AND LOWER(REPLACE(TRIM(COALESCE(c.semester_offer, '')), ' ', ''))
        = LOWER(REPLACE(TRIM(COALESCE(ap.semester, '')), ' ', ''))
      AND (c.department_id = p.department_id OR EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.course_id = c.course_id AND e.period_id = ap.period_id
          AND e.student_id IN (${student_ids.map(() => "?").join(", ")})
      ))`;
  if (requested_course_ids.length) {
    query += ` AND c.course_id IN (${requested_course_ids.map(() => "?").join(", ")})`;
    params.push(...requested_course_ids);
  }
  const [rows] = await db.query(query, params);
  return rows.map((row) => row.course_id);
};

// Replace each student's cohort enrollments with the selected curriculum's
// course set before section assignments are applied.
export const synchronizeCohortCurriculum = async (student_ids, course_ids, period_id, year_level) => {
  if (!student_ids.length || !course_ids.length) return { added: 0, removed: 0 };
  const connection = await db.getConnection();
  const studentPlaceholders = student_ids.map(() => "?").join(", ");
  const coursePlaceholders = course_ids.map(() => "?").join(", ");
  try {
    await connection.beginTransaction();
    const values = [];
    const courseSelects = course_ids.map((courseId) => {
      values.push(courseId);
      return "SELECT ? AS course_id";
    }).join(" UNION ALL ");
    const studentsSelects = student_ids.map((studentId) => {
      values.push(studentId);
      return "SELECT ? AS student_id";
    }).join(" UNION ALL ");
    const [insertResult] = await connection.query(
      `INSERT INTO enrollments
         (student_id, course_id, period_id, section_id, year_level, enrollment_date, status)
       SELECT students.student_id, courses.course_id, ?, NULL, ?, CURRENT_DATE, 'Enrolled'
       FROM (${studentsSelects}) students CROSS JOIN (${courseSelects}) courses
       WHERE NOT EXISTS (
         SELECT 1 FROM enrollments existing
         WHERE existing.student_id = students.student_id
           AND existing.course_id = courses.course_id AND existing.period_id = ?
       )`,
      [period_id, year_level, ...values.slice(course_ids.length), ...values.slice(0, course_ids.length), period_id],
    );
    const [deleteResult] = await connection.query(
      `DELETE e FROM enrollments e
       JOIN courses c ON c.course_id = e.course_id
       JOIN academic_periods ap ON ap.period_id = e.period_id
       LEFT JOIN student_details sd ON sd.user_id = e.student_id
       WHERE e.period_id = ? AND e.student_id IN (${studentPlaceholders})
         AND TRIM(COALESCE(NULLIF(e.year_level, ''), NULLIF(c.year_level, ''), NULLIF(sd.year_level, ''), '')) = TRIM(?)
         AND LOWER(REPLACE(TRIM(COALESCE(c.semester_offer, '')), ' ', ''))
           = LOWER(REPLACE(TRIM(COALESCE(ap.semester, '')), ' ', ''))
         AND e.course_id NOT IN (${coursePlaceholders})`,
      [period_id, ...student_ids, year_level, ...course_ids],
    );
    await connection.commit();
    return { added: insertResult.affectedRows || 0, removed: deleteResult.affectedRows || 0 };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
       AND e.status = 'Enrolled'
     ORDER BY sd.student_number ASC`,
    [assignmentId],
  );
  return rows;
};

// Get the enrolled roster across all courses assigned to one faculty member.
export const getStudentsByFaculty = async (facultyUserId) => {
  const [rows] = await db.query(
    `SELECT
        e.enrollment_id AS id,
        e.enrollment_id,
        e.student_id AS user_id,
        COALESCE(sd.student_number, CAST(u.user_id AS CHAR)) AS student_id,
        u.first_name,
        u.last_name,
        CONCAT_WS(' ', u.first_name, u.last_name) AS name,
        u.email,
        u.phone,
        fca.assignment_id,
        fca.course_id,
        c.code AS course_code,
        c.title AS course_title,
        fca.section,
        COALESCE(p.code, sd.course, 'N/A') AS program,
        COALESCE(e.year_level, sd.year_level, 'N/A') AS year_level,
        e.status,
        e.midterm_grade,
        e.final_grade
     FROM faculty_course_assignments fca
     JOIN enrollments e
       ON e.course_id = fca.course_id
      AND e.period_id = fca.academic_period_id
      AND e.status = 'Enrolled'
     JOIN sections s
       ON s.section_id = e.section_id
      AND s.period_id = e.period_id
      AND s.section_name = fca.section
     JOIN users u ON u.user_id = e.student_id
     LEFT JOIN student_details sd ON sd.user_id = e.student_id
     JOIN courses c ON c.course_id = e.course_id
     LEFT JOIN programs p ON p.program_id = s.program_id
     WHERE fca.faculty_user_id = ?
     ORDER BY c.code, fca.section, sd.student_number, u.last_name, u.first_name`,
    [facultyUserId],
  );
  return rows;
};
