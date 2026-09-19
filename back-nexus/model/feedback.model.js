import db from "../config/db.js";

const FeedbackModel = {
    create: async (data) => {
        try {
            const query = `
        INSERT INTO student_feedback (user_id, category, rating, message)
        VALUES (?, ?, ?, ?)
      `;
            const [result] = await db.query(query, [
                data.user_id,
                data.category,
                data.rating,
                data.message,
            ]);
            return result.insertId;
        } catch (err) {
            console.error("FeedbackModel.create error:", err);
            throw err;
        }
    },

    getAll: async (filters = {}) => {
        try {
            let query = "SELECT * FROM student_feedback WHERE 1=1";
            const params = [];

            if (filters.user_id) {
                query += " AND user_id = ?";
                params.push(filters.user_id);
            }

            query += " ORDER BY submitted_at DESC";

            const [results] = await db.query(query, params);
            return results;
        } catch (err) {
            console.error("FeedbackModel.getAll error:", err);
            throw err;
        }
    },

    getById: async (id) => {
        try {
            const query = "SELECT * FROM student_feedback WHERE feedback_id = ?";
            const [results] = await db.query(query, [id]);
            return results[0];
        } catch (err) {
            console.error("FeedbackModel.getById error:", err);
            throw err;
        }
    },
};

export default FeedbackModel;
