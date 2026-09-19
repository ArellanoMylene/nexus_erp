// rbac.controller.js
import { getRbacService, saveRbacService } from "../services/rbac.service.js";

/**
 * GET /api/rbac
 * Returns the full RBAC config (all roles × all permissions).
 */
export const getRbac = async (req, res) => {
  try {
    const data = await getRbacService();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching RBAC config:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to fetch RBAC config" });
  }
};

/**
 * PUT /api/rbac
 * Body: { Admin: [...], Faculty: [...], ... }
 * Saves the full RBAC config.
 */
export const saveRbac = async (req, res) => {
  try {
    const rbacData = req.body;

    if (!rbacData || typeof rbacData !== "object") {
      return res.status(400).json({ message: "Invalid RBAC payload" });
    }

    await saveRbacService(rbacData);
    res.status(200).json({ message: "RBAC configuration saved successfully" });
  } catch (error) {
    console.error("Error saving RBAC config:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to save RBAC config" });
  }
};
