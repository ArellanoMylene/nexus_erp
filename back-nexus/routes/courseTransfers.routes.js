// routes/courseTransfers.routes.js
import express from "express";
import {
  getAllTransfers,
  getTransfersByStudent,
  getTransferById,
  createTransfer,
  updateTransfer,
  deleteTransfer,
} from "../controllers/courseTransfers.controller.js";

const router = express.Router();

router.get("/course-transfers", getAllTransfers);
router.get("/course-transfers/student/:studentId", getTransfersByStudent);
router.get("/course-transfers/:id", getTransferById);
router.post("/course-transfers", createTransfer);
router.put("/course-transfers/:id", updateTransfer);
router.delete("/course-transfers/:id", deleteTransfer);

export default router;
