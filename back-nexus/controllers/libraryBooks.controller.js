import LibraryBooksService from "../services/libraryBooks.service.js";

const LibraryBooksController = {
  getAllBooks: async (req, res) => {
    try {
      const filters = {
        category: req.query.category,
        status: req.query.status,
        borrowable: req.query.borrowable,
        search: req.query.search,
      };

      const books = await LibraryBooksService.getAllBooks(filters);
      res.status(200).json(books);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getBookById: async (req, res) => {
    try {
      const book = await LibraryBooksService.getBookById(req.params.id);
      res.status(200).json(book);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  createBook: async (req, res) => {
    try {
      const book = await LibraryBooksService.createBook(req.body);
      res.status(201).json(book);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateBook: async (req, res) => {
    try {
      const book = await LibraryBooksService.updateBook(
        req.params.id,
        req.body
      );
      res.status(200).json(book);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteBook: async (req, res) => {
    try {
      const result = await LibraryBooksService.deleteBook(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getStatistics: async (req, res) => {
    try {
      const stats = await LibraryBooksService.getStatistics();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getCategories: async (req, res) => {
    try {
      const categories = await LibraryBooksService.getCategories();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default LibraryBooksController;
