import express from "express";
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeSummary,
  getEmployeeByUserId,
} from "../controllers/employeeRecords.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// Employee routes - SPECIFIC routes BEFORE generic ones
router.get("/summary", getEmployeeSummary);
router.get("/by-user/:userId", getEmployeeByUserId);
router.get("/", getAllEmployees);
router.get("/:id", getEmployeeById);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
