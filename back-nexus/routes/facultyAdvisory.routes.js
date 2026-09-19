import express from "express";
import {
  getAllAdvisories,
  getAdvisoryById,
  getAdvisoriesByFacultyId,
  getAdvisoryByStudentId,
  createAdvisory,
  updateAdvisory,
  deleteAdvisory,
  getAdvisoryLoad,
  getStudentsWithoutAdvisors,
} from "../controllers/facultyAdvisory.controller.js";

const router = express.Router();

// Get all advisory assignments
router.get("/", getAllAdvisories);

// Get advisory by ID
router.get("/:id", getAdvisoryById);

// Get advisories by faculty ID
router.get("/faculty/:facultyId", getAdvisoriesByFacultyId);

// Get advisory by student ID
router.get("/student/:studentId", getAdvisoryByStudentId);

// Get advisory load for faculty
router.get("/load/:facultyId/:periodId", getAdvisoryLoad);

// Get students without advisors
router.get("/unassigned/:periodId", getStudentsWithoutAdvisors);

// Create new advisory assignment
router.post("/", createAdvisory);

// Update advisory assignment
router.put("/:id", updateAdvisory);

// Delete advisory assignment
router.delete("/:id", deleteAdvisory);

export default router;
