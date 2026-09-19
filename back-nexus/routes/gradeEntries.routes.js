import express from "express";
import GradeEntriesController from "../controllers/gradeEntries.controller.js";

const router = express.Router();

// Get all grade entries (with optional filters)
router.get("/", GradeEntriesController.getAllEntries);

// Get grade entry by ID
router.get("/:id", GradeEntriesController.getEntryById);

// Create new grade entry
router.post("/", GradeEntriesController.createEntry);

// Update grade entry
router.put("/:id", GradeEntriesController.updateEntry);

// Delete grade entry
router.delete("/:id", GradeEntriesController.deleteEntry);

// Approve grade entry
router.patch("/:id/approve", GradeEntriesController.approveEntry);

// Reject grade entry
router.patch("/:id/reject", GradeEntriesController.rejectEntry);

// Get pending approvals count
router.get("/pending/count", GradeEntriesController.getPendingCount);

// Sync graded submissions from LMS to grade_entries
router.post("/sync/submissions", GradeEntriesController.syncFromSubmissions);

export default router;
