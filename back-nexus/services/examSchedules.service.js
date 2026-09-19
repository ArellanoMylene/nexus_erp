import ExamSchedulesModel from "../model/examSchedules.model.js";

const ExamSchedulesService = {
  getAllSchedules: async (filters) => {
    try {
      const schedules = await ExamSchedulesModel.getAll(filters);
      return { success: true, data: schedules };
    } catch (error) {
      console.error("Error in getAllSchedules service:", error);
      throw error;
    }
  },

  getScheduleById: async (scheduleId) => {
    try {
      const schedule = await ExamSchedulesModel.getById(scheduleId);
      if (!schedule) {
        return { success: false, message: "Schedule not found" };
      }
      return { success: true, data: schedule };
    } catch (error) {
      console.error("Error in getScheduleById service:", error);
      throw error;
    }
  },

  createSchedule: async (scheduleData) => {
    try {
      // Check for venue conflicts
      if (scheduleData.venue) {
        const hasConflict = await ExamSchedulesModel.checkVenueConflict(
          scheduleData.venue,
          scheduleData.exam_date,
          scheduleData.start_time,
          scheduleData.end_time
        );

        if (hasConflict) {
          return {
            success: false,
            message:
              "Venue conflict detected. The venue is already booked for the specified time slot.",
          };
        }
      }

      const scheduleId = await ExamSchedulesModel.create(scheduleData);
      return {
        success: true,
        scheduleId,
        message: "Exam schedule created successfully",
      };
    } catch (error) {
      console.error("Error in createSchedule service:", error);
      throw error;
    }
  },

  updateSchedule: async (scheduleId, scheduleData) => {
    try {
      // Check for venue conflicts (excluding current schedule)
      if (scheduleData.venue) {
        const hasConflict = await ExamSchedulesModel.checkVenueConflict(
          scheduleData.venue,
          scheduleData.exam_date,
          scheduleData.start_time,
          scheduleData.end_time,
          scheduleId
        );

        if (hasConflict) {
          return {
            success: false,
            message:
              "Venue conflict detected. The venue is already booked for the specified time slot.",
          };
        }
      }

      const affectedRows = await ExamSchedulesModel.update(
        scheduleId,
        scheduleData
      );
      if (affectedRows === 0) {
        return {
          success: false,
          message: "Schedule not found or no changes made",
        };
      }
      return { success: true, message: "Exam schedule updated successfully" };
    } catch (error) {
      console.error("Error in updateSchedule service:", error);
      throw error;
    }
  },

  deleteSchedule: async (scheduleId) => {
    try {
      const affectedRows = await ExamSchedulesModel.delete(scheduleId);
      if (affectedRows === 0) {
        return { success: false, message: "Schedule not found" };
      }
      return { success: true, message: "Exam schedule deleted successfully" };
    } catch (error) {
      console.error("Error in deleteSchedule service:", error);
      throw error;
    }
  },

  getSchedulesByProctor: async (proctorId) => {
    try {
      const schedules = await ExamSchedulesModel.getByProctor(proctorId);
      return { success: true, data: schedules };
    } catch (error) {
      console.error("Error in getSchedulesByProctor service:", error);
      throw error;
    }
  },
};

export default ExamSchedulesService;
