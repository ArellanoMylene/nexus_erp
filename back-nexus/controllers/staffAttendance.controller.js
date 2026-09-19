import StaffAttendanceService from "../services/staffAttendance.service.js";

const StaffAttendanceController = {
  // GET /api/staff-attendance - Get all staff attendance records
  async getAllStaffAttendance(req, res) {
    try {
      const filters = {
        user_id: req.query.user_id,
        status: req.query.status,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        department: req.query.department,
      };

      const attendance = await StaffAttendanceService.getAllStaffAttendance(
        filters
      );
      res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/staff-attendance/:id - Get staff attendance by ID
  async getStaffAttendanceById(req, res) {
    try {
      const attendance = await StaffAttendanceService.getStaffAttendanceById(
        req.params.id
      );
      res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // POST /api/staff-attendance - Create staff attendance record
  async createStaffAttendance(req, res) {
    try {
      const attendance = await StaffAttendanceService.createStaffAttendance(
        req.body
      );
      res.status(201).json({
        success: true,
        message: "Staff attendance record created successfully",
        data: attendance,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PUT /api/staff-attendance/:id - Update staff attendance record
  async updateStaffAttendance(req, res) {
    try {
      const attendance = await StaffAttendanceService.updateStaffAttendance(
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: "Staff attendance record updated successfully",
        data: attendance,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE /api/staff-attendance/:id - Delete staff attendance record
  async deleteStaffAttendance(req, res) {
    try {
      const result = await StaffAttendanceService.deleteStaffAttendance(
        req.params.id
      );
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/staff-attendance/summary/:user_id - Get attendance summary
  async getStaffAttendanceSummary(req, res) {
    try {
      const { user_id } = req.params;
      const { date_from, date_to } = req.query;

      if (!date_from || !date_to) {
        return res.status(400).json({
          success: false,
          message: "date_from and date_to are required",
        });
      }

      const summary = await StaffAttendanceService.getStaffAttendanceSummary(
        user_id,
        date_from,
        date_to
      );
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

export default StaffAttendanceController;
