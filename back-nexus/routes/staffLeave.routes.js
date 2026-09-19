import express from "express";
import {
  getAllLeaveRequests,
  getLeaveById,
  createLeaveRequest,
  updateLeaveRequest,
  approveLeave,
  rejectLeave,
  deleteLeaveRequest,
  getLeaveSummary,
} from "../controllers/staffLeave.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// Leave routes
router.get("/", getAllLeaveRequests);
router.get("/summary", getLeaveSummary);
router.get("/:id", getLeaveById);
router.post("/", createLeaveRequest);
router.put("/:id", updateLeaveRequest);
router.patch("/:id/approve", approveLeave);
router.patch("/:id/reject", rejectLeave);
router.delete("/:id", deleteLeaveRequest);

export default router;
