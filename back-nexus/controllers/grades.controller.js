import GradesService from "../services/grades.service.js";

const GradesController = {
  getAllGrades: async (req, res) => {
    try {
      const filters = {
        student_user_id: req.query.student_user_id,
        course_id: req.query.course_id,
        period_id: req.query.period_id,
      };

      const grades = await GradesService.getAllGrades(filters);
      res.status(200).json(grades);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getGradeById: async (req, res) => {
    try {
      const grade = await GradesService.getGradeById(req.params.id);
      res.status(200).json(grade);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // Bulk-approves all grade_entries for this student/course/period
  approveGrade: async (req, res) => {
    try {
      const grade = await GradesService.approveGrade(
        req.params.id,
        req.body.approved_by
      );
      res.status(200).json(grade);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

export default GradesController;