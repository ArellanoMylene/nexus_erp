import express from "express";
import StudentAttendanceController from "../controllers/studentAttendance.controller.js";

const router = express.Router();

// GET all student attendance records
router.get("/", StudentAttendanceController.getAllStudentAttendance);

// GET student attendance summary
router.get(
  "/summary/:student_id",
  StudentAttendanceController.getStudentAttendanceSummary
);

// POST bulk mark attendance
router.post("/bulk", StudentAttendanceController.bulkMarkAttendance);

// GET student attendance by ID
router.get("/:id", StudentAttendanceController.getStudentAttendanceById);

// POST create new student attendance record
router.post("/", StudentAttendanceController.createStudentAttendance);

// PUT update student attendance record
router.put("/:id", StudentAttendanceController.updateStudentAttendance);

// DELETE student attendance record
router.delete("/:id", StudentAttendanceController.deleteStudentAttendance);

export default router;
