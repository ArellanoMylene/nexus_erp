import SectionsService from "../services/sections.service.js";

const SectionsController = {
  getAllSections: async (req, res) => {
    try {
      const filters = {
        period_id: req.query.period_id,
        program_id: req.query.program_id,
        search: req.query.search,
      };

      const sections = await SectionsService.getAllSections(filters);
      res.status(200).json(sections);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getSectionById: async (req, res) => {
    try {
      const section = await SectionsService.getSectionById(req.params.id);
      res.status(200).json(section);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  createSection: async (req, res) => {
    try {
      const section = await SectionsService.createSection(req.body);
      res.status(201).json(section);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateSection: async (req, res) => {
    try {
      const section = await SectionsService.updateSection(
        req.params.id,
        req.body
      );
      res.status(200).json(section);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteSection: async (req, res) => {
    try {
      const result = await SectionsService.deleteSection(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getEnrollmentCount: async (req, res) => {
    try {
      const count = await SectionsService.getEnrollmentCount(req.params.id);
      res.status(200).json({ count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default SectionsController;
