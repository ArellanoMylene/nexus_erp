import express from "express";
import GradeComputationSettingsController from "../controllers/gradeComputationSettings.controller.js";

const router = express.Router();

// Get all grade computation settings (with optional filters)
router.get("/", GradeComputationSettingsController.getAllSettings);

// Get setting by ID
router.get("/:id", GradeComputationSettingsController.getSettingById);

// Get settings by course and period
router.get(
  "/course/:course_id/period/:period_id",
  GradeComputationSettingsController.getSettingsByCourseAndPeriod
);

// Validate weights for a course/period
router.get(
  "/validate/:course_id/period/:period_id",
  GradeComputationSettingsController.validateWeights
);

// Create new setting
router.post("/", GradeComputationSettingsController.createSetting);

// Update setting
router.put("/:id", GradeComputationSettingsController.updateSetting);

// Delete setting
router.delete("/:id", GradeComputationSettingsController.deleteSetting);

export default router;
