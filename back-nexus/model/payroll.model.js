import db from "../config/db.js";

const Payroll = {
  // Create payroll setup
  createSetup: async (payrollData) => {
    const query = `
      INSERT INTO payroll_setup (
        payroll_period_start, payroll_period_end, pay_date,
        payroll_type, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      payrollData.payroll_period_start,
      payrollData.payroll_period_end,
      payrollData.pay_date,
      payrollData.payroll_type,
      payrollData.status || "Draft",
      payrollData.notes,
      payrollData.created_by,
    ]);
    return result;
  },

  // Get all payroll setups
  getAllSetups: async (filters) => {
    let query = `
      SELECT ps.*, 
             ps.payroll_period_start as start_date,
             ps.payroll_period_end as end_date,
             ps.payroll_type as period_type,
             creator.first_name as creator_first_name,
             creator.last_name as creator_last_name,
             processor.first_name as processor_first_name,
             processor.last_name as processor_last_name
      FROM payroll_setup ps
      LEFT JOIN users creator ON ps.created_by = creator.user_id
      LEFT JOIN users processor ON ps.processed_by = processor.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += " AND ps.status = ?";
      params.push(filters.status);
    }

    if (filters.start_date && filters.end_date) {
      query +=
        " AND ps.payroll_period_start >= ? AND ps.payroll_period_end <= ?";
      params.push(filters.start_date, filters.end_date);
    }

    query += " ORDER BY ps.created_at DESC";

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get payroll setup by ID
  getSetupById: async (id) => {
    const query = `
      SELECT ps.*,
             ps.payroll_period_start as start_date,
             ps.payroll_period_end as end_date,
             ps.payroll_type as period_type,
             creator.first_name as creator_first_name,
             creator.last_name as creator_last_name
      FROM payroll_setup ps
      LEFT JOIN users creator ON ps.created_by = creator.user_id
      WHERE ps.payroll_setup_id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Update payroll setup
  updateSetup: async (id, payrollData) => {
    const query = `
      UPDATE payroll_setup SET
        payroll_period_start = ?, payroll_period_end = ?, pay_date = ?,
        payroll_type = ?, status = ?, notes = ?
      WHERE payroll_setup_id = ?
    `;
    const [result] = await db.query(query, [
      payrollData.payroll_period_start,
      payrollData.payroll_period_end,
      payrollData.pay_date,
      payrollData.payroll_type,
      payrollData.status,
      payrollData.notes,
      id,
    ]);
    return result;
  },

  // Delete payroll setup (also removes associated payslips)
  deleteSetup: async (id) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM payslips WHERE payroll_setup_id = ?", [id]);
      const [result] = await conn.query(
        "DELETE FROM payroll_setup WHERE payroll_setup_id = ?",
        [id],
      );
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Get payslip by ID
  getPayslipById: async (id) => {
    const query = `
      SELECT p.*,
             er.employee_number, er.department, er.position,
             u.first_name,
             u.middle_name,
             u.last_name,
             ps.payroll_period_start as start_date, ps.payroll_period_end as end_date, ps.pay_date
      FROM payslips p
      LEFT JOIN employee_records er ON p.employee_id = er.employee_id
      LEFT JOIN users u ON er.user_id = u.user_id
      LEFT JOIN payroll_setup ps ON p.payroll_setup_id = ps.payroll_setup_id
      WHERE p.payslip_id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Update payslip
  updatePayslip: async (id, payslipData) => {
    const query = `
      UPDATE payslips SET
        basic_salary = ?, allowances = ?, overtime_pay = ?,
        bonus = ?, other_earnings = ?,
        sss_deduction = ?, philhealth_deduction = ?, pagibig_deduction = ?,
        withholding_tax = ?, loan_deduction = ?, other_deductions = ?,
        days_worked = ?, overtime_hours = ?, late_hours = ?,
        absences = ?, remarks = ?
      WHERE payslip_id = ?
    `;

    const [result] = await db.query(query, [
      payslipData.basic_salary,
      payslipData.allowances,
      payslipData.overtime_pay,
      payslipData.bonus,
      payslipData.other_earnings,
      payslipData.sss_deduction,
      payslipData.philhealth_deduction,
      payslipData.pagibig_deduction,
      payslipData.withholding_tax,
      payslipData.loan_deduction,
      payslipData.other_deductions,
      payslipData.days_worked,
      payslipData.overtime_hours,
      payslipData.late_hours,
      payslipData.absences,
      payslipData.remarks,
      id,
    ]);
    return result;
  },

  // Delete payslip
  deletePayslip: async (id) => {
    const [result] = await db.query(
      "DELETE FROM payslips WHERE payslip_id = ?",
      [id],
    );
    return result;
  },

  // Get payroll summary
  getPayrollSummary: async (payrollSetupId) => {
    const query = `
      SELECT 
        COUNT(*) as total_employees,
        SUM(gross_pay) as total_gross_pay,
        SUM(total_deductions) as total_deductions,
        SUM(net_pay) as total_net_pay,
        AVG(net_pay) as average_net_pay
      FROM payslips
      WHERE payroll_setup_id = ?
    `;
    const [rows] = await db.query(query, [payrollSetupId]);
    return rows;
  },

  // Get next payslip number
  getNextPayslipNumber: async () => {
    const query = `
      SELECT CONCAT('PAY-', LPAD(COALESCE(MAX(CAST(SUBSTRING(payslip_number, 5) AS UNSIGNED)), 0) + 1, 6, '0')) as next_number
      FROM payslips
      WHERE payslip_number LIKE 'PAY-%'
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  // Create new payslip
  createPayslip: async (payslipData) => {
    const query = `
      INSERT INTO payslips (
        payroll_setup_id, employee_id, user_id, payslip_number,
        basic_salary, allowances, overtime_pay,
        bonus, other_earnings,
        sss_deduction, philhealth_deduction, pagibig_deduction,
        withholding_tax, loan_deduction, other_deductions,
        days_worked, overtime_hours, late_hours,
        absences, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      payslipData.payroll_setup_id,
      payslipData.employee_id || null,
      payslipData.user_id || null,
      payslipData.payslip_number,
      payslipData.basic_salary || 0,
      payslipData.allowances || 0,
      payslipData.overtime_pay || 0,
      payslipData.bonus || 0,
      payslipData.other_earnings || 0,
      payslipData.sss_deduction || 0,
      payslipData.philhealth_deduction || 0,
      payslipData.pagibig_deduction || 0,
      payslipData.withholding_tax || 0,
      payslipData.loan_deduction || 0,
      payslipData.other_deductions || 0,
      payslipData.days_worked || 0,
      payslipData.overtime_hours || 0,
      payslipData.late_hours || 0,
      payslipData.absences || 0,
      payslipData.remarks,
    ]);
    return result;
  },

  // Get payslips by setup ID
  getPayslipsBySetup: async (setupId) => {
    const query = `
      SELECT p.*, 
             u.first_name,
             u.last_name,
             er.employee_number, er.department, er.position,
             er.bank_name, er.bank_account_number,
             er.tin_number, er.sss_number, er.philhealth_number, er.pagibig_number
      FROM payslips p
      LEFT JOIN employee_records er ON p.employee_id = er.employee_id
      LEFT JOIN users u ON er.user_id = u.user_id
      WHERE p.payroll_setup_id = ?
      ORDER BY u.last_name, u.first_name
    `;
    const [rows] = await db.query(query, [setupId]);
    return rows;
  },

  // Get eligible users for payslips (non-students with employee records)
  getEligibleUsersForPayslips: async () => {
    const query = `
      SELECT er.employee_id, er.user_id, er.basic_salary, er.allowances,
             u.first_name, u.last_name, u.role
      FROM employee_records er
      INNER JOIN users u ON er.user_id = u.user_id
      WHERE u.role IN ('Admin', 'Faculty', 'HR', 'Accounting', 'Staff', 'Employee')
      AND u.status = 'Active'
      AND er.employment_status = 'Active'
      ORDER BY u.last_name, u.first_name
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  // Get all non-student users (including those without employee records)
  getAllNonStudentUsers: async () => {
    const query = `
      SELECT u.user_id, u.first_name, u.last_name, u.role,
             er.employee_id, er.basic_salary, er.allowances
      FROM users u
      LEFT JOIN employee_records er ON u.user_id = er.user_id
      WHERE u.role IN ('Admin', 'Faculty', 'HR', 'Accounting', 'Staff', 'Employee')
      AND u.status = 'Active'
      ORDER BY u.last_name, u.first_name
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  // Check if payslip already exists for employee in setup
  checkPayslipExists: async (setupId, employeeId) => {
    const query = `
      SELECT payslip_id FROM payslips
      WHERE payroll_setup_id = ? AND employee_id = ?
      LIMIT 1
    `;
    const [rows] = await db.query(query, [setupId, employeeId]);
    return rows;
  },

  // Get payslips for a specific user (by user_id)
  getPayslipsByUserId: async (userId) => {
    const query = `
      SELECT p.*,
             er.employee_number, er.department, er.position,
             er.bank_name, er.bank_account_number,
             u.first_name, u.last_name,
             ps.payroll_period_start as start_date,
             ps.payroll_period_end as end_date,
             ps.pay_date
      FROM payslips p
      LEFT JOIN employee_records er ON p.employee_id = er.employee_id
      LEFT JOIN users u ON er.user_id = u.user_id
      LEFT JOIN payroll_setup ps ON p.payroll_setup_id = ps.payroll_setup_id
      WHERE er.user_id = ?
      ORDER BY ps.payroll_period_start DESC, p.created_at DESC
    `;
    console.log("🔍 Executing query for user_id:", userId);
    console.log("📝 Query:", query);
    const [rows] = await db.query(query, [userId]);
    console.log("✅ Query returned", rows.length, "rows");
    console.log("📋 Rows:", rows);
    return rows;
  },
};

export default Payroll;
