// models/prerequisites.model.js
import db from "../config/db.js";

// Get all prerequisites for a specific course
export const getPrerequisitesByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT 
        p.prereq_link_id AS id,
        p.course_id,
        p.prereq_course_id,
        p.is_corequisite,
        c1.code AS course_code,
        c1.title AS course_title,
        c2.code AS prereq_code,
        c2.title AS prereq_title
     FROM prerequisites p
     JOIN courses c1 ON p.course_id = c1.course_id
     JOIN courses c2 ON p.prereq_course_id = c2.course_id
     WHERE p.course_id = ?`,
    [courseId]
  );
  return rows;
};

// Get all prerequisites (for all courses)
export const getAllPrerequisites = async () => {
  const [rows] = await db.query(
    `SELECT 
        p.prereq_link_id AS id,
        p.course_id,
        p.prereq_course_id,
        p.is_corequisite,
        c1.code AS course_code,
        c1.title AS course_title,
        c2.code AS prereq_code,
        c2.title AS prereq_title
     FROM prerequisites p
     JOIN courses c1 ON p.course_id = c1.course_id
     JOIN courses c2 ON p.prereq_course_id = c2.course_id
     ORDER BY c1.code, c2.code`
  );
  return rows;
};

// Get single prerequisite by ID
export const getPrerequisiteById = async (id) => {
  const [rows] = await db.query(
    `SELECT 
        p.prereq_link_id AS id,
        p.course_id,
        p.prereq_course_id,
        p.is_corequisite,
        c1.code AS course_code,
        c1.title AS course_title,
        c2.code AS prereq_code,
        c2.title AS prereq_title
     FROM prerequisites p
     JOIN courses c1 ON p.course_id = c1.course_id
     JOIN courses c2 ON p.prereq_course_id = c2.course_id
     WHERE p.prereq_link_id = ?`,
    [id]
  );
  return rows[0];
};

// Create new prerequisite
export const createPrerequisite = async ({
  course_id,
  prereq_course_id,
  is_corequisite,
}) => {
  const [result] = await db.query(
    `INSERT INTO prerequisites (course_id, prereq_course_id, is_corequisite)
     VALUES (?, ?, ?)`,
    [course_id, prereq_course_id, is_corequisite || false]
  );

  return {
    id: result.insertId,
    course_id,
    prereq_course_id,
    is_corequisite: is_corequisite || false,
  };
};

// Update prerequisite
export const updatePrerequisite = async (
  id,
  { course_id, prereq_course_id, is_corequisite }
) => {
  await db.query(
    `UPDATE prerequisites 
     SET course_id = ?, prereq_course_id = ?, is_corequisite = ?
     WHERE prereq_link_id = ?`,
    [course_id, prereq_course_id, is_corequisite, id]
  );

  return getPrerequisiteById(id);
};

// Delete prerequisite
export const deletePrerequisite = async (id) => {
  await db.query(`DELETE FROM prerequisites WHERE prereq_link_id = ?`, [id]);
  return true;
};

// Delete all prerequisites for a course
export const deletePrerequisitesByCourse = async (courseId) => {
  await db.query(`DELETE FROM prerequisites WHERE course_id = ?`, [courseId]);
  return true;
};

// Check if prerequisite already exists
export const checkPrerequisiteExists = async (courseId, prereqCourseId) => {
  const [rows] = await db.query(
    `SELECT prereq_link_id FROM prerequisites 
     WHERE course_id = ? AND prereq_course_id = ?`,
    [courseId, prereqCourseId]
  );
  return rows.length > 0;
};
