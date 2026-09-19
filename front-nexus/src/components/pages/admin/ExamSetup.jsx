import { useState, useEffect } from "react";
import Select from "react-select";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const runtimeHostApiBase =
  typeof window !== "undefined"
    ? `http://${window.location.hostname}:5000`
    : "http://localhost:5000";

const apiBaseCandidates = [
  import.meta.env.VITE_API_BASE_URL,
  runtimeHostApiBase,
  "http://localhost:5000",
].filter((value, index, arr) => value && arr.indexOf(value) === index);

const apiFetch = async (path, options = {}) => {
  let lastError;

  for (const base of apiBaseCandidates) {
    try {
      const response = await fetch(`${base}${path}`, options);
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

// --- Generic Confirm Modal (same pattern as AcademicSem.jsx / AcademicCalendar.jsx / GradeManagement.jsx) ---
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

const ExamSetup = () => {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({
    course_id: "",
    exam_type: "",
    status: "",
    search: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [formData, setFormData] = useState({
    exam_name: "",
    course_id: "",
    section_id: "",
    room_id: "",
    proctor_id: "",
    exam_type: "quiz",
    exam_date: "",
    exam_time: "",
    exam_duration: "",
    total_points: "",
    passing_score: "",
    instructions: "",
    status: "draft",
  });

  useEffect(() => {
    fetchExams();
    fetchCourses();
    fetchSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Turn a fetch/response error into a short, human-readable message
  const getErrorMessage = async (errorOrResponse, fallback) => {
    // response object with data already parsed
    if (errorOrResponse && errorOrResponse.__parsedData) {
      const data = errorOrResponse.__parsedData;
      return data?.message || data?.error || fallback;
    }
    // network-level error (fetch threw)
    if (errorOrResponse instanceof Error) {
      return "Can't reach the server. Check your connection and try again.";
    }
    return fallback;
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await apiFetch(`/api/exams?${queryParams}`);
      const data = await response.json();
      if (data.success) {
        setExams(data.data);
      } else {
        toast.error(data?.message || data?.error || "Failed to load exams.");
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error(await getErrorMessage(error, "Failed to load exams."));
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await apiFetch("/api/sections");
      const data = await response.json();
      if (Array.isArray(data)) {
        setSections(data);
      } else if (data.success && Array.isArray(data.data)) {
        setSections(data.data);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error(await getErrorMessage(error, "Failed to load sections."));
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await apiFetch("/api/course/courses");
      const data = await response.json();
      console.log("Courses API response:", data); // Debug

      // Handle both array response and { success, data } format
      if (Array.isArray(data)) {
        setCourses(data);
        console.log("Courses loaded (array format):", data);
      } else if (data.success && Array.isArray(data.data)) {
        setCourses(data.data);
        console.log("Courses loaded (object format):", data.data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error(await getErrorMessage(error, "Failed to load courses."));
    }
  };

  const fetchAllRooms = () => {
    try {
      console.log("Fetching all rooms"); // Debug

      // Get ALL unique rooms from all sections (regardless of course or department)
      const allRoomsMap = new Map();
      sections.forEach((s) => {
        if (s.room) {
          const key = s.room;
          if (!allRoomsMap.has(key)) {
            allRoomsMap.set(key, {
              room_id: s.section_id,
              room_name: s.room,
              room_number: s.room,
            });
          }
        }
      });

      const allRooms = Array.from(allRoomsMap.values());
      setRooms(allRooms);
      console.log("All rooms set:", allRooms); // Debug
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
      toast.error("Failed to load rooms.");
    }
  };

  const fetchFacultyByDepartment = async (departmentId) => {
    if (!departmentId) {
      // Fallback: no department_id on the course, so load all faculty instead
      // (same pattern as GradeManagement.jsx: fetch all users, filter by role)
      fetchAllFaculty();
      return;
    }
    try {
      const response = await apiFetch(
        `/api/faculty/department/${departmentId}`,
      );
      const data = await response.json();
      console.log(`Faculty for department ${departmentId}:`, data); // Debug
      if (Array.isArray(data) && data.length > 0) {
        setFaculty(data);
      } else {
        // Department endpoint returned nothing usable (or an empty list,
        // meaning no faculty is assigned to that specific department) —
        // fall back to showing all faculty instead of leaving it empty.
        console.log(
          "No faculty found for this department, falling back to all faculty",
        ); // Debug
        fetchAllFaculty();
      }
    } catch (error) {
      console.error("Error fetching faculty:", error);
      setFaculty([]);
      toast.error(await getErrorMessage(error, "Failed to load faculty."));
    }
  };

  // Fallback: fetch ALL faculty (any department) when the course has no
  // department_id or the department-specific endpoint has nothing to offer.
  const fetchAllFaculty = async () => {
    try {
      const response = await apiFetch("/api/users");
      const data = await response.json();
      console.log("Raw /api/users response:", data); // Debug

      const usersList = Array.isArray(data)
        ? data
        : data?.data || data?.users || [];
      console.log("Users list after unwrap:", usersList); // Debug
      console.log(
        "Distinct roles found:",
        [...new Set(usersList.map((u) => u.role))],
      ); // Debug

      // Case-insensitive match so "Faculty", "faculty", "FACULTY" all work
      const facultyList = usersList.filter(
        (user) => (user.role || "").toLowerCase() === "faculty",
      );
      console.log("Filtered faculty list:", facultyList); // Debug

      setFaculty(facultyList);
      if (facultyList.length === 0) {
        toast.error(
          "No faculty accounts found. Check that users have role = 'Faculty' in the database.",
        );
      }
    } catch (error) {
      console.error("Error fetching all faculty:", error);
      setFaculty([]);
      toast.error(await getErrorMessage(error, "Failed to load faculty."));
    }
  };

  const handleOpenModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam);
      // Fetch all rooms and faculty based on course department
      const selectedCourse = courses.find((c) => c.id === exam.course_id);
      if (selectedCourse) {
        fetchAllRooms();
        // fetchFacultyByDepartment falls back to fetchAllFaculty when there's
        // no department_id, so always call it once we have the course.
        fetchFacultyByDepartment(selectedCourse.department_id);
      }
      setFormData({
        exam_name: exam.exam_name || "",
        course_id: exam.course_id || "",
        section_id: exam.section_id || "",
        room_id: exam.room_id || "",
        proctor_id: exam.proctor_id || "",
        exam_type: exam.exam_type || "quiz",
        exam_date: exam.exam_date || "",
        exam_time: exam.exam_time || "",
        exam_duration: exam.exam_duration || "",
        total_points: exam.total_points || "",
        passing_score: exam.passing_score || "",
        instructions: exam.instructions || "",
        status: exam.status || "draft",
      });
    } else {
      setEditingExam(null);
      setRooms([]);
      setFaculty([]);
      setFormData({
        exam_name: "",
        course_id: "",
        section_id: "",
        room_id: "",
        proctor_id: "",
        exam_type: "quiz",
        exam_date: "",
        exam_time: "",
        exam_duration: "",
        total_points: "",
        passing_score: "",
        instructions: "",
        status: "draft",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExam(null);
    setRooms([]);
    setFaculty([]);
    setFormData({
      exam_name: "",
      course_id: "",
      section_id: "",
      room_id: "",
      proctor_id: "",
      exam_type: "quiz",
      exam_date: "",
      exam_time: "",
      exam_duration: "",
      total_points: "",
      passing_score: "",
      instructions: "",
      status: "draft",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const path = editingExam
        ? `/api/exams/${editingExam.exam_id}`
        : "/api/exams";
      const method = editingExam ? "PUT" : "POST";

      // Get logged-in user ID from localStorage
      const userId = localStorage.getItem("userId");

      // Include created_by for new exams
      const submitData = editingExam
        ? formData
        : { ...formData, created_by: userId };

      const response = await apiFetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          editingExam ? "Exam updated successfully." : "Exam created successfully.",
        );
        fetchExams();
        handleCloseModal();
      } else {
        toast.error(
          data?.message ||
            data?.error ||
            (editingExam ? "Failed to update exam." : "Failed to create exam."),
        );
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      toast.error(
        await getErrorMessage(
          error,
          editingExam ? "Failed to update exam." : "Failed to create exam.",
        ),
      );
    }
  };

  const handleDelete = (examId) => {
    setDeleteTargetId(examId);
  };

  const cancelDelete = () => {
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    const examId = deleteTargetId;
    if (!examId) return;
    try {
      const response = await apiFetch(`/api/exams/${examId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        fetchExams();
        toast.success("Exam deleted successfully.");
      } else {
        toast.error(data?.message || data?.error || "Failed to delete exam.");
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error(await getErrorMessage(error, "Failed to delete exam."));
    } finally {
      setDeleteTargetId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: "bg-slate-100 text-slate-800",
      scheduled: "bg-blue-100 text-blue-800",
      ongoing: "bg-green-100 text-green-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          statusColors[status] || "bg-slate-100 text-slate-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const getExamTypeBadge = (type) => {
    const typeColors = {
      quiz: "bg-yellow-100 text-yellow-800",
      midterm: "bg-orange-100 text-orange-800",
      final: "bg-red-100 text-red-800",
      practical: "bg-indigo-100 text-indigo-800",
      project: "bg-pink-100 text-pink-800",
    };

    return (
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          typeColors[type] || "bg-slate-100 text-slate-800"
        }`}
      >
        {type}
      </span>
    );
  };

  return (
    <div className=" p-3 sm:p-4 transition-colors duration-500">
      <ToastContainer position="top-right" />

      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            Exam Setup
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Total Exams</p>
            <p className="text-2xl font-bold text-indigo-600">245</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600">32</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Ongoing</p>
            <p className="text-2xl font-bold text-green-600">8</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Completed</p>
            <p className="text-2xl font-bold text-purple-600">205</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search exams..."
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
            <select
              value={filters.exam_type}
              onChange={(e) =>
                setFilters({ ...filters, exam_type: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-40"
            >
              <option value="">All Exam Types</option>
              <option value="quiz">Quiz</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="practical">Practical</option>
              <option value="project">Project</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-32"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              Create New Exam
            </button>
          </div>
        </div>

        {/* Exams Table */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800">Exam List</h2>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="px-4 py-2.5">Exam Name</th>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">Section</th>
                  <th className="px-4 py-2.5">Room</th>
                  <th className="px-4 py-2.5">Proctor</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Points</th>
                  <th className="px-4 py-2.5">Duration</th>
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
                          colSpan={10}
                          className="p-4 text-center text-slate-500 italic"
                        >
                          Loading...
                        </td>
                      </tr>
                    );
                  }

                  const searchTerm = filters.search.toLowerCase();
                  const filtered = exams.filter((exam) => {
                    const matchesSearch =
                      exam.exam_name?.toLowerCase().includes(searchTerm) ||
                      exam.course_code?.toLowerCase().includes(searchTerm) ||
                      exam.exam_type?.toLowerCase().includes(searchTerm);
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
                          colSpan={10}
                          className="p-4 text-center text-slate-500 italic"
                        >
                          No exams found matching your search criteria.
                        </td>
                      </tr>
                    );
                  }

                  return paginatedData.map((exam) => (
                    <tr
                      key={exam.exam_id}
                      className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150"
                    >
                      <td className="px-4 py-2 font-medium">
                        {exam.exam_name}
                      </td>
                      <td className="px-4 py-2">{exam.course_code}</td>
                      <td className="px-4 py-2">{exam.section_name || "-"}</td>
                      <td className="px-4 py-2">
                        {exam.room_number || exam.room || "-"}
                      </td>
                      <td className="px-4 py-2">
                        {exam.proctor_first_name && exam.proctor_last_name
                          ? `${exam.proctor_first_name} ${exam.proctor_last_name}`
                          : "-"}
                      </td>
                      <td className="px-4 py-2">
                        {getExamTypeBadge(exam.exam_type)}
                      </td>
                      <td className="px-4 py-2">{exam.total_points}</td>
                      <td className="px-4 py-2">
                        {exam.exam_duration
                          ? `${exam.exam_duration} mins`
                          : "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {getStatusBadge(exam.status)}
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(exam)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(exam.exam_id)}
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
                  const filtered = exams.filter((exam) => {
                    const matchesSearch =
                      exam.exam_name?.toLowerCase().includes(searchTerm) ||
                      exam.course_code?.toLowerCase().includes(searchTerm) ||
                      exam.exam_type?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  return Math.ceil(filtered.length / itemsPerPage) || 1;
                })()}
              </span>{" "}
              | Total Records:{" "}
              {(() => {
                const searchTerm = filters.search.toLowerCase();
                const filtered = exams.filter((exam) => {
                  const matchesSearch =
                    exam.exam_name?.toLowerCase().includes(searchTerm) ||
                    exam.course_code?.toLowerCase().includes(searchTerm) ||
                    exam.exam_type?.toLowerCase().includes(searchTerm);
                  return matchesSearch;
                });
                return filtered.length;
              })()}
            </span>
            <div className="flex gap-1 mt-2 sm:mt-0">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              {(() => {
                const searchTerm = filters.search.toLowerCase();
                const filtered = exams.filter((exam) => {
                  const matchesSearch =
                    exam.exam_name?.toLowerCase().includes(searchTerm) ||
                    exam.course_code?.toLowerCase().includes(searchTerm) ||
                    exam.exam_type?.toLowerCase().includes(searchTerm);
                  return matchesSearch;
                });
                const totalPages =
                  Math.ceil(filtered.length / itemsPerPage) || 1;

                return [...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                      currentPage === i + 1
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ));
              })()}
              <button
                onClick={() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = exams.filter((exam) => {
                    const matchesSearch =
                      exam.exam_name?.toLowerCase().includes(searchTerm) ||
                      exam.course_code?.toLowerCase().includes(searchTerm) ||
                      exam.exam_type?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  const totalPages =
                    Math.ceil(filtered.length / itemsPerPage) || 1;
                  setCurrentPage(Math.min(totalPages, currentPage + 1));
                }}
                disabled={(() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = exams.filter((exam) => {
                    const matchesSearch =
                      exam.exam_name?.toLowerCase().includes(searchTerm) ||
                      exam.course_code?.toLowerCase().includes(searchTerm) ||
                      exam.exam_type?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  const totalPages =
                    Math.ceil(filtered.length / itemsPerPage) || 1;
                  return currentPage === totalPages;
                })()}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Exam Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Header */}
              <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingExam ? "Edit Exam" : "Create New Exam"}
                  </h2>
                  <button
                    onClick={handleCloseModal}
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
                        Exam Name *
                      </label>
                      <input
                        type="text"
                        value={formData.exam_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            exam_name: e.target.value,
                          })
                        }
                        required
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Course ID
                      </label>
                      <Select
                        options={courses.map((course) => ({
                          value: course.id,
                          label: `${course.code} - ${course.title}`,
                        }))}
                        value={
                          formData.course_id
                            ? {
                                value: formData.course_id,
                                label: courses.find(
                                  (c) => c.id === formData.course_id,
                                )
                                  ? `${courses.find((c) => c.id === formData.course_id).code} - ${courses.find((c) => c.id === formData.course_id).title}`
                                  : "",
                              }
                            : null
                        }
                        onChange={(option) => {
                          console.log("Course selected:", option); // Debug
                          setFormData({
                            ...formData,
                            course_id: option?.value || "",
                          });
                          // Fetch rooms from sections for this course and faculty based on course department
                          const selectedCourse = courses.find(
                            (c) => c.id === option?.value,
                          );
                          console.log(
                            "Selected course details:",
                            selectedCourse,
                          ); // Debug
                          if (selectedCourse) {
                            console.log("Fetching all rooms"); // Debug
                            fetchAllRooms();
                          }
                          if (selectedCourse) {
                            // fetchFacultyByDepartment falls back to all
                            // faculty when department_id is missing.
                            fetchFacultyByDepartment(
                              selectedCourse.department_id,
                            );
                          } else {
                            setFaculty([]);
                          }
                        }}
                        className="text-sm"
                        placeholder="Select course..."
                        isClearable
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
                        Exam Type *
                      </label>
                      <select
                        value={formData.exam_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            exam_type: e.target.value,
                          })
                        }
                        required
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="quiz">Quiz</option>
                        <option value="midterm">Midterm</option>
                        <option value="final">Final</option>
                        <option value="practical">Practical</option>
                        <option value="project">Project</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Section
                      </label>
                      <Select
                        options={sections.map((section) => ({
                          value: section.section_id || section.id,
                          label: section.section_name || section.name,
                          room: section.room, // Include room data
                        }))}
                        value={
                          formData.section_id
                            ? {
                                value: formData.section_id,
                                label:
                                  sections.find(
                                    (s) =>
                                      (s.section_id || s.id) ===
                                      formData.section_id,
                                  )?.section_name ||
                                  sections.find(
                                    (s) =>
                                      (s.section_id || s.id) ===
                                      formData.section_id,
                                  )?.name ||
                                  "",
                              }
                            : null
                        }
                        onChange={(option) => {
                          setFormData({
                            ...formData,
                            section_id: option?.value || "",
                            // Don't auto-set room_id - keep it for Room dropdown selection
                            // The section's room is just reference info
                          });
                        }}
                        className="text-sm"
                        placeholder="Select section..."
                        isClearable
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
                        <span className="text-slate-400 ml-1 font-normal text-xs">
                          ({rooms.length} available)
                        </span>
                      </label>
                      {!formData.course_id && (
                        <p className="text-xs text-yellow-600 mb-2">
                          ⚠️ Select a course first to load available rooms
                        </p>
                      )}
                      <Select
                        options={rooms.map((room) => ({
                          value: room.room_id,
                          label: room.room_name || room.room_number,
                        }))}
                        value={
                          formData.room_id
                            ? {
                                value: formData.room_id,
                                label: rooms.find(
                                  (r) => r.room_id === formData.room_id,
                                )
                                  ? rooms.find(
                                      (r) => r.room_id === formData.room_id,
                                    ).room_name ||
                                    rooms.find(
                                      (r) => r.room_id === formData.room_id,
                                    ).room_number
                                  : "",
                              }
                            : null
                        }
                        onChange={(option) =>
                          setFormData({
                            ...formData,
                            room_id: option?.value || "",
                          })
                        }
                        className="text-sm"
                        placeholder={
                          formData.course_id
                            ? rooms.length > 0
                              ? "Select a room..."
                              : "No rooms available for this course"
                            : "Select course first..."
                        }
                        isClearable
                        isDisabled={!formData.course_id}
                        noOptionsMessage={() =>
                          formData.course_id
                            ? "No rooms available for this course"
                            : "Select a course first"
                        }
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
                        Proctor (Faculty)
                      </label>
                      <Select
                        options={faculty.map((fac) => ({
                          value: fac.user_id,
                          label: `${fac.first_name} ${fac.last_name}${fac.specialization ? ` (${fac.specialization})` : ""}`,
                        }))}
                        value={
                          formData.proctor_id
                            ? {
                                value: formData.proctor_id,
                                label: faculty.find(
                                  (f) => f.user_id === formData.proctor_id,
                                )
                                  ? `${faculty.find((f) => f.user_id === formData.proctor_id).first_name} ${faculty.find((f) => f.user_id === formData.proctor_id).last_name}${faculty.find((f) => f.user_id === formData.proctor_id).specialization ? ` (${faculty.find((f) => f.user_id === formData.proctor_id).specialization})` : ""}`
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
                        isDisabled={!formData.course_id}
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
                        Exam Date
                      </label>
                      <input
                        type="date"
                        value={formData.exam_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            exam_date: e.target.value,
                          })
                        }
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Exam Time
                      </label>
                      <input
                        type="time"
                        value={formData.exam_time}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            exam_time: e.target.value,
                          })
                        }
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.exam_duration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            exam_duration: e.target.value,
                          })
                        }
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Total Points
                      </label>
                      <input
                        type="number"
                        value={formData.total_points}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            total_points: e.target.value,
                          })
                        }
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Passing Score
                      </label>
                      <input
                        type="number"
                        value={formData.passing_score}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            passing_score: e.target.value,
                          })
                        }
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Status *
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        required
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Instructions
                      </label>
                      <textarea
                        value={formData.instructions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            instructions: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-lg">
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      {editingExam ? "Update Exam" : "Create Exam"}
                    </button>
                  </div>
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
              Are you sure you want to delete this exam?{" "}
              <span className="text-red-400">
                This action cannot be undone!
              </span>
            </>
          }
          confirmLabel="Yes"
          tone="danger"
        />
      </div>
    </div>
  );
};

export default ExamSetup;