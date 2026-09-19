import DigitalLibraryModel from "../model/digitalLibrary.model.js";

const DigitalLibraryService = {
  getAllDigitalResources: async (filters) => {
    try {
      return await DigitalLibraryModel.getAllDigitalResources(filters);
    } catch (error) {
      throw new Error(`Error fetching digital resources: ${error.message}`);
    }
  },

  getDigitalResourceById: async (id) => {
    try {
      const resource = await DigitalLibraryModel.getDigitalResourceById(id);
      if (!resource) {
        throw new Error("Digital resource not found");
      }
      return resource;
    } catch (error) {
      throw new Error(`Error fetching digital resource: ${error.message}`);
    }
  },

  createDigitalResource: async (resourceData) => {
    try {
      if (!resourceData.title || !resourceData.file_name || !resourceData.file_path) {
        throw new Error("Missing required fields: title, file_name, and file_path are required");
      }

      const resourceId = await DigitalLibraryModel.createDigitalResource(resourceData);
      return await DigitalLibraryModel.getDigitalResourceById(resourceId);
    } catch (error) {
      throw new Error(`Error creating digital resource: ${error.message}`);
    }
  },

  updateDigitalResource: async (id, resourceData) => {
    try {
      const updated = await DigitalLibraryModel.updateDigitalResource(id, resourceData);
      if (!updated) {
        throw new Error("Digital resource not found or not updated");
      }
      return await DigitalLibraryModel.getDigitalResourceById(id);
    } catch (error) {
      throw new Error(`Error updating digital resource: ${error.message}`);
    }
  },

  deleteDigitalResource: async (id) => {
    try {
      const deleted = await DigitalLibraryModel.deleteDigitalResource(id);
      if (!deleted) {
        throw new Error("Digital resource not found or already deleted");
      }
      return { message: "Digital resource deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting digital resource: ${error.message}`);
    }
  },

  incrementViewCount: async (id) => {
    try {
      await DigitalLibraryModel.incrementViewCount(id);
      return { message: "View count incremented" };
    } catch (error) {
      throw new Error(`Error incrementing view count: ${error.message}`);
    }
  },

  incrementDownloadCount: async (id) => {
    try {
      await DigitalLibraryModel.incrementDownloadCount(id);
      return { message: "Download count incremented" };
    } catch (error) {
      throw new Error(`Error incrementing download count: ${error.message}`);
    }
  },

  getStatistics: async () => {
    try {
      return await DigitalLibraryModel.getStatistics();
    } catch (error) {
      throw new Error(`Error fetching statistics: ${error.message}`);
    }
  },
};

export default DigitalLibraryService;
