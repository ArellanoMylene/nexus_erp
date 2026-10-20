import db from "../config/db.js";

const getSequence = (studentNumber) => {
  const match = /^BCC-(\d+)$/i.exec(String(studentNumber || "").trim());
  return match ? Number.parseInt(match[1], 10) : 0;
};

const backfillBccStudentNumbers = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [studentRows] = await connection.query(
      `SELECT u.user_id, sd.student_number
       FROM users u
       LEFT JOIN student_details sd ON sd.user_id = u.user_id
       WHERE u.role = 'Student'
         AND (sd.user_id IS NULL OR sd.student_number IS NULL OR TRIM(sd.student_number) = '')
       ORDER BY u.user_id ASC
       FOR UPDATE`,
    );

    const [numberRows] = await connection.query(
      `SELECT student_number FROM student_details WHERE student_number LIKE 'BCC-%'`,
    );
    let sequence = numberRows.reduce(
      (highest, row) => Math.max(highest, getSequence(row.student_number)),
      0,
    );

    for (const student of studentRows) {
      sequence += 1;
      const studentNumber = `BCC-${String(sequence).padStart(4, "0")}`;
      await connection.query(
        `INSERT INTO student_details (user_id, student_number)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE student_number = VALUES(student_number)`,
        [student.user_id, studentNumber],
      );
      console.log(`Assigned ${studentNumber} to user ${student.user_id}`);
    }

    await connection.commit();
    console.log(`Backfill complete. Assigned ${studentRows.length} student ID(s).`);
  } catch (error) {
    await connection.rollback();
    console.error("Failed to assign BCC student numbers:", error);
    throw error;
  } finally {
    connection.release();
  }
};

backfillBccStudentNumbers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
