import express from "express";
import GradesController from "../controllers/grades.controller.js";

const router = express.Router();

// GET all grades (live-computed from grade_entries)
router.get("/", GradesController.getAllGrades);

// GET one grade by composite id "{student_id}-{course_id}-{period_id}"
router.get("/:id", GradesController.getGradeById);

// POST bulk-approve all grade_entries for this student/course/period
router.post("/:id/approve", GradesController.approveGrade);

export default router;