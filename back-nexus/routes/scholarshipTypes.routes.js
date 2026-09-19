import express from "express";
import {
  getAllScholarshipTypes,
  getScholarshipTypeById,
  createScholarshipType,
  updateScholarshipType,
  deleteScholarshipType,
  getStatistics,
  getFundingSources,
} from "../controllers/scholarshipTypes.controller.js";

const router = express.Router();

router.get("/", getAllScholarshipTypes);
router.get("/statistics", getStatistics);
router.get("/funding-sources", getFundingSources);
router.get("/:id", getScholarshipTypeById);
router.post("/", createScholarshipType);
router.put("/:id", updateScholarshipType);
router.delete("/:id", deleteScholarshipType);

export default router;
