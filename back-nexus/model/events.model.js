import db from "../config/db.js";

const EventsModel = {
  getAllEvents: async (filters = {}) => {
    try {
      let query = `
        SELECT e.*, 
               CONCAT(u.first_name, ' ', u.last_name) as creator_name,
               CONCAT(a.first_name, ' ', a.last_name) as approver_name
        FROM events e
        LEFT JOIN users u ON e.created_by = u.user_id
        LEFT JOIN users a ON e.approved_by = a.user_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.status) {
        query += " AND e.status = ?";
        params.push(filters.status);
      }

      if (filters.event_type) {
        query += " AND e.event_type = ?";
        params.push(filters.event_type);
      }

      if (filters.event_category) {
        query += " AND e.event_category = ?";
        params.push(filters.event_category);
      }

      if (filters.search) {
        query +=
          " AND (e.event_name LIKE ? OR e.event_code LIKE ? OR e.organizer LIKE ?)";
        params.push(
          `%${filters.search}%`,
          `%${filters.search}%`,
          `%${filters.search}%`,
        );
      }

      query += " ORDER BY e.start_date DESC";

      const [results] = await db.query(query, params);
      return results;
    } catch (err) {
      console.error("getAllEvents error:", err);
      throw err;
    }
  },

  getEventById: async (id) => {
    try {
      const query = `
        SELECT e.*, 
               CONCAT(u.first_name, ' ', u.last_name) as creator_name,
               CONCAT(a.first_name, ' ', a.last_name) as approver_name
        FROM events e
        LEFT JOIN users u ON e.created_by = u.user_id
        LEFT JOIN users a ON e.approved_by = a.user_id
        WHERE e.event_id = ?
      `;
      const [results] = await db.query(query, [id]);
      return results[0];
    } catch (err) {
      console.error("getEventById error:", err);
      throw err;
    }
  },

  createEvent: async (data) => {
    try {
      // Clean up empty strings to null
      const cleanData = Object.keys(data).reduce((acc, key) => {
        acc[key] = data[key] === "" ? null : data[key];
        return acc;
      }, {});

      const query = "INSERT INTO events SET ?";
      const [results] = await db.query(query, cleanData);
      return results;
    } catch (err) {
      console.error("createEvent error:", err);
      throw err;
    }
  },

  updateEvent: async (id, data) => {
    try {
      const query = "UPDATE events SET ? WHERE event_id = ?";
      const [results] = await db.query(query, [data, id]);
      return results;
    } catch (err) {
      console.error("updateEvent error:", err);
      throw err;
    }
  },

  deleteEvent: async (id) => {
    try {
      const query = "DELETE FROM events WHERE event_id = ?";
      const [results] = await db.query(query, [id]);
      return results;
    } catch (err) {
      console.error("deleteEvent error:", err);
      throw err;
    }
  },

  generateEventCode: async () => {
    try {
      const query =
        "SELECT event_code FROM events ORDER BY event_id DESC LIMIT 1";
      const [results] = await db.query(query);

      let newCode = "EVT-0001";
      if (results.length > 0 && results[0].event_code) {
        const lastCode = results[0].event_code;
        const match = lastCode.match(/EVT-(\d+)/);
        if (match) {
          const num = parseInt(match[1]) + 1;
          newCode = `EVT-${String(num).padStart(4, "0")}`;
        }
      }
      return newCode;
    } catch (err) {
      console.error("generateEventCode error:", err);
      throw err;
    }
  },

  getStatistics: async () => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN status = 'Ongoing' THEN 1 ELSE 0 END) as ongoing_count,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
          COALESCE(SUM(registered_count), 0) as total_registrations,
          COALESCE(SUM(checked_in_count), 0) as total_attendees
        FROM events
      `;
      const [results] = await db.query(query);
      return (
        results[0] || {
          total_events: 0,
          approved_count: 0,
          ongoing_count: 0,
          completed_count: 0,
          total_registrations: 0,
          total_attendees: 0,
        }
      );
    } catch (err) {
      console.error("getStatistics error:", err);
      return {
        total_events: 0,
        approved_count: 0,
        ongoing_count: 0,
        completed_count: 0,
        total_registrations: 0,
        total_attendees: 0,
      };
    }
  },
};

export default EventsModel;
