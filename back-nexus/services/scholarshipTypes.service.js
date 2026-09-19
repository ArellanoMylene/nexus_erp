import ScholarshipTypesModel from "../model/scholarshipTypes.model.js";

const ScholarshipTypesService = {
  async getAllScholarshipTypes(filters) {
    return await ScholarshipTypesModel.getAllScholarshipTypes(filters);
  },

  async getScholarshipTypeById(id) {
    const scholarshipType = await ScholarshipTypesModel.getScholarshipTypeById(id);
    if (!scholarshipType) {
      throw new Error("Scholarship type not found");
    }
    return scholarshipType;
  },

  async createScholarshipType(data) {
    // Validate required fields
    if (!data.scholarship_name || !data.scholarship_code) {
      throw new Error("Scholarship name and code are required");
    }

    // Calculate slots_available
    if (data.total_slots) {
      data.slots_available = data.total_slots - (data.slots_filled || 0);
    }

    // Calculate remaining_budget
    if (data.total_budget) {
      data.remaining_budget = data.total_budget - (data.allocated_budget || 0);
    }

    const id = await ScholarshipTypesModel.createScholarshipType(data);
    return await ScholarshipTypesModel.getScholarshipTypeById(id);
  },

  async updateScholarshipType(id, data) {
    const existing = await ScholarshipTypesModel.getScholarshipTypeById(id);
    if (!existing) {
      throw new Error("Scholarship type not found");
    }

    // Recalculate slots_available
    if (data.total_slots !== undefined || data.slots_filled !== undefined) {
      const totalSlots = data.total_slots !== undefined ? data.total_slots : existing.total_slots;
      const slotsFilled = data.slots_filled !== undefined ? data.slots_filled : existing.slots_filled;
      data.slots_available = totalSlots - slotsFilled;
    }

    // Recalculate remaining_budget
    if (data.total_budget !== undefined || data.allocated_budget !== undefined) {
      const totalBudget = data.total_budget !== undefined ? data.total_budget : existing.total_budget;
      const allocatedBudget = data.allocated_budget !== undefined ? data.allocated_budget : existing.allocated_budget;
      data.remaining_budget = totalBudget - allocatedBudget;
    }

    await ScholarshipTypesModel.updateScholarshipType(id, data);
    return await ScholarshipTypesModel.getScholarshipTypeById(id);
  },

  async deleteScholarshipType(id) {
    const existing = await ScholarshipTypesModel.getScholarshipTypeById(id);
    if (!existing) {
      throw new Error("Scholarship type not found");
    }
    return await ScholarshipTypesModel.deleteScholarshipType(id);
  },

  async getStatistics() {
    return await ScholarshipTypesModel.getStatistics();
  },

  async getFundingSources() {
    return await ScholarshipTypesModel.getFundingSources();
  },
};

export default ScholarshipTypesService;
