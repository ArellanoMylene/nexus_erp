import LibraryBooksModel from "../model/libraryBooks.model.js";

const LibraryBooksService = {
  getAllBooks: async (filters) => {
    try {
      return await LibraryBooksModel.getAllBooks(filters);
    } catch (error) {
      throw new Error(`Error fetching library books: ${error.message}`);
    }
  },

  getBookById: async (id) => {
    try {
      const book = await LibraryBooksModel.getBookById(id);
      if (!book) {
        throw new Error("Book not found");
      }
      return book;
    } catch (error) {
      throw new Error(`Error fetching book: ${error.message}`);
    }
  },

  createBook: async (bookData) => {
    try {
      // Validate required fields
      if (!bookData.title || !bookData.author || !bookData.category) {
        throw new Error(
          "Missing required fields: title, author, and category are required",
        );
      }

      // Validate ISBN format if provided
      if (bookData.isbn) {
        const isbnPattern = /^(?:\d{10}|\d{13})$/;
        if (!isbnPattern.test(bookData.isbn.replace(/-/g, ""))) {
          throw new Error("Invalid ISBN format");
        }
      }

      const bookId = await LibraryBooksModel.createBook(bookData);
      return await LibraryBooksModel.getBookById(bookId);
    } catch (error) {
      throw new Error(`Error creating book: ${error.message}`);
    }
  },

  updateBook: async (id, bookData) => {
    try {
      const updated = await LibraryBooksModel.updateBook(id, bookData);
      if (!updated) {
        throw new Error("Book not found or not updated");
      }
      return await LibraryBooksModel.getBookById(id);
    } catch (error) {
      throw new Error(`Error updating book: ${error.message}`);
    }
  },

  deleteBook: async (id) => {
    try {
      const deleted = await LibraryBooksModel.deleteBook(id);
      if (!deleted) {
        throw new Error("Book not found or already deleted");
      }
      return { message: "Book deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting book: ${error.message}`);
    }
  },

  getStatistics: async () => {
    try {
      return await LibraryBooksModel.getBookStatistics();
    } catch (error) {
      throw new Error(`Error fetching statistics: ${error.message}`);
    }
  },

  getCategories: async () => {
    try {
      return await LibraryBooksModel.getCategories();
    } catch (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }
  },
};

export default LibraryBooksService;
