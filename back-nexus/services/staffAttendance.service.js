import StaffAttendanceModel from "../model/staffAttendance.model.js";

const StaffAttendanceService = {
  // Get all staff attendance records
  async getAllStaffAttendance(filters) {
    try {
      return await StaffAttendanceModel.getAll(filters);
    } catch (error) {
      throw new Error(`Error fetching staff attendance: ${error.message}`);
    }
  },

  // Get staff attendance by ID
  async getStaffAttendanceById(id) {
    try {
      const attendance = await StaffAttendanceModel.getById(id);
      if (!attendance) {
        throw new Error("Staff attendance record not found");
      }
      return attendance;
    } catch (error) {
      throw new Error(`Error fetching staff attendance: ${error.message}`);
    }
  },

  // Create staff attendance record
  async createStaffAttendance(data) {
    try {
      const attendanceId = await StaffAttendanceModel.create(data);
      return await StaffAttendanceModel.getById(attendanceId);
    } catch (error) {
      throw new Error(`Error creating staff attendance: ${error.message}`);
    }
  },

  // Update staff attendance record
  async updateStaffAttendance(id, data) {
    try {
      const affectedRows = await StaffAttendanceModel.update(id, data);
      if (affectedRows === 0) {
        throw new Error("Staff attendance record not found");
      }
      return await StaffAttendanceModel.getById(id);
    } catch (error) {
      throw new Error(`Error updating staff attendance: ${error.message}`);
    }
  },

  // Delete staff attendance record
  async deleteStaffAttendance(id) {
    try {
      const affectedRows = await StaffAttendanceModel.delete(id);
      if (affectedRows === 0) {
        throw new Error("Staff attendance record not found");
      }
      return { message: "Staff attendance record deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting staff attendance: ${error.message}`);
    }
  },

  // Get attendance summary for a staff member
  async getStaffAttendanceSummary(user_id, date_from, date_to) {
    try {
      return await StaffAttendanceModel.getSummary(user_id, date_from, date_to);
    } catch (error) {
      throw new Error(
        `Error fetching staff attendance summary: ${error.message}`
      );
    }
  },
};

export default StaffAttendanceService;
