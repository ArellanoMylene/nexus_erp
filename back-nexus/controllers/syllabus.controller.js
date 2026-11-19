import SyllabusService from "../services/syllabus.service.js";

const SyllabusController = {
  visibilityFilter: (req) => {
    const role = String(req.user?.role || "").toLowerCase();
    const userId = req.user?.userId || req.user?.user_id;
    if (role === "faculty") return { faculty_user_id: userId };
    if (role === "student") return { student_id: userId };
    return {};
  },
  getAllSyllabi: async (req, res) => {
    try {
      const filters = {
        course_id: req.query.course_id,
        period_id: req.query.period_id,
        search: req.query.search,
        ...SyllabusController.visibilityFilter(req),
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
      const role = String(req.user?.role || "").toLowerCase();
      if (role === "faculty" || role === "student") {
        const allowed = await SyllabusService.getAllSyllabi({
          ...SyllabusController.visibilityFilter(req),
          course_id: syllabus.course_id,
          period_id: syllabus.period_id,
        });
        if (!allowed.some((item) => String(item.syllabus_id) === String(syllabus.syllabus_id))) {
          return res.status(403).json({ error: "You do not have access to this syllabus" });
        }
      }
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
