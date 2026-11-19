import pool from "../config/db.js";

const SyllabusModel = {
  // Get all syllabi
  getAllSyllabi: async (filters = {}) => {
    try {
      let query = `
        SELECT 
          s.*,
          c.code AS course_code,
          c.title AS course_title,
          ap.semester,
          ap.school_year,
          u.first_name,
          u.last_name
        FROM syllabus s
        LEFT JOIN courses c ON s.course_id = c.course_id
        LEFT JOIN academic_periods ap ON s.period_id = ap.period_id
        LEFT JOIN users u ON s.uploaded_by = u.user_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.course_id) {
        query += " AND s.course_id = ?";
        params.push(filters.course_id);
      }

      if (filters.period_id) {
        query += " AND s.period_id = ?";
        params.push(filters.period_id);
      }

      if (filters.faculty_user_id) {
        query += ` AND (
          s.uploaded_by = ? OR EXISTS (
            SELECT 1 FROM faculty_course_assignments fca
            WHERE fca.faculty_user_id = ? AND fca.course_id = s.course_id
              AND fca.academic_period_id = s.period_id
          )
        )`;
        params.push(filters.faculty_user_id, filters.faculty_user_id);
      }

      if (filters.student_id) {
        query += ` AND EXISTS (
          SELECT 1 FROM enrollments e
          WHERE e.student_id = ? AND e.course_id = s.course_id
            AND (s.period_id IS NULL OR e.period_id = s.period_id)
            AND LOWER(COALESCE(e.status, 'enrolled')) NOT IN ('dropped', 'withdrawn')
        )`;
        params.push(filters.student_id);
      }

      if (filters.search) {
        query +=
          " AND (c.course_code LIKE ? OR c.course_title LIKE ? OR s.description LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += " ORDER BY s.created_at DESC";

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get syllabus by ID
  getSyllabusById: async (id) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          s.*,
          c.code AS course_code,
          c.title AS course_title,
          ap.semester,
          ap.school_year,
          u.first_name,
          u.last_name
        FROM syllabus s
        LEFT JOIN courses c ON s.course_id = c.course_id
        LEFT JOIN academic_periods ap ON s.period_id = ap.period_id
        LEFT JOIN users u ON s.uploaded_by = u.user_id
        WHERE s.syllabus_id = ?`,
        [id],
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Create new syllabus
  createSyllabus: async (syllabusData) => {
    try {
      const {
        course_id,
        period_id,
        file_name,
        file_path,
        file_type,
        file_size,
        description,
        uploaded_by,
      } = syllabusData;

      const [result] = await pool.query(
        `INSERT INTO syllabus 
        (course_id, period_id, file_name, file_path, file_type, file_size, description, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          course_id,
          period_id,
          file_name,
          file_path,
          file_type,
          file_size,
          description,
          uploaded_by,
        ],
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Update syllabus
  updateSyllabus: async (id, syllabusData) => {
    try {
      const {
        course_id,
        period_id,
        file_name,
        file_path,
        file_type,
        file_size,
        description,
      } = syllabusData;

      const [result] = await pool.query(
        `UPDATE syllabus 
        SET course_id = ?, period_id = ?, file_name = ?, file_path = ?, 
            file_type = ?, file_size = ?, description = ?
        WHERE syllabus_id = ?`,
        [
          course_id,
          period_id,
          file_name,
          file_path,
          file_type,
          file_size,
          description,
          id,
        ],
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Delete syllabus
  deleteSyllabus: async (id) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM syllabus WHERE syllabus_id = ?",
        [id],
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },
};

export default SyllabusModel;
