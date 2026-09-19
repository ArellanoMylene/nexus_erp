import AnnouncementsService from "../services/announcements.service.js";

const AnnouncementsController = {
  getAll: async (req, res) => {
    try {
      const currentUserId = req.user ? (req.user.userId || req.user.user_id) : null;
      const filters = { ...req.query, user_id: req.query.user_id || currentUserId };

      const announcements = await AnnouncementsService.getAllAnnouncements(filters);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const announcement = await AnnouncementsService.getAnnouncementById(
        req.params.id,
      );
      res.json(announcement);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    console.log("CREATE ANNOUNCEMENT - Request received:", req.body);
    try {
      if (!req.body.created_by) {
        req.body.created_by = req.user.userId || req.user.user_id;
      }
      console.log("CREATE ANNOUNCEMENT - Calling service with data:", req.body);
      const id = await AnnouncementsService.createAnnouncement(req.body);
      console.log("CREATE ANNOUNCEMENT - Success, ID:", id);
      res.status(201).json({
        announcement_id: id,
        message: "Announcement created successfully",
      });
    } catch (error) {
      console.error("CREATE ANNOUNCEMENT - Error:", error);
      res.status(400).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      req.body.updated_by = req.user.userId || req.user.user_id;
      await AnnouncementsService.updateAnnouncement(req.params.id, req.body);
      res.json({ message: "Announcement updated successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await AnnouncementsService.deleteAnnouncement(req.params.id);
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getStatistics: async (req, res) => {
    try {
      const stats = await AnnouncementsService.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const userId = req.user ? (req.user.userId || req.user.user_id) : null;
      console.log("MARK AS READ - User ID from token:", userId);
      const announcementId = req.params.id;

      if (!userId) {
        console.error("MARK AS READ - No User ID found in req.user:", req.user);
        return res.status(401).json({ error: "User not authenticated" });
      }

      await AnnouncementsService.markAsRead(announcementId, userId);
      res.json({ message: "Announcement marked as read" });
    } catch (error) {
      console.error("MARK AS READ - Error:", error);
      res.status(400).json({ error: error.message });
    }
  },
};

export default AnnouncementsController;
