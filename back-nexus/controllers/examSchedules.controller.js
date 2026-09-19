import ExamSchedulesService from "../services/examSchedules.service.js";

const ExamSchedulesController = {
  getAllSchedules: async (req, res) => {
    try {
      const filters = {
        exam_id: req.query.exam_id,
        section_id: req.query.section_id,
        exam_date: req.query.exam_date,
        status: req.query.status,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
      };

      const result = await ExamSchedulesService.getAllSchedules(filters);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getAllSchedules controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  getScheduleById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ExamSchedulesService.getScheduleById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getScheduleById controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  createSchedule: async (req, res) => {
    try {
      const scheduleData = req.body;
      const result = await ExamSchedulesService.createSchedule(scheduleData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error("Error in createSchedule controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  updateSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const scheduleData = req.body;
      const result = await ExamSchedulesService.updateSchedule(
        id,
        scheduleData
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in updateSchedule controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  deleteSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ExamSchedulesService.deleteSchedule(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in deleteSchedule controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  getSchedulesByProctor: async (req, res) => {
    try {
      const { proctor_id } = req.params;
      const result = await ExamSchedulesService.getSchedulesByProctor(
        proctor_id
      );

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getSchedulesByProctor controller:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};

export default ExamSchedulesController;
