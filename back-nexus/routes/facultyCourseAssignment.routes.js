import express from "express";
import {
  getAllAssignments,
  getAssignmentById,
  getAssignmentsByFacultyId,
  getAssignmentsByAcademicPeriod,
  createAssignment,
  updateAssignment,
  deleteAssignment,

} from "../controllers/facultyCourseAssignment.controller.js";

const router = express.Router();

// Get all course assignments
router.get("/", getAllAssignments);

// Get assignment by ID
router.get("/:id", getAssignmentById);

// Get assignments by faculty ID
router.get("/faculty/:facultyId", getAssignmentsByFacultyId);

// Get assignments by academic period
router.get("/period/:periodId", getAssignmentsByAcademicPeriod);

// Create new assignment
router.post("/", createAssignment);

// Update assignment
router.put("/:id", updateAssignment);

// Delete assignment
router.delete("/:id", deleteAssignment);

export default router;
