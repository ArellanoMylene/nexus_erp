import express from "express";
import {
  getAllScreenings,
  getScreeningById,
  createScreening,
  updateScreening,
  deleteScreening,
  getStatistics,
} from "../controllers/scholarshipEligibility.controller.js";

const router = express.Router();

router.get("/", getAllScreenings);
router.get("/statistics", getStatistics);
router.get("/:id", getScreeningById);
router.post("/", createScreening);
router.put("/:id", updateScreening);
router.delete("/:id", deleteScreening);

export default router;
