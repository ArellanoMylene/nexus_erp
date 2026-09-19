import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Generic Confirm Modal (same pattern as AcademicSem.jsx) ---
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

const AcademicCalendar = () => {
  const [events, setEvents] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    period_id: "",
    event_name: "",
    event_type: "other",
    start_date: "",
    end_date: "",
    description: "",
    location: "",
    target_audience: "all",
  });

  const eventTypes = [
    { value: "enrollment", label: "Enrollment", color: "#3498db" },
    { value: "exam", label: "Examination", color: "#e74c3c" },
    { value: "holiday", label: "Holiday", color: "#27ae60" },
    { value: "meeting", label: "Meeting", color: "#9b59b6" },
    { value: "deadline", label: "Deadline", color: "#e67e22" },
    { value: "activity", label: "Activity", color: "#1abc9c" },
    { value: "other", label: "Other", color: "#95a5a6" },
  ];

  const audienceOptions = [
    { value: "all", label: "Everyone" },
    { value: "students", label: "Students Only" },
    { value: "faculty", label: "Faculty Only" },
    { value: "staff", label: "Staff Only" },
    { value: "admin", label: "Admin Only" },
  ];

  useEffect(() => {
    fetchEvents();
    fetchPeriods();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/academic-events`);
      // ✅ Handle both array and { data: [...] } response
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]); // ✅ Fallback para hindi mag-crash
      toast.error(getErrorMessage(error, "Failed to load events."));
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/academic-periods`);
      // ✅ Handle both array and { data: [...] } response
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setPeriods(data);
    } catch (error) {
      console.error("Error fetching periods:", error);
      setPeriods([]); // ✅ Fallback
      toast.error(getErrorMessage(error, "Failed to load academic periods."));
    }
  };

  // Turn a raw axios error into a short, human-readable message
  const getErrorMessage = (err, fallback) => {
    const serverMessage =
      err.response?.data?.message || err.response?.data?.error;
    if (serverMessage) return serverMessage;
    if (err.response?.status === 400)
      return "Some fields are missing or invalid. Please check the form and try again.";
    if (err.response?.status === 404)
      return "This event no longer exists. It may have already been deleted.";
    if (err.response?.status === 409)
      return "An event with these details already exists.";
    if (err.response?.status === 500)
      return "Something went wrong on the server. Please try again later.";
    if (!err.response)
      return "Can't reach the server. Check your connection and try again.";
    return fallback;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (selectedOption, field) => {
    setFormData({ ...formData, [field]: selectedOption?.value || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(
          `${API_BASE}/api/academic-events/${currentEvent.event_id}`,
          formData,
        );
        toast.success("Event updated successfully.");
      } else {
        await axios.post(`${API_BASE}/api/academic-events`, formData);
        toast.success("Event added successfully.");
      }
      fetchEvents();
      closeModal();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(
        getErrorMessage(
          error,
          editMode ? "Failed to update event." : "Failed to add event.",
        ),
      );
    }
  };

  const handleEdit = (event) => {
    setCurrentEvent(event);
    setFormData({
      period_id: event.period_id || "",
      event_name: event.event_name,
      event_type: event.event_type,
      start_date: event.start_date,
      end_date: event.end_date || "",
      description: event.description || "",
      location: event.location || "",
      target_audience: event.target_audience,
    });
    setEditMode(true);
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
      await axios.delete(`${API_BASE}/api/academic-events/${id}`);
      fetchEvents();
      toast.success("Event deleted successfully.");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error(getErrorMessage(error, "Failed to delete event."));
    } finally {
      setDeleteTargetId(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentEvent(null);
    setFormData({
      period_id: "",
      event_name: "",
      event_type: "other",
      start_date: "",
      end_date: "",
      description: "",
      location: "",
      target_audience: "all",
    });
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPeriod =
      !filterPeriod || event.period_id === filterPeriod.value;
    const matchesType = !filterType || event.event_type === filterType.value;

    return matchesSearch && matchesPeriod && matchesType;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEvents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  const periodOptions = periods.map((period) => ({
    value: period.id || period.period_id,
    label: `${period.school_year || period.year || ""} ${period.semester || period.period_name || ""}`,
  }));

  const getEventColor = (eventType) => {
    return eventTypes.find((t) => t.value === eventType)?.color || "#95a5a6";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper Components
  const StatusBadge = ({ type }) => {
    const eventTypeObj = eventTypes.find((t) => t.value === type);
    const colorMap = {
      enrollment: "bg-blue-100 text-blue-700",
      exam: "bg-red-100 text-red-700",
      holiday: "bg-green-100 text-green-700",
      meeting: "bg-purple-100 text-purple-700",
      deadline: "bg-orange-100 text-orange-700",
      activity: "bg-teal-100 text-teal-700",
      other: "bg-slate-100 text-slate-700",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          colorMap[type] || colorMap.other
        }`}
      >
        {eventTypeObj?.label || type}
      </span>
    );
  };

  const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700">
      <span className="text-xs sm:text-sm">
        Page {currentPage} of {totalPages} | Total Records: {totalItems}
      </span>
      <div className="flex gap-1 items-center mt-2 sm:mt-0">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 py-1 text-xs font-semibold text-indigo-600">
          {currentPage}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // Calculate statistics
  const totalEvents = events.length;
  const upcomingEvents = events.filter(
    (e) => new Date(e.start_date) > new Date(),
  ).length;
  const thisWeekEvents = events.filter((e) => {
    const eventDate = new Date(e.start_date);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= today && eventDate <= weekFromNow;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <ToastContainer position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Academic Calendar
          </h1>
          <p className="text-gray-600">
            Manage academic events, deadlines, and important dates
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Events
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalEvents}
                </p>
              </div>
              <CalendarIcon className="text-blue-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Upcoming Events
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {upcomingEvents}
                </p>
              </div>
              <TrendingUp className="text-green-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {thisWeekEvents}
                </p>
              </div>
              <Clock className="text-orange-500" size={40} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input - LEFT */}
            <div className="relative flex-grow max-w-xs">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-inner"
              />
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
            </div>

            {/* Filter & Action Buttons - RIGHT */}
            <div className="flex items-center gap-2">
              <div className="w-48">
                <Select
                  options={periodOptions}
                  value={filterPeriod}
                  onChange={(option) => {
                    setFilterPeriod(option);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by Period"
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>
              <div className="w-48">
                <Select
                  options={eventTypes}
                  value={filterType}
                  onChange={(option) => {
                    setFilterType(option);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by Type"
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors text-sm border shadow-sm whitespace-nowrap bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-700 shadow-md shadow-indigo-500/30"
              >
                <Plus size={14} />
                New Event
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="px-4 py-2.5">Event Name</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Audience</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentItems.length > 0 ? (
                  currentItems.map((event) => (
                    <tr
                      key={event.event_id}
                      className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150"
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1 h-12 rounded-full"
                            style={{
                              backgroundColor: getEventColor(event.event_type),
                            }}
                          />
                          <div>
                            <div className="font-semibold">
                              {event.event_name}
                            </div>
                            {event.description && (
                              <div className="text-slate-500 text-xs mt-1">
                                {event.description.substring(0, 60)}
                                {event.description.length > 60 && "..."}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge type={event.event_type} />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={16} className="text-slate-400" />
                          <div>
                            <div>{formatDate(event.start_date)}</div>
                            {event.end_date &&
                              event.end_date !== event.start_date && (
                                <div className="text-slate-500 text-xs">
                                  to {formatDate(event.end_date)}
                                </div>
                              )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {event.school_year && event.semester
                          ? `${event.school_year} ${event.semester}`
                          : "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {event.location ? (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400" />
                            {event.location}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-slate-400" />
                          <span className="capitalize">
                            {event.target_audience}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.event_id)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-4 text-center text-slate-500 italic"
                    >
                      No events found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setPage={setCurrentPage}
            totalItems={filteredEvents.length}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editMode ? "Edit Event" : "Add New Event"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                {/* Event Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <CalendarIcon size={18} className="text-blue-500" />
                    Event Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="event_name"
                        value={formData.event_name}
                        onChange={handleInputChange}
                        placeholder="e.g., First Semester Enrollment"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Event Type <span className="text-red-500">*</span>
                        </label>
                        <Select
                          options={eventTypes}
                          value={eventTypes.find(
                            (o) => o.value === formData.event_type,
                          )}
                          onChange={(option) =>
                            handleSelectChange(option, "event_type")
                          }
                          placeholder="Select Type"
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Academic Period
                        </label>
                        <Select
                          options={periodOptions}
                          value={periodOptions.find(
                            (o) => o.value === formData.period_id,
                          )}
                          onChange={(option) =>
                            handleSelectChange(option, "period_id")
                          }
                          placeholder="Select Period (Optional)"
                          isClearable
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Location */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-green-500" />
                    Date & Location
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Auditorium, Online"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-purple-500" />
                    Additional Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Audience
                      </label>
                      <Select
                        options={audienceOptions}
                        value={audienceOptions.find(
                          (o) => o.value === formData.target_audience,
                        )}
                        onChange={(option) =>
                          handleSelectChange(option, "target_audience")
                        }
                        placeholder="Select Audience"
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Event description..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editMode ? "Update Event" : "Create Event"}
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
            Are you sure you want to delete this event?{" "}
            <span className="text-red-400">This action cannot be undone!</span>
          </>
        }
        confirmLabel="Yes"
        tone="danger"
      />
    </div>
  );
};

export default AcademicCalendar;