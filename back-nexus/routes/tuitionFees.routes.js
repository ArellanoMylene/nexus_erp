import express from "express";
import tuitionFeeController from "../controllers/tuitionFees.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create tuition fee setup
router.post("/", tuitionFeeController.createTuitionFee);

// Get all tuition fees with filters
router.get("/", tuitionFeeController.getAllTuitionFees);

// Get fee for specific criteria
router.get("/details", tuitionFeeController.getFeeByDetails);

// Get fee schedule for current student
router.get("/student-schedule", tuitionFeeController.getStudentSchedule);

// Generate invoices for all matching enrolled students (accounting use)
router.post(
  "/:id/generate-invoices",
  tuitionFeeController.generateInvoicesForSetup,
);

// Get tuition fee by ID
router.get("/:id", tuitionFeeController.getTuitionFeeById);

// Update tuition fee
router.put("/:id", tuitionFeeController.updateTuitionFee);

// Delete tuition fee
router.delete("/:id", tuitionFeeController.deleteTuitionFee);

export default router;
