import bcrypt from "bcrypt";
import db from "../config/db.js";

async function createBulkStudents() {
  try {
    console.log("🚀 Starting bulk student creation...");

    const totalStudents = 50;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 1; i <= totalStudents; i++) {
      try {
        // Generate email and password following the pattern
        const email = `student${i}@gmail.com`;
        const password = `student${i}`;
        const passwordHash = await bcrypt.hash(password, 10);

        // Check if user already exists
        const [existingUsers] = await db.query(
          "SELECT * FROM users WHERE email = ?",
          [email],
        );

        if (existingUsers.length > 0) {
          console.log(`⏭️  Student ${i} (${email}) already exists, skipping...`);
          continue;
        }

        // Start a transaction
        const connection = await db.getConnection();
        try {
          await connection.beginTransaction();

          // 1. Insert into users table
          const [userResult] = await connection.query(
            `INSERT INTO users 
             (email, password_hash, role, first_name, last_name, status, phone)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              email,
              passwordHash,
              "Student",
              `Student`,
              `${i}`,
              "Active",
              "0000000000",
            ],
          );

          const userId = userResult.insertId;
          const studentNumber = `STU-${String(i).padStart(5, "0")}`;

          // 2. Insert into student_details table
          await connection.query(
            `INSERT INTO student_details 
             (user_id, student_number, course, year_level)
             VALUES (?, ?, ?, ?)`,
            [userId, studentNumber, "General", 1],
          );

          // Commit transaction
          await connection.commit();
          connection.release();

          successCount++;
          console.log(`✅ Student ${i}: ${email} | Password: ${password} | Student #: ${studentNumber}`);
        } catch (transactionError) {
          await connection.rollback();
          connection.release();
          throw transactionError;
        }
      } catch (error) {
        failureCount++;
        console.error(`❌ Error creating student ${i}:`, error.message);
      }
    }

    console.log("\n📊 Bulk Student Creation Summary:");
    console.log(`✅ Successfully created: ${successCount} students`);
    console.log(`❌ Failed: ${failureCount} students`);
    console.log(`\n📧 Email pattern: student[1-50]@gmail.com`);
    console.log(`🔑 Password pattern: student[1-50]`);
    console.log(`👤 Student Number pattern: STU-00001 to STU-00050`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

createBulkStudents();
