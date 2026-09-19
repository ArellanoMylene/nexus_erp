import express from "express";
import SectionsController from "../controllers/sections.controller.js";

const router = express.Router();

// GET all sections with optional filters
router.get("/", SectionsController.getAllSections);

// GET section by ID
router.get("/:id", SectionsController.getSectionById);

// POST create new section
router.post("/", SectionsController.createSection);

// PUT update section
router.put("/:id", SectionsController.updateSection);

// DELETE section
router.delete("/:id", SectionsController.deleteSection);

// GET enrollment count for section
router.get("/:id/enrollment-count", SectionsController.getEnrollmentCount);

export default router;
