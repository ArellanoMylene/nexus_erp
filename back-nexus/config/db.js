import mysql from "mysql2/promise";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),

  /* ssl: {
    ca: fs.readFileSync("./config/ca.pem"),
  }, */

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("MySQL pool initialized");

// Automatically ensure email verification columns exist on the users table
const ensureVerificationSchema = async () => {
  try {
    const [columns] = await db.query(`SHOW COLUMNS FROM users LIKE 'is_verified'`);
    if (columns.length === 0) {
      console.log("Adding email verification columns to users table...");
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
        ADD COLUMN verification_code VARCHAR(6) NULL DEFAULT NULL AFTER is_verified,
        ADD COLUMN verification_expires_at DATETIME NULL DEFAULT NULL AFTER verification_code,
        ADD COLUMN email_verified_at DATETIME NULL DEFAULT NULL AFTER verification_expires_at
      `);
      // Ensure existing active users are marked as verified
      await db.query(`
        UPDATE users 
        SET is_verified = 1, email_verified_at = CURRENT_TIMESTAMP 
        WHERE (is_verified IS NULL OR is_verified = 0) AND status = 'Active'
      `);
      console.log("✅ Email verification columns successfully added to users table.");
    }
  } catch (err) {
    // If the database is not connected or users table doesn't exist yet, log softly
    console.warn("⚠️ Database schema check notice:", err.message);
  }
};

ensureVerificationSchema();

export default db;