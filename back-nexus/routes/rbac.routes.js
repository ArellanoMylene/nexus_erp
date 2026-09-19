// rbac.routes.js
import express from "express";
import { getRbac, saveRbac } from "../controllers/rbac.controller.js";

const router = express.Router();

// Get full RBAC config (all roles × permissions)
router.get("/rbac", getRbac);

// Save / update RBAC config
router.put("/rbac", saveRbac);

export default router;
