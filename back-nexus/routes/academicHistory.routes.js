// routes/academicHistory.routes.js
import express from "express";
import { validate, validateId } from "../middleware/validate.js"; // 👈 add validateId
import {
  createHistorySchema,
  updateHistorySchema,
} from "../validators/academicHistory.validator.js";
import {
  getAllAcademicHistory,
  getHistoryByStudent,
  getHistoryById,
  createHistory,
  updateHistory,
  deleteHistory,
} from "../controllers/academicHistory.controller.js";

const router = express.Router();

// ✅ GET routes — /student/:studentId MUST be before /:id
router.get("/", getAllAcademicHistory);
router.get("/student/:studentId", validateId("studentId"), getHistoryByStudent);
router.get("/:id", validateId("id"), getHistoryById);

// ✅ Write routes
router.post("/", validate(createHistorySchema), createHistory);
router.put("/:id", validateId("id"), validate(updateHistorySchema), updateHistory);
router.delete("/:id", validateId("id"), deleteHistory);

export default router;