import LMSDiscussions from "../model/lmsDiscussions.model.js";

const lmsDiscussionsController = {
  // Create new discussion thread
  createThread: async (req, res) => {
    try {
      const threadData = req.body;
      const threadId = await LMSDiscussions.createThread(threadData);

      res.status(201).json({
        success: true,
        message: "Discussion thread created successfully",
        threadId,
      });
    } catch (error) {
      console.error("Error creating thread:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create discussion thread",
        error: error.message,
      });
    }
  },

  // Get discussions by section
  getBySection: async (req, res) => {
    try {
      const { section_id, academic_period_id } = req.query;

      if (!section_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Section ID and Academic Period ID are required",
        });
      }

      const discussions = await LMSDiscussions.getBySection(
        section_id,
        academic_period_id
      );

      res.status(200).json({
        success: true,
        discussions,
      });
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch discussions",
        error: error.message,
      });
    }
  },

  // Get discussions by faculty
  getByFaculty: async (req, res) => {
    try {
      const { faculty_id, academic_period_id } = req.query;

      if (!faculty_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Faculty ID and Academic Period ID are required",
        });
      }

      const discussions = await LMSDiscussions.getByFaculty(
        faculty_id,
        academic_period_id
      );

      res.status(200).json({
        success: true,
        discussions,
      });
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch discussions",
        error: error.message,
      });
    }
  },

  // Get discussions for a student based on their enrolled courses
  getByStudent: async (req, res) => {
    try {
      const { student_id, academic_period_id } = req.query;

      if (!student_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Student ID and Academic Period ID are required",
        });
      }

      const discussions = await LMSDiscussions.getByStudent(
        student_id,
        academic_period_id
      );

      res.status(200).json({
        success: true,
        discussions,
      });
    } catch (error) {
      console.error("Error fetching student discussions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch discussions",
        error: error.message,
      });
    }
  },

  // Get discussion by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const discussion = await LMSDiscussions.getById(id);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      res.status(200).json({
        success: true,
        discussion,
      });
    } catch (error) {
      console.error("Error fetching discussion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch discussion",
        error: error.message,
      });
    }
  },

  // Update discussion
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updated = await LMSDiscussions.update(id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Discussion updated successfully",
      });
    } catch (error) {
      console.error("Error updating discussion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update discussion",
        error: error.message,
      });
    }
  },

  // Delete discussion
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await LMSDiscussions.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Discussion deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting discussion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete discussion",
        error: error.message,
      });
    }
  },

  // Create reply
  createReply: async (req, res) => {
    try {
      const replyData = req.body;

      const replyId = await LMSDiscussions.createReply(replyData);

      res.status(201).json({
        success: true,
        message: "Reply created successfully",
        replyId,
      });
    } catch (error) {
      console.error("Error creating reply:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create reply",
        error: error.message,
      });
    }
  },

  // Get replies
  getReplies: async (req, res) => {
    try {
      const { discussion_id } = req.params;

      const replies = await LMSDiscussions.getReplies(discussion_id);

      res.status(200).json({
        success: true,
        replies,
      });
    } catch (error) {
      console.error("Error fetching replies:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch replies",
        error: error.message,
      });
    }
  },

  // Update reply
  updateReply: async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      const updated = await LMSDiscussions.updateReply(id, content);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Reply not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Reply updated successfully",
      });
    } catch (error) {
      console.error("Error updating reply:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update reply",
        error: error.message,
      });
    }
  },

  // Delete reply
  deleteReply: async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await LMSDiscussions.deleteReply(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Reply not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Reply deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting reply:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete reply",
        error: error.message,
      });
    }
  },

  // Toggle like
  toggleLike: async (req, res) => {
    try {
      const { discussion_id, user_id } = req.body;

      const result = await LMSDiscussions.toggleLike(discussion_id, user_id);

      res.status(200).json({
        success: true,
        liked: result.liked,
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle like",
        error: error.message,
      });
    }
  },

  // Get like count
  getLikeCount: async (req, res) => {
    try {
      const { discussion_id } = req.params;

      const likeCount = await LMSDiscussions.getLikeCount(discussion_id);

      res.status(200).json({
        success: true,
        likeCount,
      });
    } catch (error) {
      console.error("Error fetching like count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch like count",
        error: error.message,
      });
    }
  },
};

export default lmsDiscussionsController;
