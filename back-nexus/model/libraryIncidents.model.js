import pool from "../config/db.js";

const LibraryIncidentsModel = {
  // Get all incidents with filters
  getAllIncidents: async (filters = {}) => {
    try {
      let query = `
        SELECT 
          li.*,
          lb.title as book_title,
          lb.author as book_author,
          lb.isbn,
          CONCAT(u.first_name, ' ', u.last_name) as user_name,
          u.email as user_email,
          CONCAT(reporter.first_name, ' ', reporter.last_name) as reported_by_name
        FROM library_incidents li
        LEFT JOIN library_books lb ON li.book_id = lb.book_id
        LEFT JOIN users u ON li.user_id = u.user_id
        LEFT JOIN users reporter ON li.reported_by = reporter.user_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.incident_type) {
        query += " AND li.incident_type = ?";
        params.push(filters.incident_type);
      }

      if (filters.payment_status) {
        query += " AND li.payment_status = ?";
        params.push(filters.payment_status);
      }

      if (filters.resolved !== undefined) {
        query += " AND li.resolved = ?";
        params.push(filters.resolved);
      }

      if (filters.search) {
        query += " AND (lb.title LIKE ? OR lb.author LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      query += " ORDER BY li.created_at DESC";

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get incident by ID
  getIncidentById: async (id) => {
    try {
      const query = `
        SELECT 
          li.*,
          lb.title as book_title,
          lb.author as book_author,
          lb.isbn,
          CONCAT(u.first_name, ' ', u.last_name) as user_name,
          u.email as user_email,
          CONCAT(reporter.first_name, ' ', reporter.last_name) as reported_by_name
        FROM library_incidents li
        LEFT JOIN library_books lb ON li.book_id = lb.book_id
        LEFT JOIN users u ON li.user_id = u.user_id
        LEFT JOIN users reporter ON li.reported_by = reporter.user_id
        WHERE li.incident_id = ?
      `;
      const [rows] = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Create new incident
  createIncident: async (incidentData) => {
    try {
      const query = `
        INSERT INTO library_incidents (
          book_id, transaction_id, user_id, incident_type, incident_date,
          severity, description, replacement_cost, amount_charged, amount_paid,
          payment_status, resolved, reported_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        incidentData.book_id,
        incidentData.transaction_id || null,
        incidentData.user_id || null,
        incidentData.incident_type,
        incidentData.incident_date,
        incidentData.severity || null,
        incidentData.description || null,
        incidentData.replacement_cost || null,
        incidentData.amount_charged || null,
        incidentData.amount_paid || 0,
        incidentData.payment_status || 'Pending',
        incidentData.resolved || false,
        incidentData.reported_by || null,
      ];

      const [result] = await pool.query(query, values);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Update incident
  updateIncident: async (id, incidentData) => {
    try {
      const fields = [];
      const values = [];

      const allowedFields = [
        'severity', 'description', 'replacement_cost', 'amount_charged',
        'amount_paid', 'payment_status', 'resolved', 'resolved_date', 'resolution_notes'
      ];

      allowedFields.forEach(field => {
        if (incidentData[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(incidentData[field]);
        }
      });

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(id);
      const query = `UPDATE library_incidents SET ${fields.join(', ')} WHERE incident_id = ?`;
      
      const [result] = await pool.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Delete incident
  deleteIncident: async (id) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM library_incidents WHERE incident_id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Get incident statistics
  getStatistics: async () => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_incidents,
          SUM(CASE WHEN incident_type = 'Lost' THEN 1 ELSE 0 END) as lost_count,
          SUM(CASE WHEN incident_type = 'Damaged' THEN 1 ELSE 0 END) as damaged_count,
          SUM(CASE WHEN incident_type = 'Missing' THEN 1 ELSE 0 END) as missing_count,
          SUM(CASE WHEN resolved = TRUE THEN 1 ELSE 0 END) as resolved_count,
          SUM(amount_charged) as total_charges,
          SUM(amount_paid) as total_paid,
          SUM(amount_charged - amount_paid) as outstanding_balance
        FROM library_incidents
      `;
      const [rows] = await pool.query(query);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },
};

export default LibraryIncidentsModel;
