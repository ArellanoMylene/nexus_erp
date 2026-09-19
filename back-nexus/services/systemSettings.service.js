import * as SystemSettingsModel from "../model/systemSettings.model.js";

// ==================== GENERAL SETTINGS ====================

export const getAllSettings = async () => {
  try {
    const settings = await SystemSettingsModel.getAllSettings();
    return settings;
  } catch (error) {
    throw new Error(`Error fetching settings: ${error.message}`);
  }
};

export const getSettingByKey = async (key) => {
  try {
    const setting = await SystemSettingsModel.getSettingByKey(key);
    return setting;
  } catch (error) {
    throw new Error(`Error fetching setting: ${error.message}`);
  }
};

export const upsertSetting = async (key, value, description, category) => {
  try {
    const result = await SystemSettingsModel.upsertSetting(key, value, description, category);
    return result;
  } catch (error) {
    throw new Error(`Error saving setting: ${error.message}`);
  }
};

export const deleteSetting = async (key) => {
  try {
    const result = await SystemSettingsModel.deleteSetting(key);
    return result;
  } catch (error) {
    throw new Error(`Error deleting setting: ${error.message}`);
  }
};

export const getSettingsByCategory = async (category) => {
  try {
    const settings = await SystemSettingsModel.getSettingsByCategory(category);
    return settings;
  } catch (error) {
    throw new Error(`Error fetching settings by category: ${error.message}`);
  }
};

// ==================== EMAIL & SMS GATEWAY ====================

export const getAllGateways = async () => {
  try {
    const gateways = await SystemSettingsModel.getAllGateways();
    return gateways;
  } catch (error) {
    throw new Error(`Error fetching gateways: ${error.message}`);
  }
};

export const getGatewayById = async (id) => {
  try {
    const gateway = await SystemSettingsModel.getGatewayById(id);
    return gateway;
  } catch (error) {
    throw new Error(`Error fetching gateway: ${error.message}`);
  }
};

export const getGatewayByType = async (type) => {
  try {
    const gateway = await SystemSettingsModel.getGatewayByType(type);
    return gateway;
  } catch (error) {
    throw new Error(`Error fetching gateway by type: ${error.message}`);
  }
};

export const createGateway = async (gatewayData) => {
  try {
    const id = await SystemSettingsModel.createGateway(gatewayData);
    return id;
  } catch (error) {
    throw new Error(`Error creating gateway: ${error.message}`);
  }
};

export const updateGateway = async (id, gatewayData) => {
  try {
    const result = await SystemSettingsModel.updateGateway(id, gatewayData);
    return result;
  } catch (error) {
    throw new Error(`Error updating gateway: ${error.message}`);
  }
};

export const deleteGateway = async (id) => {
  try {
    const result = await SystemSettingsModel.deleteGateway(id);
    return result;
  } catch (error) {
    throw new Error(`Error deleting gateway: ${error.message}`);
  }
};

export const testGatewayConnection = async (id) => {
  try {
    const result = await SystemSettingsModel.testGatewayConnection(id);
    return result;
  } catch (error) {
    throw new Error(`Error testing gateway: ${error.message}`);
  }
};

// ==================== SYSTEM LOGS ====================

export const getAllLogs = async (filters) => {
  try {
    const logs = await SystemSettingsModel.getAllLogs(filters);
    const total = await SystemSettingsModel.getLogCount(filters);
    return { logs, total };
  } catch (error) {
    throw new Error(`Error fetching logs: ${error.message}`);
  }
};

export const createLog = async (logData) => {
  try {
    const id = await SystemSettingsModel.createLog(logData);
    return id;
  } catch (error) {
    throw new Error(`Error creating log: ${error.message}`);
  }
};

export const getLogById = async (id) => {
  try {
    const log = await SystemSettingsModel.getLogById(id);
    return log;
  } catch (error) {
    throw new Error(`Error fetching log: ${error.message}`);
  }
};

export const deleteOldLogs = async (daysToKeep) => {
  try {
    const result = await SystemSettingsModel.deleteOldLogs(daysToKeep);
    return result;
  } catch (error) {
    throw new Error(`Error deleting old logs: ${error.message}`);
  }
};

export const getLogStatistics = async (days) => {
  try {
    const stats = await SystemSettingsModel.getLogStatistics(days);
    return stats;
  } catch (error) {
    throw new Error(`Error fetching log statistics: ${error.message}`);
  }
};

export const getRecentActivity = async (limit) => {
  try {
    const activity = await SystemSettingsModel.getRecentActivity(limit);
    return activity;
  } catch (error) {
    throw new Error(`Error fetching recent activity: ${error.message}`);
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
