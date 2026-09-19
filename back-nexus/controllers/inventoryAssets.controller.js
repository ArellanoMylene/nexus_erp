// ...existing code...
// ...existing code...

// Place this at the end of the file after all function declarations:
// export default {
//   getAllAssets,
//   getAssetById,
//   createAsset,
//   updateAsset,
//   deleteAsset,
//   getAllCategories,
//   getTransfers,
//   createTransfer,
//   updateTransfer,
//   getMaintenanceRecords,
//   createMaintenance,
//   updateMaintenance,
//   getRequests,
//   createRequest,
//   updateRequestStatus,
//   getAssetSummary
// };
import InventoryAssetsService from "../services/inventoryAssets.service.js";

// ===========================
// ASSETS MANAGEMENT
// ===========================

// Get all assets with filtering
export const getAllAssets = async (req, res) => {
  try {
    const filters = {
      asset_type: req.query.type,
      status: req.query.status,
      category: req.query.category,
      location: req.query.location,
      department: req.query.department,
      search: req.query.search,
      condition: req.query.condition,
    };

    const assets = await InventoryAssetsService.getAllAssets(filters);
    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single asset by ID
export const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await InventoryAssetsService.getAssetById(id);
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(404).json({ success: false, message: error.message });
  }
};

// Create new asset
export const createAsset = async (req, res) => {
  try {
    const asset = await InventoryAssetsService.createAsset(req.body);
    res.status(201).json({
      success: true,
      data: asset,
      message: "Asset created successfully",
    });
  } catch (error) {
    console.error("Error creating asset:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update asset
export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await InventoryAssetsService.updateAsset(id, req.body);
    res.status(200).json({
      success: true,
      data: asset,
      message: "Asset updated successfully",
    });
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete asset
export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    await InventoryAssetsService.deleteAsset(id);
    res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===========================
// ASSET CATEGORIES
// ===========================

export const getAllCategories = async (req, res) => {
  try {
    const categories = await InventoryAssetsService.getCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===========================
// ASSET TRANSFERS
// ===========================

export const createTransfer = async (req, res) => {
  try {
    const transfer = await InventoryAssetsService.createTransfer(req.body);
    res.status(201).json({
      success: true,
      data: transfer,
      message: "Transfer created successfully",
    });
  } catch (error) {
    console.error("Error creating transfer:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransfers = async (req, res) => {
  try {
    const filters = {
      asset_id: req.query.asset_id,
      approval_status: req.query.approval_status,
      transfer_type: req.query.transfer_type,
    };

    const transfers = await InventoryAssetsService.getTransfers(filters);
    res.status(200).json({ success: true, data: transfers });
  } catch (error) {
    console.error("Error fetching transfers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await InventoryAssetsService.updateTransfer(id, req.body);
    res.status(200).json({
      success: true,
      data: transfer,
      message: "Transfer updated successfully",
    });
  } catch (error) {
    console.error("Error updating transfer:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===========================
// ASSET MAINTENANCE
// ===========================

export const createMaintenance = async (req, res) => {
  try {
    const maintenance = await InventoryAssetsService.createMaintenance(
      req.body,
    );
    res.status(201).json({
      success: true,
      data: maintenance,
      message: "Maintenance record created successfully",
    });
  } catch (error) {
    console.error("Error creating maintenance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMaintenanceRecords = async (req, res) => {
  try {
    const filters = {
      asset_id: req.query.asset_id,
      maintenance_type: req.query.maintenance_type,
      maintenance_status: req.query.maintenance_status,
    };

    const maintenance = await InventoryAssetsService.getMaintenance(filters);
    res.status(200).json({ success: true, data: maintenance });
  } catch (error) {
    console.error("Error fetching maintenance records:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const maintenance = await InventoryAssetsService.updateMaintenance(
      id,
      req.body,
    );
    res.status(200).json({
      success: true,
      data: maintenance,
      message: "Maintenance record updated successfully",
    });
  } catch (error) {
    console.error("Error updating maintenance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===========================
// ASSET REQUESTS
// ===========================

export const createRequest = async (req, res) => {
  try {
    const request = await InventoryAssetsService.createRequest(req.body);
    res.status(201).json({
      success: true,
      data: request,
      message: "Request created successfully",
    });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const filters = {
      request_type: req.query.request_type,
      status: req.query.status,
      priority: req.query.priority,
    };

    const requests = await InventoryAssetsService.getRequests(filters);
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await InventoryAssetsService.updateRequest(id, req.body);
    res.status(200).json({
      success: true,
      data: request,
      message: "Request status updated successfully",
    });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===========================
// REPORTS & ANALYTICS
// ===========================

export const getAssetSummary = async (req, res) => {
  try {
    const statistics = await InventoryAssetsService.getStatistics();
    res.status(200).json({ success: true, data: statistics });
  } catch (error) {
    console.error("Error fetching asset summary:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAllCategories,
  getTransfers,
  createTransfer,
  getMaintenanceRecords,
  createMaintenance,
  updateMaintenance,
  getRequests,
  createRequest,
  updateRequestStatus,
  getAssetSummary,
};
