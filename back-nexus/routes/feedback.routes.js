import express from "express";
import FeedbackController from "../controllers/feedback.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", FeedbackController.getStudentFeedback);
router.post("/", FeedbackController.submit);
router.get("/all", FeedbackController.getAll);

export default router;
