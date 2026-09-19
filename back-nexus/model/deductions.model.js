import db from "../config/db.js";

const Deductions = {
  // Create deduction
  create: (deductionData, callback) => {
    const query = `
      INSERT INTO deductions (
        employee_id, deduction_type, deduction_name, amount,
        frequency, start_date, end_date, remaining_balance,
        is_active, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [
        deductionData.employee_id,
        deductionData.deduction_type,
        deductionData.deduction_name,
        deductionData.amount,
        deductionData.frequency,
        deductionData.start_date,
        deductionData.end_date,
        deductionData.remaining_balance || deductionData.amount,
        deductionData.is_active !== undefined ? deductionData.is_active : true,
        deductionData.description,
      ],
      callback
    );
  },

  // Get all deductions
  getAll: (filters, callback) => {
    let query = `
      SELECT d.*, er.employee_number, er.department, er.position,
             u.first_name, u.middle_name, u.last_name
      FROM deductions d
      INNER JOIN employee_records er ON d.employee_id = er.employee_id
      INNER JOIN users u ON er.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.employee_id) {
      query += " AND d.employee_id = ?";
      params.push(filters.employee_id);
    }

    if (filters.deduction_type) {
      query += " AND d.deduction_type = ?";
      params.push(filters.deduction_type);
    }

    if (filters.is_active !== undefined) {
      query += " AND d.is_active = ?";
      params.push(filters.is_active);
    }

    query += " ORDER BY d.created_at DESC";

    db.query(query, params, callback);
  },

  // Get deduction by ID
  getById: (id, callback) => {
    const query = `
      SELECT d.*, er.employee_number, er.department,
             u.first_name, u.middle_name, u.last_name
      FROM deductions d
      INNER JOIN employee_records er ON d.employee_id = er.employee_id
      INNER JOIN users u ON er.user_id = u.user_id
      WHERE d.deduction_id = ?
    `;
    db.query(query, [id], callback);
  },

  // Get deductions by employee
  getByEmployee: (employeeId, callback) => {
    const query = `
      SELECT * FROM deductions
      WHERE employee_id = ? AND is_active = TRUE
      ORDER BY start_date DESC
    `;
    db.query(query, [employeeId], callback);
  },

  // Update deduction
  update: (id, deductionData, callback) => {
    const query = `
      UPDATE deductions SET
        deduction_type = ?, deduction_name = ?, amount = ?,
        frequency = ?, start_date = ?, end_date = ?,
        remaining_balance = ?, is_active = ?, description = ?
      WHERE deduction_id = ?
    `;

    db.query(
      query,
      [
        deductionData.deduction_type,
        deductionData.deduction_name,
        deductionData.amount,
        deductionData.frequency,
        deductionData.start_date,
        deductionData.end_date,
        deductionData.remaining_balance,
        deductionData.is_active,
        deductionData.description,
        id,
      ],
      callback
    );
  },

  // Update remaining balance
  updateBalance: (id, newBalance, callback) => {
    const query = `
      UPDATE deductions SET
        remaining_balance = ?,
        is_active = CASE WHEN ? <= 0 THEN FALSE ELSE is_active END
      WHERE deduction_id = ?
    `;
    db.query(query, [newBalance, newBalance, id], callback);
  },

  // Delete deduction
  delete: (id, callback) => {
    db.query("DELETE FROM deductions WHERE deduction_id = ?", [id], callback);
  },

  // Get summary
  getSummary: (callback) => {
    const query = `
      SELECT 
        COUNT(*) as total_deductions,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_deductions,
        SUM(amount) as total_amount,
        SUM(remaining_balance) as total_remaining
      FROM deductions
    `;
    db.query(query, callback);
  },
};

export default Deductions;
