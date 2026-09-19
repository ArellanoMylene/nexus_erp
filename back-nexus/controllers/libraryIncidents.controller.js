import LibraryIncidentsService from "../services/libraryIncidents.service.js";

const LibraryIncidentsController = {
  getAllIncidents: async (req, res) => {
    try {
      const filters = {
        incident_type: req.query.incident_type,
        payment_status: req.query.payment_status,
        resolved: req.query.resolved,
        search: req.query.search,
      };

      const incidents = await LibraryIncidentsService.getAllIncidents(filters);
      res.status(200).json(incidents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getIncidentById: async (req, res) => {
    try {
      const incident = await LibraryIncidentsService.getIncidentById(req.params.id);
      res.status(200).json(incident);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  createIncident: async (req, res) => {
    try {
      const incident = await LibraryIncidentsService.createIncident(req.body);
      res.status(201).json(incident);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateIncident: async (req, res) => {
    try {
      const incident = await LibraryIncidentsService.updateIncident(
        req.params.id,
        req.body
      );
      res.status(200).json(incident);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteIncident: async (req, res) => {
    try {
      const result = await LibraryIncidentsService.deleteIncident(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getStatistics: async (req, res) => {
    try {
      const stats = await LibraryIncidentsService.getStatistics();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default LibraryIncidentsController;
