import express from "express";
import inventoryController from "../controllers/inventoryAssets.controller.js";
const router = express.Router();

// Asset Management Routes
router.get("/assets", inventoryController.getAllAssets);
router.get("/assets/:id", inventoryController.getAssetById);
router.post("/assets", inventoryController.createAsset);
router.put("/assets/:id", inventoryController.updateAsset);
router.delete("/assets/:id", inventoryController.deleteAsset);

// Asset Categories
router.get("/categories", inventoryController.getAllCategories);

// Asset Transfers
router.get("/transfers", inventoryController.getTransfers);
router.post("/transfers", inventoryController.createTransfer);

// Asset Maintenance
router.get("/maintenance", inventoryController.getMaintenanceRecords);
router.post("/maintenance", inventoryController.createMaintenance);
router.put("/maintenance/:id", inventoryController.updateMaintenance);

// Asset Requests
router.get("/requests", inventoryController.getRequests);
router.post("/requests", inventoryController.createRequest);
router.put("/requests/:id/status", inventoryController.updateRequestStatus);

// Reports & Analytics
router.get("/summary", inventoryController.getAssetSummary);

export default router;
