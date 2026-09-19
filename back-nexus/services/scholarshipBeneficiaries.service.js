import ScholarshipBeneficiariesModel from "../model/scholarshipBeneficiaries.model.js";
import { getAcademicPeriodById } from "../model/academicPeriods.model.js";

const ScholarshipBeneficiariesService = {
  async getAllBeneficiaries(filters) {
    return await ScholarshipBeneficiariesModel.getAllBeneficiaries(filters);
  },

  async getBeneficiaryById(id) {
    const beneficiary = await ScholarshipBeneficiariesModel.getBeneficiaryById(id);
    if (!beneficiary) {
      throw new Error("Beneficiary not found");
    }
    return beneficiary;
  },

  async createBeneficiary(data) {
    // Validate required fields
    if (!data.application_id || !data.scholarship_id || !data.student_id || !data.academic_period_id) {
      throw new Error("Application, scholarship program, student, and academic period are required");
    }

    if (!data.start_date || !data.total_grant_amount) {
      throw new Error("Start date and total grant amount are required");
    }

    // Fetch academic period to populate year and semester
    const period = await getAcademicPeriodById(data.academic_period_id);
    if (period) {
      data.academic_year = period.school_year;
      data.semester = period.semester;
    }

    const id = await ScholarshipBeneficiariesModel.createBeneficiary(data);
    return await ScholarshipBeneficiariesModel.getBeneficiaryById(id);
  },

  async updateBeneficiary(id, data) {
    const existing = await ScholarshipBeneficiariesModel.getBeneficiaryById(id);
    if (!existing) {
      throw new Error("Beneficiary not found");
    }

    // If academic_period_id is updated, refresh year and semester
    if (data.academic_period_id && data.academic_period_id !== existing.academic_period_id) {
      const period = await getAcademicPeriodById(data.academic_period_id);
      if (period) {
        data.academic_year = period.school_year;
        data.semester = period.semester;
      }
    }

    // Update disbursement status based on amounts
    if (data.total_disbursed !== undefined && data.total_grant_amount !== undefined) {
      if (data.total_disbursed >= data.total_grant_amount) {
        data.disbursement_status = 'Completed';
      } else if (data.total_disbursed > 0) {
        data.disbursement_status = 'Partial';
      } else {
        data.disbursement_status = 'Pending';
      }
    }

    await ScholarshipBeneficiariesModel.updateBeneficiary(id, data);
    return await ScholarshipBeneficiariesModel.getBeneficiaryById(id);
  },

  async deleteBeneficiary(id) {
    const existing = await ScholarshipBeneficiariesModel.getBeneficiaryById(id);
    if (!existing) {
      throw new Error("Beneficiary not found");
    }
    return await ScholarshipBeneficiariesModel.deleteBeneficiary(id);
  },

  async getStatistics() {
    return await ScholarshipBeneficiariesModel.getStatistics();
  },
};

export default ScholarshipBeneficiariesService;
