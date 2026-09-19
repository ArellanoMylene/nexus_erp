import express from "express";
import {
  getAllEvaluations,
  getEvaluationById,
  getEvaluationsByFacultyId,
  getEvaluationsByAcademicPeriod,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getAverageRatings,
} from "../controllers/facultyEvaluation.controller.js";

const router = express.Router();

// Get all evaluations
router.get("/", getAllEvaluations);

// Get evaluation by ID
router.get("/:id", getEvaluationById);

// Get evaluations by faculty ID
router.get("/faculty/:facultyId", getEvaluationsByFacultyId);

// Get evaluations by academic period
router.get("/period/:periodId", getEvaluationsByAcademicPeriod);

// Get average ratings for faculty
router.get("/average/:facultyId", getAverageRatings);

// Create new evaluation
router.post("/", createEvaluation);

// Update evaluation
router.put("/:id", updateEvaluation);

// Delete evaluation
router.delete("/:id", deleteEvaluation);

export default router;
