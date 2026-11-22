import express from "express";
import { authenticateToken } from "../helpers/jwt.js";
import { getHrDashboard } from "../controllers/hrDashboard.controller.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/dashboard", getHrDashboard);

export default router;
