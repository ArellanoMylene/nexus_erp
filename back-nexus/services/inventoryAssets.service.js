import InventoryAssetsModel from "../model/inventoryAssets.model.js";

const InventoryAssetsService = {
  // Get all assets
  async getAllAssets(filters) {
    try {
      return await InventoryAssetsModel.getAll(filters);
    } catch (error) {
      throw new Error(`Error fetching assets: ${error.message}`);
    }
  },

  // Get asset by ID
  async getAssetById(id) {
    try {
      const asset = await InventoryAssetsModel.getById(id);
      if (!asset) {
        throw new Error("Asset not found");
      }
      return asset;
    } catch (error) {
      throw new Error(`Error fetching asset: ${error.message}`);
    }
  },

  // Create asset
  async createAsset(data) {
    try {
      const assetId = await InventoryAssetsModel.create(data);
      return await InventoryAssetsModel.getById(assetId);
    } catch (error) {
      throw new Error(`Error creating asset: ${error.message}`);
    }
  },

  // Update asset
  async updateAsset(id, data) {
    try {
      const affectedRows = await InventoryAssetsModel.update(id, data);
      if (affectedRows === 0) {
        throw new Error("Asset not found");
      }
      return await InventoryAssetsModel.getById(id);
    } catch (error) {
      throw new Error(`Error updating asset: ${error.message}`);
    }
  },

  // Delete asset
  async deleteAsset(id) {
    try {
      const affectedRows = await InventoryAssetsModel.delete(id);
      if (affectedRows === 0) {
        throw new Error("Asset not found");
      }
      return { message: "Asset deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting asset: ${error.message}`);
    }
  },

  // Get categories
  async getCategories() {
    try {
      return await InventoryAssetsModel.getCategories();
    } catch (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }
  },

  // Get transfers
  async getTransfers(filters) {
    try {
      return await InventoryAssetsModel.getTransfers(filters);
    } catch (error) {
      throw new Error(`Error fetching transfers: ${error.message}`);
    }
  },

  // Create transfer
  async createTransfer(data) {
    try {
      const transferId = await InventoryAssetsModel.createTransfer(data);
      const transfers = await InventoryAssetsModel.getTransfers({ transfer_id: transferId });
      return transfers[0];
    } catch (error) {
      throw new Error(`Error creating transfer: ${error.message}`);
    }
  },

  // Update transfer
  async updateTransfer(id, data) {
    try {
      const affectedRows = await InventoryAssetsModel.updateTransfer(id, data);
      if (affectedRows === 0) {
        throw new Error("Transfer not found");
      }
      const transfers = await InventoryAssetsModel.getTransfers({ transfer_id: id });
      return transfers[0];
    } catch (error) {
      throw new Error(`Error updating transfer: ${error.message}`);
    }
  },

  // Get maintenance records
  async getMaintenance(filters) {
    try {
      return await InventoryAssetsModel.getMaintenance(filters);
    } catch (error) {
      throw new Error(`Error fetching maintenance records: ${error.message}`);
    }
  },

  // Create maintenance record
  async createMaintenance(data) {
    try {
      const maintenanceId = await InventoryAssetsModel.createMaintenance(data);
      const maintenance = await InventoryAssetsModel.getMaintenance({ maintenance_id: maintenanceId });
      return maintenance[0];
    } catch (error) {
      throw new Error(`Error creating maintenance record: ${error.message}`);
    }
  },

  // Update maintenance record
  async updateMaintenance(id, data) {
    try {
      const affectedRows = await InventoryAssetsModel.updateMaintenance(id, data);
      if (affectedRows === 0) {
        throw new Error("Maintenance record not found");
      }
      const maintenance = await InventoryAssetsModel.getMaintenance({ maintenance_id: id });
      return maintenance[0];
    } catch (error) {
      throw new Error(`Error updating maintenance record: ${error.message}`);
    }
  },

  // Get requests
  async getRequests(filters) {
    try {
      return await InventoryAssetsModel.getRequests(filters);
    } catch (error) {
      throw new Error(`Error fetching requests: ${error.message}`);
    }
  },

  // Create request
  async createRequest(data) {
    try {
      const requestId = await InventoryAssetsModel.createRequest(data);
      const requests = await InventoryAssetsModel.getRequests({ request_id: requestId });
      return requests[0];
    } catch (error) {
      throw new Error(`Error creating request: ${error.message}`);
    }
  },

  // Update request
  async updateRequest(id, data) {
    try {
      const affectedRows = await InventoryAssetsModel.updateRequest(id, data);
      if (affectedRows === 0) {
        throw new Error("Request not found");
      }
      const requests = await InventoryAssetsModel.getRequests({ request_id: id });
      return requests[0];
    } catch (error) {
      throw new Error(`Error updating request: ${error.message}`);
    }
  },

  // Get statistics
  async getStatistics() {
    try {
      return await InventoryAssetsModel.getStatistics();
    } catch (error) {
      throw new Error(`Error fetching statistics: ${error.message}`);
    }
  },
};

export default InventoryAssetsService;
