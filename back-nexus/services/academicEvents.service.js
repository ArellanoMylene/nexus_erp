import AcademicEventsModel from "../model/academicEvents.model.js";

const AcademicEventsService = {
  getAllEvents: async (filters) => {
    try {
      return await AcademicEventsModel.getAllEvents(filters);
    } catch (error) {
      throw new Error(`Error fetching events: ${error.message}`);
    }
  },

  getEventById: async (id) => {
    try {
      const event = await AcademicEventsModel.getEventById(id);
      if (!event) {
        throw new Error("Event not found");
      }
      return event;
    } catch (error) {
      throw new Error(`Error fetching event: ${error.message}`);
    }
  },

  createEvent: async (eventData) => {
    try {
      if (!eventData.event_name || !eventData.start_date) {
        throw new Error("Missing required fields");
      }

      const eventId = await AcademicEventsModel.createEvent(eventData);
      return await AcademicEventsModel.getEventById(eventId);
    } catch (error) {
      throw new Error(`Error creating event: ${error.message}`);
    }
  },

  updateEvent: async (id, eventData) => {
    try {
      const updated = await AcademicEventsModel.updateEvent(id, eventData);
      if (!updated) {
        throw new Error("Event not found or not updated");
      }
      return await AcademicEventsModel.getEventById(id);
    } catch (error) {
      throw new Error(`Error updating event: ${error.message}`);
    }
  },

  deleteEvent: async (id) => {
    try {
      const deleted = await AcademicEventsModel.deleteEvent(id);
      if (!deleted) {
        throw new Error("Event not found");
      }
      return { message: "Event deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting event: ${error.message}`);
    }
  },
};

export default AcademicEventsService;
