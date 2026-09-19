import pool from "../config/db.js";

const DigitalLibraryModel = {
  // Get all digital resources
  getAllDigitalResources: async (filters = {}) => {
    try {
      let query = `
        SELECT 
          dl.*,
          lb.title as linked_book_title,
          CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
        FROM digital_library dl
        LEFT JOIN library_books lb ON dl.book_id = lb.book_id
        LEFT JOIN users u ON dl.uploaded_by = u.user_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.category) {
        query += " AND dl.category = ?";
        params.push(filters.category);
      }

      if (filters.access_level) {
        query += " AND dl.access_level = ?";
        params.push(filters.access_level);
      }

      if (filters.search) {
        query += " AND (dl.title LIKE ? OR dl.author LIKE ? OR dl.description LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += " ORDER BY dl.created_at DESC";

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get digital resource by ID
  getDigitalResourceById: async (id) => {
    try {
      const query = `
        SELECT 
          dl.*,
          lb.title as linked_book_title,
          CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
        FROM digital_library dl
        LEFT JOIN library_books lb ON dl.book_id = lb.book_id
        LEFT JOIN users u ON dl.uploaded_by = u.user_id
        WHERE dl.digital_id = ?
      `;
      const [rows] = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Create new digital resource
  createDigitalResource: async (resourceData) => {
    try {
      const query = `
        INSERT INTO digital_library (
          book_id, title, author, file_name, file_path, file_type,
          file_size, category, description, cover_image_url, access_level,
          download_allowed, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        resourceData.book_id || null,
        resourceData.title,
        resourceData.author || null,
        resourceData.file_name,
        resourceData.file_path,
        resourceData.file_type || null,
        resourceData.file_size || null,
        resourceData.category || null,
        resourceData.description || null,
        resourceData.cover_image_url || null,
        resourceData.access_level || 'Students Only',
        resourceData.download_allowed !== undefined ? resourceData.download_allowed : true,
        resourceData.uploaded_by || null,
      ];

      const [result] = await pool.query(query, values);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Update digital resource
  updateDigitalResource: async (id, resourceData) => {
    try {
      const fields = [];
      const values = [];

      const allowedFields = [
        'title', 'author', 'category', 'description', 'cover_image_url',
        'access_level', 'download_allowed', 'view_count', 'download_count'
      ];

      allowedFields.forEach(field => {
        if (resourceData[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(resourceData[field]);
        }
      });

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(id);
      const query = `UPDATE digital_library SET ${fields.join(', ')} WHERE digital_id = ?`;
      
      const [result] = await pool.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Delete digital resource
  deleteDigitalResource: async (id) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM digital_library WHERE digital_id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Increment view count
  incrementViewCount: async (id) => {
    try {
      const query = "UPDATE digital_library SET view_count = view_count + 1 WHERE digital_id = ?";
      await pool.query(query, [id]);
    } catch (error) {
      throw error;
    }
  },

  // Increment download count
  incrementDownloadCount: async (id) => {
    try {
      const query = "UPDATE digital_library SET download_count = download_count + 1 WHERE digital_id = ?";
      await pool.query(query, [id]);
    } catch (error) {
      throw error;
    }
  },

  // Get statistics
  getStatistics: async () => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_resources,
          SUM(file_size) as total_storage,
          SUM(view_count) as total_views,
          SUM(download_count) as total_downloads,
          COUNT(DISTINCT category) as total_categories
        FROM digital_library
      `;
      const [rows] = await pool.query(query);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },
};

export default DigitalLibraryModel;
