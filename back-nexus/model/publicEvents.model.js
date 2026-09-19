import db from "../config/db.js";

const PublicEventsModel = {
  getAllPublicEvents: (filters = {}) => {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT pe.*, 
               CONCAT(u.first_name, ' ', u.last_name) as creator_name,
               CONCAT(a.first_name, ' ', a.last_name) as approver_name
        FROM public_events pe
        LEFT JOIN users u ON pe.created_by = u.user_id
        LEFT JOIN users a ON pe.approved_by = a.user_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.status) {
        query += " AND pe.status = ?";
        params.push(filters.status);
      }

      if (filters.event_category) {
        query += " AND pe.event_category = ?";
        params.push(filters.event_category);
      }

      if (filters.approval_status) {
        query += " AND pe.approval_status = ?";
        params.push(filters.approval_status);
      }

      if (filters.search) {
        query += " AND (pe.event_title LIKE ? OR pe.short_description LIKE ? OR pe.event_slug LIKE ?)";
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }

      query += " ORDER BY pe.is_featured DESC, pe.display_order ASC, pe.event_date DESC";

      db.query(query, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  getPublicEventById: (id) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT pe.*, 
               CONCAT(u.first_name, ' ', u.last_name) as creator_name,
               CONCAT(a.first_name, ' ', a.last_name) as approver_name
        FROM public_events pe
        LEFT JOIN users u ON pe.created_by = u.user_id
        LEFT JOIN users a ON pe.approved_by = a.user_id
        WHERE pe.public_event_id = ?
      `;
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  },

  getPublicEventBySlug: (slug) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT pe.*, 
               CONCAT(u.first_name, ' ', u.last_name) as creator_name
        FROM public_events pe
        LEFT JOIN users u ON pe.created_by = u.user_id
        WHERE pe.event_slug = ? AND pe.status = 'Published'
      `;
      db.query(query, [slug], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  },

  createPublicEvent: (data) => {
    return new Promise((resolve, reject) => {
      const query = "INSERT INTO public_events SET ?";
      db.query(query, data, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  updatePublicEvent: (id, data) => {
    return new Promise((resolve, reject) => {
      const query = "UPDATE public_events SET ? WHERE public_event_id = ?";
      db.query(query, [data, id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  deletePublicEvent: (id) => {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM public_events WHERE public_event_id = ?";
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  incrementViews: (id) => {
    return new Promise((resolve, reject) => {
      const query = "UPDATE public_events SET views_count = views_count + 1 WHERE public_event_id = ?";
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  generateSlug: (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 255);
  },

  getStatistics: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN status = 'Published' THEN 1 ELSE 0 END) as published_count,
          SUM(CASE WHEN is_featured = TRUE THEN 1 ELSE 0 END) as featured_count,
          SUM(views_count) as total_views,
          SUM(registrations_count) as total_registrations
        FROM public_events
      `;
      db.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  },
};

export default PublicEventsModel;
