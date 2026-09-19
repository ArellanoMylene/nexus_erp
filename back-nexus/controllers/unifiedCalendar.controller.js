import UnifiedCalendarService from "../services/unifiedCalendar.service.js";

const UnifiedCalendarController = {
  /**
   * Get unified calendar (exams, events, calendar items)
   * Query params: student_id, section_id, date_from, date_to, type (exam|event|calendar)
   */
  getUnifiedCalendar: async (req, res) => {
    try {
      const {
        student_id,
        section_id,
        date_from,
        date_to,
        type: typeFilter,
      } = req.query;

      console.log("Calendar API called with params:", {
        student_id,
        section_id,
        date_from,
        date_to,
        typeFilter,
      });

      const result = await UnifiedCalendarService.getUnifiedCalendar({
        student_id,
        section_id,
        date_from,
        date_to,
        type_filter: typeFilter,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getUnifiedCalendar controller:", error.message);
      console.error("Full error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch unified calendar",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },

  /**
   * Get student-specific exam schedule
   */
  getStudentExams: async (req, res) => {
    try {
      const { student_id } = req.params;

      // Get student_id from params or JWT
      const userId =
        student_id ||
        (req.headers.user ? JSON.parse(req.headers.user).user_id : null);

      console.log("Student exams API called with student_id:", userId);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Student ID is required",
        });
      }

      const result = await UnifiedCalendarService.getStudentExams(userId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getStudentExams controller:", error.message);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch student exams",
      });
    }
  },

  /**
   * Get student-visible events
   */
  getStudentEvents: async (req, res) => {
    try {
      const { date_from, date_to } = req.query;

      console.log("Student events API called with params:", {
        date_from,
        date_to,
      });

      const result = await UnifiedCalendarService.getStudentEvents({
        date_from,
        date_to,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getStudentEvents controller:", error.message);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch student events",
      });
    }
  },
};

export default UnifiedCalendarController;
