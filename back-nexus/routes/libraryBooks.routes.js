import express from "express";
import LibraryBooksController from "../controllers/libraryBooks.controller.js";

const router = express.Router();

// GET all books with optional filters
router.get("/", LibraryBooksController.getAllBooks);

// GET book statistics
router.get("/statistics", LibraryBooksController.getStatistics);

// GET all categories
router.get("/categories", LibraryBooksController.getCategories);

// GET book by ID
router.get("/:id", LibraryBooksController.getBookById);

// POST create new book
router.post("/", LibraryBooksController.createBook);

// PUT update book
router.put("/:id", LibraryBooksController.updateBook);

// DELETE book
router.delete("/:id", LibraryBooksController.deleteBook);

export default router;
