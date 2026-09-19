import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  Eye,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Send,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    target_audience: "all",
    section_id: "",
    course_id: "",
    expiry_date: "",
    is_pinned: false,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/announcements/faculty/${userId}`
      );

      if (response.data.success) {
        setAnnouncements(response.data.announcements);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
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
    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      const announcementData = {
        ...formData,
        faculty_id: userId,
      };

      let response;
      if (editMode && selectedAnnouncement) {
        response = await axios.put(
          `${API_BASE}/api/announcements/${selectedAnnouncement.id}`,
          announcementData
        );
      } else {
        response = await axios.post(
          `${API_BASE}/api/announcements`,
          announcementData
        );
      }

      if (response.data.success) {
        alert(
          editMode
            ? "Announcement updated successfully!"
            : "Announcement posted successfully!"
        );
        setShowModal(false);
        resetForm();
        fetchAnnouncements();
      }
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("Failed to save announcement");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      target_audience: announcement.target_audience,
      section_id: announcement.section_id || "",
      course_id: announcement.course_id || "",
      expiry_date: announcement.expiry_date
        ? announcement.expiry_date.split("T")[0]
        : "",
      is_pinned: announcement.is_pinned || false,
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE}/api/announcements/${id}`
      );

      if (response.data.success) {
        alert("Announcement deleted successfully!");
        fetchAnnouncements();
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("Failed to delete announcement");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      priority: "normal",
      target_audience: "all",
      section_id: "",
      course_id: "",
      expiry_date: "",
      is_pinned: false,
    });
    setEditMode(false);
    setSelectedAnnouncement(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300";
      case "important":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="w-4 h-4" />;
      case "important":
        return <Bell className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      filterPriority === "all" || announcement.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Bell className="w-8 h-8 mr-3 text-indigo-600" />
              Announcements
            </h1>
            <p className="text-gray-600 mt-2">
              Post announcements to your classes and students
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            New Announcement
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="important">Important</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden ${announcement.is_pinned ? "border-l-4 border-indigo-600" : ""
                }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getPriorityColor(
                          announcement.priority
                        )}`}
                      >
                        {getPriorityIcon(announcement.priority)}
                        {announcement.priority.toUpperCase()}
                      </span>
                      {announcement.is_pinned && (
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                          PINNED
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {announcement.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                      {announcement.content}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedAnnouncement(announcement);
                        setShowViewModal(true);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-500 mt-4 pt-4 border-t">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {announcement.target_audience === "all"
                      ? "All Students"
                      : announcement.section_name || "Specific Section"}
                  </span>
                  {announcement.expiry_date && (
                    <span className="text-orange-600">
                      Expires: {new Date(announcement.expiry_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredAnnouncements.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No announcements found</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editMode ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
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
                  placeholder="Enter announcement title"
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
                  placeholder="Write your announcement here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience *
                  </label>
                  <select
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Students</option>
                    <option value="section">Specific Section</option>
                    <option value="course">Specific Course</option>
                  </select>
                </div>
              </div>

              {formData.target_audience === "section" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section ID
                  </label>
                  <input
                    type="number"
                    name="section_id"
                    value={formData.section_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter section ID"
                  />
                </div>
              )}

              {formData.target_audience === "course" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course ID
                  </label>
                  <input
                    type="number"
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter course ID"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_pinned"
                  id="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="is_pinned"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Pin this announcement (appears at the top)
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {loading
                    ? "Posting..."
                    : editMode
                      ? "Update Announcement"
                      : "Post Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedAnnouncement.title}
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getPriorityColor(
                    selectedAnnouncement.priority
                  )}`}
                >
                  {getPriorityIcon(selectedAnnouncement.priority)}
                  {selectedAnnouncement.priority.toUpperCase()}
                </span>
                {selectedAnnouncement.is_pinned && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                    PINNED
                  </span>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Content</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">Posted:</span>{" "}
                  {new Date(selectedAnnouncement.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    Target Audience:
                  </span>{" "}
                  {selectedAnnouncement.target_audience === "all"
                    ? "All Students"
                    : selectedAnnouncement.section_name || "Specific Group"}
                </div>
                {selectedAnnouncement.expiry_date && (
                  <div>
                    <span className="font-medium text-gray-900">Expires:</span>{" "}
                    {new Date(selectedAnnouncement.expiry_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
