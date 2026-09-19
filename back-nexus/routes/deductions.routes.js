import express from "express";
import {
  getAllDeductions,
  getDeductionById,
  getDeductionsByEmployee,
  createDeduction,
  updateDeduction,
  updateDeductionBalance,
  deleteDeduction,
  getDeductionSummary,
} from "../controllers/deductions.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// Deduction routes
router.get("/", getAllDeductions);
router.get("/summary", getDeductionSummary);
router.get("/employee/:employeeId", getDeductionsByEmployee);
router.get("/:id", getDeductionById);
router.post("/", createDeduction);
router.put("/:id", updateDeduction);
router.patch("/:id/balance", updateDeductionBalance);
router.delete("/:id", deleteDeduction);

export default router;
