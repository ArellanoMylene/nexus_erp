-- Migration: Add HR and Accounting roles to role_permissions ENUM
-- Run this against your database to support HR and Accounting in RBAC.

-- Step 1: Expand the ENUM on role_permissions to include HR and Accounting
ALTER TABLE role_permissions
  MODIFY COLUMN role ENUM('Student', 'Admin', 'Faculty', 'Staff', 'HR', 'Accounting') NOT NULL;

-- Step 2: Seed default (denied) rows for HR and Accounting for every existing permission
INSERT IGNORE INTO role_permissions (role, permission_id, is_allowed)
SELECT 'HR', permission_id, FALSE FROM rbac_permissions;

INSERT IGNORE INTO role_permissions (role, permission_id, is_allowed)
SELECT 'Accounting', permission_id, FALSE FROM rbac_permissions;
