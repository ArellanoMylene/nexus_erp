import express from "express";
import LibraryIncidentsController from "../controllers/libraryIncidents.controller.js";

const router = express.Router();

// GET all incidents with optional filters
router.get("/", LibraryIncidentsController.getAllIncidents);

// GET incident statistics
router.get("/statistics", LibraryIncidentsController.getStatistics);

// GET incident by ID
router.get("/:id", LibraryIncidentsController.getIncidentById);

// POST create new incident
router.post("/", LibraryIncidentsController.createIncident);

// PUT update incident
router.put("/:id", LibraryIncidentsController.updateIncident);

// DELETE incident
router.delete("/:id", LibraryIncidentsController.deleteIncident);

export default router;
