// rbacModel.js
import db from "../config/db.js";

/**
 * Fetch all permissions and, for each role, whether it's allowed or not.
 * Returns shape: { [role]: [{ permission_id, name, description, is_allowed }] }
 */
export const getAllRbac = async () => {
  // Get every permission
  const [permissions] = await db.query(
    "SELECT permission_id, name, description FROM rbac_permissions ORDER BY permission_id",
  );

  // Get all role-permission rows
  const [rolePerms] = await db.query(
    "SELECT role, permission_id, is_allowed FROM role_permissions",
  );

  // Build a lookup map: "role:permission_id" => is_allowed
  const lookup = {};
  for (const row of rolePerms) {
    lookup[`${row.role}:${row.permission_id}`] = Boolean(row.is_allowed);
  }

  const ROLES = ["Admin", "Faculty", "Staff", "Student", "HR", "Accounting"];

  const result = {};
  for (const role of ROLES) {
    result[role] = permissions.map((p) => ({
      id: p.permission_id,
      name: p.name,
      description: p.description,
      allowed: lookup[`${role}:${p.permission_id}`] ?? false,
    }));
  }

  return result;
};

/**
 * Bulk-save RBAC config using INSERT ... ON DUPLICATE KEY UPDATE.
 * @param {Array<{ role, permissionId, isAllowed }>} entries
 */
export const saveRbac = async (entries) => {
  if (!entries || entries.length === 0) return;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const { role, permissionId, isAllowed } of entries) {
      await connection.query(
        `INSERT INTO role_permissions (role, permission_id, is_allowed)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed)`,
        [role, permissionId, isAllowed ? 1 : 0],
      );
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
