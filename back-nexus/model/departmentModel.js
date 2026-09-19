import db from "../config/db.js";

// Fetch all departments with head info and status
export const getAllDepartments = async () => {
  const [rows] = await db.query(
    `SELECT 
        d.department_id AS id,
        d.name,
        d.description,
        d.head_user_id AS user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS head,
        d.status,
        d.created_at
     FROM departments d
     LEFT JOIN users u ON d.head_user_id = u.user_id`
  );
  return rows;
};

// Get department by ID
export const getDepartmentById = async (id) => {
  const [rows] = await db.query(
    `SELECT d.department_id, d.name, d.description, d.head_user_id, u.first_name, u.last_name, d.created_at
     FROM departments d
     LEFT JOIN users u ON d.head_user_id = u.user_id
     WHERE d.department_id = ?`,
    [id]
  );
  return rows[0];
};

export const createDepartment = async ({
  name,
  description,
  head_user_id,
  status,
}) => {
  try {
    const [result] = await db.query(
      `INSERT INTO departments (name, description, head_user_id, status) VALUES (?, ?, ?, ?)`,
      [name, description, head_user_id || null, status || "Active"]
    );

    // Return object with same keys frontend expects
    return {
      id: result.insertId, // use "id" not "department_id"
      name,
      description,
      head_user_id,
      status: status || "Active",
    };
  } catch (err) {
    console.error("Failed to create department:", err);
    throw err;
  }
};

// Update department
export const updateDepartment = async (
  id,
  { name, description, head_user_id, status }
) => {
  await db.query(
    `UPDATE departments SET name = ?, description = ?, head_user_id = ?,status = ? WHERE department_id = ?`,
    [name, description, head_user_id, status || null, id]
  );
  return getDepartmentById(id);
};

// Delete department
export const deleteDepartment = async (id) => {
  await db.query(`DELETE FROM departments WHERE department_id = ?`, [id]);
  return true;
};

// Get eligible users for department head
export const getEligibleHeads = async () => {
  const [rows] = await db.query(
    `SELECT user_id, first_name, last_name, role FROM users WHERE role IN ('Faculty', 'Staff', 'Admin')`
  );
  return rows;
};
