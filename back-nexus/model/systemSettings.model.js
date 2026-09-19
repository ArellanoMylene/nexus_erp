import pool from "../config/db.js";

// ==================== GENERAL SETTINGS ====================

// Get all general settings
export const getAllSettings = async () => {
  const [rows] = await pool.query(
    `SELECT * FROM system_settings ORDER BY setting_key ASC`
  );
  return rows;
};

// Get setting by key
export const getSettingByKey = async (key) => {
  const [rows] = await pool.query(
    `SELECT * FROM system_settings WHERE setting_key = ?`,
    [key]
  );
  return rows[0];
};

// Update or create setting
export const upsertSetting = async (key, value, description, category) => {
  const [result] = await pool.query(
    `INSERT INTO system_settings (setting_key, setting_value, description, category, updated_at)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE 
       setting_value = VALUES(setting_value),
       description = VALUES(description),
       category = VALUES(category),
       updated_at = NOW()`,
    [key, value, description, category]
  );
  return result;
};

// Delete setting
export const deleteSetting = async (key) => {
  const [result] = await pool.query(
    `DELETE FROM system_settings WHERE setting_key = ?`,
    [key]
  );
  return result;
};

// Get settings by category
export const getSettingsByCategory = async (category) => {
  const [rows] = await pool.query(
    `SELECT * FROM system_settings WHERE category = ? ORDER BY setting_key ASC`,
    [category]
  );
  return rows;
};

// ==================== EMAIL & SMS GATEWAY ====================

// Get all gateway configurations
export const getAllGateways = async () => {
  const [rows] = await pool.query(
    `SELECT * FROM communication_gateways ORDER BY created_at DESC`
  );
  return rows;
};

// Get gateway by ID
export const getGatewayById = async (id) => {
  const [rows] = await pool.query(
    `SELECT * FROM communication_gateways WHERE gateway_id = ?`,
    [id]
  );
  return rows[0];
};

// Get gateway by type
export const getGatewayByType = async (type) => {
  const [rows] = await pool.query(
    `SELECT * FROM communication_gateways WHERE gateway_type = ? AND is_active = 1`,
    [type]
  );
  return rows[0];
};

