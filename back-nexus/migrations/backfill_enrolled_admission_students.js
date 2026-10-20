import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../config/db.js";
import { createStudentUser } from "../model/userModel.js";

const backfillEnrolledAdmissionStudents = async () => {
  const [admissions] = await db.query(
    `SELECT a.*
     FROM admissions a
     LEFT JOIN users u
       ON a.email = u.email COLLATE utf8mb4_unicode_ci
      AND u.role = 'Student'
     WHERE LOWER(TRIM(a.status)) = 'enrolled'
       AND TRIM(COALESCE(a.email, '')) <> ''
       AND u.user_id IS NULL
     ORDER BY a.admission_id ASC`,
  );

  let created = 0;
  let skipped = 0;

  for (const admission of admissions) {
    const email = String(admission.email || "").trim();
    try {
      // Enrollment only needs the student account and number. The random
      // password is intentionally undisclosed; credential setup is separate.
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
      await createStudentUser({
        email,
        passwordHash,
        firstName: admission.first_name,
        middleName: admission.middle_name,
        lastName: admission.last_name,
        dateOfBirth: admission.date_of_birth,
        gender: admission.gender,
        phone: admission.phone,
        permanentAddress: admission.address,
        courseProgram: admission.program_applied,
        yearLevel: admission.year_level || "1st Year",
        previousSchool: admission.previous_school,
        yearGraduated: admission.year_graduated,
        isVerified: false,
      });
      created += 1;
    } catch (error) {
      // Another admission may use the same email, or a student account may
      // have been created after the initial query. Leave existing users intact.
      const [existing] = await db.query(
        `SELECT user_id FROM users
         WHERE email = ? COLLATE utf8mb4_unicode_ci AND role = 'Student'
         LIMIT 1`,
        [email],
      );
      if (existing.length) {
        skipped += 1;
        continue;
      }
      console.error(`Failed to provision admission ${admission.admission_id}:`, error.message);
      throw error;
    }
  }

  console.log(`Backfill complete. Created ${created} student account(s); skipped ${skipped} already-linked record(s).`);
};

backfillEnrolledAdmissionStudents()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to provision enrolled admission students:", error);
    process.exit(1);
  });
