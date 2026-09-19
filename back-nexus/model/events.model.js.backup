import db from "../config/db.js";

const EventsModel = {
  getAllEvents: (filters = {}) => {
    return new Promise((resolve, reject) => {
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
        query += " AND (e.event_name LIKE ? OR e.event_code LIKE ? OR e.organizer LIKE ?)";
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }

      query += " ORDER BY e.start_date DESC";

      db.query(query, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  getEventById: (id) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT e.*, 
               CONCAT(u.first_name, ' ', u.last_name) as creator_name,
               CONCAT(a.first_name, ' ', a.last_name) as approver_name
        FROM events e
        LEFT JOIN users u ON e.created_by = u.user_id
        LEFT JOIN users a ON e.approved_by = a.user_id
        WHERE e.event_id = ?
      `;
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  },

  createEvent: (data) => {
    return new Promise((resolve, reject) => {
      const query = "INSERT INTO events SET ?";
      db.query(query, data, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  updateEvent: (id, data) => {
    return new Promise((resolve, reject) => {
      const query = "UPDATE events SET ? WHERE event_id = ?";
      db.query(query, [data, id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  deleteEvent: (id) => {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM events WHERE event_id = ?";
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  generateEventCode: () => {
    return new Promise((resolve, reject) => {
      const query = "SELECT event_code FROM events ORDER BY event_id DESC LIMIT 1";
      db.query(query, (err, results) => {
        if (err) return reject(err);
        
        let newCode = "EVT-0001";
        if (results.length > 0 && results[0].event_code) {
          const lastCode = results[0].event_code;
          const match = lastCode.match(/EVT-(\d+)/);
          if (match) {
            const num = parseInt(match[1]) + 1;
            newCode = `EVT-${String(num).padStart(4, '0')}`;
          }
        }
        resolve(newCode);
      });
    });
  },

  getStatistics: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN status = 'Ongoing' THEN 1 ELSE 0 END) as ongoing_count,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
          SUM(registered_count) as total_registrations,
          SUM(checked_in_count) as total_attendees
        FROM events
      `;
      db.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  },
};

export default EventsModel;
