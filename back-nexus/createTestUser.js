import bcrypt from "bcrypt";
import db from "./config/db.js";

const TEST_EMAIL = "admin1@nexus.com";
const TEST_PASSWORD = "admin123";

async function createTestUser() {
  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    // Check if user already exists
    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [TEST_EMAIL],
    );

    if (existingUsers.length > 0) {
      console.log("User already exists!");
      process.exit(0);
    }

    // Create admin user matching current database structure
    const [userResult] = await db.query(
      `INSERT INTO users 
       (email, password_hash, role, first_name, middle_name, last_name, suffix, status, is_verified, phone, permanent_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        TEST_EMAIL,
        passwordHash,
        "Admin",
        "Admin",
        null,
        "User",
        null,
        "Active",
        1,
        "1234567890",
        "Admin Address",
      ],
    );

    const userId = userResult.insertId;
await db.query(
  `INSERT INTO employee_details (user_id, employee_id, position_title)
   VALUES (?, ?, ?)`,
  [userId, "EMP-10000", "Registrar"]
);
    // Create employee records for admin matching current setup
    await db.query(
      `INSERT INTO employee_records 
       (user_id, employee_number, department, position, employment_type, employment_status, hire_date, basic_salary, allowances)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        "EMP-11540721",
        "",
        "",
        "Full-time",
        "Active",
        new Date("2026-02-16"),
        "0.00",
        "0.00",
      ],
    );

    console.log("✅ Test admin user created successfully!");
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`🔑 Password: ${TEST_PASSWORD}`);
    console.log("👤 User ID:", userId);
    console.log("🏢 Employee Number: EMP-11540721");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    process.exit(1);
  }
}

createTestUser();
