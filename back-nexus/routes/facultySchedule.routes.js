import express from "express";
import {
  getAllSchedules,
  getScheduleById,
  getSchedulesByFacultyId,
  getSchedulesByAcademicPeriod,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getWeeklySchedule,
} from "../controllers/facultySchedule.controller.js";

const router = express.Router();

// Get all schedules
router.get("/", getAllSchedules);

// Get schedule by ID
router.get("/:id", getScheduleById);

// Get schedules by faculty ID
router.get("/faculty/:facultyId", getSchedulesByFacultyId);

// Get schedules by academic period
router.get("/period/:periodId", getSchedulesByAcademicPeriod);

// Get weekly schedule for faculty
router.get("/weekly/:facultyId/:periodId", getWeeklySchedule);

// Create new schedule
router.post("/", createSchedule);

// Update schedule
router.put("/:id", updateSchedule);

// Delete schedule
router.delete("/:id", deleteSchedule);

export default router;
