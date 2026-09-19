import StudentAttendanceService from "../services/studentAttendance.service.js";

const StudentAttendanceController = {
  // GET /api/student-attendance - Get all student attendance records
  async getAllStudentAttendance(req, res) {
    try {
      const filters = {
        student_id: req.query.student_id,
        course_id: req.query.course_id,
        section_id: req.query.section_id,
        period_id: req.query.period_id,
        status: req.query.status,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
      };

      const attendance = await StudentAttendanceService.getAllStudentAttendance(
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

  // GET /api/student-attendance/:id - Get student attendance by ID
  async getStudentAttendanceById(req, res) {
    try {
      const attendance =
        await StudentAttendanceService.getStudentAttendanceById(req.params.id);
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

  // POST /api/student-attendance - Create student attendance record
  async createStudentAttendance(req, res) {
    try {
      const attendance = await StudentAttendanceService.createStudentAttendance(
        req.body
      );
      res.status(201).json({
        success: true,
        message: "Student attendance record created successfully",
        data: attendance,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PUT /api/student-attendance/:id - Update student attendance record
  async updateStudentAttendance(req, res) {
    try {
      const attendance = await StudentAttendanceService.updateStudentAttendance(
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: "Student attendance record updated successfully",
        data: attendance,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE /api/student-attendance/:id - Delete student attendance record
  async deleteStudentAttendance(req, res) {
    try {
      const result = await StudentAttendanceService.deleteStudentAttendance(
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

  // GET /api/student-attendance/summary/:student_id - Get attendance summary
  async getStudentAttendanceSummary(req, res) {
    try {
      const { student_id } = req.params;
      const { course_id, period_id } = req.query;

      if (!course_id || !period_id) {
        return res.status(400).json({
          success: false,
          message: "course_id and period_id are required",
        });
      }

      const summary =
        await StudentAttendanceService.getStudentAttendanceSummary(
          student_id,
          course_id,
          period_id
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

  // POST /api/student-attendance/bulk - Bulk mark attendance
  async bulkMarkAttendance(req, res) {
    try {
      const { attendanceRecords } = req.body;

      if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
        return res.status(400).json({
          success: false,
          message: "attendanceRecords array is required and must not be empty",
        });
      }

      const result = await StudentAttendanceService.bulkMarkAttendance(
        attendanceRecords
      );
      res.status(201).json({
        success: true,
        message: result.message,
        recordsCreated: result.recordsCreated,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};

export default StudentAttendanceController;
