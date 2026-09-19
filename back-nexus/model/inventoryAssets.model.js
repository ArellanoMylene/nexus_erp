import pool from "../config/db.js";

const InventoryAssetsModel = {
  // Get all assets with filters
  async getAll(filters = {}) {
    let query = `
      SELECT 
        ia.*,
        ic.category_name,
        ic.category_type,
        CONCAT(u.first_name, ' ', u.last_name) AS assigned_to_name,
        COUNT(DISTINCT im.maintenance_id) as maintenance_count,
        COUNT(DISTINCT it.transfer_id) as transfer_count
      FROM inventory_assets ia
      LEFT JOIN inventory_categories ic ON ia.category = ic.category_name
      LEFT JOIN users u ON ia.assigned_to = u.user_id
      LEFT JOIN inventory_maintenance im ON ia.asset_id = im.asset_id
      LEFT JOIN inventory_transfers it ON ia.asset_id = it.asset_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.search) {
      query += ` AND (ia.asset_code LIKE ? OR ia.asset_name LIKE ? OR ia.serial_number LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.asset_type) {
      query += " AND ia.asset_type = ?";
      params.push(filters.asset_type);
    }

    if (filters.category) {
      query += " AND ia.category = ?";
      params.push(filters.category);
    }

    if (filters.status) {
      query += " AND ia.status = ?";
      params.push(filters.status);
    }

    if (filters.condition) {
      query += " AND ia.condition = ?";
      params.push(filters.condition);
    }

    if (filters.department) {
      query += " AND ia.department = ?";
      params.push(filters.department);
    }

    if (filters.location) {
      query += " AND ia.location LIKE ?";
      params.push(`%${filters.location}%`);
    }

    query += " GROUP BY ia.asset_id ORDER BY ia.created_at DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get asset by ID
  async getById(id) {
    const [rows] = await pool.query(
      `SELECT 
        ia.*,
        ic.category_name,
        ic.category_type,
        CONCAT(u.first_name, ' ', u.last_name) AS assigned_to_name
      FROM inventory_assets ia
      LEFT JOIN inventory_categories ic ON ia.category = ic.category_name
      LEFT JOIN users u ON ia.assigned_to = u.user_id
      WHERE ia.asset_id = ?`,
      [id]
    );
    return rows[0];
  },

  // Create new asset
  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO inventory_assets (
        asset_code, asset_name, asset_type, category, description,
        serial_number, model_number, manufacturer, supplier,
        purchase_date, purchase_price, current_value,
        warranty_start_date, warranty_end_date,
        location, building, department, status, \`condition\`,
        assigned_to, depreciation_method, useful_life_years,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.asset_code,
        data.asset_name,
        data.asset_type,
        data.category,
        data.description,
        data.serial_number,
        data.model_number,
        data.manufacturer,
        data.supplier,
        data.purchase_date,
        data.purchase_price,
        data.current_value,
        data.warranty_start_date,
        data.warranty_end_date,
        data.location,
        data.building,
        data.department,
        data.status || "available",
        data.condition || "good",
        data.assigned_to,
        data.depreciation_method,
        data.useful_life_years,
        data.notes,
      ]
    );
    return result.insertId;
  },

  // Update asset
  async update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        if (key === "condition") {
          fields.push("`condition` = ?");
        } else {
          fields.push(`${key} = ?`);
        }
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return 0;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE inventory_assets SET ${fields.join(", ")} WHERE asset_id = ?`,
      values
    );
    return result.affectedRows;
  },

  // Delete asset
  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM inventory_assets WHERE asset_id = ?",
      [id]
    );
    return result.affectedRows;
  },

  // Get categories
  async getCategories() {
    const [rows] = await pool.query(
      "SELECT * FROM inventory_categories ORDER BY category_name"
    );
    return rows;
  },

  // Get transfers with filters
  async getTransfers(filters = {}) {
    let query = `
      SELECT 
        it.*,
        ia.asset_code,
        ia.asset_name,
        CONCAT(u.first_name, ' ', u.last_name) AS requested_by_name,
        CONCAT(a.first_name, ' ', a.last_name) AS approved_by_name
      FROM inventory_transfers it
      LEFT JOIN inventory_assets ia ON it.asset_id = ia.asset_id
      LEFT JOIN users u ON it.requested_by = u.user_id
      LEFT JOIN users a ON it.approved_by = a.user_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.asset_id) {
      query += " AND it.asset_id = ?";
      params.push(filters.asset_id);
    }

    if (filters.approval_status) {
      query += " AND it.approval_status = ?";
      params.push(filters.approval_status);
    }

    if (filters.transfer_type) {
      query += " AND it.transfer_type = ?";
      params.push(filters.transfer_type);
    }

    query += " ORDER BY it.created_at DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Create transfer
  async createTransfer(data) {
    const [result] = await pool.query(
      `INSERT INTO inventory_transfers (
        asset_id, from_location, from_department, to_location, to_department,
        transfer_type, transfer_date, reason, requested_by, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.asset_id,
        data.from_location,
        data.from_department,
        data.to_location,
        data.to_department,
        data.transfer_type,
        data.transfer_date,
        data.reason,
        data.requested_by,
        data.approval_status || "pending",
      ]
    );
    return result.insertId;
  },

  // Update transfer
  async updateTransfer(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return 0;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE inventory_transfers SET ${fields.join(", ")} WHERE transfer_id = ?`,
      values
    );
    return result.affectedRows;
  },

  // Get maintenance records
  async getMaintenance(filters = {}) {
    let query = `
      SELECT 
        im.*,
        ia.asset_code,
        ia.asset_name,
        CONCAT(u.first_name, ' ', u.last_name) AS performed_by_name
      FROM inventory_maintenance im
      LEFT JOIN inventory_assets ia ON im.asset_id = ia.asset_id
      LEFT JOIN users u ON im.performed_by = u.user_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.asset_id) {
      query += " AND im.asset_id = ?";
      params.push(filters.asset_id);
    }

    if (filters.maintenance_type) {
      query += " AND im.maintenance_type = ?";
      params.push(filters.maintenance_type);
    }

    if (filters.maintenance_status) {
      query += " AND im.maintenance_status = ?";
      params.push(filters.maintenance_status);
    }

    query += " ORDER BY im.maintenance_date DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Create maintenance record
  async createMaintenance(data) {
    const [result] = await pool.query(
      `INSERT INTO inventory_maintenance (
        asset_id, maintenance_type, maintenance_date, scheduled_date,
        description, action_taken, maintenance_cost, performed_by,
        maintenance_status, priority, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.asset_id,
        data.maintenance_type,
        data.maintenance_date,
        data.scheduled_date,
        data.description,
        data.action_taken,
        data.maintenance_cost,
        data.performed_by,
        data.maintenance_status || "scheduled",
        data.priority,
        data.notes,
      ]
    );
    return result.insertId;
  },

  // Update maintenance record
  async updateMaintenance(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return 0;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE inventory_maintenance SET ${fields.join(", ")} WHERE maintenance_id = ?`,
      values
    );
    return result.affectedRows;
  },

  // Get requests
  async getRequests(filters = {}) {
    let query = `
      SELECT 
        ir.*,
        ia.asset_code,
        ia.asset_name,
        CONCAT(u.first_name, ' ', u.last_name) AS requested_by_name,
        CONCAT(r.first_name, ' ', r.last_name) AS reviewed_by_name,
        CONCAT(a.first_name, ' ', a.last_name) AS approved_by_name
      FROM inventory_requests ir
      LEFT JOIN inventory_assets ia ON ir.asset_id = ia.asset_id
      LEFT JOIN users u ON ir.requested_by = u.user_id
      LEFT JOIN users r ON ir.reviewed_by = r.user_id
      LEFT JOIN users a ON ir.approved_by = a.user_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.request_type) {
      query += " AND ir.request_type = ?";
      params.push(filters.request_type);
    }

    if (filters.status) {
      query += " AND ir.status = ?";
      params.push(filters.status);
    }

    if (filters.priority) {
      query += " AND ir.priority = ?";
      params.push(filters.priority);
    }

    query += " ORDER BY ir.request_date DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Create request
  async createRequest(data) {
    const [result] = await pool.query(
      `INSERT INTO inventory_requests (
        asset_id, request_type, request_date, description,
        quantity, estimated_cost, priority, department,
        justification, requested_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.asset_id,
        data.request_type,
        data.request_date,
        data.description,
        data.quantity,
        data.estimated_cost,
        data.priority,
        data.department,
        data.justification,
        data.requested_by,
        data.status || "pending",
      ]
    );
    return result.insertId;
  },

  // Update request
  async updateRequest(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return 0;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE inventory_requests SET ${fields.join(", ")} WHERE request_id = ?`,
      values
    );
    return result.affectedRows;
  },

  // Get statistics
  async getStatistics() {
    const [totalAssets] = await pool.query(
      "SELECT COUNT(*) as count FROM inventory_assets"
    );
    const [available] = await pool.query(
      "SELECT COUNT(*) as count FROM inventory_assets WHERE status = 'available'"
    );
    const [inUse] = await pool.query(
      "SELECT COUNT(*) as count FROM inventory_assets WHERE status = 'in_use'"
    );
    const [maintenance] = await pool.query(
      "SELECT COUNT(*) as count FROM inventory_assets WHERE status = 'maintenance'"
    );
    const [totalValue] = await pool.query(
      "SELECT SUM(current_value) as total FROM inventory_assets"
    );

    return {
      total_assets: totalAssets[0].count,
      available: available[0].count,
      in_use: inUse[0].count,
      maintenance: maintenance[0].count,
      total_value: totalValue[0].total || 0,
    };
  },
};

export default InventoryAssetsModel;
