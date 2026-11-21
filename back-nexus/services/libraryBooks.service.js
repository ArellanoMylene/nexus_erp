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
      if (!bookData.title?.trim() || !bookData.author?.trim() || !bookData.category?.trim()) {
        throw new Error("Title, author, and category are required");
      }

      const normalizedData = {
        ...bookData,
        title: bookData.title.trim(),
        author: bookData.author.trim(),
        category: bookData.category.trim(),
      };
      for (const field of ["publication_year", "pages", "price"]) {
        const value = normalizedData[field];
        normalizedData[field] = value === "" || value === null || value === undefined
          ? null
          : Number(value);
        if (normalizedData[field] !== null && !Number.isFinite(normalizedData[field])) {
          throw new Error(`${field.replaceAll("_", " ")} must be a valid number`);
        }
      }
      if (normalizedData.date_acquired === "") normalizedData.date_acquired = null;
      for (const field of ["isbn", "publisher", "edition", "subcategory", "shelf_location", "dewey_decimal", "call_number", "description", "cover_image_url"]) {
        if (normalizedData[field] === "") normalizedData[field] = null;
      }

      const updated = await LibraryBooksModel.updateBook(id, normalizedData);
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
