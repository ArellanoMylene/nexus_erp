// routes/clearances.routes.js
import express from "express";
import {
  getAllClearances,
  getClearancesByStudent,
  getClearanceById,
  createClearance,
  updateClearance,
  deleteClearance,
} from "../controllers/clearances.controller.js";

const router = express.Router();

router.get("/clearances", getAllClearances);
router.get("/clearances/student/:studentId", getClearancesByStudent);
router.get("/clearances/:id", getClearanceById);
router.post("/clearances", createClearance);
router.put("/clearances/:id", updateClearance);
router.delete("/clearances/:id", deleteClearance);

export default router;
