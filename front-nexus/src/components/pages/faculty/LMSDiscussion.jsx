import React, { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Plus,
  Pin,
  Heart,
  Send,
  Edit,
  Trash2,
  X,
  Search,
  Filter,
  Clock,
  User,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getCurrentAcademicPeriodId = async () => {
  try {
    const response = await axios.get(`${API_BASE}/api/academic-periods/active`);
    const periodData = response.data?.period || response.data;
    return periodData?.period_id || periodData?.id || "";
  } catch (error) {
    console.error("Error fetching active academic period:", error);
    return "";
  }
};

const LMSDiscussion = () => {
  const [discussions, setDiscussions] = useState([]);
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [academicPeriods, setAcademicPeriods] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    section_id: "",
    course_id: "",
    academic_period_id: "",
    is_pinned: false,
  });

  const fetchAcademicPeriods = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/academic-periods`);
      const periods = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setAcademicPeriods(periods);
    } catch (error) {
      console.error("Error fetching academic periods:", error);
    }
  }, []);

  const fetchFacultyAssignments = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/faculty-assignments/faculty/${userId}`,
      );
      if (response.data.success) {
        setFacultyAssignments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching faculty assignments:", error);
    }
  }, []);

  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const academicPeriodId = await getCurrentAcademicPeriodId();

      const response = await axios.get(
        `${API_BASE}/api/lms/discussions/faculty`,
        {
          params: {
            faculty_id: userId,
            academic_period_id: academicPeriodId,
          },
        },
      );

      if (response.data.success) {
        setDiscussions(response.data.discussions);
      }
    } catch (error) {
      console.error("Error fetching discussions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicPeriods();
    fetchDiscussions();
    fetchFacultyAssignments();
  }, [fetchAcademicPeriods, fetchDiscussions, fetchFacultyAssignments]);

  const fetchReplies = async (discussionId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/lms/discussions/${discussionId}/replies`,
      );

      if (response.data.success) {
        setReplies(response.data.replies);
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.academic_period_id) {
      alert("Please select an academic period.");
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      const academicPeriodId = formData.academic_period_id;

      const discussionData = {
        ...formData,
        faculty_id: userId,
        academic_period_id: academicPeriodId,
      };

      const response = await axios.post(
        `${API_BASE}/api/lms/discussions`,
        discussionData,
      );

      if (response.data.success) {
        alert("Discussion created successfully!");
        setShowCreateModal(false);
        resetForm();
        fetchDiscussions();
      }
    } catch (error) {
      console.error("Error creating discussion:", error);
      alert("Failed to create discussion");
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();

    if (!replyText.trim()) return;

    try {
      const userId = localStorage.getItem("userId");

      const response = await axios.post(
        `${API_BASE}/api/lms/discussions/replies`,
        {
          discussion_id: selectedDiscussion.id,
          user_id: userId,
          content: replyText,
        },
      );

      if (response.data.success) {
        setReplyText("");
        fetchReplies(selectedDiscussion.id);
      }
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this discussion?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE}/api/lms/discussions/${id}`,
      );

      if (response.data.success) {
        alert("Discussion deleted successfully!");
        fetchDiscussions();
      }
    } catch (error) {
      console.error("Error deleting discussion:", error);
      alert("Failed to delete discussion");
    }
  };

  const handleTogglePin = async (discussion) => {
    try {
      const response = await axios.put(
        `${API_BASE}/api/lms/discussions/${discussion.id}`,
        {
          is_pinned: !discussion.is_pinned,
        },
      );

      if (response.data.success) {
        fetchDiscussions();
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const handleLike = async (discussionId) => {
    try {
      const userId = localStorage.getItem("userId");

      await axios.post(`${API_BASE}/api/lms/discussions/like`, {
        discussion_id: discussionId,
        user_id: userId,
      });

      fetchDiscussions();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      section_id: "",
      course_id: "",
      academic_period_id: "",
      is_pinned: false,
    });
  };

  const filteredDiscussions = discussions.filter(
    (discussion) =>
      discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discussion.content?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openThread = (discussion) => {
    setSelectedDiscussion(discussion);
    fetchReplies(discussion.id);
    setShowThreadModal(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="w-8 h-8 mr-3 text-indigo-600" />
              Class Discussion
            </h1>
            <p className="text-gray-600 mt-2">
              Engage with students through discussion forums
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            New Discussion
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Discussions List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDiscussions.map((discussion) => (
            <div
              key={discussion.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {discussion.is_pinned && (
                        <Pin className="w-5 h-5 text-indigo-600" />
                      )}
                      <h3
                        className="font-semibold text-xl text-gray-900 cursor-pointer hover:text-indigo-600"
                        onClick={() => openThread(discussion)}
                      >
                        {discussion.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {discussion.course_name} - {discussion.section_name}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {discussion.author_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(discussion.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTogglePin(discussion)}
                      className={`p-2 rounded-lg transition ${
                        discussion.is_pinned
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={discussion.is_pinned ? "Unpin" : "Pin"}
                    >
                      <Pin className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(discussion.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {discussion.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => handleLike(discussion.id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition"
                    >
                      <ThumbsUp className="w-5 h-5" />
                      <span className="text-sm">Like</span>
                    </button>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageSquare className="w-5 h-5" />
                      <span className="text-sm">
                        {discussion.reply_count || 0} replies
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openThread(discussion)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    View Discussion →
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredDiscussions.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No discussions found</p>
            </div>
          )}
        </div>
      )}

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Create Discussion
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter discussion topic..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Start the discussion..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <select
                    name="course_id"
                    value={formData.course_id}
                    onChange={(e) => {
                      handleInputChange(e);
                      setFormData((prev) => ({ ...prev, section_id: "" }));
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Course</option>
                    {[
                      ...new Map(
                        facultyAssignments.map((item) => [
                          item.course_id,
                          item,
                        ]),
                      ).values(),
                    ].map((assignment) => (
                      <option
                        key={assignment.course_id}
                        value={assignment.course_id}
                      >
                        {assignment.course_code} - {assignment.course_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section *
                  </label>
                  <select
                    name="section_id"
                    value={formData.section_id}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.course_id}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Section</option>
                    {facultyAssignments
                      .filter(
                        (a) => a.course_id === parseInt(formData.course_id),
                      )
                      .map((assignment) => (
                        <option
                          key={assignment.section_id}
                          value={assignment.section_id}
                        >
                          {assignment.section}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Period *
                </label>
                <select
                  name="academic_period_id"
                  value={formData.academic_period_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Academic Period</option>
                  {academicPeriods.map((period) => {
                    const periodId = period.period_id || period.id;
                    return (
                      <option key={periodId} value={periodId}>
                        {period.school_year} - {period.semester}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="text-sm text-gray-700">
                  Pin this discussion to the top
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
                >
                  {loading ? "Creating..." : "Create Discussion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thread View Modal */}
      {showThreadModal && selectedDiscussion && (
        <div className="fixed inset-0  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {selectedDiscussion.is_pinned && (
                    <Pin className="w-5 h-5 text-indigo-600" />
                  )}
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedDiscussion.title}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDiscussion.course_name} -{" "}
                  {selectedDiscussion.section_name}
                </p>
              </div>
              <button
                onClick={() => setShowThreadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Original Post */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedDiscussion.author_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedDiscussion.author_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedDiscussion.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedDiscussion.content}
                </p>
              </div>

              {/* Replies */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-lg text-gray-900">
                  Replies ({replies.length})
                </h3>

                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="border-l-4 border-indigo-200 pl-4 py-2"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {reply.author_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {reply.author_name}
                          {reply.author_role === "faculty" && (
                            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded">
                              Faculty
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(reply.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap ml-11">
                      {reply.content}
                    </p>
                  </div>
                ))}

                {replies.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No replies yet. Be the first to reply!
                  </p>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleReplySubmit} className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post a Reply
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                  placeholder="Share your thoughts..."
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition"
                  >
                    <Send className="w-4 h-4" />
                    Post Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LMSDiscussion;
