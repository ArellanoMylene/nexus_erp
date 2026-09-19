import db from "../config/db.js";

async function createFeedbackTable() {
    try {
        console.log("Creating student_feedback table...");
        const query = `
            CREATE TABLE IF NOT EXISTS student_feedback (
                feedback_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category VARCHAR(50) NOT NULL,
                rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
                message TEXT NOT NULL,
                response TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `;
        await db.query(query);
        console.log("Table created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
}

createFeedbackTable();
