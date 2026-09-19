import GradeEntriesService from "../services/gradeEntries.service.js";

const GradeEntriesController = {
  getAllEntries: async (req, res) => {
    try {
      const filters = {
        student_id: req.query.student_id,
        course_id: req.query.course_id,
        section_id: req.query.section_id,
        period_id: req.query.period_id,
        submitted_by: req.query.submitted_by,
        approval_status: req.query.approval_status,
        component_type: req.query.component_type,
      };

      const result = await GradeEntriesService.getAllEntries(filters);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getAllEntries controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  getEntryById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await GradeEntriesService.getEntryById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getEntryById controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  createEntry: async (req, res) => {
    try {
      const entryData = req.body;
      const result = await GradeEntriesService.createEntry(entryData);

      res.status(201).json(result);
    } catch (error) {
      console.error("Error in createEntry controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  updateEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const entryData = req.body;
      const result = await GradeEntriesService.updateEntry(id, entryData);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in updateEntry controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  deleteEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await GradeEntriesService.deleteEntry(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in deleteEntry controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  approveEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const { approved_by } = req.body;

      if (!approved_by) {
        return res
          .status(400)
          .json({ success: false, message: "approved_by is required" });
      }

      const result = await GradeEntriesService.approveEntry(id, approved_by);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in approveEntry controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  rejectEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const { approved_by, rejection_reason } = req.body;

      if (!approved_by) {
        return res
          .status(400)
          .json({ success: false, message: "approved_by is required" });
      }

      const result = await GradeEntriesService.rejectEntry(
        id,
        approved_by,
        rejection_reason
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in rejectEntry controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  getPendingCount: async (req, res) => {
    try {
      const result = await GradeEntriesService.getPendingCount();
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getPendingCount controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // Sync graded submissions from LMS to grade_entries
  syncFromSubmissions: async (req, res) => {
    try {
      const { course_id, period_id } = req.query;
      const submitted_by = req.body.submitted_by; // Faculty ID

      if (!course_id || !period_id || !submitted_by) {
        return res.status(400).json({
          success: false,
          message: "course_id, period_id, and submitted_by are required",
        });
      }

      const result = await GradeEntriesService.syncFromSubmissions(
        course_id,
        period_id,
        submitted_by
      );

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in syncFromSubmissions controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to sync submissions",
        error: error.message,
      });
    }
  },
};

export default GradeEntriesController;
