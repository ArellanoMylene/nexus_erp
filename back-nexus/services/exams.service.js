import ExamsModel from "../model/exams.model.js";
import ExamSchedulesModel from "../model/examSchedules.model.js";

const ExamsService = {
  getAllExams: async (filters) => {
    try {
      const exams = await ExamsModel.getAll(filters);
      return { success: true, data: exams };
    } catch (error) {
      console.error("Error in getAllExams service:", error);
      throw error;
    }
  },

  getExamById: async (examId) => {
    try {
      const exam = await ExamsModel.getById(examId);
      if (!exam) {
        return { success: false, message: "Exam not found" };
      }
      return { success: true, data: exam };
    } catch (error) {
      console.error("Error in getExamById service:", error);
      throw error;
    }
  },

  createExam: async (examData) => {
    try {
      const examId = await ExamsModel.create(examData);

      // If scheduling details are provided, create an exam schedule entry
      if (examData.exam_date && examData.exam_time) {
        const endTime = ExamsService.calculateEndTime(
          examData.exam_time,
          examData.exam_duration,
        );

        // Validate room_id - must be numeric or null
        let roomId = null;
        if (examData.room_id && !isNaN(examData.room_id)) {
          roomId = parseInt(examData.room_id, 10);
        }

        const scheduleData = {
          exam_id: examId,
          section_id: examData.section_id || null,
          exam_date: examData.exam_date,
          start_time: examData.exam_time,
          end_time: endTime,
          venue: null,
          room_id: roomId, // Only numeric room_id or null
          proctor_id: examData.proctor_id || null,
          max_capacity: null,
          special_instructions: examData.instructions || null,
          status: "scheduled",
        };

        await ExamSchedulesModel.create(scheduleData);
      }

      return { success: true, examId, message: "Exam created successfully" };
    } catch (error) {
      console.error("Error in createExam service:", error);
      throw error;
    }
  },

  updateExam: async (examId, examData) => {
    try {
      const affectedRows = await ExamsModel.update(examId, examData);
      if (affectedRows === 0) {
        return { success: false, message: "Exam not found or no changes made" };
      }
      return { success: true, message: "Exam updated successfully" };
    } catch (error) {
      console.error("Error in updateExam service:", error);
      throw error;
    }
  },

  deleteExam: async (examId) => {
    try {
      const affectedRows = await ExamsModel.delete(examId);
      if (affectedRows === 0) {
        return { success: false, message: "Exam not found" };
      }
      return { success: true, message: "Exam deleted successfully" };
    } catch (error) {
      console.error("Error in deleteExam service:", error);
      throw error;
    }
  },

  getExamsByFaculty: async (facultyId) => {
    try {
      const exams = await ExamsModel.getByFaculty(facultyId);
      return { success: true, data: exams };
    } catch (error) {
      console.error("Error in getExamsByFaculty service:", error);
      throw error;
    }
  },

  // Helper function to calculate end time
  calculateEndTime: (startTime, durationMinutes) => {
    if (!startTime || durationMinutes === undefined || durationMinutes === null)
      return null;

    const normalizedStartTime = String(startTime).trim();
    const parsedDuration = parseInt(durationMinutes, 10);

    if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
      return null;
    }

    let hours;
    let minutes;

    const twelveHourMatch = normalizedStartTime.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i,
    );
    if (twelveHourMatch) {
      hours = parseInt(twelveHourMatch[1], 10);
      minutes = parseInt(twelveHourMatch[2], 10);
      const meridiem = twelveHourMatch[3].toUpperCase();

      if (hours === 12) {
        hours = meridiem === "AM" ? 0 : 12;
      } else if (meridiem === "PM") {
        hours += 12;
      }
    } else {
      const twentyFourHourMatch = normalizedStartTime.match(
        /^(\d{1,2}):(\d{2})(?::\d{2})?$/,
      );

      if (!twentyFourHourMatch) {
        return null;
      }

      hours = parseInt(twentyFourHourMatch[1], 10);
      minutes = parseInt(twentyFourHourMatch[2], 10);
    }

    const totalMinutes = hours * 60 + minutes + parsedDuration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
  },
};

export default ExamsService;
