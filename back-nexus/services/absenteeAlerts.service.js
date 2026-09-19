import AbsenteeAlertsModel from "../model/absenteeAlerts.model.js";

const AbsenteeAlertsService = {
  // Get all absentee alerts
  async getAllAbsenteeAlerts(filters) {
    try {
      return await AbsenteeAlertsModel.getAll(filters);
    } catch (error) {
      throw new Error(`Error fetching absentee alerts: ${error.message}`);
    }
  },

  // Get absentee alert by ID
  async getAbsenteeAlertById(id) {
    try {
      const alert = await AbsenteeAlertsModel.getById(id);
      if (!alert) {
        throw new Error("Absentee alert not found");
      }
      return alert;
    } catch (error) {
      throw new Error(`Error fetching absentee alert: ${error.message}`);
    }
  },

  // Create absentee alert
  async createAbsenteeAlert(data) {
    try {
      const alertId = await AbsenteeAlertsModel.create(data);
      return await AbsenteeAlertsModel.getById(alertId);
    } catch (error) {
      throw new Error(`Error creating absentee alert: ${error.message}`);
    }
  },

  // Update absentee alert
  async updateAbsenteeAlert(id, data) {
    try {
      const affectedRows = await AbsenteeAlertsModel.update(id, data);
      if (affectedRows === 0) {
        throw new Error("Absentee alert not found");
      }
      return await AbsenteeAlertsModel.getById(id);
    } catch (error) {
      throw new Error(`Error updating absentee alert: ${error.message}`);
    }
  },

  // Delete absentee alert
  async deleteAbsenteeAlert(id) {
    try {
      const affectedRows = await AbsenteeAlertsModel.delete(id);
      if (affectedRows === 0) {
        throw new Error("Absentee alert not found");
      }
      return { message: "Absentee alert deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting absentee alert: ${error.message}`);
    }
  },

  // Acknowledge alert
  async acknowledgeAlert(id, acknowledgedBy, resolutionNotes = null) {
    try {
      const updateData = {
        status: "acknowledged",
        acknowledged_by: acknowledgedBy,
        resolution_notes: resolutionNotes,
      };
      return await this.updateAbsenteeAlert(id, updateData);
    } catch (error) {
      throw new Error(`Error acknowledging alert: ${error.message}`);
    }
  },

  // Resolve alert
  async resolveAlert(id, acknowledgedBy, resolutionNotes) {
    try {
      const updateData = {
        status: "resolved",
        acknowledged_by: acknowledgedBy,
        resolution_notes: resolutionNotes,
      };
      return await this.updateAbsenteeAlert(id, updateData);
    } catch (error) {
      throw new Error(`Error resolving alert: ${error.message}`);
    }
  },

  // Get alert statistics
  async getAlertStatistics(filters) {
    try {
      return await AbsenteeAlertsModel.getStatistics(filters);
    } catch (error) {
      throw new Error(`Error fetching alert statistics: ${error.message}`);
    }
  },

  // Create alert for absent student
  async createAbsenteeAlertForAttendance(attendanceData) {
    try {
      // Default thresholds - configure these as needed
      const ABSENCE_THRESHOLD = 3; // Alert after 3 absences
      const CONSECUTIVE_THRESHOLD = 2; // Alert after 2 consecutive absences

      // Only create alert for absent status
      if (attendanceData.status !== "absent") {
        return null;
      }

      // Get absence count for this student in this course
      const absenceCount = await AbsenteeAlertsModel.getAbsenceCount(
        attendanceData.student_id,
        attendanceData.course_id,
        attendanceData.period_id
      );

      // Check for consecutive absences
      const consecutiveAbsences = await AbsenteeAlertsModel.getConsecutiveAbsences(
        attendanceData.student_id,
        attendanceData.course_id,
        attendanceData.period_id
      );

      // Determine priority and alert type
      let priority = "low";
      let alertType = "excessive_absence";
      let message = `Student has been absent ${absenceCount} time(s)`;

      if (consecutiveAbsences >= CONSECUTIVE_THRESHOLD) {
        alertType = "consecutive_absence";
        priority = consecutiveAbsences >= 3 ? "critical" : "high";
        message = `Student has been absent ${consecutiveAbsences} consecutive day(s)`;
      } else if (absenceCount >= ABSENCE_THRESHOLD) {
        priority = absenceCount >= 5 ? "critical" : "high";
        message = `Student has exceeded absence threshold (${absenceCount} absences)`;
      } else if (absenceCount >= 2) {
        priority = "medium";
      }

      // Check if alert already exists for today
      const existingAlert = await AbsenteeAlertsModel.checkExistingAlert(
        attendanceData.student_id,
        attendanceData.course_id,
        attendanceData.period_id,
        attendanceData.attendance_date
      );

      if (existingAlert) {
        // Update existing alert
        return await this.updateAbsenteeAlert(existingAlert.alert_id, {
          absence_count: absenceCount,
          priority: priority,
          status: "pending",
          message: message,
        });
      }

      // Create new alert
      const alertData = {
        user_id: attendanceData.student_id,
        user_type: "student",
        alert_type: alertType,
        period_id: attendanceData.period_id,
        course_id: attendanceData.course_id,
        absence_count: absenceCount,
        threshold_exceeded: absenceCount >= ABSENCE_THRESHOLD ? 1 : 0,
        alert_date: attendanceData.attendance_date,
        priority: priority,
        status: "pending",
        message: message,
      };

      return await this.createAbsenteeAlert(alertData);
    } catch (error) {
      console.error("Error creating absentee alert:", error);
      // Don't throw - attendance should still be saved even if alert creation fails
      return null;
    }
  },
};

export default AbsenteeAlertsService;
