import express from "express";
import systemSettingsController from "../controllers/systemSettings.controller.js";
const router = express.Router();

// ==================== GENERAL SETTINGS ROUTES ====================
router.get("/settings", systemSettingsController.getAllSettings);
router.get(
  "/settings/category/:category",
  systemSettingsController.getSettingsByCategory,
);
router.get("/settings/:key", systemSettingsController.getSettingByKey);
router.post("/settings", systemSettingsController.upsertSetting);
router.put("/settings", systemSettingsController.upsertSetting);
router.delete("/settings/:key", systemSettingsController.deleteSetting);

// ==================== GATEWAY ROUTES ====================
router.get("/gateways", systemSettingsController.getAllGateways);
router.get("/gateways/type/:type", systemSettingsController.getGatewayByType);
router.get("/gateways/:id", systemSettingsController.getGatewayById);
router.post("/gateways", systemSettingsController.createGateway);
router.put("/gateways/:id", systemSettingsController.updateGateway);
router.delete("/gateways/:id", systemSettingsController.deleteGateway);
router.post(
  "/gateways/:id/test",
  systemSettingsController.testGatewayConnection,
);

// ==================== SYSTEM LOGS ROUTES ====================
router.get("/logs", systemSettingsController.getAllLogs);
router.get("/logs/statistics", systemSettingsController.getLogStatistics);
router.get("/logs/recent", systemSettingsController.getRecentActivity);
router.get("/logs/:id", systemSettingsController.getLogById);
router.post("/logs", systemSettingsController.createLog);
router.delete("/logs/cleanup", systemSettingsController.deleteOldLogs);

export default router;
