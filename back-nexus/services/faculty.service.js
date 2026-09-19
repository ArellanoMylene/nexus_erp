import Faculty from "../model/faculty.model.js";

const FacultyService = {
  // Get all faculty members
  async getAllFaculty() {
    try {
      const [faculty] = await Faculty.getAll();
      return { success: true, data: faculty };
    } catch (error) {
      console.error("Error getting all faculty:", error);
      return { success: false, message: "Failed to retrieve faculty members" };
    }
  },

  // Get faculty by user ID
  async getFacultyById(userId) {
    try {
      const [faculty] = await Faculty.getById(userId);
      if (faculty.length === 0) {
        return { success: false, message: "Faculty member not found" };
      }
      return { success: true, data: faculty[0] };
    } catch (error) {
      console.error("Error getting faculty by ID:", error);
      return { success: false, message: "Failed to retrieve faculty member" };
    }
  },

  // Get faculty by department
  async getFacultyByDepartment(departmentId) {
    try {
      const [faculty] = await Faculty.getByDepartment(departmentId);
      return { success: true, data: faculty };
    } catch (error) {
      console.error("Error getting faculty by department:", error);
      return { success: false, message: "Failed to retrieve faculty members" };
    }
  },

  // Create new faculty member
  async createFaculty(facultyData) {
    try {
      // Check if employee ID already exists
      const [existing] = await Faculty.getByEmployeeId(facultyData.employee_id);
      if (existing.length > 0) {
        return { success: false, message: "Employee ID already exists" };
      }

      const [result] = await Faculty.create(facultyData);
      return {
        success: true,
        message: "Faculty member created successfully",
        data: { faculty_id: result.insertId },
      };
    } catch (error) {
      console.error("Error creating faculty:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return { success: false, message: "Email already exists" };
      }
      return { success: false, message: "Failed to create faculty member" };
    }
  },

  // Update faculty member
  async updateFaculty(userId, facultyData) {
    try {
      const [result] = await Faculty.update(userId, facultyData);
      if (result.affectedRows === 0) {
        return { success: false, message: "Faculty member not found" };
      }
      return { success: true, message: "Faculty member updated successfully" };
    } catch (error) {
      console.error("Error updating faculty:", error);
      return { success: false, message: "Failed to update faculty member" };
    }
  },

  // Delete faculty member
  async deleteFaculty(userId) {
    try {
      const [result] = await Faculty.delete(userId);
      if (result.affectedRows === 0) {
        return { success: false, message: "Faculty member not found" };
      }
      return { success: true, message: "Faculty member deleted successfully" };
    } catch (error) {
      console.error("Error deleting faculty:", error);
      return { success: false, message: "Failed to delete faculty member" };
    }
  },

  // Get faculty statistics
  async getFacultyStats() {
    try {
      const [stats] = await Faculty.getStats();
      return { success: true, data: stats[0] };
    } catch (error) {
      console.error("Error getting faculty stats:", error);
      return {
        success: false,
        message: "Failed to retrieve faculty statistics",
      };
    }
  },
};

export default FacultyService;