// Create gateway configuration
export const createGateway = async (gatewayData) => {
  const {
    gateway_name,
    gateway_type,
    provider,
    api_key,
    api_secret,
    sender_id,
    webhook_url,
    config_json,
    is_active,
  } = gatewayData;

  const [result] = await pool.query(
    `INSERT INTO communication_gateways 
     (gateway_name, gateway_type, provider, api_key, api_secret, sender_id, webhook_url, config_json, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      gateway_name,
      gateway_type,
      provider,
      api_key,
      api_secret,
      sender_id,
      webhook_url,
      config_json,
      is_active,
    ]
  );
  return result.insertId;
};

// Update gateway configuration
export const updateGateway = async (id, gatewayData) => {
  const {
    gateway_name,
    gateway_type,
    provider,
    api_key,
    api_secret,
    sender_id,
    webhook_url,
    config_json,
    is_active,
  } = gatewayData;

  const [result] = await pool.query(
    `UPDATE communication_gateways 
     SET gateway_name = ?, gateway_type = ?, provider = ?, api_key = ?, api_secret = ?,
         sender_id = ?, webhook_url = ?, config_json = ?, is_active = ?, updated_at = NOW()
     WHERE gateway_id = ?`,
    [
      gateway_name,
      gateway_type,
      provider,
      api_key,
      api_secret,
      sender_id,
      webhook_url,
      config_json,
      is_active,
      id,
    ]
  );
  return result;
};

// Delete gateway
export const deleteGateway = async (id) => {
  const [result] = await pool.query(
    `DELETE FROM communication_gateways WHERE gateway_id = ?`,
    [id]
  );
  return result;
};

// Test gateway connection
export const testGatewayConnection = async (id) => {
  // This would integrate with actual gateway APIs
  // For now, just return the gateway details
  return await getGatewayById(id);
};

// ==================== SYSTEM LOGS ====================

// Get all system logs with pagination and filters
export const getAllLogs = async (filters = {}) => {
  const { log_type, user_id, start_date, end_date, search, limit = 100, offset = 0 } = filters;
  
  let query = `SELECT sl.*, u.email, u.first_name, u.last_name, u.role
               FROM system_logs sl
               LEFT JOIN users u ON sl.user_id = u.user_id
               WHERE 1=1`;
  
  const params = [];

  if (log_type) {
    query += ` AND sl.log_type = ?`;
    params.push(log_type);
  }

  if (user_id) {
    query += ` AND sl.user_id = ?`;
    params.push(user_id);
  }

  if (start_date) {
    query += ` AND sl.created_at >= ?`;
    params.push(start_date);
  }

  if (end_date) {
    query += ` AND sl.created_at <= ?`;
    params.push(end_date);
  }

  if (search) {
    query += ` AND (sl.action LIKE ? OR sl.description LIKE ? OR sl.ip_address LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY sl.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const [rows] = await pool.query(query, params);
  return rows;
};

// Get total log count
export const getLogCount = async (filters = {}) => {
  const { log_type, user_id, start_date, end_date, search } = filters;
  
  let query = `SELECT COUNT(*) as total FROM system_logs WHERE 1=1`;
  const params = [];

  if (log_type) {
    query += ` AND log_type = ?`;
    params.push(log_type);
  }

  if (user_id) {
    query += ` AND user_id = ?`;
    params.push(user_id);
  }

  if (start_date) {
    query += ` AND created_at >= ?`;
    params.push(start_date);
  }

  if (end_date) {
    query += ` AND created_at <= ?`;
    params.push(end_date);
  }

  if (search) {
    query += ` AND (action LIKE ? OR description LIKE ? OR ip_address LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  const [rows] = await pool.query(query, params);
  return rows[0].total;
};

// Create system log entry
export const createLog = async (logData) => {
  const { log_type, action, description, user_id, ip_address, user_agent, metadata } = logData;

  const [result] = await pool.query(
    `INSERT INTO system_logs 
     (log_type, action, description, user_id, ip_address, user_agent, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [log_type, action, description, user_id, ip_address, user_agent, metadata]
  );
  return result.insertId;
};

// Get log by ID
export const getLogById = async (id) => {
  const [rows] = await pool.query(
    `SELECT sl.*, u.email, u.first_name, u.last_name, u.role
     FROM system_logs sl
     LEFT JOIN users u ON sl.user_id = u.user_id
     WHERE sl.log_id = ?`,
    [id]
  );
  return rows[0];
};

// Delete old logs (cleanup)
export const deleteOldLogs = async (daysToKeep = 90) => {
  const [result] = await pool.query(
    `DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [daysToKeep]
  );
  return result;
};

// Get log statistics
export const getLogStatistics = async (days = 7) => {
  const [rows] = await pool.query(
    `SELECT 
       log_type,
       COUNT(*) as count,
       DATE(created_at) as log_date
     FROM system_logs
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY log_type, DATE(created_at)
     ORDER BY log_date DESC, log_type ASC`,
    [days]
  );
  return rows;
};

// Get recent activity
export const getRecentActivity = async (limit = 20) => {
  const [rows] = await pool.query(
    `SELECT sl.*, u.email, u.first_name, u.last_name, u.role
     FROM system_logs sl
     LEFT JOIN users u ON sl.user_id = u.user_id
     ORDER BY sl.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};

export default {
  // General Settings
  getAllSettings,
  getSettingByKey,
  upsertSetting,
  deleteSetting,
  getSettingsByCategory,
  
  // Gateways
  getAllGateways,
  getGatewayById,
  getGatewayByType,
  createGateway,
  updateGateway,
  deleteGateway,
  testGatewayConnection,
  
  // System Logs
  getAllLogs,
  getLogCount,
  createLog,
  getLogById,
  deleteOldLogs,
  getLogStatistics,
  getRecentActivity,
};
