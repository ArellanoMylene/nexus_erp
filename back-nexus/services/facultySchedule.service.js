import FacultySchedule from "../model/facultySchedule.model.js";

const FacultyScheduleService = {
  // Get all schedules
  async getAllSchedules() {
    try {
      const [schedules] = await FacultySchedule.getAll();
      return { success: true, data: schedules };
    } catch (error) {
      console.error("Error getting all schedules:", error);
      return { success: false, message: "Failed to retrieve schedules" };
    }
  },

  // Get schedules by faculty ID
  async getSchedulesByFacultyId(facultyUserId, academicPeriodId = null) {
    try {
      const [schedules] = await FacultySchedule.getByFacultyId(
        facultyUserId,
        academicPeriodId
      );
      return { success: true, data: schedules };
    } catch (error) {
      console.error("Error getting schedules by faculty:", error);
      return { success: false, message: "Failed to retrieve schedules" };
    }
  },

  // Get schedules by academic period
  async getSchedulesByAcademicPeriod(periodId) {
    try {
      const [schedules] = await FacultySchedule.getByAcademicPeriod(periodId);
      return { success: true, data: schedules };
    } catch (error) {
      console.error("Error getting schedules by period:", error);
      return { success: false, message: "Failed to retrieve schedules" };
    }
  },

  // Get schedule by ID
  async getScheduleById(scheduleId) {
    try {
      const [schedule] = await FacultySchedule.getById(scheduleId);
      if (schedule.length === 0) {
        return { success: false, message: "Schedule not found" };
      }
      return { success: true, data: schedule[0] };
    } catch (error) {
      console.error("Error getting schedule by ID:", error);
      return { success: false, message: "Failed to retrieve schedule" };
    }
  },

  // Create new schedule
  async createSchedule(scheduleData) {
    try {
      // Check for time conflicts
      const [conflicts] = await FacultySchedule.checkConflict(
        scheduleData.faculty_user_id,
        scheduleData.academic_period_id,
        scheduleData.day_of_week,
        scheduleData.time_start,
        scheduleData.time_end
      );

      if (conflicts.length > 0) {
        return {
          success: false,
          message:
            "Time conflict detected. Faculty already has a schedule at this time.",
        };
      }

      const [result] = await FacultySchedule.create(scheduleData);
      return {
        success: true,
        message: "Schedule created successfully",
        data: { schedule_id: result.insertId },
      };
    } catch (error) {
      console.error("Error creating schedule:", error);
      return { success: false, message: "Failed to create schedule" };
    }
  },

  // Update schedule
  async updateSchedule(scheduleId, scheduleData) {
    try {
      // Check for time conflicts (excluding current schedule)
      const [conflicts] = await FacultySchedule.checkConflict(
        scheduleData.faculty_user_id,
        scheduleData.academic_period_id,
        scheduleData.day_of_week,
        scheduleData.time_start,
        scheduleData.time_end,
        scheduleId
      );

      if (conflicts.length > 0) {
        return {
          success: false,
          message:
            "Time conflict detected. Faculty already has a schedule at this time.",
        };
      }

      const [result] = await FacultySchedule.update(scheduleId, scheduleData);
      if (result.affectedRows === 0) {
        return { success: false, message: "Schedule not found" };
      }
      return { success: true, message: "Schedule updated successfully" };
    } catch (error) {
      console.error("Error updating schedule:", error);
      return { success: false, message: "Failed to update schedule" };
    }
  },

  // Delete schedule
  async deleteSchedule(scheduleId) {
    try {
      const [result] = await FacultySchedule.delete(scheduleId);
      if (result.affectedRows === 0) {
        return { success: false, message: "Schedule not found" };
      }
      return { success: true, message: "Schedule deleted successfully" };
    } catch (error) {
      console.error("Error deleting schedule:", error);
      return { success: false, message: "Failed to delete schedule" };
    }
  },

  // Get weekly schedule for faculty
  async getWeeklySchedule(facultyUserId, academicPeriodId) {
    try {
      const [schedule] = await FacultySchedule.getWeeklySchedule(
        facultyUserId,
        academicPeriodId
      );

      // Format into weekly view
      const weeklySchedule = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
      };

      schedule.forEach((item) => {
        weeklySchedule[item.day_of_week].push(item);
      });

      return { success: true, data: weeklySchedule };
    } catch (error) {
      console.error("Error getting weekly schedule:", error);
      return { success: false, message: "Failed to retrieve weekly schedule" };
    }
  },
};

export default FacultyScheduleService;
