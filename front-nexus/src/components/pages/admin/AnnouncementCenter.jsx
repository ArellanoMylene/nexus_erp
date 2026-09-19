import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Bell,
  Eye,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Generic Confirm Modal (same pattern as AcademicCalendar.jsx) ---
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  confirmLabel = "Yes",
  tone = "danger",
}) => {
  if (!isOpen) return null;

  const confirmClasses =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-green-600 hover:bg-green-700";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-gray-900 text-center mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AnnouncementCenter = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [current, setCurrent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    announcement_type: "General",
    priority: "Normal",
    target_audience: "All",
    target_year_levels: "",
    target_courses: "",
    status: "Draft",
    publish_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    is_pinned: false,
  });

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    fetchData();
    // fetchStatistics(); // Temporarily disabled due to backend error
  }, []);

  // Turn a raw axios error into a short, human-readable message
  const getErrorMessage = (err, fallback) => {
    const serverMessage =
      err.response?.data?.message || err.response?.data?.error;
    if (serverMessage) return serverMessage;
    if (err.response?.status === 400)
      return "Some fields are missing or invalid. Please check the form and try again.";
    if (err.response?.status === 404)
      return "This announcement no longer exists. It may have already been deleted.";
    if (err.response?.status === 409)
      return "An announcement with these details already exists.";
    if (err.response?.status === 500)
      return "Something went wrong on the server. Please try again later.";
    if (!err.response)
      return "Can't reach the server. Check your connection and try again.";
    return fallback;
  };

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (searchTerm) params.append("search", searchTerm);
      const response = await axios.get(
        `${API_BASE}/api/events/announcements?${params}`,
        authHeaders(),
      );
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error(getErrorMessage(error, "Failed to load announcements."));
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/events/announcements/statistics`,
      );
      setStatistics(response.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error(getErrorMessage(error, "Failed to load statistics."));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = parseInt(localStorage.getItem("userId"));
      const submitData = current
        ? formData
        : { ...formData, created_by: userId };

      if (current) {
        await axios.put(
          `${API_BASE}/api/events/announcements/${current.announcement_id}`,
          submitData,
          authHeaders(),
        );
        toast.success("Announcement updated successfully.");
      } else {
        await axios.post(
          `${API_BASE}/api/events/announcements`,
          submitData,
          authHeaders(),
        );
        toast.success("Announcement added successfully.");
      }
      await fetchData();
      // fetchStatistics(); // Temporarily disabled
      closeModal();
    } catch (error) {
      console.error("Error details:", error);
      console.error("Error response:", error.response);
      if (error.code === "ECONNABORTED") {
        toast.error("Request timeout - server is not responding.");
      } else {
        toast.error(
          getErrorMessage(
            error,
            current
              ? "Failed to update announcement."
              : "Failed to add announcement.",
          ),
        );
      }
    }
  };

  const handleEdit = (item) => {
    setCurrent(item);
    setFormData({
      title: item.title,
      content: item.content,
      announcement_type: item.announcement_type,
      priority: item.priority,
      target_audience: item.target_audience,
      target_year_levels: item.target_year_levels || "",
      target_courses: item.target_courses || "",
      status: item.status,
      publish_date: item.publish_date
        ? new Date(item.publish_date).toISOString().split("T")[0]
        : "",
      expiry_date: item.expiry_date
        ? new Date(item.expiry_date).toISOString().split("T")[0]
        : "",
      is_pinned: item.is_pinned,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteTargetId(id);
  };

  const cancelDelete = () => {
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    if (!id) return;
    try {
      await axios.delete(
        `${API_BASE}/api/events/announcements/${id}`,
        authHeaders(),
      );
      fetchData();
      // fetchStatistics(); // Temporarily disabled
      toast.success("Announcement deleted successfully.");
    } catch (error) {
      console.error("Error:", error);
      toast.error(getErrorMessage(error, "Failed to delete announcement."));
    } finally {
      setDeleteTargetId(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrent(null);
    setFormData({
      title: "",
      content: "",
      announcement_type: "General",
      priority: "Normal",
      target_audience: "All",
      target_year_levels: "",
      target_courses: "",
      status: "Draft",
      publish_date: new Date().toISOString().split("T")[0],
      expiry_date: "",
      is_pinned: false,
    });
  };

  const filtered = announcements.filter(
    (a) =>
      (!searchTerm ||
        a.title?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!filterStatus || a.status === filterStatus),
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getPriorityBadge = (priority) => {
    const badges = {
      Low: "bg-gray-100 text-gray-700",
      Normal: "bg-blue-100 text-blue-700",
      High: "bg-orange-100 text-orange-700",
      Urgent: "bg-red-100 text-red-700",
    };
    return badges[priority] || badges.Normal;
  };

  const getStatusBadge = (status) => {
    const badges = {
      Draft: "bg-gray-100 text-gray-700",
      Published: "bg-green-100 text-green-700",
      Archived: "bg-slate-100 text-slate-700",
      Scheduled: "bg-yellow-100 text-yellow-700",
    };
    return badges[status] || badges.Draft;
  };

  return (
    <div className="p-3 sm:p-4 transition-colors duration-500">
      <ToastContainer position="top-right" />

      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell size={24} className="text-indigo-600" />
            Announcement Center
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600">Total</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {statistics.total_announcements}
              </p>
            </div>
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600">Published</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {statistics.published_count}
              </p>
            </div>
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600">Draft</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">
                {statistics.draft_count}
              </p>
            </div>
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600">Views</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {statistics.total_views}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 text-sm transition-all shadow-inner"
            />
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
          </div>

          {/* Filters - RIGHT */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 text-sm w-40"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Archived">Archived</option>
            </select>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              New Announcement
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Target</th>
                <th className="px-4 py-2.5">Publish Date</th>
                <th className="px-4 py-2.5">Views</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 w-1/12 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr
                    key={item.announcement_id}
                    className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150"
                  >
                    <td className="px-4 py-2">
                      <div className="font-semibold">
                        {item.is_pinned && "📌 "}
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">
                        {item.content}
                      </div>
                    </td>
                    <td className="px-4 py-2">{item.announcement_type}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadge(item.priority)}`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2">{item.target_audience}</td>
                    <td className="px-4 py-2">
                      {item.publish_date
                        ? new Date(item.publish_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Eye size={12} className="text-slate-400" />
                        <span>{item.views_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        title="Edit"
                        className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.announcement_id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="p-4 text-center text-slate-500 italic"
                  >
                    No announcements found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700">
          <span className="text-xs sm:text-sm">
            Page <span className="font-semibold">{currentPage}</span> of{" "}
            <span className="font-semibold">{totalPages || 1}</span> | Total
            Records: {filtered.length}
          </span>
          <div className="flex gap-1 items-center mt-2 sm:mt-0">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 py-1 text-xs font-semibold text-indigo-600">
              {currentPage}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-transform duration-300 scale-100 border border-slate-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900">
                {current ? "Edit" : "Add"} Announcement
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows="5"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    name="announcement_type"
                    value={formData.announcement_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Event">Event</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="All">All</option>
                    <option value="Students">Students</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Staff">Staff</option>
                    <option value="Parents">Parents</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    name="publish_date"
                    value={formData.publish_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_pinned"
                  id="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="is_pinned"
                  className="text-xs font-medium text-slate-700"
                >
                  Pin to Top
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30"
                >
                  {current ? "Update" : "Save"} Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message={
          <>
            Are you sure you want to delete this announcement?{" "}
            <span className="text-red-400">This action cannot be undone!</span>
          </>
        }
        confirmLabel="Yes"
        tone="danger"
      />
    </div>
  );
};

export default AnnouncementCenter;