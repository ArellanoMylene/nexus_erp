/* import express from "express";
import AbsenteeAlertsController from "../controllers/absenteeAlerts.controller.js";

const router = express.Router();

// GET all absentee alerts
router.get("/", AbsenteeAlertsController.getAllAbsenteeAlerts);

// GET alert statistics
router.get("/statistics", AbsenteeAlertsController.getAlertStatistics);

// GET absentee alert by ID
router.get("/:id", AbsenteeAlertsController.getAbsenteeAlertById);

// POST create new absentee alert
router.post("/", AbsenteeAlertsController.createAbsenteeAlert);

// PUT update absentee alert
router.put("/:id", AbsenteeAlertsController.updateAbsenteeAlert);

// PATCH acknowledge alert
router.patch("/:id/acknowledge", AbsenteeAlertsController.acknowledgeAlert);

// PATCH resolve alert
router.patch("/:id/resolve", AbsenteeAlertsController.resolveAlert);

// DELETE absentee alert
router.delete("/:id", AbsenteeAlertsController.deleteAbsenteeAlert);

export default router;
 */
// routes/absenteeAlerts.routes.js
import express from "express";
import { validate } from "../middleware/validate.js";
import {
  createAbsenteeAlertSchema,
  updateAbsenteeAlertSchema,
  acknowledgeAlertSchema,
  resolveAlertSchema,
} from "../validators/absenteeAlerts.validator.js";
import AbsenteeAlertsController from "../controllers/absenteeAlerts.controller.js";

const router = express.Router();

router.get("/", AbsenteeAlertsController.getAllAbsenteeAlerts);
router.get("/statistics", AbsenteeAlertsController.getAlertStatistics); // ⚠️ Before /:id
router.get("/:id", AbsenteeAlertsController.getAbsenteeAlertById);

router.post("/", validate(createAbsenteeAlertSchema), AbsenteeAlertsController.createAbsenteeAlert);
router.put("/:id", validate(updateAbsenteeAlertSchema), AbsenteeAlertsController.updateAbsenteeAlert);
router.delete("/:id", AbsenteeAlertsController.deleteAbsenteeAlert);

router.patch("/:id/acknowledge", validate(acknowledgeAlertSchema), AbsenteeAlertsController.acknowledgeAlert);
router.patch("/:id/resolve", validate(resolveAlertSchema), AbsenteeAlertsController.resolveAlert);

export default router;