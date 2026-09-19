import db from "../config/db.js";

const AnnouncementsModel = {
  getAllAnnouncements: async (filters = {}) => {
    try {
      let query = `
        SELECT a.*, 
               CONCAT(u.first_name, ' ', u.last_name) as creator_name,
               CASE WHEN ar.read_id IS NOT NULL THEN 1 ELSE 0 END as is_read
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.user_id
        LEFT JOIN announcement_reads ar ON a.announcement_id = ar.announcement_id AND ar.user_id = ?
        WHERE 1=1
      `;
      const params = [filters.user_id || null];

      if (filters.status) {
        query += " AND a.status = ?";
        params.push(filters.status);
      }

      if (filters.announcement_type) {
        query += " AND a.announcement_type = ?";
        params.push(filters.announcement_type);
      }

      if (filters.priority) {
        query += " AND a.priority = ?";
        params.push(filters.priority);
      }

      if (filters.target_audience) {
        query += " AND a.target_audience = ?";
        params.push(filters.target_audience);
      }

      if (filters.search) {
        query += " AND (a.title LIKE ? OR a.content LIKE ?)";
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      query += " ORDER BY a.is_pinned DESC, a.publish_date DESC";

      const [results] = await db.query(query, params);
      return results;
    } catch (err) {
      console.error("getAllAnnouncements error:", err);
      throw err;
    }
  },

  getAnnouncementById: async (id) => {
    try {
      const query = `
        SELECT a.*, 
               CONCAT(u.first_name, ' ', u.last_name) as creator_name
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.user_id
        WHERE a.announcement_id = ?
      `;
      const [results] = await db.query(query, [id]);
      return results[0];
    } catch (err) {
      console.error("getAnnouncementById error:", err);
      throw err;
    }
  },

  createAnnouncement: async (data) => {
    try {
      console.log("MODEL createAnnouncement - Data received:", data);

      // Clean up empty strings to null
      const cleanData = Object.keys(data).reduce((acc, key) => {
        acc[key] = data[key] === "" ? null : data[key];
        return acc;
      }, {});

      console.log("MODEL createAnnouncement - Cleaned data:", cleanData);

      const query = "INSERT INTO announcements SET ?";
      console.log("MODEL createAnnouncement - Executing query...");

      const [results] = await db.query(query, cleanData);
      console.log("MODEL createAnnouncement - Success:", results);
      return results;
    } catch (err) {
      console.error("MODEL createAnnouncement - SQL Error:", err);
      throw err;
    }
  },

  updateAnnouncement: async (id, data) => {
    try {
      const query = "UPDATE announcements SET ? WHERE announcement_id = ?";
      const [results] = await db.query(query, [data, id]);
      return results;
    } catch (err) {
      console.error("updateAnnouncement error:", err);
      throw err;
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      const query = "DELETE FROM announcements WHERE announcement_id = ?";
      const [results] = await db.query(query, [id]);
      return results;
    } catch (err) {
      console.error("deleteAnnouncement error:", err);
      throw err;
    }
  },

  incrementViews: async (id) => {
    try {
      const query =
        "UPDATE announcements SET views_count = views_count + 1 WHERE announcement_id = ?";
      const [results] = await db.query(query, [id]);
      return results;
    } catch (err) {
      console.error("incrementViews error:", err);
      throw err;
    }
  },

  getStatistics: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_announcements,
          SUM(CASE WHEN status = 'Published' THEN 1 ELSE 0 END) as published_count,
          SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft_count,
          SUM(CASE WHEN priority = 'Urgent' THEN 1 ELSE 0 END) as urgent_count,
          COALESCE(SUM(views_count), 0) as total_views
        FROM announcements
      `;
      db.query(query, (err, results) => {
        if (err) {
          console.error("Statistics SQL error:", err);
          // Return default stats if query fails
          return resolve({
            total_announcements: 0,
            published_count: 0,
            draft_count: 0,
            urgent_count: 0,
            total_views: 0,
          });
        }
        resolve(
          results[0] || {
            total_announcements: 0,
            published_count: 0,
            draft_count: 0,
            urgent_count: 0,
            total_views: 0,
          },
        );
      });
    });
  },

  markAsRead: async (announcement_id, user_id) => {
    try {
      const query = "INSERT IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)";
      const [results] = await db.query(query, [announcement_id, user_id]);
      return results;
    } catch (err) {
      console.error("markAsRead error:", err);
      throw err;
    }
  },
};

export default AnnouncementsModel;
