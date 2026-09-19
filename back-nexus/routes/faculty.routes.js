import express from "express";
import {
  getAllFaculty,
  getFacultyById,
  getFacultyByDepartment,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getFacultyStats,
} from "../controllers/faculty.controller.js";

const router = express.Router();

// Get all faculty members
router.get("/", getAllFaculty);

// Get faculty statistics
router.get("/stats", getFacultyStats);

// Get faculty by ID
router.get("/:id", getFacultyById);

// Get faculty by department
router.get("/department/:department", getFacultyByDepartment);

// Create new faculty member
router.post("/", createFaculty);

// Update faculty member
router.put("/:id", updateFaculty);

// Delete faculty member
router.delete("/:id", deleteFaculty);

export default router;
