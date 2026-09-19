import express from "express";
import accountingController from "../controllers/accounting.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

// Chart of Accounts
router.get("/chart-of-accounts", authenticateToken, accountingController.getChartOfAccounts);
router.post("/accounts", authenticateToken, accountingController.createAccount);

// General Ledger
router.get("/general-ledger", authenticateToken, accountingController.getGeneralLedger);

// Reports
router.get("/trial-balance", authenticateToken, accountingController.getTrialBalance);
router.get("/financial-statements", authenticateToken, accountingController.getFinancialStatements);

export default router;
