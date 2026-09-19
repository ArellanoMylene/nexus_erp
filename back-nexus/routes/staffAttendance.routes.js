import express from "express";
import StaffAttendanceController from "../controllers/staffAttendance.controller.js";

const router = express.Router();

// GET all staff attendance records
router.get("/", StaffAttendanceController.getAllStaffAttendance);

// GET staff attendance summary
router.get(
  "/summary/:user_id",
  StaffAttendanceController.getStaffAttendanceSummary
);

// GET staff attendance by ID
router.get("/:id", StaffAttendanceController.getStaffAttendanceById);

// POST create new staff attendance record
router.post("/", StaffAttendanceController.createStaffAttendance);

// PUT update staff attendance record
router.put("/:id", StaffAttendanceController.updateStaffAttendance);

// DELETE staff attendance record
router.delete("/:id", StaffAttendanceController.deleteStaffAttendance);

export default router;
