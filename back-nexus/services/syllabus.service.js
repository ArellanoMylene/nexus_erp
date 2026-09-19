import SyllabusModel from "../model/syllabus.model.js";

const SyllabusService = {
  getAllSyllabi: async (filters) => {
    try {
      return await SyllabusModel.getAllSyllabi(filters);
    } catch (error) {
      throw new Error(`Error fetching syllabi: ${error.message}`);
    }
  },

  getSyllabusById: async (id) => {
    try {
      const syllabus = await SyllabusModel.getSyllabusById(id);
      if (!syllabus) {
        throw new Error("Syllabus not found");
      }
      return syllabus;
    } catch (error) {
      throw new Error(`Error fetching syllabus: ${error.message}`);
    }
  },

  createSyllabus: async (syllabusData) => {
    try {
      if (!syllabusData.course_id || !syllabusData.file_name) {
        throw new Error("Missing required fields");
      }

      const syllabusId = await SyllabusModel.createSyllabus(syllabusData);
      return await SyllabusModel.getSyllabusById(syllabusId);
    } catch (error) {
      throw new Error(`Error creating syllabus: ${error.message}`);
    }
  },

  updateSyllabus: async (id, syllabusData) => {
    try {
      const updated = await SyllabusModel.updateSyllabus(id, syllabusData);
      if (!updated) {
        throw new Error("Syllabus not found or not updated");
      }
      return await SyllabusModel.getSyllabusById(id);
    } catch (error) {
      throw new Error(`Error updating syllabus: ${error.message}`);
    }
  },

  deleteSyllabus: async (id) => {
    try {
      const deleted = await SyllabusModel.deleteSyllabus(id);
      if (!deleted) {
        throw new Error("Syllabus not found");
      }
      return { message: "Syllabus deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting syllabus: ${error.message}`);
    }
  },
};

export default SyllabusService;
