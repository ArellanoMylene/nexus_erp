import { useState, useEffect } from "react";
import Select from "react-select";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ExamScheduleBuilder = () => {
  const [schedules, setSchedules] = useState([]);
  const [exams, setExams] = useState([]);
  const [sections, setSections] = useState([]);
  const [proctors, setProctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    status: "",
    search: "",
  });
  const [formData, setFormData] = useState({
    exam_id: "",
    section_id: "",
    exam_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    proctor_id: "",
    status: "scheduled",
    max_students: "",
  });

  useEffect(() => {
    fetchSchedules();
    fetchExams();
    fetchSections();
    fetchProctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(
        `${API_BASE}/api/exam-schedules?${queryParams}`,
      );
      const data = await response.json();
      console.log("Exam schedules response:", data);
      if (data.success) {
        setSchedules(data.data);
        console.log("Schedules set:", data.data);
      }
    } catch (error) {
      console.error("Error fetching exam schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/exams`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setExams(data.data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/sections`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setSections(data);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const fetchProctors = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/faculty`);
      const data = await response.json();
      console.log("Proctors data:", data);
      if (Array.isArray(data)) {
        setProctors(data);
      }
    } catch (error) {
      console.error("Error fetching proctors:", error);
    }
  };

  const handleFilter = () => {
    fetchSchedules();
  };

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        exam_id: schedule.exam_id || "",
        section_id: schedule.section_id || "",
        exam_date: schedule.exam_date ? schedule.exam_date.split("T")[0] : "",
        start_time: schedule.start_time || "",
        end_time: schedule.end_time || "",
        venue: schedule.venue || "",
        proctor_id: schedule.proctor_id || "",
        status: schedule.status || "scheduled",
        max_students: schedule.max_students || "",
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        exam_id: "",
        section_id: "",
        exam_date: "",
        start_time: "",
        end_time: "",
        venue: "",
        proctor_id: "",
        status: "scheduled",
        max_students: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSchedule
        ? `${API_BASE}/api/exam-schedules/${editingSchedule.schedule_id}`
        : `${API_BASE}/api/exam-schedules`;
      const method = editingSchedule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert(
          editingSchedule
            ? "Schedule updated successfully"
            : "Schedule created successfully",
        );
        handleCloseModal();
        fetchSchedules();
      } else {
        alert("Error: " + (data.message || "Failed to save schedule"));
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Error saving schedule");
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const response = await fetch(
        `${API_BASE}/api/exam-schedules/${scheduleId}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (data.success) {
        alert("Schedule deleted successfully");
        fetchSchedules();
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Error deleting schedule");
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      scheduled: "bg-blue-100 text-blue-800",
      rescheduled: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          statusColors[status] || "bg-slate-100 text-slate-800"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className=" p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            Exam Schedule Builder
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Total Schedules</p>
            <p className="text-2xl font-bold text-indigo-600">
              {schedules.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600">
              {
                schedules.filter((s) => {
                  const examDate = new Date(s.exam_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return examDate > today && s.status === "scheduled";
                }).length
              }
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Today</p>
            <p className="text-2xl font-bold text-green-600">
              {
                schedules.filter((s) => {
                  const examDate = new Date(s.exam_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  examDate.setHours(0, 0, 0, 0);
                  return examDate.getTime() === today.getTime();
                }).length
              }
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Completed</p>
            <p className="text-2xl font-bold text-purple-600">
              {schedules.filter((s) => s.status === "completed").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search schedules..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-inner"
            />
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
          </div>

          {/* Filters - RIGHT */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) =>
                setFilters({ ...filters, date_from: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-40"
            />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) =>
                setFilters({ ...filters, date_to: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-40"
            />
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-40"
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              Apply Filters
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              Schedule Exam
            </button>
          </div>
        </div>

        {/* Schedules Table */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800">
            Exam Schedule List
          </h2>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="px-4 py-2.5">Exam Name</th>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">Section</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Venue</th>
                  <th className="px-4 py-2.5">Proctor</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-1/12 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(() => {
                  if (loading) {
                    return (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-4 text-center text-slate-500 italic"
                        >
                          Loading...
                        </td>
                      </tr>
                    );
                  }

                  const searchTerm = filters.search.toLowerCase();
                  const filtered = schedules.filter((schedule) => {
                    const matchesSearch =
                      schedule.exam_name?.toLowerCase().includes(searchTerm) ||
                      schedule.course_code
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      schedule.section_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      schedule.venue?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });

                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const paginatedData = filtered.slice(
                    startIndex,
                    startIndex + itemsPerPage,
                  );

                  if (paginatedData.length === 0) {
                    return (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-4 text-center text-slate-500 italic"
                        >
                          No exam schedules found matching your search criteria.
                        </td>
                      </tr>
                    );
                  }

                  return paginatedData.map((schedule) => (
                    <tr
                      key={schedule.schedule_id}
                      className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150"
                    >
                      <td className="px-4 py-2 font-medium">
                        {schedule.exam_name}
                      </td>
                      <td className="px-4 py-2">{schedule.course_code}</td>
                      <td className="px-4 py-2">
                        {schedule.section_name || "All"}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(schedule.exam_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {schedule.start_time} - {schedule.end_time}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          {schedule.venue || "TBA"}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {schedule.proctor_first_name ? (
                          <div className="flex items-center gap-1">
                            <Users size={12} />
                            {schedule.proctor_first_name}{" "}
                            {schedule.proctor_last_name}
                          </div>
                        ) : (
                          "Not assigned"
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {getStatusBadge(schedule.status)}
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(schedule)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.schedule_id)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700">
            <span className="text-xs sm:text-sm">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">
                {(() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = schedules.filter((schedule) => {
                    const matchesSearch =
                      schedule.exam_name?.toLowerCase().includes(searchTerm) ||
                      schedule.course_code
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      schedule.section_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      schedule.venue?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  return Math.ceil(filtered.length / itemsPerPage) || 1;
                })()}
              </span>{" "}
              | Total Records:{" "}
              {(() => {
                const searchTerm = filters.search.toLowerCase();
                const filtered = schedules.filter((schedule) => {
                  const matchesSearch =
                    schedule.exam_name?.toLowerCase().includes(searchTerm) ||
                    schedule.course_code?.toLowerCase().includes(searchTerm) ||
                    schedule.section_name?.toLowerCase().includes(searchTerm) ||
                    schedule.venue?.toLowerCase().includes(searchTerm);
                  return matchesSearch;
                });
                return filtered.length;
              })()}
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
                onClick={() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = schedules.filter((schedule) => {
                    const matchesSearch =
                      schedule.exam_name?.toLowerCase().includes(searchTerm) ||
                      schedule.course_code
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      schedule.section_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      schedule.venue?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  const totalPages = Math.ceil(filtered.length / itemsPerPage);
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                }}
                disabled={(() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = schedules.filter((schedule) => {
                    const matchesSearch =
                      schedule.exam_name?.toLowerCase().includes(searchTerm) ||
                      schedule.course_code
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      schedule.section_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      schedule.venue?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  const totalPages = Math.ceil(filtered.length / itemsPerPage);
                  return currentPage === totalPages;
                })()}
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
            onClick={handleCloseModal}
          >
            <div
              className="bg-white rounded-lg shadow-2xl w-full max-w-4xl transform transition-transform duration-300 scale-100 border border-slate-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg z-10">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSchedule ? "Edit" : "Add"} Exam Schedule
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Plus size={18} className="rotate-45" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Exam ID *
                    </label>
                    <Select
                      options={exams.map((exam) => ({
                        value: exam.exam_id,
                        label: `${exam.exam_name} - ${exam.course_code}`,
                      }))}
                      value={
                        formData.exam_id
                          ? {
                              value: formData.exam_id,
                              label: exams.find(
                                (e) => e.exam_id === formData.exam_id,
                              )
                                ? `${exams.find((e) => e.exam_id === formData.exam_id).exam_name} - ${exams.find((e) => e.exam_id === formData.exam_id).course_code}`
                                : "",
                            }
                          : null
                      }
                      onChange={(option) =>
                        setFormData({
                          ...formData,
                          exam_id: option?.value || "",
                        })
                      }
                      className="text-sm"
                      placeholder="Select exam..."
                      isClearable
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Section ID
                    </label>
                    <Select
                      options={sections.map((section) => ({
                        value: section.section_id,
                        label: section.section_name,
                      }))}
                      value={
                        formData.section_id
                          ? {
                              value: formData.section_id,
                              label:
                                sections.find(
                                  (s) => s.section_id === formData.section_id,
                                )?.section_name || "",
                            }
                          : null
                      }
                      onChange={(option) =>
                        setFormData({
                          ...formData,
                          section_id: option?.value || "",
                        })
                      }
                      className="text-sm"
                      placeholder="Select section..."
                      isClearable
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Exam Date *
                    </label>
                    <input
                      type="date"
                      value={formData.exam_date}
                      onChange={(e) =>
                        setFormData({ ...formData, exam_date: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Venue *
                    </label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) =>
                        setFormData({ ...formData, venue: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Proctor ID
                    </label>
                    <Select
                      options={proctors.map((proctor) => ({
                        value: proctor.faculty_id,
                        label: `${proctor.first_name} ${proctor.last_name}`,
                      }))}
                      value={
                        formData.proctor_id
                          ? {
                              value: formData.proctor_id,
                              label: proctors.find(
                                (p) => p.faculty_id === formData.proctor_id,
                              )
                                ? `${proctors.find((p) => p.faculty_id === formData.proctor_id).first_name} ${proctors.find((p) => p.faculty_id === formData.proctor_id).last_name}`
                                : "",
                            }
                          : null
                      }
                      onChange={(option) =>
                        setFormData({
                          ...formData,
                          proctor_id: option?.value || "",
                        })
                      }
                      className="text-sm"
                      placeholder="Select proctor..."
                      isClearable
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="rescheduled">Rescheduled</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Max Students
                    </label>
                    <input
                      type="number"
                      value={formData.max_students}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_students: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors border border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30"
                  >
                    {editingSchedule ? "Update" : "Save"} Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamScheduleBuilder;
