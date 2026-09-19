
import pool from "../config/db.js";

const SectionsModel = {
  // Get all sections with academic period and program details
  getAllSections: async (filters = {}) => {
    try {
      let query = `
        SELECT 
          s.*,
          ap.school_year,
          ap.semester,
          p.code AS program_code,
          p.name AS program_name,
          p.degree_type
        FROM sections s
        LEFT JOIN academic_periods ap ON s.period_id = ap.period_id
        LEFT JOIN programs p ON s.program_id = p.program_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.period_id) {
        query += " AND s.period_id = ?";
        params.push(filters.period_id);
      }

      if (filters.program_id) {
        query += " AND s.program_id = ?";
        params.push(filters.program_id);
      }

      if (filters.search) {
        query += `
          AND (
            s.section_name LIKE ? 
            OR s.room LIKE ?
            OR p.code LIKE ?
            OR p.name LIKE ?
          )
        `;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      query += " ORDER BY s.created_at DESC";

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get section by ID
  getSectionById: async (id) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          s.*,
          ap.school_year,
          ap.semester,
          p.code AS program_code,
          p.name AS program_name,
          p.degree_type
        FROM sections s
        LEFT JOIN academic_periods ap ON s.period_id = ap.period_id
        LEFT JOIN programs p ON s.program_id = p.program_id
        WHERE s.section_id = ?`,
        [id],
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Create new section with program_id
  createSection: async (sectionData) => {
    try {
      const {
        program_id,
        period_id,
        section_name,
        room,
        max_capacity,
        schedule_day,
        schedule_time_start,
        schedule_time_end,
      } = sectionData;

      const [result] = await pool.query(
        `INSERT INTO sections 
        (program_id, period_id, section_name, room, max_capacity, current_enrolled, 
         schedule_day, schedule_time_start, schedule_time_end)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          program_id || null,
          period_id,
          section_name,
          room || null,
          max_capacity || 40,
          schedule_day || null,
          schedule_time_start || null,
          schedule_time_end || null,
        ],
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Update section with program_id
  updateSection: async (id, sectionData) => {
    try {
      const {
        program_id,
        period_id,
        section_name,
        room,
        max_capacity,
        schedule_day,
        schedule_time_start,
        schedule_time_end,
        status,
      } = sectionData;

      const [result] = await pool.query(
        `UPDATE sections 
        SET program_id = ?, period_id = ?, section_name = ?, room = ?, 
            max_capacity = ?, schedule_day = ?, schedule_time_start = ?, 
            schedule_time_end = ?, status = ?
        WHERE section_id = ?`,
        [
          program_id || null,
          period_id,
          section_name,
          room || null,
          max_capacity || 40,
          schedule_day || null,
          schedule_time_start || null,
          schedule_time_end || null,
          status || "active",
          id,
        ],
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Delete section
  deleteSection: async (id) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM sections WHERE section_id = ?",
        [id],
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Get enrollment count
  getEnrollmentCount: async (sectionId) => {
    try {
      const [rows] = await pool.query(
        "SELECT current_enrolled FROM sections WHERE section_id = ?",
        [sectionId],
      );
      return rows[0]?.current_enrolled || 0;
    } catch (error) {
      throw error;
    }
  },

  // Update enrollment count
  updateEnrollmentCount: async (sectionId, increment = true) => {
    try {
      const operator = increment ? "+" : "-";
      const [result] = await pool.query(
        `UPDATE sections 
        SET current_enrolled = current_enrolled ${operator} 1 
        WHERE section_id = ?`,
        [sectionId],
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Get raw section rows for a period, used by balancing algorithm.
  // Optionally filter by program_id to balance by program.
  getSectionsForPeriod: async (periodId, programId = null) => {
    try {
      let query = `
        SELECT s.section_id, s.period_id, s.program_id, s.section_name, s.max_capacity, s.current_enrolled, s.status,
               p.code AS program_code, p.name AS program_name
        FROM sections s
        LEFT JOIN programs p ON s.program_id = p.program_id
        WHERE s.period_id = ?
      `;
      const params = [periodId];

      if (programId) {
        query += " AND s.program_id = ?";
        params.push(programId);
      }

      query += " ORDER BY s.section_name ASC";

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },
};

export default SectionsModel;