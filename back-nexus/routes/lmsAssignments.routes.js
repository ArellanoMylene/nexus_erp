import express from "express";
import lmsAssignmentsController from "../controllers/lmsAssignments.controller.js";

const router = express.Router();

// Create new assignment
router.post("/", lmsAssignmentsController.create);

// Get assignments by faculty
router.get("/faculty", lmsAssignmentsController.getByFaculty);

// Get assignments for a student (filtered by enrolled courses)
router.get("/student", lmsAssignmentsController.getByStudent);

// Get assignments by section
router.get("/section", lmsAssignmentsController.getBySection);

// Get assignment by ID
router.get("/:id", lmsAssignmentsController.getById);

// Update assignment
router.put("/:id", lmsAssignmentsController.update);

// Delete assignment
router.delete("/:id", lmsAssignmentsController.delete);

// Upload assignment file
router.post("/upload", lmsAssignmentsController.uploadFile);

// Submit assignment
router.post("/submit", lmsAssignmentsController.submitAssignment);

// Get submissions for an assignment
router.get("/:assignment_id/submissions", lmsAssignmentsController.getSubmissions);

// Grade submission
router.put("/submissions/:submission_id/grade", lmsAssignmentsController.gradeSubmission);

// Get student submission
router.get("/student-submission", lmsAssignmentsController.getStudentSubmission);

// Create quiz question
router.post("/quiz-question", lmsAssignmentsController.createQuizQuestion);

// Get quiz questions
router.get("/:assignment_id/quiz-questions", lmsAssignmentsController.getQuizQuestions);

// Get quiz review (secure)
router.get("/:assignment_id/quiz-review", lmsAssignmentsController.getQuizReview);
// Parse quiz document (PDF/DOCX) into questions
router.post("/parse-quiz-document", lmsAssignmentsController.parseQuizDocument);
// AI-assisted check of a student submission
router.post("/submissions/:submission_id/ai-check", lmsAssignmentsController.aiCheckSubmission);

export default router;
