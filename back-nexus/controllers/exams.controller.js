import ExamsService from "../services/exams.service.js";

const ExamsController = {
  getAllExams: async (req, res) => {
    try {
      const filters = {
        course_id: req.query.course_id,
        section_id: req.query.section_id,
        period_id: req.query.period_id,
        exam_type: req.query.exam_type,
        status: req.query.status,
      };

      const result = await ExamsService.getAllExams(filters);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getAllExams controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  getExamById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ExamsService.getExamById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getExamById controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  createExam: async (req, res) => {
    try {
      const examData = req.body;
      const result = await ExamsService.createExam(examData);

      res.status(201).json(result);
    } catch (error) {
      console.error("Error in createExam controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  updateExam: async (req, res) => {
    try {
      const { id } = req.params;
      const examData = req.body;
      const result = await ExamsService.updateExam(id, examData);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in updateExam controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  deleteExam: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ExamsService.deleteExam(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in deleteExam controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  getExamsByFaculty: async (req, res) => {
    try {
      const { faculty_id } = req.params;
      const result = await ExamsService.getExamsByFaculty(faculty_id);

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getExamsByFaculty controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};

export default ExamsController;
