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

  // Fetch prerequisites for all courses
  for (const course of rows) {
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
      [course.id]
    );
    course.prerequisites = prereqs;
  }

  return rows;
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
  semester_offer,
  department_id,
  instructor_id,
  status,
}) => {
  const [result] = await db.query(
    `INSERT INTO courses (code, title, description, units, hours, type, semester_offer, department_id, instructor_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, title, description, units, hours, type, semester_offer, department_id, instructor_id, status]
  );

  return {
    id: result.insertId,
    code,
    title,
    description,
    units,
    hours,
    type,
    semester_offer,
    department_id,
    instructor_id,
    status,
  };
};

// Update course
export const updateCourse = async (
  id,
  { code, title, description, units, hours, type, semester_offer, department_id, instructor_id, status }
) => {
  await db.query(
    `UPDATE courses 
     SET code = ?, title = ?, description = ?, units = ?, hours = ?, type = ?, semester_offer = ?, department_id = ?, instructor_id = ?, status = ?
     WHERE course_id = ?`,
    [
      code,
      title,
      description,
      units,
      hours,
      type,
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
