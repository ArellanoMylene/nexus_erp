import PublicEventsModel from "../model/publicEvents.model.js";

const PublicEventsService = {
  getAllPublicEvents: async (filters) => {
    return await PublicEventsModel.getAllPublicEvents(filters);
  },

  getPublicEventById: async (id) => {
    const event = await PublicEventsModel.getPublicEventById(id);
    if (!event) {
      throw new Error("Public event not found");
    }
    await PublicEventsModel.incrementViews(id);
    return event;
  },

  getPublicEventBySlug: async (slug) => {
    const event = await PublicEventsModel.getPublicEventBySlug(slug);
    if (!event) {
      throw new Error("Public event not found");
    }
    await PublicEventsModel.incrementViews(event.public_event_id);
    return event;
  },

  createPublicEvent: async (data) => {
    // Validation
    if (!data.event_title || !data.event_date) {
      throw new Error("Event title and date are required");
    }

    // Generate slug from title if not provided
    if (!data.event_slug) {
      data.event_slug = PublicEventsModel.generateSlug(data.event_title);
      
      // Ensure unique slug by appending timestamp if needed
      const existing = await PublicEventsModel.getPublicEventBySlug(data.event_slug);
      if (existing) {
        data.event_slug = `${data.event_slug}-${Date.now()}`;
      }
    }

    // Auto-set publish date for Published status
    if (data.status === 'Published' && !data.publish_date) {
      data.publish_date = new Date();
    }

    const result = await PublicEventsModel.createPublicEvent(data);
    return result.insertId;
  },

  updatePublicEvent: async (id, data) => {
    const existing = await PublicEventsModel.getPublicEventById(id);
    if (!existing) {
      throw new Error("Public event not found");
    }

    // Update slug if title changed
    if (data.event_title && data.event_title !== existing.event_title && !data.event_slug) {
      data.event_slug = PublicEventsModel.generateSlug(data.event_title);
    }

    // Auto-set publish date when changing from Draft to Published
    if (data.status === 'Published' && existing.status === 'Draft' && !data.publish_date) {
      data.publish_date = new Date();
    }

    await PublicEventsModel.updatePublicEvent(id, data);
    return true;
  },

  deletePublicEvent: async (id) => {
    const existing = await PublicEventsModel.getPublicEventById(id);
    if (!existing) {
      throw new Error("Public event not found");
    }

    await PublicEventsModel.deletePublicEvent(id);
    return true;
  },

  getStatistics: async () => {
    return await PublicEventsModel.getStatistics();
  },
};

export default PublicEventsService;
