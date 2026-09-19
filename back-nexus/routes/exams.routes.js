import express from "express";
import ExamsController from "../controllers/exams.controller.js";

const router = express.Router();

// Get all exams (with optional filters)
router.get("/", ExamsController.getAllExams);

// Get exam by ID
router.get("/:id", ExamsController.getExamById);

// Create new exam
router.post("/", ExamsController.createExam);

// Update exam
router.put("/:id", ExamsController.updateExam);

// Delete exam
router.delete("/:id", ExamsController.deleteExam);

// Get exams by faculty
router.get("/faculty/:faculty_id", ExamsController.getExamsByFaculty);

export default router;
