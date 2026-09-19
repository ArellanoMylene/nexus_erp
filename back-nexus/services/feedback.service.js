import FeedbackModel from "../model/feedback.model.js";

const FeedbackService = {
    submitFeedback: async (feedbackData) => {
        // Basic validation
        if (!feedbackData.user_id || !feedbackData.category || !feedbackData.message) {
            throw new Error("Missing required feedback fields");
        }

        if (feedbackData.rating < 1 || feedbackData.rating > 5) {
            throw new Error("Rating must be between 1 and 5");
        }

        return await FeedbackModel.create(feedbackData);
    },

    getStudentFeedback: async (userId) => {
        return await FeedbackModel.getAll({ user_id: userId });
    },

    getAllFeedback: async () => {
        return await FeedbackModel.getAll();
    },
};

export default FeedbackService;
