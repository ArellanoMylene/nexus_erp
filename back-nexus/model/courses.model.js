// models/courses.model.js
import db from "../config/db.js";

export const getAllCourses = async () => {
  const [rows] = await db.query(
    `SELECT 
        c.course_id AS id,
        c.code,
        c.title,
        c.description,
        c.units,
        c.hours,
        c.type,
        c.curriculum_type,
        c.year_level,
        c.semester_offer,
        c.status,
        d.department_id,
        d.name AS department_name,
        c.instructor_id,
        CONCAT(u.first_name, ' ', u.last_name) AS instructor_name,
        c.created_at
     FROM courses c
     LEFT JOIN departments d ON c.department_id = d.department_id
     LEFT JOIN users u ON c.instructor_id = u.user_id`
  );

  // Load prerequisites in one query instead of one query per course. The
  // course list feeds enrollment and sectioning selectors, so the old N+1
  // lookup delayed those controls as the curriculum grew.
  if (rows.length) {
    const courseIds = rows.map((course) => course.id);
    const [prerequisites] = await db.query(
      `SELECT
         p.course_id,
         p.prereq_link_id AS id,
         p.prereq_course_id,
         c2.code AS prereq_code,
         c2.title AS prereq_title,
         p.is_corequisite
       FROM prerequisites p
       JOIN courses c2 ON p.prereq_course_id = c2.course_id
       WHERE p.course_id IN (${courseIds.map(() => "?").join(", ")})`,
      courseIds,
    );

    const prerequisitesByCourse = new Map();
    for (const prerequisite of prerequisites) {
      if (!prerequisitesByCourse.has(prerequisite.course_id)) {
        prerequisitesByCourse.set(prerequisite.course_id, []);
      }
      prerequisitesByCourse.get(prerequisite.course_id).push({
        id: prerequisite.id,
        prereq_course_id: prerequisite.prereq_course_id,
        prereq_code: prerequisite.prereq_code,
        prereq_title: prerequisite.prereq_title,
        is_corequisite: prerequisite.is_corequisite,
      });
    }

    for (const course of rows) {
      course.prerequisites = prerequisitesByCourse.get(course.id) || [];
    }
  }

  return rows;
};

export const hasCourseCodeConflict = async (
  { code, department_id, year_level, curriculum_type },
  excludeCourseId = null,
) => {
  let query = `SELECT course_id FROM courses
    WHERE code = ? AND department_id = ? AND year_level <=> ? AND curriculum_type = ?`;
  const params = [code, department_id, year_level ?? null, curriculum_type || "New"];
  if (excludeCourseId !== null) {
    query += " AND course_id <> ?";
    params.push(excludeCourseId);
  }
  query += " LIMIT 1";
  const [rows] = await db.query(query, params);
  return rows.length > 0;
};

// Get single course
export const getCourseById = async (id) => {
  const [rows] = await db.query(
    `SELECT 
        c.course_id AS id,
        c.code,
        c.title,
        c.description,
        c.units,
        c.hours,
        c.type,
        c.curriculum_type,
        c.year_level,
        c.semester_offer,
        c.status,
        c.department_id,
        c.instructor_id,
        d.name AS department,
        CONCAT(u.first_name, ' ', u.last_name) AS instructor,
        c.created_at
     FROM courses c
     LEFT JOIN departments d ON c.department_id = d.department_id
     LEFT JOIN users u ON c.instructor_id = u.user_id
     WHERE c.course_id = ?`,
    [id]
  );

  if (rows[0]) {
    const [prereqs] = await db.query(
      `SELECT 
        p.prereq_link_id AS id,
        p.prereq_course_id,
        c2.code AS prereq_code,
        c2.title AS prereq_title,
        p.is_corequisite
       FROM prerequisites p
       JOIN courses c2 ON p.prereq_course_id = c2.course_id
       WHERE p.course_id = ?`,
      [id]
    );
    rows[0].prerequisites = prereqs;
  }

  return rows[0];
};

// Create new course
export const createCourse = async ({
  code,
  title,
  description,
  units,
  hours,
  type,
  curriculum_type = "New",
  year_level = null,
  semester_offer,
  department_id,
  instructor_id,
  status,
}) => {
  const [result] = await db.query(
    `INSERT INTO courses (code, title, description, units, hours, type, curriculum_type, year_level, semester_offer, department_id, instructor_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, title, description, units, hours, type, curriculum_type, year_level, semester_offer, department_id, instructor_id, status]
  );

  return {
    id: result.insertId,
    code,
    title,
    description,
    units,
    hours,
    type,
    curriculum_type,
    year_level,
    semester_offer,
    department_id,
    instructor_id,
    status,
  };
};

// Update course
export const updateCourse = async (
  id,
  { code, title, description, units, hours, type, curriculum_type = "Old", year_level = null, semester_offer, department_id, instructor_id, status }
) => {
  await db.query(
    `UPDATE courses 
     SET code = ?, title = ?, description = ?, units = ?, hours = ?, type = ?, curriculum_type = ?, year_level = ?, semester_offer = ?, department_id = ?, instructor_id = ?, status = ?
     WHERE course_id = ?`,
    [
      code,
      title,
      description,
      units,
      hours,
      type,
      curriculum_type,
      year_level,
      semester_offer,
      department_id,
      instructor_id,
      status,
      id,
    ]
  );

  return getCourseById(id);
};

// Delete course
export const deleteCourse = async (id) => {
  await db.query(`DELETE FROM courses WHERE course_id = ?`, [id]);
  return true;
};

// Optional: Get all instructors
export const getEligibleInstructors = async () => {
  const [rows] = await db.query(
    `SELECT user_id, first_name, last_name, role
     FROM users WHERE role IN ('Instructor', 'Faculty', 'Admin')`
  );
  return rows;
};
