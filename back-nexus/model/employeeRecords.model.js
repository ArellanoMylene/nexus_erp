import db from "../config/db.js";

const EmployeeRecords = {
  // Create new employee record
  create: async (employeeData) => {
    const query = `
      INSERT INTO employee_records (
        user_id, employee_number, department, position, employment_type,
        employment_status, hire_date, end_date, basic_salary, allowances,
        sss_number, tin_number, philhealth_number, pagibig_number,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        bank_name, bank_account_number, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      employeeData.user_id,
      employeeData.employee_number,
      employeeData.department,
      employeeData.position,
      employeeData.employment_type,
      employeeData.employment_status,
      employeeData.hire_date,
      employeeData.end_date,
      employeeData.basic_salary,
      employeeData.allowances,
      employeeData.sss_number,
      employeeData.tin_number,
      employeeData.philhealth_number,
      employeeData.pagibig_number,
      employeeData.emergency_contact_name,
      employeeData.emergency_contact_phone,
      employeeData.emergency_contact_relationship,
      employeeData.bank_name,
      employeeData.bank_account_number,
      employeeData.notes,
    ]);
    return result;
  },

  // Get all employee records with user details
  getAll: async (filters) => {
    let query = `
      SELECT er.*, u.first_name, u.middle_name, u.last_name, u.email,
             u.phone, u.gender, u.date_of_birth, u.status as user_status
      FROM employee_records er
      INNER JOIN users u ON er.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.department) {
      query += " AND er.department = ?";
      params.push(filters.department);
    }

    if (filters.employment_status) {
      query += " AND er.employment_status = ?";
      params.push(filters.employment_status);
    }

    if (filters.employment_type) {
      query += " AND er.employment_type = ?";
      params.push(filters.employment_type);
    }

    if (filters.search) {
      query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR 
                 er.employee_number LIKE ? OR er.position LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY er.created_at DESC";

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get employee by ID
  getById: async (id) => {
    const query = `
      SELECT er.*, u.first_name, u.middle_name, u.last_name, u.email,
             u.phone, u.gender, u.date_of_birth, u.permanent_address,
             u.status as user_status
      FROM employee_records er
      INNER JOIN users u ON er.user_id = u.user_id
      WHERE er.employee_id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Get employee by User ID
  getByUserId: async (userId) => {
    const query = `SELECT * FROM employee_records WHERE user_id = ?`;
    const [rows] = await db.query(query, [userId]);
    return rows;
  },

  // Update employee record
  update: async (id, employeeData) => {
    const query = `
      UPDATE employee_records SET
        department = ?, position = ?, employment_type = ?,
        employment_status = ?, hire_date = ?, end_date = ?,
        basic_salary = ?, allowances = ?,
        sss_number = ?, tin_number = ?, philhealth_number = ?, pagibig_number = ?,
        emergency_contact_name = ?, emergency_contact_phone = ?,
        emergency_contact_relationship = ?, bank_name = ?,
        bank_account_number = ?, notes = ?
      WHERE employee_id = ?
    `;

    const [result] = await db.query(query, [
      employeeData.department,
      employeeData.position,
      employeeData.employment_type,
      employeeData.employment_status,
      employeeData.hire_date,
      employeeData.end_date,
      employeeData.basic_salary,
      employeeData.allowances,
      employeeData.sss_number,
      employeeData.tin_number,
      employeeData.philhealth_number,
      employeeData.pagibig_number,
      employeeData.emergency_contact_name,
      employeeData.emergency_contact_phone,
      employeeData.emergency_contact_relationship,
      employeeData.bank_name,
      employeeData.bank_account_number,
      employeeData.notes,
      id,
    ]);
    return result;
  },

  // Delete employee record
  delete: async (id) => {
    const [result] = await db.query(
      "DELETE FROM employee_records WHERE employee_id = ?",
      [id]
    );
    return result;
  },

  // Get summary statistics
  getSummary: async () => {
    const query = `
      SELECT 
        COUNT(*) as total_employees,
        SUM(CASE WHEN employment_status = 'Active' THEN 1 ELSE 0 END) as active_employees,
        SUM(CASE WHEN employment_status = 'On Leave' THEN 1 ELSE 0 END) as on_leave,
        SUM(CASE WHEN employment_type = 'Full-time' THEN 1 ELSE 0 END) as full_time,
        SUM(CASE WHEN employment_type = 'Part-time' THEN 1 ELSE 0 END) as part_time
      FROM employee_records
    `;
    const [rows] = await db.query(query);
    return rows;
  },
};

export default EmployeeRecords;
