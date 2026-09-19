import FeedbackService from "../services/feedback.service.js";

const FeedbackController = {
    submit: async (req, res) => {
        try {
            const userId = req.user ? (req.user.userId || req.user.user_id) : null;
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }

            const feedbackData = {
                ...req.body,
                user_id: userId,
            };

            const feedbackId = await FeedbackService.submitFeedback(feedbackData);
            res.status(201).json({
                message: "Feedback submitted successfully",
                feedback_id: feedbackId,
            });
        } catch (error) {
            console.error("FeedbackController.submit error:", error);
            res.status(400).json({ error: error.message });
        }
    },

    getStudentFeedback: async (req, res) => {
        try {
            const userId = req.user ? (req.user.userId || req.user.user_id) : null;
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }

            const feedback = await FeedbackService.getStudentFeedback(userId);
            res.json(feedback);
        } catch (error) {
            console.error("FeedbackController.getStudentFeedback error:", error);
            res.status(500).json({ error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const feedback = await FeedbackService.getAllFeedback();
            res.json(feedback);
        } catch (error) {
            console.error("FeedbackController.getAll error:", error);
            res.status(500).json({ error: error.message });
        }
    },
};

export default FeedbackController;
