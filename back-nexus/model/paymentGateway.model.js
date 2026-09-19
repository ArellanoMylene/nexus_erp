import db from "../config/db.js";

const PaymentGateway = {
  // Create gateway configuration
  createConfig: (data, callback) => {
    const query = `
      INSERT INTO payment_gateway_config 
      (gateway_name, gateway_type, is_active, is_test_mode, api_key, api_secret,
       merchant_id, webhook_url, public_key, private_key, transaction_fee_type,
       transaction_fee_value, supported_currencies, min_amount, max_amount,
       configuration_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [
        data.gateway_name,
        data.gateway_type,
        data.is_active || false,
        data.is_test_mode !== undefined ? data.is_test_mode : true,
        data.api_key,
        data.api_secret,
        data.merchant_id,
        data.webhook_url,
        data.public_key,
        data.private_key,
        data.transaction_fee_type || "Percentage",
        data.transaction_fee_value || 0,
        data.supported_currencies || "PHP",
        data.min_amount || 0,
        data.max_amount,
        data.configuration_json,
        data.created_by,
      ],
      callback
    );
  },

  // Get all gateway configurations
  getAllConfigs: (filters, callback) => {
    let query = `
      SELECT 
        pgc.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM payment_gateway_config pgc
      LEFT JOIN users u ON pgc.created_by = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.is_active !== undefined) {
      query += " AND pgc.is_active = ?";
      params.push(filters.is_active);
    }
    if (filters.gateway_type) {
      query += " AND pgc.gateway_type = ?";
      params.push(filters.gateway_type);
    }

    query += " ORDER BY pgc.is_active DESC, pgc.gateway_name ASC";
    db.query(query, params, callback);
  },

  // Get gateway config by ID
  getConfigById: (id, callback) => {
    const query = `
      SELECT 
        pgc.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM payment_gateway_config pgc
      LEFT JOIN users u ON pgc.created_by = u.user_id
      WHERE pgc.gateway_id = ?
    `;
    db.query(query, [id], callback);
  },

  // Get active gateways
  getActiveGateways: (callback) => {
    const query = `
      SELECT * FROM payment_gateway_config 
      WHERE is_active = TRUE
      ORDER BY gateway_name
    `;
    db.query(query, [], callback);
  },

  // Update gateway configuration
  updateConfig: (id, data, callback) => {
    const query = `
      UPDATE payment_gateway_config 
      SET gateway_name = ?, gateway_type = ?, is_active = ?, is_test_mode = ?,
          api_key = ?, api_secret = ?, merchant_id = ?, webhook_url = ?,
          public_key = ?, private_key = ?, transaction_fee_type = ?,
          transaction_fee_value = ?, supported_currencies = ?, min_amount = ?,
          max_amount = ?, configuration_json = ?
      WHERE gateway_id = ?
    `;
    db.query(
      query,
      [
        data.gateway_name,
        data.gateway_type,
        data.is_active,
        data.is_test_mode,
        data.api_key,
        data.api_secret,
        data.merchant_id,
        data.webhook_url,
        data.public_key,
        data.private_key,
        data.transaction_fee_type,
        data.transaction_fee_value,
        data.supported_currencies,
        data.min_amount,
        data.max_amount,
        data.configuration_json,
        id,
      ],
      callback
    );
  },

  // Toggle gateway active status
  toggleActive: (id, is_active, callback) => {
    const query =
      "UPDATE payment_gateway_config SET is_active = ? WHERE gateway_id = ?";
    db.query(query, [is_active, id], callback);
  },

  // Delete gateway configuration
  deleteConfig: (id, callback) => {
    const query = "DELETE FROM payment_gateway_config WHERE gateway_id = ?";
    db.query(query, [id], callback);
  },

  // Create gateway transaction
  createTransaction: (data, callback) => {
    const query = `
      INSERT INTO payment_gateway_transactions 
      (payment_id, gateway_id, external_transaction_id, transaction_reference,
       student_id, invoice_id, amount, currency, transaction_fee, net_amount,
       payment_status, gateway_response, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [
        data.payment_id,
        data.gateway_id,
        data.external_transaction_id,
        data.transaction_reference,
        data.student_id,
        data.invoice_id,
        data.amount,
        data.currency || "PHP",
        data.transaction_fee || 0,
        data.net_amount,
        data.payment_status || "Initiated",
        data.gateway_response,
        data.ip_address,
        data.user_agent,
      ],
      callback
    );
  },

  // Get all gateway transactions
  getAllTransactions: (filters, callback) => {
    let query = `
      SELECT 
        pgt.*,
        pgc.gateway_name,
        pgc.gateway_type,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        sd.student_number,
        si.invoice_number
      FROM payment_gateway_transactions pgt
      INNER JOIN payment_gateway_config pgc ON pgt.gateway_id = pgc.gateway_id
      INNER JOIN users s ON pgt.student_id = s.user_id
      LEFT JOIN student_details sd ON s.user_id = sd.user_id
      LEFT JOIN student_invoices si ON pgt.invoice_id = si.invoice_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.gateway_id) {
      query += " AND pgt.gateway_id = ?";
      params.push(filters.gateway_id);
    }
    if (filters.student_id) {
      query += " AND pgt.student_id = ?";
      params.push(filters.student_id);
    }
    if (filters.payment_status) {
      query += " AND pgt.payment_status = ?";
      params.push(filters.payment_status);
    }
    if (filters.start_date && filters.end_date) {
      query += " AND DATE(pgt.initiated_at) BETWEEN ? AND ?";
      params.push(filters.start_date, filters.end_date);
    }
    if (filters.search) {
      query += ` AND (pgt.transaction_reference LIKE ? OR 
                      pgt.external_transaction_id LIKE ? OR
                      CONCAT(s.first_name, ' ', s.last_name) LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY pgt.initiated_at DESC";

    if (filters.limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
    }

    db.query(query, params, callback);
  },

  // Get transaction by ID
  getTransactionById: (id, callback) => {
    const query = `
      SELECT 
        pgt.*,
        pgc.gateway_name,
        pgc.gateway_type,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.email as student_email,
        sd.student_number,
        si.invoice_number,
        si.total_amount as invoice_total
      FROM payment_gateway_transactions pgt
      INNER JOIN payment_gateway_config pgc ON pgt.gateway_id = pgc.gateway_id
      INNER JOIN users s ON pgt.student_id = s.user_id
      LEFT JOIN student_details sd ON s.user_id = sd.user_id
      LEFT JOIN student_invoices si ON pgt.invoice_id = si.invoice_id
      WHERE pgt.gateway_transaction_id = ?
    `;
    db.query(query, [id], callback);
  },

  // Get transaction by reference
  getTransactionByReference: (reference, callback) => {
    const query = `
      SELECT * FROM payment_gateway_transactions 
      WHERE transaction_reference = ?
    `;
    db.query(query, [reference], callback);
  },

  // Update transaction status
  updateTransactionStatus: (
    id,
    status,
    gateway_response,
    error_message,
    callback
  ) => {
    const query = `
      UPDATE payment_gateway_transactions 
      SET payment_status = ?, gateway_response = ?, error_message = ?,
          completed_at = CASE WHEN ? IN ('Success', 'Failed', 'Cancelled') 
                         THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE gateway_transaction_id = ?
    `;
    db.query(
      query,
      [status, gateway_response, error_message, status, id],
      callback
    );
  },

  // Link transaction to payment
  linkToPayment: (gateway_transaction_id, payment_id, callback) => {
    const query = `
      UPDATE payment_gateway_transactions 
      SET payment_id = ?
      WHERE gateway_transaction_id = ?
    `;
    db.query(query, [payment_id, gateway_transaction_id], callback);
  },

  // Delete transaction
  deleteTransaction: (id, callback) => {
    const query =
      "DELETE FROM payment_gateway_transactions WHERE gateway_transaction_id = ?";
    db.query(query, [id], callback);
  },

  // Get gateway transaction summary
  getTransactionSummary: (filters, callback) => {
    let query = `
      SELECT 
        pgc.gateway_name,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN pgt.payment_status = 'Success' THEN 1 ELSE 0 END) as successful_count,
        SUM(CASE WHEN pgt.payment_status = 'Failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN pgt.payment_status = 'Success' THEN pgt.amount ELSE 0 END) as total_amount,
        SUM(CASE WHEN pgt.payment_status = 'Success' THEN pgt.transaction_fee ELSE 0 END) as total_fees
      FROM payment_gateway_transactions pgt
      INNER JOIN payment_gateway_config pgc ON pgt.gateway_id = pgc.gateway_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.start_date && filters.end_date) {
      query += " AND DATE(pgt.initiated_at) BETWEEN ? AND ?";
      params.push(filters.start_date, filters.end_date);
    }
    if (filters.gateway_id) {
      query += " AND pgt.gateway_id = ?";
      params.push(filters.gateway_id);
    }

    query += " GROUP BY pgc.gateway_id, pgc.gateway_name";
    db.query(query, params, callback);
  },

  // Generate transaction reference
  generateTransactionReference: (callback) => {
    const query = `
      SELECT transaction_reference FROM payment_gateway_transactions 
      ORDER BY gateway_transaction_id DESC LIMIT 1
    `;
    db.query(query, [], callback);
  },
};

export default PaymentGateway;
