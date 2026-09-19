import GradeComputationSettingsService from "../services/gradeComputationSettings.service.js";

const GradeComputationSettingsController = {
  getAllSettings: async (req, res) => {
    try {
      const filters = {
        course_id: req.query.course_id,
        section_id: req.query.section_id,
        period_id: req.query.period_id,
        component_type: req.query.component_type,
      };

      const result = await GradeComputationSettingsService.getAllSettings(
        filters
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getAllSettings controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  getSettingById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await GradeComputationSettingsService.getSettingById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getSettingById controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  getSettingsByCourseAndPeriod: async (req, res) => {
    try {
      const { course_id, period_id } = req.params;
      const { section_id } = req.query;

      const result =
        await GradeComputationSettingsService.getSettingsByCourseAndPeriod(
          course_id,
          period_id,
          section_id
        );

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getSettingsByCourseAndPeriod controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  createSetting: async (req, res) => {
    try {
      const settingData = req.body;
      const result = await GradeComputationSettingsService.createSetting(
        settingData
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error("Error in createSetting controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  updateSetting: async (req, res) => {
    try {
      const { id } = req.params;
      const settingData = req.body;
      const result = await GradeComputationSettingsService.updateSetting(
        id,
        settingData
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in updateSetting controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  deleteSetting: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await GradeComputationSettingsService.deleteSetting(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in deleteSetting controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  validateWeights: async (req, res) => {
    try {
      const { course_id, period_id } = req.params;
      const { section_id } = req.query;

      const result = await GradeComputationSettingsService.validateWeights(
        course_id,
        period_id,
        section_id
      );

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in validateWeights controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};

export default GradeComputationSettingsController;
