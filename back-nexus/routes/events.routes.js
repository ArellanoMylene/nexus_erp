import express from "express";
import EventsController from "../controllers/events.controller.js";

const router = express.Router();

router.get("/", EventsController.getAll);
router.get("/statistics", EventsController.getStatistics);
router.get("/:id", EventsController.getById);
router.post("/", EventsController.create);
router.put("/:id", EventsController.update);
router.delete("/:id", EventsController.delete);

export default router;
