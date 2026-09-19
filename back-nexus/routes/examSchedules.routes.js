import express from "express";
import ExamSchedulesController from "../controllers/examSchedules.controller.js";

const router = express.Router();

// Get all exam schedules (with optional filters)
router.get("/", ExamSchedulesController.getAllSchedules);

// Get exam schedule by ID
router.get("/:id", ExamSchedulesController.getScheduleById);

// Create new exam schedule
router.post("/", ExamSchedulesController.createSchedule);

// Update exam schedule
router.put("/:id", ExamSchedulesController.updateSchedule);

// Delete exam schedule
router.delete("/:id", ExamSchedulesController.deleteSchedule);

// Get schedules by proctor
router.get(
  "/proctor/:proctor_id",
  ExamSchedulesController.getSchedulesByProctor
);

export default router;
