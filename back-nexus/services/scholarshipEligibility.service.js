import EligibilityScreeningModel from "../model/scholarshipEligibility.model.js";

const EligibilityScreeningService = {
  async getAllScreenings(filters) {
    return await EligibilityScreeningModel.getAllScreenings(filters);
  },

  async getScreeningById(id) {
    const screening = await EligibilityScreeningModel.getScreeningById(id);
    if (!screening) {
      throw new Error("Screening record not found");
    }
    return screening;
  },

  async createScreening(data) {
    // Validate required fields
    if (!data.application_id || !data.scholarship_id || !data.student_id || !data.academic_period_id || !data.screened_by) {
      throw new Error("Application, scholarship program, student, academic period, and screener are required");
    }

    // Set screening date if not provided
    if (!data.screening_date) {
      data.screening_date = new Date().toISOString().split('T')[0];
    }

    // Calculate overall eligibility
    const allRequirementsMet =
      (data.gpa_requirement_met || false) &&
      (data.year_level_eligible || false) &&
      (data.course_eligible || false) &&
      (data.income_requirement_met || false) &&
      (data.documents_complete || false) &&
      (!data.interview_required || data.interview_completed);

    data.overall_eligible = allRequirementsMet;

    // Set screening status based on eligibility
    if (!data.screening_status) {
      if (allRequirementsMet) {
        data.screening_status = 'Passed';
      } else if (data.documents_complete === false) {
        data.screening_status = 'Pending Review';
      } else {
        data.screening_status = 'Failed';
      }
    }

    const id = await EligibilityScreeningModel.createScreening(data);
    return await EligibilityScreeningModel.getScreeningById(id);
  },

  async updateScreening(id, data) {
    const existing = await EligibilityScreeningModel.getScreeningById(id);
    if (!existing) {
      throw new Error("Screening record not found");
    }

    // Recalculate overall eligibility if criteria changed
    if (data.gpa_requirement_met !== undefined ||
      data.year_level_eligible !== undefined ||
      data.course_eligible !== undefined ||
      data.income_requirement_met !== undefined ||
      data.documents_complete !== undefined ||
      data.interview_completed !== undefined) {

      const gpaOk = data.gpa_requirement_met !== undefined ? data.gpa_requirement_met : existing.gpa_requirement_met;
      const yearOk = data.year_level_eligible !== undefined ? data.year_level_eligible : existing.year_level_eligible;
      const courseOk = data.course_eligible !== undefined ? data.course_eligible : existing.course_eligible;
      const incomeOk = data.income_requirement_met !== undefined ? data.income_requirement_met : existing.income_requirement_met;
      const docsOk = data.documents_complete !== undefined ? data.documents_complete : existing.documents_complete;
      const interviewOk = !existing.interview_required || (data.interview_completed !== undefined ? data.interview_completed : existing.interview_completed);

      data.overall_eligible = gpaOk && yearOk && courseOk && incomeOk && docsOk && interviewOk;
    }

    await EligibilityScreeningModel.updateScreening(id, data);
    return await EligibilityScreeningModel.getScreeningById(id);
  },

  async deleteScreening(id) {
    const existing = await EligibilityScreeningModel.getScreeningById(id);
    if (!existing) {
      throw new Error("Screening record not found");
    }
    return await EligibilityScreeningModel.deleteScreening(id);
  },

  async getStatistics() {
    return await EligibilityScreeningModel.getStatistics();
  },
};

export default EligibilityScreeningService;
