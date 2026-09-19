import db from "../config/db.js";
import bcrypt from "./bcrypt.js";

const Faculty = {
  // Get all faculty members
  getAll: () => {
    return db.query(`
      SELECT u.user_id, u.email, u.first_name, u.middle_name, u.last_name, 
             u.phone, u.status, u.profile_picture_url,
             ed.employee_id, ed.department, ed.position_title, ed.specialization,
             ed.date_hired, ed.educational_attainment
      FROM users u
      INNER JOIN employee_details ed ON u.user_id = ed.user_id
      WHERE u.role = 'Faculty'
      ORDER BY u.last_name, u.first_name
    `);
  },

  // Get faculty by user ID
  getById: (userId) => {
    return db.query(
      `
      SELECT u.user_id, u.email, u.first_name, u.middle_name, u.last_name, 
             u.phone, u.status, u.profile_picture_url, u.date_of_birth, u.gender,
             u.permanent_address,
             ed.employee_id, ed.department, ed.position_title, ed.specialization,
             ed.date_hired, ed.educational_attainment, ed.license_number
      FROM users u
      INNER JOIN employee_details ed ON u.user_id = ed.user_id
      WHERE u.user_id = ? AND u.role = 'Faculty'
    `,
      [userId],
    );
  },

  // Get faculty by employee ID
  getByEmployeeId: (employeeId) => {
    return db.query(
      `
      SELECT u.*, ed.*
      FROM users u
      INNER JOIN employee_details ed ON u.user_id = ed.user_id
      WHERE ed.employee_id = ? AND u.role = 'Faculty'
    `,
      [employeeId],
    );
  },

  // Get faculty by department
  getByDepartment: (departmentId) => {
    return db.query(
      `
      SELECT u.user_id, u.email, u.first_name, u.middle_name, u.last_name, 
             u.phone, u.status,
             ed.employee_id, ed.department, ed.position_title, ed.specialization
      FROM users u
      INNER JOIN employee_details ed ON u.user_id = ed.user_id
      INNER JOIN departments d ON d.name = ed.department
      WHERE d.department_id = ? AND u.role = 'Faculty'
      ORDER BY u.last_name, u.first_name
    `,
      [departmentId],
    );
  },

  // Create new faculty (insert into both users and employee_details)
  create: async (facultyData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Hash password before insert
      const password = facultyData.password || "";
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert into users table
      const [userResult] = await connection.query(
        `INSERT INTO users (email, password_hash, role, first_name, middle_name, last_name,
         date_of_birth, gender, phone, permanent_address, profile_picture_url, status)
         VALUES (?, ?, 'Faculty', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          facultyData.email,
          passwordHash,
          facultyData.first_name,
          facultyData.middle_name,
          facultyData.last_name,
          facultyData.date_of_birth,
          facultyData.gender,
          facultyData.phone,
          facultyData.permanent_address,
          facultyData.profile_picture_url,
          facultyData.status || "Active",
        ],
      );

      const userId = userResult.insertId;

      // Insert into employee_details table
      await connection.query(
        `INSERT INTO employee_details (user_id, employee_id, department, position_title,
         date_hired, specialization, educational_attainment, license_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          facultyData.employee_id,
          facultyData.department,
          facultyData.position_title,
          facultyData.date_hired || null, // Convert empty string to null
          facultyData.specialization,
          facultyData.educational_attainment,
          facultyData.license_number,
        ],
      );

      await connection.commit();
      return [{ insertId: userId }];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update faculty
  update: async (userId, facultyData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Update users table
      await connection.query(
        `UPDATE users SET 
         first_name = ?, middle_name = ?, last_name = ?, email = ?, 
         phone = ?, date_of_birth = ?, gender = ?, permanent_address = ?,
         profile_picture_url = ?, status = ?
         WHERE user_id = ?`,
        [
          facultyData.first_name,
          facultyData.middle_name,
          facultyData.last_name,
          facultyData.email,
          facultyData.phone,
          facultyData.date_of_birth,
          facultyData.gender,
          facultyData.permanent_address,
          facultyData.profile_picture_url,
          facultyData.status,
          userId,
        ],
      );

      // Update employee_details table
      const [result] = await connection.query(
        `UPDATE employee_details SET
         department = ?, position_title = ?, specialization = ?,
         date_hired = ?, educational_attainment = ?, license_number = ?
         WHERE user_id = ?`,
        [
          facultyData.department,
          facultyData.position_title,
          facultyData.specialization,
          facultyData.date_hired || null, // Convert empty string to null
          facultyData.educational_attainment,
          facultyData.license_number,
          userId,
        ],
      );

      await connection.commit();
      return [result];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Delete faculty
  delete: (userId) => {
    return db.query(
      "DELETE FROM users WHERE user_id = ? AND role = 'Faculty'",
      [userId],
    );
  },

  // Get faculty statistics
  getStats: () => {
    return db.query(`
      SELECT 
        COUNT(*) as total_faculty,
        SUM(CASE WHEN u.status = 'Active' THEN 1 ELSE 0 END) as active_faculty
      FROM users u
      INNER JOIN employee_details ed ON u.user_id = ed.user_id
      WHERE u.role = 'Faculty'
    `);
  },
};

export default Faculty;
