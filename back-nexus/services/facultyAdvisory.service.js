import FacultyAdvisory from "../model/facultyAdvisory.model.js";

const FacultyAdvisoryService = {
  // Get all advisory assignments
  async getAllAdvisories() {
    try {
      const [advisories] = await FacultyAdvisory.getAll();
      return { success: true, data: advisories };
    } catch (error) {
      console.error("Error getting all advisories:", error);
      return {
        success: false,
        message: "Failed to retrieve advisory assignments",
      };
    }
  },

  // Get advisories by faculty ID
  async getAdvisoriesByFacultyId(facultyUserId) {
    try {
      const [advisories] = await FacultyAdvisory.getByFacultyId(facultyUserId);
      return { success: true, data: advisories };
    } catch (error) {
      console.error("Error getting advisories by faculty:", error);
      return { success: false, message: "Failed to retrieve advisories" };
    }
  },

  // Get advisory by student ID
  async getAdvisoryByStudentId(studentId) {
    try {
      const [advisory] = await FacultyAdvisory.getByStudentId(studentId);
      return { success: true, data: advisory };
    } catch (error) {
      console.error("Error getting advisory by student:", error);
      return { success: false, message: "Failed to retrieve advisory" };
    }
  },

  // Get advisory by ID
  async getAdvisoryById(advisoryId) {
    try {
      const [advisory] = await FacultyAdvisory.getById(advisoryId);
      if (advisory.length === 0) {
        return { success: false, message: "Advisory assignment not found" };
      }
      return { success: true, data: advisory[0] };
    } catch (error) {
      console.error("Error getting advisory by ID:", error);
      return { success: false, message: "Failed to retrieve advisory" };
    }
  },

  // Create new advisory assignment
  async createAdvisory(advisoryData) {
    try {
      const [result] = await FacultyAdvisory.create(advisoryData);
      return {
        success: true,
        message: "Advisory assignment created successfully",
        data: { advisory_id: result.insertId },
      };
    } catch (error) {
      console.error("Error creating advisory:", error);
      return {
        success: false,
        message: "Failed to create advisory assignment",
      };
    }
  },

  // Update advisory assignment
  async updateAdvisory(advisoryId, advisoryData) {
    try {
      const [result] = await FacultyAdvisory.update(advisoryId, advisoryData);
      if (result.affectedRows === 0) {
        return { success: false, message: "Advisory assignment not found" };
      }
      return {
        success: true,
        message: "Advisory assignment updated successfully",
      };
    } catch (error) {
      console.error("Error updating advisory:", error);
      return {
        success: false,
        message: "Failed to update advisory assignment",
      };
    }
  },

  // Delete advisory assignment
  async deleteAdvisory(advisoryId) {
    try {
      const [result] = await FacultyAdvisory.delete(advisoryId);
      if (result.affectedRows === 0) {
        return { success: false, message: "Advisory assignment not found" };
      }
      return {
        success: true,
        message: "Advisory assignment deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting advisory:", error);
      return {
        success: false,
        message: "Failed to delete advisory assignment",
      };
    }
  },

  // Get advisory load for faculty
  async getAdvisoryLoad(facultyUserId, academicPeriodId) {
    try {
      const [load] = await FacultyAdvisory.getAdvisoryLoad(
        facultyUserId,
        academicPeriodId
      );
      return { success: true, data: load[0] };
    } catch (error) {
      console.error("Error getting advisory load:", error);
      return { success: false, message: "Failed to retrieve advisory load" };
    }
  },

  // Get students without advisors
  async getStudentsWithoutAdvisors(academicPeriodId) {
    try {
      const [students] = await FacultyAdvisory.getStudentsWithoutAdvisors(
        academicPeriodId
      );
      return { success: true, data: students };
    } catch (error) {
      console.error("Error getting students without advisors:", error);
      return { success: false, message: "Failed to retrieve students" };
    }
  },
};

export default FacultyAdvisoryService;
