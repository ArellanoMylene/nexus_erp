// models/programs.model.js
import db from "../config/db.js";

// Get all programs
export const getAllPrograms = async () => {
  const [rows] = await db.query(
    `SELECT 
        p.program_id AS id,
        p.code,
        p.name,
        p.description,
        p.degree_type,
        p.duration_years,
        p.department_id,
        p.status,
        d.name AS department_name,
        p.created_at
     FROM programs p
     LEFT JOIN departments d ON p.department_id = d.department_id
     ORDER BY p.created_at DESC`
  );
  return rows;
};

// Get single program by ID
export const getProgramById = async (id) => {
  const [rows] = await db.query(
    `SELECT 
        p.program_id AS id,
        p.code,
        p.name,
        p.description,
        p.degree_type,
        p.duration_years,
        p.department_id,
        p.status,
        d.name AS department_name,
        p.created_at
     FROM programs p
     LEFT JOIN departments d ON p.department_id = d.department_id
     WHERE p.program_id = ?`,
    [id]
  );
  return rows[0];
};

// Create new program
export const createProgram = async ({
  code,
  name,
  description,
  degree_type,
  duration_years,
  department_id,
  status,
}) => {
  const [result] = await db.query(
    `INSERT INTO programs (code, name, description, degree_type, duration_years, department_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      name,
      description,
      degree_type,
      duration_years,
      department_id,
      status,
    ]
  );

  return {
    id: result.insertId,
    code,
    name,
    description,
    degree_type,
    duration_years,
    department_id,
    status,
  };
};

// Update program
export const updateProgram = async (
  id,
  {
    code,
    name,
    description,
    degree_type,
    duration_years,
    department_id,
    status,
  }
) => {
  await db.query(
    `UPDATE programs 
     SET code = ?, name = ?, description = ?, degree_type = ?, duration_years = ?, department_id = ?, status = ?
     WHERE program_id = ?`,
    [
      code,
      name,
      description,
      degree_type,
      duration_years,
      department_id,
      status,
      id,
    ]
  );

  return getProgramById(id);
};

// Delete program
export const deleteProgram = async (id) => {
  await db.query(`DELETE FROM programs WHERE program_id = ?`, [id]);
  return true;
};
