import express from "express";
import {
  getAllApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  getStatistics,
} from "../controllers/scholarshipApplications.controller.js";

const router = express.Router();

router.get("/", getAllApplications);
router.get("/statistics", getStatistics);
router.get("/:id", getApplicationById);
router.post("/", createApplication);
router.put("/:id", updateApplication);
router.delete("/:id", deleteApplication);

export default router;
