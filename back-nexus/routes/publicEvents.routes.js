import express from "express";
import PublicEventsController from "../controllers/publicEvents.controller.js";

const router = express.Router();

router.get("/", PublicEventsController.getAll);
router.get("/statistics", PublicEventsController.getStatistics);
router.get("/slug/:slug", PublicEventsController.getBySlug);
router.get("/:id", PublicEventsController.getById);
router.post("/", PublicEventsController.create);
router.put("/:id", PublicEventsController.update);
router.delete("/:id", PublicEventsController.delete);

export default router;
