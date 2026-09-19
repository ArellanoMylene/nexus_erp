import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  BookOpen,
  GraduationCap,
  AlertCircle,
  TrendingUp,
  Eye,
} from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Turn a raw axios error into a short, human-readable message
const getErrorMessage = (err, fallback) => {
  const serverMessage = err.response?.data?.error || err.response?.data?.message;
  if (serverMessage) return serverMessage;
  if (err.response?.status === 400)
    return "Some fields are missing or invalid. Please check the form and try again.";
  if (err.response?.status === 404)
    return "This record no longer exists. It may have already been deleted.";
  if (err.response?.status === 409)
    return "A conflicting record already exists.";
  if (err.response?.status === 500)
    return "Something went wrong on the server. Please try again later.";
  if (!err.response)
    return "Can't reach the server. Check your connection and try again.";
  return fallback;
};

// --- Generic Confirm Modal (Yes / No), same pattern used across the module ---
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  confirmLabel = "Yes",
  tone = "danger",
  loading = false,
}) => {
  if (!isOpen) return null;

  const confirmClasses =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-green-600 hover:bg-green-700";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4"
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
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${confirmClasses}`}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    full: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        colors[status] || colors.active
      }`}
    >
      {status?.toUpperCase()}
    </span>
  );
};

// Small badge for enrollment status inside the View Students modal
const EnrollmentStatusBadge = ({ status }) => {
  const colors = {
    Enrolled: "bg-green-100 text-green-800",
    Dropped: "bg-red-100 text-red-800",
    Completed: "bg-blue-100 text-blue-800",
    Failed: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        colors[status] || colors.Enrolled
      }`}
    >
      {status}
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

// Modal that lists students currently enrolled in a given section.
const ViewStudentsModal = ({ isOpen, onClose, section }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !section) return;

    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/enrollments`, {
          params: { section_id: section.section_id },
        });
        setStudents(res.data || []);
      } catch (err) {
        console.error("Error fetching section students:", err);
        setError("Failed to load enrolled students.");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [isOpen, section]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Enrolled Students
            </h2>
            {section && (
              <p className="text-sm text-slate-500 mt-0.5">
                {section.program_code && (
                  <span className="font-semibold text-indigo-600 mr-1.5">
                    [{section.program_code}]
                  </span>
                )}
                {section.section_name} — {section.semester}{" "}
                {section.school_year} ·{" "}
                <span className="font-semibold">
                  {section.current_enrolled}/{section.max_capacity}
                </span>{" "}
                slots
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-center text-slate-500 py-8 text-sm">
              Loading students...
            </p>
          ) : error ? (
            <p className="text-center text-red-500 py-8 text-sm">{error}</p>
          ) : students.length === 0 ? (
            <p className="text-center text-slate-500 italic py-8 text-sm">
              No students enrolled in this section yet.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Student No.</th>
                  <th className="px-3 py-2">Year Level</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-center">Grades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.enrollment_id} className="text-sm text-slate-700">
                    <td className="px-3 py-2 font-medium">
                      {s.student_name}
                    </td>
                    <td className="px-3 py-2">{s.student_number || "N/A"}</td>
                    <td className="px-3 py-2">{s.year_level || "N/A"}</td>
                    <td className="px-3 py-2">
                      <EnrollmentStatusBadge status={s.status} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {s.midterm_grade ?? "-"} / {s.final_grade ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SubjectSections = () => {
  const [sections, setSections] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [filterPeriod, setFilterPeriod] = useState(null);
  const [filterProgram, setFilterProgram] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    program_id: "",
    period_id: "",
    section_name: "",
    room: "",
    max_capacity: 40,
    schedule_day: "",
    schedule_time_start: "",
    schedule_time_end: "",
    status: "active",
  });

  // View Students modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewSection, setViewSection] = useState(null);

  // Delete confirm modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchSections();
    fetchPeriods();
    fetchPrograms();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/sections`);
      setSections(response.data);
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error(getErrorMessage(error, "Failed to load sections."));
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/academic-periods`);
      setPeriods(response.data);
      const activePeriod = Array.isArray(response.data)
        ? response.data.find((period) => period.is_active)
        : null;
      if (activePeriod) {
        setFormData((prev) => ({
          ...prev,
          period_id: activePeriod.id || activePeriod.period_id,
        }));
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/programs`);
      setPrograms(response.data || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOption, field) => {
    setFormData((prev) => ({ ...prev, [field]: selectedOption?.value || "" }));
  };

  // Helper to suggest or format section name with program code
  const handleProgramSelect = (selectedOption) => {
    const progId = selectedOption?.value || "";
    const selectedProg = programs.find((p) => (p.id || p.program_id) === progId);
    
    setFormData((prev) => {
      let nextSectionName = prev.section_name;
      // If section name is empty or already matches another program prefix, help format it
      if (selectedProg) {
        if (!nextSectionName) {
          nextSectionName = `${selectedProg.code}-1A`;
        }
      }
      return {
        ...prev,
        program_id: progId,
        section_name: nextSectionName,
      };
    });
  };

  const setSectionSuffix = (suffix) => {
    const selectedProg = programs.find((p) => (p.id || p.program_id) === formData.program_id);
    const prefix = selectedProg ? `${selectedProg.code}-` : "";
    setFormData((prev) => ({
      ...prev,
      section_name: `${prefix}${suffix}`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.program_id) {
      toast.error("Please select a Program Offering.");
      return;
    }
    if (!formData.period_id) {
      toast.error("Please select an Academic Period.");
      return;
    }
    if (!formData.section_name?.trim()) {
      toast.error("Please enter a Section Name.");
      return;
    }

    try {
      if (editMode) {
        await axios.put(
          `${API_BASE}/api/sections/${currentSection.section_id}`,
          formData,
        );
        toast.success("Section updated successfully.");
      } else {
        await axios.post(`${API_BASE}/api/sections`, formData);
        toast.success("Section created successfully.");
      }
      fetchSections();
      closeModal();
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error(
        getErrorMessage(
          error,
          editMode ? "Failed to update section." : "Failed to create section.",
        ),
      );
    }
  };

  const handleEdit = (section) => {
    setCurrentSection(section);
    setFormData({
      program_id: section.program_id || "",
      period_id: section.period_id || "",
      section_name: section.section_name || "",
      room: section.room || "",
      max_capacity: section.max_capacity || 40,
      schedule_day: section.schedule_day || "",
      schedule_time_start: section.schedule_time_start || "",
      schedule_time_end: section.schedule_time_end || "",
      status: section.status || "active",
    });
    setEditMode(true);
    setShowModal(true);
  };

  // Opens the Yes/No confirm modal for deleting a section
  const handleDelete = (id) => {
    setDeleteTargetId(id);
  };

  const cancelDelete = () => {
    if (deleteLoading) return;
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    if (!id) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_BASE}/api/sections/${id}`);
      toast.success("Section deleted successfully.");
      fetchSections();
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error(getErrorMessage(error, "Failed to delete section."));
    } finally {
      setDeleteLoading(false);
      setDeleteTargetId(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentSection(null);
    const activePeriod = Array.isArray(periods)
      ? periods.find((p) => p.is_active)
      : null;
    setFormData({
      program_id: "",
      period_id: activePeriod ? (activePeriod.id || activePeriod.period_id) : "",
      section_name: "",
      room: "",
      max_capacity: 40,
      schedule_day: "",
      schedule_time_start: "",
      schedule_time_end: "",
      status: "active",
    });
  };

  const openViewModal = (section) => {
    setViewSection(section);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewSection(null);
  };

  // Filter sections
  const filteredSections = sections.filter((section) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (section.section_name || "").toLowerCase().includes(q) ||
      (section.room || "").toLowerCase().includes(q) ||
      (section.program_code || "").toLowerCase().includes(q) ||
      (section.program_name || "").toLowerCase().includes(q);

    const matchesPeriod =
      !filterPeriod || String(section.period_id) === String(filterPeriod.value);

    const matchesProgram =
      !filterProgram || String(section.program_id) === String(filterProgram.value);

    return matchesSearch && matchesPeriod && matchesProgram;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSections.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredSections.length / itemsPerPage);

  const periodOptions = periods.map((period) => ({
    value: period.id || period.period_id,
    label: `${period.semester} ${period.school_year}`,
  }));

  const programOptions = programs.map((prog) => ({
    value: prog.id || prog.program_id,
    label: `${prog.code} - ${prog.name}`,
    code: prog.code,
    name: prog.name,
  }));

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "full", label: "Full" },
  ];

  // Calculate statistics
  const totalSections = sections.length;
  const activeSections = sections.filter((s) => s.status === "active").length;
  const fullSections = sections.filter(
    (s) => s.current_enrolled >= s.max_capacity,
  ).length;
  const totalStudents = sections.reduce(
    (sum, s) => sum + (s.current_enrolled || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <ToastContainer position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subject & Sections Management
          </h1>
          <p className="text-gray-600">
            Manage academic program sections, capacity, and student sectioning
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Sections
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalSections}
                </p>
              </div>
              <BookOpen className="text-blue-500" size={40} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Sections
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {activeSections}
                </p>
              </div>
              <TrendingUp className="text-green-500" size={40} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Full Sections
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {fullSections}
                </p>
              </div>
              <AlertCircle className="text-red-500" size={40} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalStudents}
                </p>
              </div>
              <Users className="text-purple-500" size={40} />
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
                placeholder="Search by section, program, or room..."
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-52">
                <Select
                  options={programOptions}
                  value={filterProgram}
                  onChange={(option) => {
                    setFilterProgram(option);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by Program"
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>
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
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors text-sm border shadow-sm whitespace-nowrap bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-700 shadow-md shadow-indigo-500/30"
              >
                <Plus size={14} />
                New Section
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="px-4 py-2.5">Program Offering</th>
                  <th className="px-4 py-2.5">Section Name</th>
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5">Room</th>
                  <th className="px-4 py-2.5">Capacity</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentItems.length > 0 ? (
                  currentItems.map((section) => {
                    const capacityPercentage =
                      (section.current_enrolled / section.max_capacity) * 100;
                    return (
                      <tr
                        key={section.section_id}
                        className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150"
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-xs">
                              {section.program_code || "General"}
                            </span>
                            {section.program_name && (
                              <span className="text-xs text-slate-500 truncate max-w-[200px]" title={section.program_name}>
                                {section.program_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-semibold text-gray-900">
                            {section.section_name}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {section.semester} {section.school_year}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-slate-400" />
                            {section.room || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-slate-400" />
                              <span className="font-semibold">
                                {section.current_enrolled}/
                                {section.max_capacity}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  capacityPercentage >= 100
                                    ? "bg-red-500"
                                    : capacityPercentage >= 80
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(capacityPercentage, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <StatusBadge status={section.status} />
                        </td>
                        <td className="px-4 py-2 text-right space-x-2">
                          <button
                            onClick={() => openViewModal(section)}
                            title="View Enrolled Students"
                            className="text-slate-600 hover:text-slate-900 transition-colors p-1 rounded-full hover:bg-slate-200"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleEdit(section)}
                            title="Edit"
                            className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(section.section_id)}
                            title="Delete"
                            className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-8 text-center text-slate-500 italic"
                    >
                      No sections found matching your search criteria.
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
            totalItems={filteredSections.length}
          />
        </div>
      </div>

      {/* Add/Edit Section Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editMode ? "Edit Section" : "Add New Section"}
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
                {/* Program & Academic Period */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <GraduationCap size={18} className="text-indigo-600" />
                    Program & Period Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Program Offering <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={programOptions}
                        value={programOptions.find(
                          (o) => o.value === formData.program_id,
                        )}
                        onChange={handleProgramSelect}
                        placeholder="Select Program..."
                        required
                        className="react-select-container text-sm"
                        classNamePrefix="react-select"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Sections are tied to programs (e.g. BPA, BAHISTO).
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Academic Period <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={periodOptions}
                        value={periodOptions.find(
                          (o) => o.value === formData.period_id,
                        )}
                        onChange={(option) =>
                          handleSelectChange(option, "period_id")
                        }
                        placeholder="Select Period..."
                        required
                        className="react-select-container text-sm"
                        classNamePrefix="react-select"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users size={18} className="text-green-600" />
                    Section Identification & Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Section Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="section_name"
                        value={formData.section_name}
                        onChange={handleInputChange}
                        placeholder="e.g., BPA-1A, BAHISTO-1A, BPA - 1A"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                      />

                      {/* Quick Suffix Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-xs text-slate-500 mr-1">
                          Quick Presets:
                        </span>
                        {["1A", "1B", "1C", "2A", "2B", "3A", "4A"].map((suf) => (
                          <button
                            key={suf}
                            type="button"
                            onClick={() => setSectionSuffix(suf)}
                            className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded font-medium transition-colors"
                          >
                            {suf}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Max Capacity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="max_capacity"
                          value={formData.max_capacity}
                          onChange={handleInputChange}
                          min="1"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Room
                        </label>
                        <input
                          type="text"
                          name="room"
                          value={formData.room}
                          onChange={handleInputChange}
                          placeholder="e.g., Room 101"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Status
                        </label>
                        <Select
                          options={statusOptions}
                          value={statusOptions.find(
                            (o) => o.value === formData.status,
                          )}
                          onChange={(option) =>
                            handleSelectChange(option, "status")
                          }
                          placeholder="Select Status"
                          className="react-select-container text-sm"
                          classNamePrefix="react-select"
                        />
                      </div>
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
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow"
                >
                  {editMode ? "Update Section" : "Create Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Enrolled Students Modal */}
      <ViewStudentsModal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        section={viewSection}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message={
          <>
            Are you sure you want to delete this section?{" "}
            <span className="text-red-500 font-semibold">This action cannot be undone!</span>
          </>
        }
        confirmLabel="Yes, Delete"
        tone="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default SubjectSections;