import db from "../config/db.js";

const Payment = {
  // Create new payment
  create: async (data) => {
    const query = `
      INSERT INTO payment_collections 
      (payment_reference, invoice_id, student_id, amount_paid, payment_method,
       payment_date, bank_name, check_number, reference_number, payment_status,
       receipt_number, notes, collected_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(
      query,
      [
        data.payment_reference,
        data.invoice_id,
        data.student_id,
        data.amount_paid,
        data.payment_method,
        data.payment_date,
        data.bank_name,
        data.check_number,
        data.reference_number,
        data.payment_status || "Pending",
        data.receipt_number,
        data.notes,
        data.collected_by,
      ]
    );
    return result;
  },

  // Get all payments with filters
  getAll: async (filters) => {
    let query = `
      SELECT 
        pc.*,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        sd.student_number,
        si.invoice_number,
        si.total_amount as invoice_total,
        si.amount_paid as invoice_total_paid,
        si.total_amount - si.amount_paid as invoice_balance,
        CONCAT(c.first_name, ' ', c.last_name) as collected_by_name,
        CONCAT(v.first_name, ' ', v.last_name) as verified_by_name
      FROM payment_collections pc
      INNER JOIN users s ON pc.student_id = s.user_id
      LEFT JOIN student_details sd ON s.user_id = sd.user_id
      INNER JOIN student_invoices si ON pc.invoice_id = si.invoice_id
      LEFT JOIN users c ON pc.collected_by = c.user_id
      LEFT JOIN users v ON pc.verified_by = v.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.student_id) {
      query += " AND pc.student_id = ?";
      params.push(filters.student_id);
    }
    if (filters.invoice_id) {
      query += " AND pc.invoice_id = ?";
      params.push(filters.invoice_id);
    }
    if (filters.payment_method) {
      query += " AND pc.payment_method = ?";
      params.push(filters.payment_method);
    }
    if (filters.payment_status) {
      query += " AND pc.payment_status = ?";
      params.push(filters.payment_status);
    }
    if (filters.start_date && filters.end_date) {
      query += " AND pc.payment_date BETWEEN ? AND ?";
      params.push(filters.start_date, filters.end_date);
    }
    if (filters.search) {
      query += ` AND (pc.payment_reference LIKE ? OR 
                      pc.receipt_number LIKE ? OR
                      CONCAT(s.first_name, ' ', s.last_name) LIKE ? OR 
                      sd.student_number LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY pc.created_at DESC";

    if (filters.limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get payment by ID
  getById: async (id) => {
    const query = `
      SELECT 
        pc.*,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.email as student_email,
        sd.student_number,
        si.invoice_number,
        si.total_amount as invoice_total,
        si.amount_paid as invoice_total_paid,
        si.total_amount - si.amount_paid as invoice_balance,
        CONCAT(c.first_name, ' ', c.last_name) as collected_by_name,
        CONCAT(v.first_name, ' ', v.last_name) as verified_by_name
      FROM payment_collections pc
      INNER JOIN users s ON pc.student_id = s.user_id
      LEFT JOIN student_details sd ON s.user_id = sd.user_id
      INNER JOIN student_invoices si ON pc.invoice_id = si.invoice_id
      LEFT JOIN users c ON pc.collected_by = c.user_id
      LEFT JOIN users v ON pc.verified_by = v.user_id
      WHERE pc.payment_id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Get payments by student
  getByStudent: async (student_id) => {
    const query = `
      SELECT 
        pc.*,
        si.invoice_number
      FROM payment_collections pc
      INNER JOIN student_invoices si ON pc.invoice_id = si.invoice_id
      WHERE pc.student_id = ?
      ORDER BY pc.payment_date DESC
    `;
    const [rows] = await db.query(query, [student_id]);
    return rows;
  },

  // Get payments by invoice
  getByInvoice: async (invoice_id) => {
    const query = `
      SELECT 
        pc.*,
        CONCAT(c.first_name, ' ', c.last_name) as collected_by_name
      FROM payment_collections pc
      LEFT JOIN users c ON pc.collected_by = c.user_id
      WHERE pc.invoice_id = ?
      ORDER BY pc.payment_date DESC
    `;
    const [rows] = await db.query(query, [invoice_id]);
    return rows;
  },

  // Update payment
  update: async (id, data) => {
    const query = `
      UPDATE payment_collections 
      SET amount_paid = ?, payment_method = ?, payment_date = ?,
          bank_name = ?, check_number = ?, reference_number = ?,
          payment_status = ?, receipt_number = ?, notes = ?
      WHERE payment_id = ?
    `;
    const [result] = await db.query(
      query,
      [
        data.amount_paid,
        data.payment_method,
        data.payment_date,
        data.bank_name,
        data.check_number,
        data.reference_number,
        data.payment_status,
        data.receipt_number,
        data.notes,
        id,
      ]
    );
    return result;
  },

  // Verify payment
  verify: async (id, verified_by) => {
    const query = `
      UPDATE payment_collections 
      SET payment_status = 'Verified', verified_by = ?
      WHERE payment_id = ?
    `;
    const [result] = await db.query(query, [verified_by, id]);
    return result;
  },

  // Update payment status
  updateStatus: async (id, status) => {
    const query =
      "UPDATE payment_collections SET payment_status = ? WHERE payment_id = ?";
    const [result] = await db.query(query, [status, id]);
    return result;
  },

  // Delete payment
  delete: async (id) => {
    const query = "DELETE FROM payment_collections WHERE payment_id = ?";
    const [result] = await db.query(query, [id]);
    return result;
  },

  // Generate payment reference
  generatePaymentReference: async () => {
    const query = `
      SELECT payment_reference FROM payment_collections 
      ORDER BY payment_id DESC LIMIT 1
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  // Get payment summary
  getPaymentSummary: async (filters) => {
    let query = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount_paid) as total_collected,
        SUM(CASE WHEN payment_status = 'Verified' THEN amount_paid ELSE 0 END) as verified_amount,
        SUM(CASE WHEN payment_status = 'Pending' THEN amount_paid ELSE 0 END) as pending_amount,
        COUNT(DISTINCT student_id) as unique_payers
      FROM payment_collections
      WHERE 1=1
    `;
    const params = [];

    if (filters.start_date && filters.end_date) {
      query += " AND payment_date BETWEEN ? AND ?";
      params.push(filters.start_date, filters.end_date);
    }
    if (filters.payment_method) {
      query += " AND pc.payment_method = ?";
      params.push(filters.payment_method);
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get daily collection report
  getDailyCollection: async (date) => {
    const query = `
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(amount_paid) as total_amount
      FROM payment_collections
      WHERE DATE(payment_date) = ?
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `;
    const [rows] = await db.query(query, [date]);
    return rows;
  },
};

export default Payment;
