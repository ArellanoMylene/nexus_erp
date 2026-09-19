import express from "express";
import UnifiedCalendarController from "../controllers/unifiedCalendar.controller.js";

const router = express.Router();

/**
 * GET /api/calendar/health
 * Health check endpoint for diagnostics
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Calendar service is running",
  });
});

/**
 * GET /api/calendar/unified
 * Get combined calendar data (exams, events, school calendar)
 * Query params:
 *   - student_id: Filter by specific student
 *   - section_id: Filter by section
 *   - date_from: Start date (YYYY-MM-DD)
 *   - date_to: End date (YYYY-MM-DD)
 *   - type: Filter by type (exam, event, calendar)
 */
router.get("/unified", UnifiedCalendarController.getUnifiedCalendar);

/**
 * GET /api/calendar/student/:student_id/exams
 * Get exams for specific student
 */
router.get(
  "/student/:student_id/exams",
  UnifiedCalendarController.getStudentExams,
);

/**
 * GET /api/calendar/student/exams
 * Get exams for authenticated student (from JWT)
 */
router.get("/student/exams", UnifiedCalendarController.getStudentExams);

/**
 * GET /api/calendar/student/events
 * Get events visible to students
 */
router.get("/student/events", UnifiedCalendarController.getStudentEvents);

export default router;
