/* import AcademicEventsService from "../services/academicEvents.service.js";

const AcademicEventsController = {
  getAllEvents: async (req, res) => {
    try {
      const filters = {
        period_id: req.query.period_id,
        event_type: req.query.event_type,
        search: req.query.search,
      };

      const events = await AcademicEventsService.getAllEvents(filters);
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getEventById: async (req, res) => {
    try {
      const event = await AcademicEventsService.getEventById(req.params.id);
      res.status(200).json(event);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  createEvent: async (req, res) => {
    try {
      const event = await AcademicEventsService.createEvent(req.body);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateEvent: async (req, res) => {
    try {
      const event = await AcademicEventsService.updateEvent(
        req.params.id,
        req.body
      );
      res.status(200).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteEvent: async (req, res) => {
    try {
      const result = await AcademicEventsService.deleteEvent(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

export default AcademicEventsController;
 */

// controllers/academicEvents.controller.js
import AcademicEventsService from "../services/academicEvents.service.js";

const AcademicEventsController = {

  async getAllEvents(req, res) {
    try {
      const filters = {
        period_id: req.query.period_id,
        event_type: req.query.event_type,
        search: req.query.search,
      };
      const events = await AcademicEventsService.getAllEvents(filters);
      res.status(200).json({ success: true, data: events });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getEventById(req, res) {
    try {
      const event = await AcademicEventsService.getEventById(req.params.id);
      res.status(200).json({ success: true, data: event });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async createEvent(req, res) {
    try {
      // req.body already validated & sanitized by Zod middleware
      const event = await AcademicEventsService.createEvent(req.body);
      res.status(201).json({ success: true, message: "Event created successfully", data: event });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async updateEvent(req, res) {
    try {
      const event = await AcademicEventsService.updateEvent(req.params.id, req.body);
      res.status(200).json({ success: true, message: "Event updated successfully", data: event });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async deleteEvent(req, res) {
    try {
      const result = await AcademicEventsService.deleteEvent(req.params.id);
      res.status(200).json({ success: true, message: "Event deleted successfully", data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};

export default AcademicEventsController;