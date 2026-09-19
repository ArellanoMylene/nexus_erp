import express from "express";
import lmsMaterialsController from "../controllers/lmsMaterials.controller.js";

const router = express.Router();

// Upload learning material file
router.post("/upload", lmsMaterialsController.uploadFile);

// Create new material
router.post("/", lmsMaterialsController.create);

// Get materials by faculty
router.get("/faculty", lmsMaterialsController.getByFaculty);

// Get materials for a student (filtered by enrolled courses)
router.get("/student", lmsMaterialsController.getByStudent);

// Get materials by section
router.get("/section", lmsMaterialsController.getBySection);

// Get material by ID
router.get("/:id", lmsMaterialsController.getById);

// Update material
router.put("/:id", lmsMaterialsController.update);

// Delete material
router.delete("/:id", lmsMaterialsController.delete);

// Track material view
router.post("/track-view", lmsMaterialsController.trackView);

// Get material views
router.get("/:material_id/views", lmsMaterialsController.getViews);

export default router;
