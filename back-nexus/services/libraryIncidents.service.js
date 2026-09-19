import LibraryIncidentsModel from "../model/libraryIncidents.model.js";

const LibraryIncidentsService = {
  getAllIncidents: async (filters) => {
    try {
      return await LibraryIncidentsModel.getAllIncidents(filters);
    } catch (error) {
      throw new Error(`Error fetching incidents: ${error.message}`);
    }
  },

  getIncidentById: async (id) => {
    try {
      const incident = await LibraryIncidentsModel.getIncidentById(id);
      if (!incident) {
        throw new Error("Incident not found");
      }
      return incident;
    } catch (error) {
      throw new Error(`Error fetching incident: ${error.message}`);
    }
  },

  createIncident: async (incidentData) => {
    try {
      if (!incidentData.book_id || !incidentData.incident_type || !incidentData.incident_date) {
        throw new Error("Missing required fields");
      }

      const incidentId = await LibraryIncidentsModel.createIncident(incidentData);
      return await LibraryIncidentsModel.getIncidentById(incidentId);
    } catch (error) {
      throw new Error(`Error creating incident: ${error.message}`);
    }
  },

  updateIncident: async (id, incidentData) => {
    try {
      const updated = await LibraryIncidentsModel.updateIncident(id, incidentData);
      if (!updated) {
        throw new Error("Incident not found or not updated");
      }
      return await LibraryIncidentsModel.getIncidentById(id);
    } catch (error) {
      throw new Error(`Error updating incident: ${error.message}`);
    }
  },

  deleteIncident: async (id) => {
    try {
      const deleted = await LibraryIncidentsModel.deleteIncident(id);
      if (!deleted) {
        throw new Error("Incident not found or already deleted");
      }
      return { message: "Incident deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting incident: ${error.message}`);
    }
  },

  getStatistics: async () => {
    try {
      return await LibraryIncidentsModel.getStatistics();
    } catch (error) {
      throw new Error(`Error fetching statistics: ${error.message}`);
    }
  },
};

export default LibraryIncidentsService;
