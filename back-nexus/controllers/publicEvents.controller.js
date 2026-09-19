import PublicEventsService from "../services/publicEvents.service.js";

const PublicEventsController = {
  getAll: async (req, res) => {
    try {
      const events = await PublicEventsService.getAllPublicEvents(req.query);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const event = await PublicEventsService.getPublicEventById(req.params.id);
      res.json(event);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  getBySlug: async (req, res) => {
    try {
      const event = await PublicEventsService.getPublicEventBySlug(req.params.slug);
      res.json(event);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const user = JSON.parse(req.headers.user || '{}');
      req.body.created_by = user.user_id;
      const id = await PublicEventsService.createPublicEvent(req.body);
      res.status(201).json({ public_event_id: id, message: "Public event created successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const user = JSON.parse(req.headers.user || '{}');
      req.body.updated_by = user.user_id;
      await PublicEventsService.updatePublicEvent(req.params.id, req.body);
      res.json({ message: "Public event updated successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await PublicEventsService.deletePublicEvent(req.params.id);
      res.json({ message: "Public event deleted successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getStatistics: async (req, res) => {
    try {
      const stats = await PublicEventsService.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default PublicEventsController;
