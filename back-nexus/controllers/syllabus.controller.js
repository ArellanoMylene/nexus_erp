import SyllabusService from "../services/syllabus.service.js";

const SyllabusController = {
  getAllSyllabi: async (req, res) => {
    try {
      const filters = {
        course_id: req.query.course_id,
        period_id: req.query.period_id,
        search: req.query.search,
      };

      const syllabi = await SyllabusService.getAllSyllabi(filters);
      res.status(200).json(syllabi);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  getSyllabusById: async (req, res) => {
    try {
      const syllabus = await SyllabusService.getSyllabusById(req.params.id);
      res.status(200).json(syllabus);
    } catch (error) {
      console.error(error);
      res.status(404).json({ error: error.message });
    }
  },

  createSyllabus: async (req, res) => {
    try {
      const syllabus = await SyllabusService.createSyllabus(req.body);
      res.status(201).json(syllabus);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  },

  updateSyllabus: async (req, res) => {
    try {
      const syllabus = await SyllabusService.updateSyllabus(
        req.params.id,
        req.body,
      );
      res.status(200).json(syllabus);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  },

  deleteSyllabus: async (req, res) => {
    try {
      const result = await SyllabusService.deleteSyllabus(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  },
};

export default SyllabusController;
