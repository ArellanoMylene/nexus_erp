// rbac.service.js
import { getAllRbac, saveRbac } from "../model/rbacModel.js";

/**
 * Return the full RBAC config keyed by role.
 */
export const getRbacService = async () => {
  return await getAllRbac();
};

/**
 * Accepts the rbac object from the frontend:
 * { Admin: [{ id, name, description, allowed }], Faculty: [...], ... }
 * and flattens it into rows for bulk-save.
 */
export const saveRbacService = async (rbacData) => {
  const entries = [];

  for (const [role, permissions] of Object.entries(rbacData)) {
    for (const perm of permissions) {
      entries.push({
        role,
        permissionId: perm.id,
        isAllowed: perm.allowed,
      });
    }
  }

  await saveRbac(entries);
  return true;
};
