import db from "../config/db.js";

const SchoolCalendarModel = {
  getAllCalendarEvents: (filters = {}) => {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT sc.*, 
               CONCAT(u.first_name, ' ', u.last_name) as creator_name
        FROM school_calendar sc
        LEFT JOIN users u ON sc.created_by = u.user_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.calendar_type) {
        query += " AND sc.calendar_type = ?";
        params.push(filters.calendar_type);
      }

      if (filters.academic_year) {
        query += " AND sc.academic_year = ?";
        params.push(filters.academic_year);
      }

      if (filters.semester) {
        query += " AND (sc.semester = ? OR sc.semester = 'All')";
        params.push(filters.semester);
      }

      if (filters.status) {
        query += " AND sc.status = ?";
        params.push(filters.status);
      }

      if (filters.month) {
        query += " AND MONTH(sc.start_date) = ?";
        params.push(filters.month);
      }

      if (filters.year) {
        query += " AND YEAR(sc.start_date) = ?";
        params.push(filters.year);
      }

      if (filters.search) {
        query += " AND (sc.event_title LIKE ? OR sc.event_description LIKE ?)";
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      query += " ORDER BY sc.start_date ASC";

      db.query(query, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  getCalendarEventById: (id) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT sc.*, 
               CONCAT(u.first_name, ' ', u.last_name) as creator_name
        FROM school_calendar sc
        LEFT JOIN users u ON sc.created_by = u.user_id
        WHERE sc.calendar_id = ?
      `;
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  },

  createCalendarEvent: (data) => {
    return new Promise((resolve, reject) => {
      const query = "INSERT INTO school_calendar SET ?";
      db.query(query, data, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  updateCalendarEvent: (id, data) => {
    return new Promise((resolve, reject) => {
      const query = "UPDATE school_calendar SET ? WHERE calendar_id = ?";
      db.query(query, [data, id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  deleteCalendarEvent: (id) => {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM school_calendar WHERE calendar_id = ?";
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  getStatistics: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN calendar_type = 'Academic' THEN 1 ELSE 0 END) as academic_count,
          SUM(CASE WHEN calendar_type = 'Holiday' THEN 1 ELSE 0 END) as holiday_count,
          SUM(CASE WHEN calendar_type = 'Exam' THEN 1 ELSE 0 END) as exam_count,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_count
        FROM school_calendar
      `;
      db.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  },

  getAcademicYears: () => {
    return new Promise((resolve, reject) => {
      const query = "SELECT DISTINCT academic_year FROM school_calendar WHERE academic_year IS NOT NULL ORDER BY academic_year DESC";
      db.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },
};

export default SchoolCalendarModel;
