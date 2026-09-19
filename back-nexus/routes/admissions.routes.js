// routes/admissions.routes.js
import express from "express";
import {
  getAllAdmissions,
  getAdmissionById,
  createAdmission,
  updateAdmission,
  deleteAdmission,
  bulkEnroll,
} from "../controllers/admissions.controller.js";

const router = express.Router();

router.get("/admissions", getAllAdmissions);
router.post("/admissions/bulk-enroll", bulkEnroll);
router.get("/admissions/:id", getAdmissionById);
router.post("/admissions", createAdmission);
router.put("/admissions/:id", updateAdmission);
router.delete("/admissions/:id", deleteAdmission);

export default router;
