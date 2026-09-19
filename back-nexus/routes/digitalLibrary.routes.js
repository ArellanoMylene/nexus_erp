import express from "express";
import DigitalLibraryController from "../controllers/digitalLibrary.controller.js";

const router = express.Router();

// GET all digital resources with optional filters
router.get("/", DigitalLibraryController.getAllDigitalResources);

// GET digital resource statistics
router.get("/statistics", DigitalLibraryController.getStatistics);

// GET digital resource by ID
router.get("/:id", DigitalLibraryController.getDigitalResourceById);

// POST create new digital resource
router.post("/", DigitalLibraryController.createDigitalResource);

// PUT update digital resource
router.put("/:id", DigitalLibraryController.updateDigitalResource);

// PUT increment view count
router.put("/:id/view", DigitalLibraryController.incrementViewCount);

// PUT increment download count
router.put("/:id/download", DigitalLibraryController.incrementDownloadCount);

// DELETE digital resource
router.delete("/:id", DigitalLibraryController.deleteDigitalResource);

export default router;
