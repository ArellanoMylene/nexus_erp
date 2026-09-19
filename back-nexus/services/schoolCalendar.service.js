import SchoolCalendarModel from "../model/schoolCalendar.model.js";

const SchoolCalendarService = {
  getAllCalendarEvents: async (filters) => {
    return await SchoolCalendarModel.getAllCalendarEvents(filters);
  },

  getCalendarEventById: async (id) => {
    const event = await SchoolCalendarModel.getCalendarEventById(id);
    if (!event) {
      throw new Error("Calendar event not found");
    }
    return event;
  },

  createCalendarEvent: async (data) => {
    // Validation
    if (!data.event_title || !data.start_date || !data.end_date) {
      throw new Error("Event title, start date, and end date are required");
    }

    // Validate dates
    if (new Date(data.start_date) > new Date(data.end_date)) {
      throw new Error("Start date cannot be after end date");
    }

    // Set default color if not provided
    if (!data.color_code) {
      const colorMap = {
        'Academic': '#3b82f6',
        'Holiday': '#ef4444',
        'Exam': '#f59e0b',
        'Break': '#10b981',
        'Enrollment': '#6366f1',
        'Event': '#8b5cf6',
        'Deadline': '#ec4899',
        'Meeting': '#14b8a6'
      };
      data.color_code = colorMap[data.calendar_type] || '#6b7280';
    }

    const result = await SchoolCalendarModel.createCalendarEvent(data);
    return result.insertId;
  },

  updateCalendarEvent: async (id, data) => {
    const existing = await SchoolCalendarModel.getCalendarEventById(id);
    if (!existing) {
      throw new Error("Calendar event not found");
    }

    // Validate dates if updating
    if (data.start_date && data.end_date) {
      if (new Date(data.start_date) > new Date(data.end_date)) {
        throw new Error("Start date cannot be after end date");
      }
    }

    await SchoolCalendarModel.updateCalendarEvent(id, data);
    return true;
  },

  deleteCalendarEvent: async (id) => {
    const existing = await SchoolCalendarModel.getCalendarEventById(id);
    if (!existing) {
      throw new Error("Calendar event not found");
    }

    await SchoolCalendarModel.deleteCalendarEvent(id);
    return true;
  },

  getStatistics: async () => {
    return await SchoolCalendarModel.getStatistics();
  },

  getAcademicYears: async () => {
    return await SchoolCalendarModel.getAcademicYears();
  },
};

export default SchoolCalendarService;
