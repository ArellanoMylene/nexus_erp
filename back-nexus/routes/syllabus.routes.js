import express from "express";
import SyllabusController from "../controllers/syllabus.controller.js";

const router = express.Router();

// GET all syllabi with optional filters
router.get("/", SyllabusController.getAllSyllabi);

// GET syllabus by ID
router.get("/:id", SyllabusController.getSyllabusById);

// POST create new syllabus
router.post("/", SyllabusController.createSyllabus);

// PUT update syllabus
router.put("/:id", SyllabusController.updateSyllabus);

// DELETE syllabus
router.delete("/:id", SyllabusController.deleteSyllabus);

export default router;
