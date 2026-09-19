import SchoolCalendarService from "../services/schoolCalendar.service.js";

const SchoolCalendarController = {
  getAll: async (req, res) => {
    try {
      const events = await SchoolCalendarService.getAllCalendarEvents(req.query);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const event = await SchoolCalendarService.getCalendarEventById(req.params.id);
      res.json(event);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const user = JSON.parse(req.headers.user || '{}');
      req.body.created_by = user.user_id;
      const id = await SchoolCalendarService.createCalendarEvent(req.body);
      res.status(201).json({ calendar_id: id, message: "Calendar event created successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const user = JSON.parse(req.headers.user || '{}');
      req.body.updated_by = user.user_id;
      await SchoolCalendarService.updateCalendarEvent(req.params.id, req.body);
      res.json({ message: "Calendar event updated successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await SchoolCalendarService.deleteCalendarEvent(req.params.id);
      res.json({ message: "Calendar event deleted successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getStatistics: async (req, res) => {
    try {
      const stats = await SchoolCalendarService.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAcademicYears: async (req, res) => {
    try {
      const years = await SchoolCalendarService.getAcademicYears();
      res.json(years);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default SchoolCalendarController;
