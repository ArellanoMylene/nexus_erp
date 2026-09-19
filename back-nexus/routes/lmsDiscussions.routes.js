import express from "express";
import lmsDiscussionsController from "../controllers/lmsDiscussions.controller.js";

const router = express.Router();

// Create new discussion thread
router.post("/", lmsDiscussionsController.createThread);

// Get discussions by section
router.get("/section", lmsDiscussionsController.getBySection);

// Get discussions by faculty
router.get("/faculty", lmsDiscussionsController.getByFaculty);

// Get discussions for a student (filtered by enrolled courses)
router.get("/student", lmsDiscussionsController.getByStudent);

// Get discussion by ID
router.get("/:id", lmsDiscussionsController.getById);

// Update discussion
router.put("/:id", lmsDiscussionsController.update);

// Delete discussion
router.delete("/:id", lmsDiscussionsController.delete);

// Create reply
router.post("/replies", lmsDiscussionsController.createReply);

// Get replies for a discussion
router.get("/:discussion_id/replies", lmsDiscussionsController.getReplies);

// Update reply
router.put("/replies/:id", lmsDiscussionsController.updateReply);

// Delete reply
router.delete("/replies/:id", lmsDiscussionsController.deleteReply);

// Toggle like
router.post("/like", lmsDiscussionsController.toggleLike);

// Get like count
router.get("/:discussion_id/likes", lmsDiscussionsController.getLikeCount);

export default router;
