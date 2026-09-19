import express from "express";
import AnnouncementsController from "../controllers/announcements.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", AnnouncementsController.getAll);
router.get("/statistics", AnnouncementsController.getStatistics);
router.get("/:id", AnnouncementsController.getById);
router.post("/", AnnouncementsController.create);
router.put("/:id", AnnouncementsController.update);
router.put("/:id/read", AnnouncementsController.markAsRead);
router.delete("/:id", AnnouncementsController.delete);

export default router;
