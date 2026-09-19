import express from "express";
import SchoolCalendarController from "../controllers/schoolCalendar.controller.js";

const router = express.Router();

router.get("/", SchoolCalendarController.getAll);
router.get("/statistics", SchoolCalendarController.getStatistics);
router.get("/academic-years", SchoolCalendarController.getAcademicYears);
router.get("/:id", SchoolCalendarController.getById);
router.post("/", SchoolCalendarController.create);
router.put("/:id", SchoolCalendarController.update);
router.delete("/:id", SchoolCalendarController.delete);

export default router;
