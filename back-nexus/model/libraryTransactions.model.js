import pool from "../config/db.js";

const LibraryTransactionsModel = {
  // Get all transactions with filters
  getAllTransactions: async (filters = {}) => {
    try {
      let query = `
        SELECT 
          lt.*,
          lb.title as book_title,
          lb.author as book_author,
          lb.isbn,
          CONCAT(u.first_name, ' ', u.last_name) as borrower_name,
          u.email as borrower_email,
          u.role as borrower_role,
          CONCAT(issued.first_name, ' ', issued.last_name) as issued_by_name,
          CONCAT(returned.first_name, ' ', returned.last_name) as returned_to_name,
          DATEDIFF(CURDATE(), lt.due_date) as days_overdue
        FROM library_transactions lt
        LEFT JOIN library_books lb ON lt.book_id = lb.book_id
        LEFT JOIN users u ON lt.borrower_id = u.user_id
        LEFT JOIN users issued ON lt.issued_by = issued.user_id
        LEFT JOIN users returned ON lt.returned_to = returned.user_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.status) {
        query += " AND lt.status = ?";
        params.push(filters.status);
      }

      if (filters.borrower_id) {
        query += " AND lt.borrower_id = ?";
        params.push(filters.borrower_id);
      }

      if (filters.book_id) {
        query += " AND lt.book_id = ?";
        params.push(filters.book_id);
      }

      if (filters.transaction_type) {
        query += " AND lt.transaction_type = ?";
        params.push(filters.transaction_type);
      }

      if (filters.search) {
        query += " AND (lb.title LIKE ? OR lb.author LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      query += " ORDER BY lt.created_at DESC";

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get transaction by ID
  getTransactionById: async (id) => {
    try {
      const query = `
        SELECT 
          lt.*,
          lb.title as book_title,
          lb.author as book_author,
          lb.isbn,
          CONCAT(u.first_name, ' ', u.last_name) as borrower_name,
          u.email as borrower_email,
          u.role as borrower_role,
          CONCAT(issued.first_name, ' ', issued.last_name) as issued_by_name,
          CONCAT(returned.first_name, ' ', returned.last_name) as returned_to_name
        FROM library_transactions lt
        LEFT JOIN library_books lb ON lt.book_id = lb.book_id
        LEFT JOIN users u ON lt.borrower_id = u.user_id
        LEFT JOIN users issued ON lt.issued_by = issued.user_id
        LEFT JOIN users returned ON lt.returned_to = returned.user_id
        WHERE lt.transaction_id = ?
      `;
      const [rows] = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Create new transaction (borrow)
  createTransaction: async (transactionData) => {
    try {
      const query = `
        INSERT INTO library_transactions (
          book_id, borrower_id, transaction_type, borrow_date,
          due_date, status, condition_out, issued_by, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        transactionData.book_id,
        transactionData.borrower_id,
        transactionData.transaction_type || 'Borrow',
        transactionData.borrow_date,
        transactionData.due_date,
        transactionData.status || 'Active',
        transactionData.condition_out || 'Good',
        transactionData.issued_by || null,
        transactionData.remarks || null,
      ];

      const [result] = await pool.query(query, values);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Update transaction (return, renew, etc.)
  updateTransaction: async (id, transactionData) => {
    try {
      const fields = [];
      const values = [];

      const allowedFields = [
        'return_date', 'renewed_count', 'status', 'overdue_days',
        'penalty_amount', 'penalty_paid', 'condition_in', 'returned_to', 'remarks'
      ];

      allowedFields.forEach(field => {
        if (transactionData[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(transactionData[field]);
        }
      });

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(id);
      const query = `UPDATE library_transactions SET ${fields.join(', ')} WHERE transaction_id = ?`;
      
      const [result] = await pool.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Delete transaction
  deleteTransaction: async (id) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM library_transactions WHERE transaction_id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Get transaction statistics
  getStatistics: async () => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_borrows,
          SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_count,
          SUM(CASE WHEN status = 'Returned' THEN 1 ELSE 0 END) as returned_count,
          SUM(penalty_amount) as total_penalties,
          SUM(CASE WHEN penalty_paid = TRUE THEN penalty_amount ELSE 0 END) as penalties_paid
        FROM library_transactions
      `;
      const [rows] = await pool.query(query);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get overdue transactions
  getOverdueTransactions: async () => {
    try {
      const query = `
        SELECT 
          lt.*,
          lb.title as book_title,
          CONCAT(u.first_name, ' ', u.last_name) as borrower_name,
          u.email as borrower_email,
          DATEDIFF(CURDATE(), lt.due_date) as days_overdue
        FROM library_transactions lt
        LEFT JOIN library_books lb ON lt.book_id = lb.book_id
        LEFT JOIN users u ON lt.borrower_id = u.user_id
        WHERE lt.status = 'Active' AND lt.due_date < CURDATE()
        ORDER BY lt.due_date ASC
      `;
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  },
};

export default LibraryTransactionsModel;
