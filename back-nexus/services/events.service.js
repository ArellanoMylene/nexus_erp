import EventsModel from "../model/events.model.js";

const EventsService = {
  getAllEvents: async (filters) => {
    return await EventsModel.getAllEvents(filters);
  },

  getEventById: async (id) => {
    const event = await EventsModel.getEventById(id);
    if (!event) {
      throw new Error("Event not found");
    }
    return event;
  },

  createEvent: async (data) => {
    // Validation
    if (!data.event_name || !data.start_date) {
      throw new Error("Event name and start date are required");
    }

    // Validate dates if end_date is provided
    if (data.end_date && data.start_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format");
      }

      if (startDate > endDate) {
        throw new Error(
          `Start date (${startDate.toISOString()}) cannot be after end date (${endDate.toISOString()})`,
        );
      }
    }

    // Generate event code if not provided
    if (!data.event_code) {
      data.event_code = await EventsModel.generateEventCode();
    }

    // Calculate duration in hours
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      data.duration_hours = Math.abs(end - start) / 36e5; // milliseconds to hours
    }

    const result = await EventsModel.createEvent(data);
    return result.insertId;
  },

  updateEvent: async (id, data) => {
    const existing = await EventsModel.getEventById(id);
    if (!existing) {
      throw new Error("Event not found");
    }

    // Validate dates if updating
    if (data.start_date && data.end_date) {
      if (new Date(data.start_date) > new Date(data.end_date)) {
        throw new Error("Start date cannot be after end date");
      }

      // Recalculate duration
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      data.duration_hours = Math.abs(end - start) / 36e5;
    }

    // Auto-update status based on dates
    if (data.start_date) {
      const now = new Date();
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date || existing.end_date);

      if (now >= startDate && now <= endDate) {
        data.status = "Ongoing";
      } else if (now > endDate) {
        data.status = "Completed";
      }
    }

    await EventsModel.updateEvent(id, data);
    return true;
  },

  deleteEvent: async (id) => {
    const existing = await EventsModel.getEventById(id);
    if (!existing) {
      throw new Error("Event not found");
    }

    await EventsModel.deleteEvent(id);
    return true;
  },

  getStatistics: async () => {
    return await EventsModel.getStatistics();
  },
};

export default EventsService;
