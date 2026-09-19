/* import express from "express";
import AcademicEventsController from "../controllers/academicEvents.controller.js";

const router = express.Router();

// GET all events with optional filters
router.get("/", AcademicEventsController.getAllEvents);

// GET event by ID
router.get("/:id", AcademicEventsController.getEventById);

// POST create new event
router.post("/", AcademicEventsController.createEvent);

// PUT update event
router.put("/:id", AcademicEventsController.updateEvent);

// DELETE event
router.delete("/:id", AcademicEventsController.deleteEvent);

export default router;
 */
// routes/academicEvents.routes.js
import express from "express";
import { validate } from "../middleware/validate.js";
import {
  createAcademicEventSchema,
  updateAcademicEventSchema,
} from "../validators/academicEvents.validator.js";
import AcademicEventsController from "../controllers/academicEvents.controller.js";

const router = express.Router();

router.get("/", AcademicEventsController.getAllEvents);
router.get("/:id", AcademicEventsController.getEventById);

router.post("/", validate(createAcademicEventSchema), AcademicEventsController.createEvent);
router.put("/:id", validate(updateAcademicEventSchema), AcademicEventsController.updateEvent);
router.delete("/:id", AcademicEventsController.deleteEvent);

export default router;