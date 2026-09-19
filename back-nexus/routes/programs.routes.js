// routes/programs.routes.js
import express from "express";
import {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
} from "../controllers/programs.controller.js";

const router = express.Router();

router.get("/programs", getAllPrograms);
router.get("/programs/:id", getProgramById);
router.post("/programs", createProgram);
router.put("/programs/:id", updateProgram);
router.delete("/programs/:id", deleteProgram);

export default router;
