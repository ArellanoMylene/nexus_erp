import LibraryTransactionsModel from "../model/libraryTransactions.model.js";
import LibraryBooksModel from "../model/libraryBooks.model.js";

const LibraryTransactionsService = {
  getAllTransactions: async (filters) => {
    try {
      return await LibraryTransactionsModel.getAllTransactions(filters);
    } catch (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }
  },

  getTransactionById: async (id) => {
    try {
      const transaction = await LibraryTransactionsModel.getTransactionById(id);
      if (!transaction) {
        throw new Error("Transaction not found");
      }
      return transaction;
    } catch (error) {
      throw new Error(`Error fetching transaction: ${error.message}`);
    }
  },

  createTransaction: async (transactionData) => {
    try {
      // Validate required fields
      if (!transactionData.book_id || !transactionData.borrower_id || !transactionData.borrow_date || !transactionData.due_date) {
        throw new Error("Missing required fields");
      }

      // Check if book is available
      const book = await LibraryBooksModel.getBookById(transactionData.book_id);
      if (!book) {
        throw new Error("Book not found");
      }

      if (book.quantity_available <= 0) {
        throw new Error("Book is not available for borrowing");
      }

      if (!book.borrowable) {
        throw new Error("This book cannot be borrowed");
      }

      // Create transaction
      const transactionId = await LibraryTransactionsModel.createTransaction(transactionData);

      // Update book availability
      await LibraryBooksModel.updateAvailability(
        transactionData.book_id,
        book.quantity_available - 1
      );

      return await LibraryTransactionsModel.getTransactionById(transactionId);
    } catch (error) {
      throw new Error(`Error creating transaction: ${error.message}`);
    }
  },

  returnBook: async (id, returnData) => {
    try {
      const transaction = await LibraryTransactionsModel.getTransactionById(id);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.status === 'Returned') {
        throw new Error("Book already returned");
      }

      // Calculate overdue penalty
      const returnDate = new Date(returnData.return_date || new Date());
      const dueDate = new Date(transaction.due_date);
      const overdueDays = Math.max(0, Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24)));
      const penaltyAmount = overdueDays * 5; // 5 per day penalty

      const updateData = {
        return_date: returnData.return_date || new Date().toISOString().split('T')[0],
        status: 'Returned',
        overdue_days: overdueDays,
        penalty_amount: penaltyAmount,
        condition_in: returnData.condition_in || 'Good',
        returned_to: returnData.returned_to || null,
        remarks: returnData.remarks || null,
      };

      await LibraryTransactionsModel.updateTransaction(id, updateData);

      // Update book availability
      const book = await LibraryBooksModel.getBookById(transaction.book_id);
      await LibraryBooksModel.updateAvailability(
        transaction.book_id,
        book.quantity_available + 1
      );

      return await LibraryTransactionsModel.getTransactionById(id);
    } catch (error) {
      throw new Error(`Error returning book: ${error.message}`);
    }
  },

  updateTransaction: async (id, transactionData) => {
    try {
      const updated = await LibraryTransactionsModel.updateTransaction(id, transactionData);
      if (!updated) {
        throw new Error("Transaction not found or not updated");
      }
      return await LibraryTransactionsModel.getTransactionById(id);
    } catch (error) {
      throw new Error(`Error updating transaction: ${error.message}`);
    }
  },

  deleteTransaction: async (id) => {
    try {
      const deleted = await LibraryTransactionsModel.deleteTransaction(id);
      if (!deleted) {
        throw new Error("Transaction not found or already deleted");
      }
      return { message: "Transaction deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting transaction: ${error.message}`);
    }
  },

  getStatistics: async () => {
    try {
      return await LibraryTransactionsModel.getStatistics();
    } catch (error) {
      throw new Error(`Error fetching statistics: ${error.message}`);
    }
  },

  getOverdueTransactions: async () => {
    try {
      return await LibraryTransactionsModel.getOverdueTransactions();
    } catch (error) {
      throw new Error(`Error fetching overdue transactions: ${error.message}`);
    }
  },
};

export default LibraryTransactionsService;
