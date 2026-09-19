import db from "../config/db.js";

async function createReadTrackingTable() {
    try {
        console.log("Creating announcement_reads table...");
        const query = `
            CREATE TABLE IF NOT EXISTS announcement_reads (
                read_id INT AUTO_INCREMENT PRIMARY KEY,
                announcement_id INT NOT NULL,
                user_id INT NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_read (announcement_id, user_id),
                FOREIGN KEY (announcement_id) REFERENCES announcements(announcement_id) ON DELETE CASCADE,
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

createReadTrackingTable();
