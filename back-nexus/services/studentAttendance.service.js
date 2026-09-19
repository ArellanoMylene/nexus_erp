import StudentAttendanceModel from "../model/studentAttendance.model.js";
import AbsenteeAlertsService from "./absenteeAlerts.service.js";

const StudentAttendanceService = {
  // Get all student attendance records
  async getAllStudentAttendance(filters) {
    try {
      return await StudentAttendanceModel.getAll(filters);
    } catch (error) {
      throw new Error(`Error fetching student attendance: ${error.message}`);
    }
  },

  // Get student attendance by ID
  async getStudentAttendanceById(id) {
    try {
      const attendance = await StudentAttendanceModel.getById(id);
      if (!attendance) {
        throw new Error("Student attendance record not found");
      }
      return attendance;
    } catch (error) {
      throw new Error(`Error fetching student attendance: ${error.message}`);
    }
  },

  // Create student attendance record
  async createStudentAttendance(data) {
    try {
      const attendanceId = await StudentAttendanceModel.create(data);
      return await StudentAttendanceModel.getById(attendanceId);
    } catch (error) {
      throw new Error(`Error creating student attendance: ${error.message}`);
    }
  },

  // Update student attendance record
  async updateStudentAttendance(id, data) {
    try {
      const affectedRows = await StudentAttendanceModel.update(id, data);
      if (affectedRows === 0) {
        throw new Error("Student attendance record not found");
      }
      return await StudentAttendanceModel.getById(id);
    } catch (error) {
      throw new Error(`Error updating student attendance: ${error.message}`);
    }
  },

  // Delete student attendance record
  async deleteStudentAttendance(id) {
    try {
      const affectedRows = await StudentAttendanceModel.delete(id);
      if (affectedRows === 0) {
        throw new Error("Student attendance record not found");
      }
      return { message: "Student attendance record deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting student attendance: ${error.message}`);
    }
  },

  // Get attendance summary for a student
  async getStudentAttendanceSummary(student_id, course_id, period_id) {
    try {
      return await StudentAttendanceModel.getSummary(
        student_id,
        course_id,
        period_id
      );
    } catch (error) {
      throw new Error(
        `Error fetching student attendance summary: ${error.message}`
      );
    }
  },

  // Bulk mark attendance for a class
  async bulkMarkAttendance(attendanceRecords) {
    try {
      const affectedRows = await StudentAttendanceModel.bulkCreate(
        attendanceRecords
      );

      // Create absentee alerts for students marked as absent
      for (const record of attendanceRecords) {
        if (record.status === "absent") {
          try {
            await AbsenteeAlertsService.createAbsenteeAlertForAttendance(record);
          } catch (error) {
            // Log error but don't fail the attendance save
            console.error(
              "Error creating absentee alert for student",
              record.student_id,
              error
            );
          }
        }
      }

      return {
        message: "Attendance marked successfully",
        recordsCreated: affectedRows,
      };
    } catch (error) {
      throw new Error(`Error bulk marking attendance: ${error.message}`);
    }
  },
};

export default StudentAttendanceService;
