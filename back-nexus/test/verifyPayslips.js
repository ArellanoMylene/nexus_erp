import db from "../config/db.js";

async function checkPayslipsData() {
  try {
    // Check payslips table structure
    const [columns] = await db.query(`
      DESCRIBE payslips;
    `);
    console.log("Payslips table structure:");
    console.log(columns);

    // Check admin user's payslips
    const [adminPayslips] = await db.query(`
      SELECT p.payslip_id, p.user_id, p.employee_id, u.first_name, u.last_name, u.role, u.user_id as uid
      FROM payslips p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE u.role = 'Admin'
      LIMIT 5;
    `);
    console.log("\nAdmin payslips:");
    console.log(adminPayslips);

    // Check all payslips count
    const [totalPayslips] = await db.query(`
      SELECT COUNT(*) as count FROM payslips WHERE user_id IS NOT NULL;
    `);
    console.log("\nPayslips with user_id:", totalPayslips);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkPayslipsData();
