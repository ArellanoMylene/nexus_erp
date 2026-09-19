import express from "express";
import scholarshipController from "../controllers/scholarships.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ========== SCHOLARSHIP PROGRAMS ==========

// Create scholarship program
router.post("/programs", scholarshipController.createProgram);

// Get all scholarship programs
router.get("/programs", scholarshipController.getAllPrograms);

// Get scholarship program by ID
router.get("/programs/:id", scholarshipController.getProgramById);

// Update scholarship program
router.put("/programs/:id", scholarshipController.updateProgram);

// Delete scholarship program
router.delete("/programs/:id", scholarshipController.deleteProgram);

// ========== SCHOLARSHIP ALLOCATIONS ==========

// Create scholarship allocation
router.post("/allocations", scholarshipController.createAllocation);

// Get all allocations
router.get("/allocations", scholarshipController.getAllAllocations);

// Get scholarship summary
router.get("/summary", scholarshipController.getScholarshipSummary);

// Get allocation by ID
router.get("/allocations/:id", scholarshipController.getAllocationById);

// Get student scholarships
router.get(
  "/student/:student_id",
  scholarshipController.getStudentScholarships
);

// Update scholarship allocation
router.put("/allocations/:id", scholarshipController.updateAllocation);

// Approve scholarship allocation
router.patch(
  "/allocations/:id/approve",
  scholarshipController.approveAllocation
);

// Delete scholarship allocation
router.delete("/allocations/:id", scholarshipController.deleteAllocation);

export default router;
