import pool from "../config/db.js";

const LibraryBooksModel = {
  // Get all books with filters
  getAllBooks: async (filters = {}) => {
    try {
      let query = `
        SELECT 
          lb.*,
          CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
          CASE
            WHEN lb.quantity_available = 0 THEN 'Unavailable'
            WHEN lb.quantity_available <= 3 THEN 'Limited'
            ELSE 'Available'
          END as computed_status
        FROM library_books lb
        LEFT JOIN users u ON lb.created_by = u.user_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.category) {
        query += " AND lb.category = ?";
        params.push(filters.category);
      }

      if (filters.status) {
        query += " AND lb.status = ?";
        params.push(filters.status);
      }

      if (filters.search) {
        query += " AND (lb.title LIKE ? OR lb.author LIKE ? OR lb.isbn LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.borrowable !== undefined) {
        query += " AND lb.borrowable = ?";
        params.push(filters.borrowable);
      }

      query += " ORDER BY lb.created_at DESC";

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get book by ID
  getBookById: async (id) => {
    try {
      const query = `
        SELECT 
          lb.*,
          CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
          CASE
            WHEN lb.quantity_available = 0 THEN 'Unavailable'
            WHEN lb.quantity_available <= 3 THEN 'Limited'
            ELSE 'Available'
          END as computed_status
        FROM library_books lb
        LEFT JOIN users u ON lb.created_by = u.user_id
        WHERE lb.book_id = ?
      `;
      const [rows] = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Create new book
  createBook: async (bookData) => {
    try {
      const query = `
        INSERT INTO library_books (
          isbn, title, author, publisher, publication_year, edition,
          category, subcategory, language, pages, quantity_total,
          quantity_available, shelf_location, dewey_decimal, call_number,
          description, cover_image_url, price, date_acquired, status,
          is_reference, borrowable, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        bookData.isbn || null,
        bookData.title,
        bookData.author,
        bookData.publisher || null,
        bookData.publication_year || null,
        bookData.edition || null,
        bookData.category,
        bookData.subcategory || null,
        bookData.language || 'English',
        bookData.pages || null,
        bookData.quantity_total || 1,
        bookData.quantity_available || bookData.quantity_total || 1,
        bookData.shelf_location || null,
        bookData.dewey_decimal || null,
        bookData.call_number || null,
        bookData.description || null,
        bookData.cover_image_url || null,
        bookData.price || null,
        bookData.date_acquired || null,
        bookData.status || 'Available',
        bookData.is_reference || false,
        bookData.borrowable !== undefined ? bookData.borrowable : true,
        bookData.created_by || null,
      ];

      const [result] = await pool.query(query, values);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Update book
  updateBook: async (id, bookData) => {
    try {
      const fields = [];
      const values = [];

      const allowedFields = [
        'isbn', 'title', 'author', 'publisher', 'publication_year', 'edition',
        'category', 'subcategory', 'language', 'pages', 'quantity_total',
        'quantity_available', 'quantity_borrowed', 'quantity_reserved',
        'quantity_lost', 'quantity_damaged', 'shelf_location', 'dewey_decimal',
        'call_number', 'description', 'cover_image_url', 'price', 'date_acquired',
        'status', 'is_reference', 'borrowable'
      ];

      allowedFields.forEach(field => {
        if (bookData[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(bookData[field]);
        }
      });

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(id);
      const query = `UPDATE library_books SET ${fields.join(', ')} WHERE book_id = ?`;
      
      const [result] = await pool.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Delete book
  deleteBook: async (id) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM library_books WHERE book_id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Get book statistics
  getBookStatistics: async () => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_books,
          SUM(quantity_total) as total_copies,
          SUM(quantity_available) as available_copies,
          SUM(quantity_borrowed) as borrowed_copies,
          SUM(quantity_lost) as lost_copies,
          SUM(quantity_damaged) as damaged_copies,
          COUNT(DISTINCT category) as total_categories
        FROM library_books
      `;
      const [rows] = await pool.query(query);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get all categories
  getCategories: async () => {
    try {
      const query = `
        SELECT DISTINCT category, COUNT(*) as book_count
        FROM library_books
        GROUP BY category
        ORDER BY category
      `;
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Update book availability
  updateAvailability: async (bookId, quantity) => {
    try {
      const query = `
        UPDATE library_books 
        SET quantity_available = ?
        WHERE book_id = ?
      `;
      const [result] = await pool.query(query, [quantity, bookId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },
};

export default LibraryBooksModel;
