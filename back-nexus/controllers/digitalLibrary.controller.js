import DigitalLibraryService from "../services/digitalLibrary.service.js";

const DigitalLibraryController = {
  getAllDigitalResources: async (req, res) => {
    try {
      const filters = {
        category: req.query.category,
        access_level: req.query.access_level,
        search: req.query.search,
      };

      const resources =
        await DigitalLibraryService.getAllDigitalResources(filters);
      res.status(200).json(resources);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getDigitalResourceById: async (req, res) => {
    try {
      const resource = await DigitalLibraryService.getDigitalResourceById(
        req.params.id,
      );
      res.status(200).json(resource);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  createDigitalResource: async (req, res) => {
    try {
      const resource = await DigitalLibraryService.createDigitalResource(
        req.body,
      );
      res.status(201).json(resource);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateDigitalResource: async (req, res) => {
    try {
      const resource = await DigitalLibraryService.updateDigitalResource(
        req.params.id,
        req.body,
      );
      res.status(200).json(resource);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteDigitalResource: async (req, res) => {
    try {
      const result = await DigitalLibraryService.deleteDigitalResource(
        req.params.id,
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  incrementViewCount: async (req, res) => {
    try {
      const result = await DigitalLibraryService.incrementViewCount(
        req.params.id,
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  incrementDownloadCount: async (req, res) => {
    try {
      const result = await DigitalLibraryService.incrementDownloadCount(
        req.params.id,
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getStatistics: async (req, res) => {
    try {
      const stats = await DigitalLibraryService.getStatistics();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default DigitalLibraryController;
