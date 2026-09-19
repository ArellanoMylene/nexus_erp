import { useState, useEffect } from "react";
import { CalendarCheck, Plus, Edit, Trash2, Users, MapPin, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const EventScheduling = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    event_type: "",
    status: "",
    search: "",
  });

  const [formData, setFormData] = useState({
    event_name: "",
    description: "",
    event_type: "academic",
    start_date: "",
    end_date: "",
    venue: "",
    organizer: "",
    max_participants: "",
    status: "scheduled",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/events/scheduling`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = parseInt(localStorage.getItem("userId"));
      const payload = {
        ...formData,
        created_by: userId
      };
      
      console.log("Submitting event payload:", payload);
      
      const url = selectedEvent
        ? `${API_BASE}/api/events/scheduling/${selectedEvent.event_id}`
        : `${API_BASE}/api/events/scheduling`;

      const response = await fetch(url, {
        method: selectedEvent ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Server response:", data);
      
      if (data.success || data.event_id) {
        fetchEvents();
        handleCloseModal();
      } else {
        console.error("Save failed:", data);
        alert(`Error: ${data.error || "Failed to save event"}`);
      }
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const response = await fetch(`${API_BASE}/api/events/scheduling/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchEvents();
        }
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      event_name: event.event_name,
      description: event.description,
      event_type: event.event_type,
      start_date: event.start_date?.split("T")[0] || "",
      end_date: event.end_date?.split("T")[0] || "",
      venue: event.venue || "",
      organizer: event.organizer || "",
      max_participants: event.max_participants || "",
      status: event.status,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setFormData({
      event_name: "",
      description: "",
      event_type: "academic",
      start_date: "",
      end_date: "",
      venue: "",
      organizer: "",
      max_participants: "",
      status: "scheduled",
    });
  };

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarCheck size={24} className="text-indigo-600" />
          Event Scheduling
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
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
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
            value={filters.event_type}
            onChange={(e) =>
              setFilters({ ...filters, event_type: e.target.value })
            }
            className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
          >
            <option value="">All Types</option>
            <option value="academic">Academic</option>
            <option value="sports">Sports</option>
            <option value="cultural">Cultural</option>
            <option value="workshop">Workshop</option>
            <option value="seminar">Seminar</option>
            <option value="other">Other</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
            className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-32"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
          >
            <Plus size={14} />
            Schedule Event
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">
                  Event Name
                </th>
                <th className="px-4 py-2.5">
                  Type
                </th>
                <th className="px-4 py-2.5">
                  Date
                </th>
                <th className="px-4 py-2.5">
                  Location
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
              {events
                .filter(event => 
                  (filters.search === "" || 
                    event.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                    event.venue?.toLowerCase().includes(filters.search.toLowerCase()) ||
                    event.organizer?.toLowerCase().includes(filters.search.toLowerCase()))
                )
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No events found
                  </td>
                </tr>
              ) : (
                events
                  .filter(event => 
                    (filters.search === "" || 
                      event.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                      event.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
                      event.organizer?.toLowerCase().includes(filters.search.toLowerCase()))
                  )
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((event) => (
                <tr key={event.event_id} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150">
                  <td className="px-4 py-2">
                    <div className="font-semibold">
                      {event.event_name}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-md">
                      {event.description}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {event.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div>
                      {new Date(event.start_date).toLocaleDateString()}
                    </div>
                    {event.end_date && (
                      <div className="text-xs text-slate-500">
                        to {new Date(event.end_date).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" />
                      <span className="text-xs">{event.venue || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(event)}
                      title="Edit"
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(event.event_id)}
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
          <span className="font-semibold">{Math.ceil(events.filter(event => 
            (filters.search === "" || 
              event.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
              event.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
              event.organizer?.toLowerCase().includes(filters.search.toLowerCase()))
          ).length / itemsPerPage) || 1}</span> | Total Records:{" "}
          {events.filter(event => 
            (filters.search === "" || 
              event.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
              event.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
              event.organizer?.toLowerCase().includes(filters.search.toLowerCase()))
          ).length}
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
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(events.filter(event => 
              (filters.search === "" || 
                event.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                event.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
                event.organizer?.toLowerCase().includes(filters.search.toLowerCase()))
            ).length / itemsPerPage)))}
            disabled={currentPage === Math.ceil(events.filter(event => 
              (filters.search === "" || 
                event.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                event.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
                event.organizer?.toLowerCase().includes(filters.search.toLowerCase()))
            ).length / itemsPerPage)}
            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300" onClick={handleCloseModal}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedEvent ? "Edit" : "Schedule"} Event
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.event_name}
                  onChange={(e) =>
                    setFormData({ ...formData, event_name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Event Type
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) =>
                      setFormData({ ...formData, event_type: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="academic">Academic</option>
                    <option value="sports">Sports</option>
                    <option value="cultural">Cultural</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_participants: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30"
                >
                  {selectedEvent ? "Update" : "Create"} Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventScheduling;
