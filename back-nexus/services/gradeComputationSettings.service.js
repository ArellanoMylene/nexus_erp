import GradeComputationSettingsModel from "../model/gradeComputationSettings.model.js";

const GradeComputationSettingsService = {
  getAllSettings: async (filters) => {
    try {
      const settings = await GradeComputationSettingsModel.getAll(filters);
      return { success: true, data: settings };
    } catch (error) {
      console.error("Error in getAllSettings service:", error);
      throw error;
    }
  },

  getSettingById: async (settingId) => {
    try {
      const setting = await GradeComputationSettingsModel.getById(settingId);
      if (!setting) {
        return { success: false, message: "Setting not found" };
      }
      return { success: true, data: setting };
    } catch (error) {
      console.error("Error in getSettingById service:", error);
      throw error;
    }
  },

  getSettingsByCourseAndPeriod: async (
    courseId,
    periodId,
    sectionId = null
  ) => {
    try {
      const settings = await GradeComputationSettingsModel.getByCourseAndPeriod(
        courseId,
        periodId,
        sectionId
      );
      return { success: true, data: settings };
    } catch (error) {
      console.error("Error in getSettingsByCourseAndPeriod service:", error);
      throw error;
    }
  },

  createSetting: async (settingData) => {
    try {
      // Validate that total weights don't exceed 100%
      const currentTotal = await GradeComputationSettingsModel.validateWeights(
        settingData.course_id,
        settingData.period_id,
        settingData.section_id
      );

      const newTotal =
        parseFloat(currentTotal) + parseFloat(settingData.weight);

      if (newTotal > 100) {
        return {
          success: false,
          message: `Total weight would exceed 100%. Current total: ${currentTotal}%, New weight: ${settingData.weight}%`,
        };
      }

      const settingId = await GradeComputationSettingsModel.create(settingData);
      return {
        success: true,
        settingId,
        message: "Grade computation setting created successfully",
      };
    } catch (error) {
      console.error("Error in createSetting service:", error);
      throw error;
    }
  },

  updateSetting: async (settingId, settingData) => {
    try {
      // Get current setting to exclude its weight from validation
      const currentSetting = await GradeComputationSettingsModel.getById(
        settingId
      );
      if (!currentSetting) {
        return { success: false, message: "Setting not found" };
      }

      // Validate total weights
      const currentTotal = await GradeComputationSettingsModel.validateWeights(
        settingData.course_id,
        settingData.period_id,
        settingData.section_id
      );

      const newTotal =
        parseFloat(currentTotal) -
        parseFloat(currentSetting.weight) +
        parseFloat(settingData.weight);

      if (newTotal > 100) {
        return {
          success: false,
          message: `Total weight would exceed 100%. Current total: ${currentTotal}%, Adjustment would result in: ${newTotal}%`,
        };
      }

      const affectedRows = await GradeComputationSettingsModel.update(
        settingId,
        settingData
      );
      if (affectedRows === 0) {
        return {
          success: false,
          message: "Setting not found or no changes made",
        };
      }
      return {
        success: true,
        message: "Grade computation setting updated successfully",
      };
    } catch (error) {
      console.error("Error in updateSetting service:", error);
      throw error;
    }
  },

  deleteSetting: async (settingId) => {
    try {
      const affectedRows = await GradeComputationSettingsModel.delete(
        settingId
      );
      if (affectedRows === 0) {
        return { success: false, message: "Setting not found" };
      }
      return {
        success: true,
        message: "Grade computation setting deleted successfully",
      };
    } catch (error) {
      console.error("Error in deleteSetting service:", error);
      throw error;
    }
  },

  validateWeights: async (courseId, periodId, sectionId = null) => {
    try {
      const totalWeight = await GradeComputationSettingsModel.validateWeights(
        courseId,
        periodId,
        sectionId
      );
      return {
        success: true,
        totalWeight,
        isValid: totalWeight === 100,
        message:
          totalWeight === 100
            ? "Weights are valid (total: 100%)"
            : `Warning: Total weights equal ${totalWeight}%`,
      };
    } catch (error) {
      console.error("Error in validateWeights service:", error);
      throw error;
    }
  },
};

export default GradeComputationSettingsService;
