import express from "express";
import LibraryTransactionsController from "../controllers/libraryTransactions.controller.js";

const router = express.Router();

// GET all transactions with optional filters
router.get("/", LibraryTransactionsController.getAllTransactions);

// GET transaction statistics
router.get("/statistics", LibraryTransactionsController.getStatistics);

// GET overdue transactions
router.get("/overdue", LibraryTransactionsController.getOverdueTransactions);

// GET transaction by ID
router.get("/:id", LibraryTransactionsController.getTransactionById);

// POST create new transaction (borrow)
router.post("/", LibraryTransactionsController.createTransaction);

// PUT return book
router.put("/:id/return", LibraryTransactionsController.returnBook);

// PUT update transaction
router.put("/:id", LibraryTransactionsController.updateTransaction);

// DELETE transaction
router.delete("/:id", LibraryTransactionsController.deleteTransaction);

export default router;
