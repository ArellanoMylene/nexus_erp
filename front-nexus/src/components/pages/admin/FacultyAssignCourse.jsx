import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
} from "lucide-react";

// Turn a raw axios error into a short, human-readable message
const getErrorMessage = (err, fallback) => {
  const serverMessage =
    err.response?.data?.message || err.response?.data?.error;
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

const AssignmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  subjectSections,
  faculty,
  courses,
  periods,
}) => {
  const [formData, setFormData] = useState({
    faculty_id: null,
    course_id: null,
    period_id: null,
    section: "",
    room: "",
    max_students: "",
    schedules: [
      { schedule_day: "", schedule_time_start: "", schedule_time_end: "" },
    ],
  });

  // Section and Room options from subjectSections prop
  const sectionOptions = Array.from(
    new Set((subjectSections || []).map((s) => s.section_name).filter(Boolean)),
  ).map((name) => ({ value: name, label: name }));
  const roomOptions = Array.from(
    new Set((subjectSections || []).map((s) => s.room).filter(Boolean)),
  ).map((room) => ({ value: room, label: room }));

  // Debug: log faculty options when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("Faculty options in modal:", faculty);
    }
  }, [isOpen, faculty]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        faculty_id: initialData.faculty_id ?? null,
        course_id: initialData.course_id ?? null,
        period_id: initialData.period_id ?? null,
        section: initialData.section || "",
        room: initialData.room || "",
        max_students: initialData.max_students || "",
        schedules: Array.isArray(initialData.schedules)
          ? initialData.schedules.map((s) => ({
              schedule_day: s.schedule_day || "",
              schedule_time_start: s.schedule_time_start || "",
              schedule_time_end: s.schedule_time_end || "",
            }))
          : [
              {
                schedule_day: initialData.schedule_day || "",
                schedule_time_start: initialData.schedule_time_start || "",
                schedule_time_end: initialData.schedule_time_end || "",
              },
            ],
        assignment_id: initialData.assignment_id,
      });
    } else if (mode === "edit") {
      setFormData({
        faculty_id: null,
        course_id: null,
        period_id: null,
        section: "",
        room: "",
        max_students: "",
        schedules: [
          { schedule_day: "", schedule_time_start: "", schedule_time_end: "" },
        ],
      });
    }
    // Do NOT reset formData when adding, so selection stays until modal is closed or submitted
    // Only reset on close or after submit
    // eslint-disable-next-line
  }, [initialData, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.faculty_id || !formData.course_id || !formData.period_id) {
      toast.error("Please select faculty, course, and academic period.");
      return;
    }

    console.log("formData before submit:", formData);
    const dataToSend = {
      ...formData,
      faculty_user_id: formData.faculty_id,
      academic_period_id: formData.period_id,
      max_students: formData.max_students
        ? Number(formData.max_students)
        : null,
    };
    delete dataToSend.faculty_id;
    delete dataToSend.period_id;
    onSubmit(dataToSend);
    // Reset form after submit (add mode)
    if (mode === "add") {
      setFormData({
        faculty_id: null,
        course_id: null,
        period_id: null,
        section: "",
        room: "",
        max_students: "",
        schedules: [
          { schedule_day: "", schedule_time_start: "", schedule_time_end: "" },
        ],
      });
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen && mode === "add") {
      setFormData({
        faculty_id: null,
        course_id: null,
        period_id: null,
        section: "",
        room: "",
        max_students: "",
        schedules: [
          { schedule_day: "", schedule_time_start: "", schedule_time_end: "" },
        ],
      });
    }
    // eslint-disable-next-line
  }, [isOpen, mode]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">
              {mode === "add"
                ? "New Course Assignment"
                : "Edit Course Assignment"}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Plus size={24} className="rotate-45" />
            </button>
          </div>
        </div>

        {/* Form Wrapper */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Faculty Member *
                </label>
                <Select
                  value={
                    faculty.find((f) => f.value === formData.faculty_id) || null
                  }
                  onChange={(selected) => {
                    setFormData((prev) => ({
                      ...prev,
                      faculty_id: selected ? selected.value : null,
                    }));
                  }}
                  options={faculty}
                  placeholder="Select faculty..."
                  isDisabled={mode === "edit"}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                      borderColor: "rgb(203 213 225)",
                      "&:hover": { borderColor: "rgb(148 163 184)" },
                    }),
                  }}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Course *
                </label>
                <Select
                  value={
                    courses.find((c) => c.value === formData.course_id) || null
                  }
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      course_id: selected?.value || null,
                    }))
                  }
                  options={courses}
                  placeholder="Select course..."
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                      borderColor: "rgb(203 213 225)",
                      "&:hover": { borderColor: "rgb(148 163 184)" },
                    }),
                  }}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Academic Period *
                </label>
                <Select
                  value={
                    periods.find((p) => p.value === formData.period_id) || null
                  }
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      period_id: selected?.value || null,
                    }))
                  }
                  options={periods}
                  placeholder="Select period..."
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                      borderColor: "rgb(203 213 225)",
                      "&:hover": { borderColor: "rgb(148 163 184)" },
                    }),
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Section
                </label>
                <Select
                  options={sectionOptions}
                  value={
                    sectionOptions.find((o) => o.value === formData.section) ||
                    null
                  }
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      section: selected ? selected.value : "",
                    }))
                  }
                  placeholder="Select section..."
                  isClearable
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                      borderColor: "rgb(203 213 225)",
                      "&:hover": { borderColor: "rgb(148 163 184)" },
                    }),
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Room
                </label>
                <Select
                  options={roomOptions}
                  value={
                    roomOptions.find((o) => o.value === formData.room) || null
                  }
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      room: selected ? selected.value : "",
                    }))
                  }
                  placeholder="Select room..."
                  isClearable
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                      borderColor: "rgb(203 213 225)",
                      "&:hover": { borderColor: "rgb(148 163 184)" },
                    }),
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Max Students
                </label>
                <input
                  type="number"
                  value={formData.max_students}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_students: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Schedules
              </label>
              {formData.schedules.map((sched, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-3 mb-2">
                  <input
                    type="text"
                    value={sched.schedule_day}
                    onChange={(e) => {
                      const newSchedules = [...formData.schedules];
                      newSchedules[idx].schedule_day = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        schedules: newSchedules,
                      }));
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., MWF"
                  />
                  <input
                    type="time"
                    value={sched.schedule_time_start}
                    onChange={(e) => {
                      const newSchedules = [...formData.schedules];
                      newSchedules[idx].schedule_time_start = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        schedules: newSchedules,
                      }));
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={sched.schedule_time_end}
                      onChange={(e) => {
                        const newSchedules = [...formData.schedules];
                        newSchedules[idx].schedule_time_end = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          schedules: newSchedules,
                        }));
                      }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {formData.schedules.length > 1 && (
                      <button
                        type="button"
                        className="px-2 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            schedules: prev.schedules.filter(
                              (_, i) => i !== idx,
                            ),
                          }));
                        }}
                        title="Remove schedule"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    schedules: [
                      ...prev.schedules,
                      {
                        schedule_day: "",
                        schedule_time_start: "",
                        schedule_time_end: "",
                      },
                    ],
                  }))
                }
              >
                <Plus size={12} /> Add Schedule
              </button>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-lg">
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                {mode === "add" ? "Create Assignment" : "Update Assignment"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const FacultyAssignCourse = () => {
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [subjectSections, setSubjectSections] = useState([]);
  const [search, setSearch] = useState("");
  const [filterFaculty, setFilterFaculty] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Fetch Subject Sections
  const fetchSubjectSections = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/sections`);
      setSubjectSections(res.data || []);
    } catch (err) {
      console.error("Error fetching subject sections:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/faculty-assignments`);
      setAssignments(res.data);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      toast.error(getErrorMessage(err, "Failed to load course assignments."));
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/faculty`);
      const facultyList = (res.data || []).map((f) => ({
        value: f.user_id, // Use user_id as the unique identifier
        label: `${f.first_name} ${f.last_name} (${f.employee_id})`,
      }));
      setFaculty(facultyList);
    } catch (err) {
      console.error("Error fetching faculty:", err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/course/courses`);
      const courseList = (res.data || []).map((c) => ({
        value: c.id || c.course_id,
        label: `${c.code || c.course_code} - ${c.title || c.course_title}`,
      }));
      setCourses(courseList);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchPeriods = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/academic-periods`);
      const periodList = (res.data || []).map((p) => ({
        value: p.id || p.period_id,
        label: `${p.school_year} - ${p.semester}`,
      }));
      setPeriods(periodList);
    } catch (err) {
      console.error("Error fetching periods:", err);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchFaculty();
    fetchCourses();
    fetchPeriods();
    fetchSubjectSections();
  }, []);

  const filtered = assignments.filter((a) => {
    const matchSearch =
      (a.faculty_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.course_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.course_title || "").toLowerCase().includes(search.toLowerCase());
    const matchFaculty = !filterFaculty || a.faculty_id === filterFaculty.value;
    return matchSearch && matchFaculty;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const handleSubmit = async (data) => {
    try {
      if (modalMode === "add") {
        await axios.post(`${API_BASE}/api/faculty-assignments`, data);
        toast.success("Course assignment created successfully.");
      } else {
        await axios.put(
          `${API_BASE}/api/faculty-assignments/${data.assignment_id}`,
          data,
        );
        toast.success("Course assignment updated successfully.");
      }
      fetchAssignments();
      setModalOpen(false);
      setCurrentRecord(null);
    } catch (err) {
      console.error("Error saving assignment:", err);
      toast.error(
        getErrorMessage(
          err,
          modalMode === "add"
            ? "Failed to create assignment."
            : "Failed to update assignment.",
        ),
      );
    }
  };

  // Opens the Yes/No confirm modal for deleting an assignment
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
      await axios.delete(`${API_BASE}/api/faculty-assignments/${id}`);
      toast.success("Course assignment deleted successfully.");
      fetchAssignments();
    } catch (err) {
      console.error("Error deleting assignment:", err);
      toast.error(getErrorMessage(err, "Failed to delete assignment."));
    } finally {
      setDeleteLoading(false);
      setDeleteTargetId(null);
    }
  };

  const openModal = (mode, record = null) => {
    setModalMode(mode);
    setCurrentRecord(record);
    setModalOpen(true);
  };

  return (
    <div className="p-3 sm:p-4 transition-colors duration-500">
      <ToastContainer position="top-right" />

      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-600" />
            Faculty Course Assignments
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Total Assignments</p>
            <p className="text-2xl font-bold text-indigo-600">
              {assignments.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Faculty Members</p>
            <p className="text-2xl font-bold text-blue-600">{faculty.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Courses</p>
            <p className="text-2xl font-bold text-green-600">
              {courses.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Academic Periods</p>
            <p className="text-2xl font-bold text-purple-600">
              {periods.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search by faculty or course..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-inner"
            />
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
          </div>

          {/* Filters - RIGHT */}
          <div className="flex items-center gap-2">
            <Select
              value={filterFaculty}
              onChange={(selected) => {
                setFilterFaculty(selected);
                setPage(1);
              }}
              options={faculty}
              placeholder="Filter by Faculty"
              isClearable
              className="w-56 text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "36px",
                  fontSize: "14px",
                  borderColor: "rgb(203 213 225)",
                  "&:hover": { borderColor: "rgb(148 163 184)" },
                }),
              }}
            />
            <button
              onClick={() => openModal("add")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              New Assignment
            </button>
          </div>
        </div>

        {/* Assignments Table */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800">
            Assignment List
          </h2>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="px-4 py-2.5">Faculty</th>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5">Section</th>
                  <th className="px-4 py-2.5">Room</th>
                  <th className="px-4 py-2.5">Schedule</th>
                  <th className="px-4 py-2.5 w-1/12 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayed.length > 0 ? (
                  displayed.map((assignment) => (
                    <tr
                      key={assignment.assignment_id}
                      className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150"
                    >
                      <td className="px-4 py-2 font-medium">
                        {assignment.faculty_name || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {assignment.course_code} - {assignment.course_title}
                      </td>
                      <td className="px-4 py-2">
                        {assignment.school_year} {assignment.semester}
                      </td>
                      <td className="px-4 py-2">{assignment.section || "-"}</td>
                      <td className="px-4 py-2">{assignment.room || "-"}</td>
                      <td className="px-4 py-2">
                        {Array.isArray(assignment.schedules)
                          ? assignment.schedules.map((s, i) => (
                              <div key={i}>
                                {s.schedule_day} {s.schedule_time_start} –{" "}
                                {s.schedule_time_end}
                              </div>
                            ))
                          : assignment.schedule
                            ? assignment.schedule
                            : "-"}
                      </td>
                      <td className="px-4 py-2 text-right space-x-1">
                        <button
                          onClick={() => openModal("edit", assignment)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(assignment.assignment_id)}
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
                      colSpan={7}
                      className="p-4 text-center text-slate-500 italic"
                    >
                      No course assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700">
            <span className="text-xs sm:text-sm">
              Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages || 1}</span> | Total
              Records: {filtered.length}
            </span>
            <div className="flex gap-1 mt-2 sm:mt-0">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              {[...Array(totalPages || 1)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    page === i + 1
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages || 1, page + 1))}
                disabled={page === (totalPages || 1)}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <AssignmentModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setCurrentRecord(null);
          }}
          onSubmit={handleSubmit}
          mode={modalMode}
          initialData={currentRecord}
          subjectSections={subjectSections}
          faculty={faculty}
          courses={courses}
          periods={periods}
        />

        <ConfirmModal
          isOpen={deleteTargetId !== null}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          message={
            <>
              Are you sure you want to delete this course assignment?{" "}
              <span className="text-red-400">This action cannot be undone!</span>
            </>
          }
          confirmLabel="Yes"
          tone="danger"
          loading={deleteLoading}
        />
      </div>
    </div>
  );
};

export default FacultyAssignCourse;