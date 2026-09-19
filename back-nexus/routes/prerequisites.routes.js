// routes/prerequisites.routes.js
import express from "express";
import {
  getAllPrerequisites,
  getPrerequisitesByCourse,
  getPrerequisiteById,
  createPrerequisite,
  updatePrerequisite,
  deletePrerequisite,
  deletePrerequisitesByCourse,
} from "../controllers/prerequisites.controller.js";

const router = express.Router();

router.get("/prerequisites", getAllPrerequisites);
router.get("/prerequisites/course/:courseId", getPrerequisitesByCourse);
router.get("/prerequisites/:id", getPrerequisiteById);
router.post("/prerequisites", createPrerequisite);
router.put("/prerequisites/:id", updatePrerequisite);
router.delete("/prerequisites/:id", deletePrerequisite);
router.delete("/prerequisites/course/:courseId", deletePrerequisitesByCourse);

export default router;
