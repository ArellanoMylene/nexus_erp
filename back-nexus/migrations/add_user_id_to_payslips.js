import db from "../config/db.js";

export const addUserIdToPayslips = async () => {
  try {
    // Check if user_id column already exists
    const [columns] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'payslips' AND COLUMN_NAME = 'user_id'`,
    );

    if (columns.length > 0) {
      console.log("user_id column already exists in payslips table");
      return;
    }

    // Add user_id column to payslips table
    await db.query(`
      ALTER TABLE payslips
      ADD COLUMN user_id INT,
      ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
    `);

    console.log("✓ Successfully added user_id column to payslips table");
  } catch (error) {
    console.error("Error adding user_id column:", error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addUserIdToPayslips()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

export default addUserIdToPayslips;
