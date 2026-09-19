import LibraryTransactionsService from "../services/libraryTransactions.service.js";

const LibraryTransactionsController = {
  getAllTransactions: async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        borrower_id: req.query.borrower_id,
        book_id: req.query.book_id,
        transaction_type: req.query.transaction_type,
        search: req.query.search,
      };

      const transactions = await LibraryTransactionsService.getAllTransactions(filters);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getTransactionById: async (req, res) => {
    try {
      const transaction = await LibraryTransactionsService.getTransactionById(req.params.id);
      res.status(200).json(transaction);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  createTransaction: async (req, res) => {
    try {
      const transaction = await LibraryTransactionsService.createTransaction(req.body);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  returnBook: async (req, res) => {
    try {
      const transaction = await LibraryTransactionsService.returnBook(
        req.params.id,
        req.body
      );
      res.status(200).json(transaction);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateTransaction: async (req, res) => {
    try {
      const transaction = await LibraryTransactionsService.updateTransaction(
        req.params.id,
        req.body
      );
      res.status(200).json(transaction);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteTransaction: async (req, res) => {
    try {
      const result = await LibraryTransactionsService.deleteTransaction(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getStatistics: async (req, res) => {
    try {
      const stats = await LibraryTransactionsService.getStatistics();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getOverdueTransactions: async (req, res) => {
    try {
      const overdueList = await LibraryTransactionsService.getOverdueTransactions();
      res.status(200).json(overdueList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default LibraryTransactionsController;
