import express from "express";
import { chatWithNexusAI } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/ai/chat", chatWithNexusAI);

export default router;
