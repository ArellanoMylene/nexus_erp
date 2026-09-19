import express from "express";
import {
  getStudentReports,
  getEnrollmentReports,
  getEnrollmentTrends,
  getEnrollmentByProgram,
  getAttendanceReports,
  getPayrollReports,
  getSummaryStatistics,
  exportReport,
} from "../controllers/reports.controller.js";

const router = express.Router();

// Get summary statistics
router.get("/statistics", getSummaryStatistics);

// Student reports
router.get("/students", getStudentReports);

// Enrollment reports
router.get("/enrollments", getEnrollmentReports);

// Enrollment trends and forecast
router.get("/enrollment-trends", getEnrollmentTrends);

// Enrollment by program
router.get("/enrollment-by-program", getEnrollmentByProgram);

// Attendance reports
router.get("/attendance", getAttendanceReports);

// Payroll reports
router.get("/payroll", getPayrollReports);

// Export reports
router.get("/export/:type", exportReport);

export default router;
