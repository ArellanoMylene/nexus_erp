import { useState, useEffect } from "react";
import { Mail, Plus, Edit, Trash2, Eye, Globe, Image as ImageIcon, Search, ChevronLeft, ChevronRight } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const PublicEventPosting = () => {
  const [publicEvents, setPublicEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    organizer: "",
    contact_info: "",
    registration_link: "",
    image_url: "",
    is_published: false,
  });

  useEffect(() => {
    fetchPublicEvents();
  }, []);

  const fetchPublicEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/events/public`);
      const data = await response.json();
      if (data.success) {
        setPublicEvents(data.data);
      }
    } catch (error) {
      console.error("Error fetching public events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedEvent
        ? `${API_BASE}/api/events/public/${selectedEvent.public_event_id}`
        : `${API_BASE}/api/events/public`;

      const response = await fetch(url, {
        method: selectedEvent ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success || data.public_event_id) {
        fetchPublicEvents();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving public event:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this public event?")) {
      try {
        const response = await fetch(
          `${API_BASE}/api/events/public/${id}`,
          {
            method: "DELETE",
          }
        );
        if (response.ok) {
          fetchPublicEvents();
        }
      } catch (error) {
        console.error("Error deleting public event:", error);
      }
    }
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date?.split("T")[0] || "",
      event_time: event.event_time || "",
      location: event.location || "",
      organizer: event.organizer || "",
      contact_info: event.contact_info || "",
      registration_link: event.registration_link || "",
      image_url: event.image_url || "",
      is_published: event.is_published || false,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setFormData({
      title: "",
      description: "",
      event_date: "",
      event_time: "",
      location: "",
      organizer: "",
      contact_info: "",
      registration_link: "",
      image_url: "",
      is_published: false,
    });
  };

  // Filter events based on search and status
  const filteredEvents = publicEvents.filter((event) => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && event.is_published) ||
      (statusFilter === "draft" && !event.is_published);

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const togglePublish = async (event) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/events/public/${event.public_event_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...event,
            is_published: !event.is_published,
          }),
        }
      );
      if (response.ok) {
        fetchPublicEvents();
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe size={24} className="text-indigo-600" />
            Public Event Posting
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm transition-all shadow-inner"
            />
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
          </div>

          {/* Filters - RIGHT */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              Post Event
            </button>
          </div>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">
                    Event Title
                  </th>
                  <th className="px-4 py-2.5">
                    Date & Time
                  </th>
                  <th className="px-4 py-2.5">
                    Location
                  </th>
                  <th className="px-4 py-2.5">
                    Organizer
                  </th>
                  <th className="px-4 py-2.5">
                    Status
                  </th>
                  <th className="px-4 py-2.5 w-1/12 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {currentEvents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No public events found
                    </td>
                  </tr>
                ) : (
                  currentEvents.map((event) => (
                    <tr
                      key={event.public_event_id}
                      className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                    >
                      <td className="px-4 py-2">
                        <div className="font-semibold">
                          {event.title}
                        </div>
                        {event.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                            {event.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(event.event_date).toLocaleDateString()}
                        {event.event_time && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {event.event_time}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {event.location || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {event.organizer || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {event.is_published ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <Globe size={12} className="mr-1" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          onClick={() => togglePublish(event)}
                          title={event.is_published ? "Unpublish" : "Publish"}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Globe size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(event)}
                          title="Edit"
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.public_event_id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
          <span className="text-xs sm:text-sm">
            Page <span className="font-semibold">{currentPage}</span> of{" "}
            <span className="font-semibold">{totalPages || 1}</span> | Total Records:{" "}
            {filteredEvents.length}
          </span>
          <div className="flex gap-1 items-center mt-2 sm:mt-0">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
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
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                <Globe className="inline w-5 h-5 text-indigo-600 mr-2" />
                {selectedEvent ? "Edit" : "Post"} Public Event
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 rounded-full p-1 transition-all"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows="4"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData({ ...formData, event_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Event Time
                  </label>
                  <input
                    type="time"
                    value={formData.event_time}
                    onChange={(e) =>
                      setFormData({ ...formData, event_time: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Organizer
                  </label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) =>
                      setFormData({ ...formData, organizer: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Info
                  </label>
                  <input
                    type="text"
                    value={formData.contact_info}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_info: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Registration Link
                </label>
                <input
                  type="url"
                  value={formData.registration_link}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registration_link: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) =>
                    setFormData({ ...formData, is_published: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
                <label
                  htmlFor="is_published"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Publish immediately
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-sm shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-md transition-all text-sm shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40"
                >
                  {selectedEvent ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicEventPosting;
