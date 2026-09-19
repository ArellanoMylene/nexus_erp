import EventsService from "../services/events.service.js";

const EventsController = {
  getAll: async (req, res) => {
    try {
      const events = await EventsService.getAllEvents(req.query);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const event = await EventsService.getEventById(req.params.id);
      res.json(event);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      console.log("Creating event with data:", req.body);
      const userId =
        req.body.created_by ||
        (req.headers.user ? JSON.parse(req.headers.user).user_id : null);
      req.body.created_by = userId;
      const id = await EventsService.createEvent(req.body);
      console.log("Event created successfully with ID:", id);
      res
        .status(201)
        .json({ event_id: id, message: "Event created successfully" });
    } catch (error) {
      console.error("Error creating event:", error.message);
      res.status(400).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      console.log("Updating event:", req.params.id, req.body);
      const userId =
        req.body.updated_by ||
        (req.headers.user ? JSON.parse(req.headers.user).user_id : null);
      if (userId) req.body.updated_by = userId;
      await EventsService.updateEvent(req.params.id, req.body);
      console.log("Event updated successfully");
      res.json({ message: "Event updated successfully" });
    } catch (error) {
      console.error("Error updating event:", error.message);
      res.status(400).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await EventsService.deleteEvent(req.params.id);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getStatistics: async (req, res) => {
    try {
      const stats = await EventsService.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default EventsController;
