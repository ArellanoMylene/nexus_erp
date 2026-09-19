import mysql from "mysql2/promise";
import fs from "fs";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "nexus6",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function runMigration() {
  try {
    const connection = await pool.getConnection();
    console.log("✓ Connected to database");

    // Read migration file
    const migrationSQL = fs.readFileSync(
      "../migrations/add_rooms_table.sql",
      "utf8",
    );

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      console.log("Executing:", statement.substring(0, 50) + "...");
      await connection.query(statement);
    }

    console.log("✓ Migration completed successfully!");
    console.log("✓ Rooms table created!");

    await connection.release();
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();
