import AnnouncementsModel from "../model/announcements.model.js";

const AnnouncementsService = {
  getAllAnnouncements: async (filters) => {
    return await AnnouncementsModel.getAllAnnouncements(filters);
  },

  getAnnouncementById: async (id) => {
    const announcement = await AnnouncementsModel.getAnnouncementById(id);
    if (!announcement) {
      throw new Error("Announcement not found");
    }
    // Increment view count
    await AnnouncementsModel.incrementViews(id);
    return announcement;
  },

  createAnnouncement: async (data) => {
    // Validation
    if (!data.title || !data.content) {
      throw new Error("Title and content are required");
    }

    // Auto-set publish date for Published status
    if (data.status === 'Published' && !data.publish_date) {
      data.publish_date = new Date();
    }

    const result = await AnnouncementsModel.createAnnouncement(data);
    return result.insertId;
  },

  updateAnnouncement: async (id, data) => {
    const existing = await AnnouncementsModel.getAnnouncementById(id);
    if (!existing) {
      throw new Error("Announcement not found");
    }

    // Auto-set publish date when changing from Draft to Published
    if (data.status === 'Published' && existing.status === 'Draft' && !data.publish_date) {
      data.publish_date = new Date();
    }

    await AnnouncementsModel.updateAnnouncement(id, data);
    return true;
  },

  deleteAnnouncement: async (id) => {
    const existing = await AnnouncementsModel.getAnnouncementById(id);
    if (!existing) {
      throw new Error("Announcement not found");
    }

    await AnnouncementsModel.deleteAnnouncement(id);
    return true;
  },

  getStatistics: async () => {
    return await AnnouncementsModel.getStatistics();
  },

  markAsRead: async (announcement_id, user_id) => {
    return await AnnouncementsModel.markAsRead(announcement_id, user_id);
  },
};

export default AnnouncementsService;
