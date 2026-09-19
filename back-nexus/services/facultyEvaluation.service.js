import FacultyEvaluation from "../model/facultyEvaluation.model.js";

const FacultyEvaluationService = {
  // Get all evaluations
  async getAllEvaluations() {
    try {
      const [evaluations] = await FacultyEvaluation.getAll();
      return { success: true, data: evaluations };
    } catch (error) {
      console.error("Error getting all evaluations:", error);
      return { success: false, message: "Failed to retrieve evaluations" };
    }
  },

  // Get evaluations by faculty ID
  async getEvaluationsByFacultyId(facultyUserId) {
    try {
      const [evaluations] = await FacultyEvaluation.getByFacultyId(
        facultyUserId
      );
      return { success: true, data: evaluations };
    } catch (error) {
      console.error("Error getting evaluations by faculty:", error);
      return { success: false, message: "Failed to retrieve evaluations" };
    }
  },

  // Get evaluation by ID
  async getEvaluationById(evaluationId) {
    try {
      const [evaluation] = await FacultyEvaluation.getById(evaluationId);
      if (evaluation.length === 0) {
        return { success: false, message: "Evaluation not found" };
      }
      return { success: true, data: evaluation[0] };
    } catch (error) {
      console.error("Error getting evaluation by ID:", error);
      return { success: false, message: "Failed to retrieve evaluation" };
    }
  },

  // Get evaluations by academic period
  async getEvaluationsByAcademicPeriod(periodId) {
    try {
      const [evaluations] = await FacultyEvaluation.getByAcademicPeriod(
        periodId
      );
      return { success: true, data: evaluations };
    } catch (error) {
      console.error("Error getting evaluations by period:", error);
      return { success: false, message: "Failed to retrieve evaluations" };
    }
  },

  // Create new evaluation
  async createEvaluation(evaluationData) {
    try {
      // Validate rating values (1-5)
      const ratings = [
        evaluationData.teaching_effectiveness,
        evaluationData.subject_knowledge,
        evaluationData.classroom_management,
        evaluationData.communication_skills,
        evaluationData.professionalism,
        evaluationData.student_engagement,
      ];

      const invalidRatings = ratings.some((rating) => rating < 1 || rating > 5);
      if (invalidRatings) {
        return {
          success: false,
          message: "All ratings must be between 1 and 5",
        };
      }

      const [result] = await FacultyEvaluation.create(evaluationData);
      return {
        success: true,
        message: "Evaluation created successfully",
        data: { evaluation_id: result.insertId },
      };
    } catch (error) {
      console.error("Error creating evaluation:", error);
      return { success: false, message: "Failed to create evaluation" };
    }
  },

  // Update evaluation
  async updateEvaluation(evaluationId, evaluationData) {
    try {
      // Validate rating values (1-5)
      const ratings = [
        evaluationData.teaching_effectiveness,
        evaluationData.subject_knowledge,
        evaluationData.classroom_management,
        evaluationData.communication_skills,
        evaluationData.professionalism,
        evaluationData.student_engagement,
      ];

      const invalidRatings = ratings.some((rating) => rating < 1 || rating > 5);
      if (invalidRatings) {
        return {
          success: false,
          message: "All ratings must be between 1 and 5",
        };
      }

      const [result] = await FacultyEvaluation.update(
        evaluationId,
        evaluationData
      );
      if (result.affectedRows === 0) {
        return { success: false, message: "Evaluation not found" };
      }
      return { success: true, message: "Evaluation updated successfully" };
    } catch (error) {
      console.error("Error updating evaluation:", error);
      return { success: false, message: "Failed to update evaluation" };
    }
  },

  // Delete evaluation
  async deleteEvaluation(evaluationId) {
    try {
      const [result] = await FacultyEvaluation.delete(evaluationId);
      if (result.affectedRows === 0) {
        return { success: false, message: "Evaluation not found" };
      }
      return { success: true, message: "Evaluation deleted successfully" };
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      return { success: false, message: "Failed to delete evaluation" };
    }
  },

  // Get average ratings for faculty
  async getAverageRatings(facultyUserId, academicPeriodId = null) {
    try {
      const [ratings] = await FacultyEvaluation.getAverageRatings(
        facultyUserId,
        academicPeriodId
      );
      return { success: true, data: ratings[0] };
    } catch (error) {
      console.error("Error getting average ratings:", error);
      return { success: false, message: "Failed to retrieve average ratings" };
    }
  },
};

export default FacultyEvaluationService;
