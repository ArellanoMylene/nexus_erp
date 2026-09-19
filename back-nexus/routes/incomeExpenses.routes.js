import express from "express";
import incomeExpenseController from "../controllers/incomeExpenses.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create transaction
router.post("/", incomeExpenseController.createTransaction);

// Get all transactions
router.get("/", incomeExpenseController.getAllTransactions);

// Get financial summary
router.get("/summary", incomeExpenseController.getFinancialSummary);

// Get category breakdown
router.get(
  "/category-breakdown/:transaction_type",
  incomeExpenseController.getCategoryBreakdown
);

// Get monthly trend
router.get("/monthly-trend", incomeExpenseController.getMonthlyTrend);

// Get department expenses
router.get(
  "/department-expenses",
  incomeExpenseController.getDepartmentExpenses
);

// Get transaction by ID
router.get("/:id", incomeExpenseController.getTransactionById);

// Update transaction
router.put("/:id", incomeExpenseController.updateTransaction);

// Approve transaction
router.patch("/:id/approve", incomeExpenseController.approveTransaction);

// Process transaction (mark as paid)
router.patch("/:id/process", incomeExpenseController.processTransaction);

// Delete transaction
router.delete("/:id", incomeExpenseController.deleteTransaction);

export default router;
