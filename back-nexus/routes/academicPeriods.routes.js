// routes/academicPeriods.routes.js
import express from "express";
import {
  getAllAcademicPeriods,
  getAcademicPeriodById,
  getActivePeriod,
  createAcademicPeriod,
  updateAcademicPeriod,
  deleteAcademicPeriod,
  setActivePeriod,
} from "../controllers/academicPeriods.controller.js";

const router = express.Router();

router.get("/academic-periods", getAllAcademicPeriods);
router.get("/academic-periods/active", getActivePeriod);
router.get("/academic-periods/:id", getAcademicPeriodById);
router.post("/academic-periods", createAcademicPeriod);
router.put("/academic-periods/:id", updateAcademicPeriod);
router.delete("/academic-periods/:id", deleteAcademicPeriod);
router.post("/academic-periods/:id/activate", setActivePeriod);

export default router;
