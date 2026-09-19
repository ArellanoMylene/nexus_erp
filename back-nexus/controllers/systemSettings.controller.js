import * as SystemSettingsService from "../services/systemSettings.service.js";

// ==================== GENERAL SETTINGS ====================

export const getAllSettings = async (req, res) => {
  try {
    const settings = await SystemSettingsService.getAllSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await SystemSettingsService.getSettingByKey(key);
    
    if (!setting) {
      return res.status(404).json({ success: false, message: "Setting not found" });
    }
    
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertSetting = async (req, res) => {
  try {
    const { setting_key, setting_value, description, category } = req.body;
    
    if (!setting_key || !setting_value) {
      return res.status(400).json({ success: false, message: "Setting key and value are required" });
    }
    
    await SystemSettingsService.upsertSetting(setting_key, setting_value, description, category);
    res.status(200).json({ success: true, message: "Setting saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    await SystemSettingsService.deleteSetting(key);
    res.status(200).json({ success: true, message: "Setting deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await SystemSettingsService.getSettingsByCategory(category);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== EMAIL & SMS GATEWAY ====================

export const getAllGateways = async (req, res) => {
  try {
    const gateways = await SystemSettingsService.getAllGateways();
    res.status(200).json({ success: true, data: gateways });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGatewayById = async (req, res) => {
  try {
    const { id } = req.params;
    const gateway = await SystemSettingsService.getGatewayById(id);
    
    if (!gateway) {
      return res.status(404).json({ success: false, message: "Gateway not found" });
    }
    
    res.status(200).json({ success: true, data: gateway });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGatewayByType = async (req, res) => {
  try {
    const { type } = req.params;
    const gateway = await SystemSettingsService.getGatewayByType(type);
    res.status(200).json({ success: true, data: gateway });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGateway = async (req, res) => {
  try {
    const gatewayData = req.body;
    
    if (!gatewayData.gateway_name || !gatewayData.gateway_type || !gatewayData.provider) {
      return res.status(400).json({ success: false, message: "Gateway name, type, and provider are required" });
    }
    
    const id = await SystemSettingsService.createGateway(gatewayData);
    res.status(201).json({ success: true, gateway_id: id, message: "Gateway created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGateway = async (req, res) => {
  try {
    const { id } = req.params;
    const gatewayData = req.body;
    
    await SystemSettingsService.updateGateway(id, gatewayData);
    res.status(200).json({ success: true, message: "Gateway updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGateway = async (req, res) => {
  try {
    const { id } = req.params;
    await SystemSettingsService.deleteGateway(id);
    res.status(200).json({ success: true, message: "Gateway deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const testGatewayConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SystemSettingsService.testGatewayConnection(id);
    res.status(200).json({ success: true, data: result, message: "Gateway connection test completed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SYSTEM LOGS ====================

export const getAllLogs = async (req, res) => {
  try {
    const filters = {
      log_type: req.query.log_type,
      user_id: req.query.user_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      search: req.query.search,
      limit: req.query.limit || 100,
      offset: req.query.offset || 0,
    };
    
    const { logs, total } = await SystemSettingsService.getAllLogs(filters);
    res.status(200).json({ success: true, data: logs, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLog = async (req, res) => {
  try {
    const logData = {
      ...req.body,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
    };
    
    const id = await SystemSettingsService.createLog(logData);
    res.status(201).json({ success: true, log_id: id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await SystemSettingsService.getLogById(id);
    
    if (!log) {
      return res.status(404).json({ success: false, message: "Log not found" });
    }
    
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOldLogs = async (req, res) => {
  try {
    const { days } = req.query;
    const daysToKeep = days ? parseInt(days) : 90;
    
    const result = await SystemSettingsService.deleteOldLogs(daysToKeep);
    res.status(200).json({ 
      success: true, 
      message: `Deleted logs older than ${daysToKeep} days`,
      deleted_count: result.affectedRows 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLogStatistics = async (req, res) => {
  try {
    const { days } = req.query;
    const period = days ? parseInt(days) : 7;
    
    const stats = await SystemSettingsService.getLogStatistics(period);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const { limit } = req.query;
    const maxLimit = limit ? parseInt(limit) : 20;
    
    const activity = await SystemSettingsService.getRecentActivity(maxLimit);
    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
  createLog,
  getLogById,
  deleteOldLogs,
  getLogStatistics,
  getRecentActivity,
};
