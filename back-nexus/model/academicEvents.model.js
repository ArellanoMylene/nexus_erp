import pool from "../config/db.js";

const AcademicEventsModel = {
  // Get all events
  getAllEvents: async (filters = {}) => {
    try {
      let query = `
        SELECT 
          ae.*,
          ap.semester,
          ap.school_year
        FROM academic_events ae
        LEFT JOIN academic_periods ap ON ae.period_id = ap.period_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.period_id) {
        query += " AND ae.period_id = ?";
        params.push(filters.period_id);
      }

      if (filters.event_type) {
        query += " AND ae.event_type = ?";
        params.push(filters.event_type);
      }

      if (filters.search) {
        query += " AND (ae.event_name LIKE ? OR ae.description LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      query += " ORDER BY ae.start_date ASC";

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get event by ID
  getEventById: async (id) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          ae.*,
          ap.semester,
          ap.school_year
        FROM academic_events ae
        LEFT JOIN academic_periods ap ON ae.period_id = ap.period_id
        WHERE ae.event_id = ?`,
        [id],
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Create new event
  createEvent: async (eventData) => {
    try {
      const {
        period_id,
        event_name,
        event_type,
        start_date,
        end_date,
        description,
        location,
        target_audience,
      } = eventData;

      const [result] = await pool.query(
        `INSERT INTO academic_events 
        (period_id, event_name, event_type, start_date, end_date, description, location, target_audience)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          period_id,
          event_name,
          event_type,
          start_date,
          end_date,
          description,
          location,
          target_audience,
        ],
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Update event
  updateEvent: async (id, eventData) => {
    try {
      const {
        period_id,
        event_name,
        event_type,
        start_date,
        end_date,
        description,
        location,
        target_audience,
      } = eventData;

      const [result] = await pool.query(
        `UPDATE academic_events 
        SET period_id = ?, event_name = ?, event_type = ?, start_date = ?, 
            end_date = ?, description = ?, location = ?, target_audience = ?
        WHERE event_id = ?`,
        [
          period_id,
          event_name,
          event_type,
          start_date,
          end_date,
          description,
          location,
          target_audience,
          id,
        ],
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Delete event
  deleteEvent: async (id) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM academic_events WHERE event_id = ?",
        [id],
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },
};

export default AcademicEventsModel;
