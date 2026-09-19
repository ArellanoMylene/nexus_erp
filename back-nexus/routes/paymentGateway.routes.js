import express from "express";
import paymentGatewayController from "../controllers/paymentGateway.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ========== GATEWAY CONFIGURATION ==========

// Create gateway configuration
router.post("/config", paymentGatewayController.createGatewayConfig);

// Get all gateway configurations
router.get("/config", paymentGatewayController.getAllGatewayConfigs);

// Get active gateways (for public/student use)
router.get("/config/active", paymentGatewayController.getActiveGateways);

// Get gateway configuration by ID
router.get("/config/:id", paymentGatewayController.getGatewayConfigById);

// Update gateway configuration
router.put("/config/:id", paymentGatewayController.updateGatewayConfig);

// Toggle gateway active status
router.patch(
  "/config/:id/toggle",
  paymentGatewayController.toggleGatewayActive
);

// Delete gateway configuration
router.delete("/config/:id", paymentGatewayController.deleteGatewayConfig);

// ========== GATEWAY TRANSACTIONS ==========

// Create gateway transaction
router.post("/transactions", paymentGatewayController.createGatewayTransaction);

// Get all gateway transactions
router.get("/transactions", paymentGatewayController.getAllGatewayTransactions);

// Get transaction summary
router.get(
  "/transactions/summary",
  paymentGatewayController.getGatewayTransactionSummary
);

// Get gateway transaction by ID
router.get(
  "/transactions/:id",
  paymentGatewayController.getGatewayTransactionById
);

// Update gateway transaction status
router.patch(
  "/transactions/:id/status",
  paymentGatewayController.updateGatewayTransactionStatus
);

export default router;
