import pool from "../config/db.js";

const RfidCardsModel = {
  // Get all RFID cards with filters
  async getAll(filters = {}) {
    let query = `
      SELECT 
        rc.*,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        u.email,
        u.role,
        CASE 
          WHEN u.role = 'Student' THEN sd.student_number
          WHEN u.role IN ('Faculty', 'Staff', 'Admin') THEN ed.employee_id
          ELSE NULL
        END AS user_identifier
      FROM rfid_cards rc
      INNER JOIN users u ON rc.user_id = u.user_id
      LEFT JOIN student_details sd ON rc.user_id = sd.user_id
      LEFT JOIN employee_details ed ON rc.user_id = ed.user_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.user_id) {
      query += " AND rc.user_id = ?";
      params.push(filters.user_id);
    }

    if (filters.card_type) {
      query += " AND rc.card_type = ?";
      params.push(filters.card_type);
    }

    if (filters.status) {
      query += " AND rc.status = ?";
      params.push(filters.status);
    }

    if (filters.search) {
      query +=
        " AND (rc.card_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY rc.created_at DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get RFID card by ID
  async getById(id) {
    const query = `
      SELECT 
        rc.*,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        u.email,
        u.role,
        CASE 
          WHEN u.role = 'Student' THEN sd.student_number
          WHEN u.role IN ('Faculty', 'Staff', 'Admin') THEN ed.employee_id
          ELSE NULL
        END AS user_identifier
      FROM rfid_cards rc
      INNER JOIN users u ON rc.user_id = u.user_id
      LEFT JOIN student_details sd ON rc.user_id = sd.user_id
      LEFT JOIN employee_details ed ON rc.user_id = ed.user_id
      WHERE rc.rfid_id = ?
    `;

    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

  // Get RFID card by card number
  async getByCardNumber(cardNumber) {
    const query = `
      SELECT 
        rc.*,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        u.email,
        u.role,
        CASE 
          WHEN u.role = 'Student' THEN sd.student_number
          WHEN u.role IN ('Faculty', 'Staff', 'Admin') THEN ed.employee_id
          ELSE NULL
        END AS user_identifier
      FROM rfid_cards rc
      INNER JOIN users u ON rc.user_id = u.user_id
      LEFT JOIN student_details sd ON rc.user_id = sd.user_id
      LEFT JOIN employee_details ed ON rc.user_id = ed.user_id
      WHERE rc.card_number = ?
    `;

    const [rows] = await pool.query(query, [cardNumber]);
    return rows[0];
  },

  // Create RFID card
  async create(data) {
    const query = `
      INSERT INTO rfid_cards (
        card_number, user_id, card_type, issue_date,
        expiry_date, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.card_number,
      data.user_id,
      data.card_type,
      data.issue_date,
      data.expiry_date || null,
      data.status || "active",
      data.notes || null,
    ];

    const [result] = await pool.query(query, params);
    return result.insertId;
  },

  // Update RFID card
  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.card_number) {
      fields.push("card_number = ?");
      params.push(data.card_number);
    }

    if (data.user_id) {
      fields.push("user_id = ?");
      params.push(data.user_id);
    }

    if (data.card_type) {
      fields.push("card_type = ?");
      params.push(data.card_type);
    }

    if (data.issue_date) {
      fields.push("issue_date = ?");
      params.push(data.issue_date);
    }

    if (data.expiry_date !== undefined) {
      fields.push("expiry_date = ?");
      params.push(data.expiry_date);
    }

    if (data.status) {
      fields.push("status = ?");
      params.push(data.status);
    }

    if (data.notes !== undefined) {
      fields.push("notes = ?");
      params.push(data.notes);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    params.push(id);
    const query = `UPDATE rfid_cards SET ${fields.join(
      ", "
    )} WHERE rfid_id = ?`;

    const [result] = await pool.query(query, params);
    return result.affectedRows;
  },

  // Update last used timestamp
  async updateLastUsed(cardNumber) {
    const query =
      "UPDATE rfid_cards SET last_used = NOW() WHERE card_number = ?";
    const [result] = await pool.query(query, [cardNumber]);
    return result.affectedRows;
  },

  // Delete RFID card
  async delete(id) {
    const query = "DELETE FROM rfid_cards WHERE rfid_id = ?";
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  },

  // Check if card number exists
  async cardNumberExists(cardNumber, excludeId = null) {
    let query =
      "SELECT COUNT(*) as count FROM rfid_cards WHERE card_number = ?";
    const params = [cardNumber];

    if (excludeId) {
      query += " AND rfid_id != ?";
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].count > 0;
  },
};

export default RfidCardsModel;
