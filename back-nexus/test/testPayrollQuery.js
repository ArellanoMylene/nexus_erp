import db from "../config/db.js";

async function testQuery() {
  try {
    const userId = 1; // Admin User

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
      LEFT JOIN users u ON COALESCE(er.user_id, p.user_id) = u.user_id
      LEFT JOIN payroll_setup ps ON p.payroll_setup_id = ps.payroll_setup_id
      WHERE (er.user_id = ? OR p.user_id = ?)
      ORDER BY ps.payroll_period_start DESC, p.created_at DESC
    `;

    const [rows] = await db.query(query, [userId, userId]);
    console.log("Query result for user_id 1:");
    console.log("Count:", rows.length);
    console.log(rows);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

testQuery();
