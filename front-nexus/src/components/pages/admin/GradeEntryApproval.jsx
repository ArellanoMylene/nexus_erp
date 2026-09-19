import { useState, useEffect } from "react";
import Select from "react-select";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
} from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const GradeEntryApproval = () => {
  const [gradeEntries, setGradeEntries] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filters, setFilters] = useState({
    approval_status: "pending",
    course_id: "",
    period_id: "",
    search: "",
  });
  const [formData, setFormData] = useState({
    student_id: "",
    course_id: "",
    period_id: "",
    component_id: "",
    raw_score: "",
    max_score: "",
  });

  useEffect(() => {
    fetchGradeEntries();
    fetchStudents();
    fetchCourses();
    fetchPeriods();
    fetchComponents();
  }, []);

  const fetchGradeEntries = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(
        `${API_BASE}/api/grade-entries?${queryParams}`,
      );
      const data = await response.json();
      if (data.success) {
        setGradeEntries(data.data);
      }
    } catch (error) {
      console.error("Error fetching grade entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/enrollments`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const uniqueStudents = data.reduce((acc, enrollment) => {
          if (!acc.find((s) => s.student_id === enrollment.student_id)) {
            acc.push({
              student_id: enrollment.student_id,
              student_number: enrollment.student_number,
              student_name: enrollment.student_name,
            });
          }
          return acc;
        }, []);
        setStudents(uniqueStudents);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/course/courses`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCourses(data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/academic-periods`,
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setPeriods(data);
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
    }
  };

  const fetchComponents = async () => {
    // Use predefined component types since the API has issues
    const fallbackComponents = [
      {
        component_id: "quiz",
        component_name: "Quiz",
        component_type: "assessment",
      },
      {
        component_id: "assignment",
        component_name: "Assignment",
        component_type: "assessment",
      },
      {
        component_id: "midterm",
        component_name: "Midterm Exam",
        component_type: "exam",
      },
      {
        component_id: "final",
        component_name: "Final Exam",
        component_type: "exam",
      },
      {
        component_id: "project",
        component_name: "Project",
        component_type: "assessment",
      },
      {
        component_id: "practical",
        component_name: "Practical/Lab",
        component_type: "assessment",
      },
      {
        component_id: "attendance",
        component_name: "Attendance",
        component_type: "participation",
      },
      {
        component_id: "participation",
        component_name: "Class Participation",
        component_type: "participation",
      },
    ];
    setComponents(fallbackComponents);
  };

  const handleFilter = () => {
    fetchGradeEntries();
  };

  const handleOpenModal = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        student_id: entry.student_id || "",
        course_id: entry.course_id || "",
        period_id: entry.period_id || "",
        component_id: entry.component_id || "",
        raw_score: entry.raw_score || "",
        max_score: entry.max_score || "",
      });
    } else {
      setEditingEntry(null);
      setFormData({
        student_id: "",
        course_id: "",
        period_id: "",
        component_id: "",
        raw_score: "",
        max_score: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
    setFormData({
      student_id: "",
      course_id: "",
      period_id: "",
      component_id: "",
      raw_score: "",
      max_score: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingEntry
        ? `${API_BASE}/api/grade-entries/${editingEntry.entry_id}`
        : `${API_BASE}/api/grade-entries`;
      const method = editingEntry ? "PUT" : "POST";

      // Get logged-in user ID from localStorage
      const userId = localStorage.getItem("userId");

      // Include submitted_by for new entries
      const submitData = editingEntry
        ? formData
        : { ...formData, submitted_by: userId };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      if (data.success) {
        alert(
          editingEntry
            ? "Grade entry updated successfully"
            : "Grade entry created successfully",
        );
        handleCloseModal();
        fetchGradeEntries();
      } else {
        alert("Error: " + (data.message || "Failed to save grade entry"));
      }
    } catch (error) {
      console.error("Error saving grade entry:", error);
      alert("Error saving grade entry");
    }
  };

  const handleApprove = async (entryId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/grade-entries/${entryId}/approve`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved_by: 1 }), // Replace with actual admin ID
        },
      );
      const data = await response.json();
      if (data.success) {
        fetchGradeEntries();
      }
    } catch (error) {
      console.error("Error approving grade entry:", error);
    }
  };

  const handleReject = async (entryId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/grade-entries/${entryId}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved_by: 1, rejection_reason: reason }),
        },
      );
      const data = await response.json();
      if (data.success) {
        fetchGradeEntries();
      }
    } catch (error) {
      console.error("Error rejecting grade entry:", error);
    }
  };

  const getApprovalBadge = (status) => {
    const statusColors = {
      pending:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400",
      approved:
        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
      rejected: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
      revision_needed:
        "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400",
    };

    return (
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          statusColors[status] ||
          "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300"
        }`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            Grade Entry Approval
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pending Approval
            </p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {
                gradeEntries.filter((e) => e.approval_status === "pending")
                  .length
              }
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Approved Today
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {
                gradeEntries.filter((e) => {
                  const approvedDate = e.approved_at
                    ? new Date(e.approved_at).toDateString()
                    : null;
                  const today = new Date().toDateString();
                  return (
                    e.approval_status === "approved" && approvedDate === today
                  );
                }).length
              }
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Rejected
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {
                gradeEntries.filter((e) => e.approval_status === "rejected")
                  .length
              }
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Total Entries
            </p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {gradeEntries.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search entries..."
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
              value={filters.approval_status}
              onChange={(e) =>
                setFilters({ ...filters, approval_status: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="revision_needed">Revision Needed</option>
            </select>
            <input
              type="text"
              placeholder="Course ID"
              value={filters.course_id}
              onChange={(e) =>
                setFilters({ ...filters, course_id: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-32"
            />
            <input
              type="text"
              placeholder="Period ID"
              value={filters.period_id}
              onChange={(e) =>
                setFilters({ ...filters, period_id: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-32"
            />
            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-medium shadow-sm"
            >
              Apply Filters
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
            >
              <Plus size={16} />
              Create Grade Entry
            </button>
          </div>
        </div>

        {/* Grade Entries Table */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">
            Grade Entries for Approval
          </h2>
          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">Component</th>
                  <th className="px-4 py-2.5">Score</th>
                  <th className="px-4 py-2.5">Percentage</th>
                  <th className="px-4 py-2.5">Submitted By</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-1/12 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {(() => {
                  if (loading) {
                    return (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-4 text-center text-slate-500 italic"
                        >
                          Loading...
                        </td>
                      </tr>
                    );
                  }

                  const searchTerm = filters.search.toLowerCase();
                  const filtered = gradeEntries.filter((entry) => {
                    const matchesSearch =
                      entry.student_first_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      entry.student_last_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      entry.course_code?.toLowerCase().includes(searchTerm) ||
                      entry.component_name?.toLowerCase().includes(searchTerm);
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
                          colSpan={8}
                          className="p-4 text-center text-slate-500 italic"
                        >
                          No grade entries found matching your search criteria.
                        </td>
                      </tr>
                    );
                  }

                  return paginatedData.map((entry) => (
                    <tr
                      key={entry.entry_id}
                      className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                    >
                      <td className="px-4 py-2 font-medium">
                        {entry.student_first_name} {entry.student_last_name}
                      </td>
                      <td className="px-4 py-2">{entry.course_code}</td>
                      <td className="px-4 py-2">{entry.component_name}</td>
                      <td className="px-4 py-2">
                        {entry.raw_score}/{entry.max_score}
                      </td>
                      <td className="px-4 py-2">
                        {entry.percentage && !isNaN(entry.percentage)
                          ? `${Number(entry.percentage).toFixed(2)}%`
                          : "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {entry.faculty_first_name} {entry.faculty_last_name}
                      </td>
                      <td className="px-4 py-2">
                        {getApprovalBadge(entry.approval_status)}
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        {entry.approval_status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(entry.entry_id)}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="Approve"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(entry.entry_id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="Reject"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
            <span className="text-xs sm:text-sm">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">
                {(() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = gradeEntries.filter((entry) => {
                    const matchesSearch =
                      entry.student_first_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      entry.student_last_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      entry.course_code?.toLowerCase().includes(searchTerm) ||
                      entry.component_name?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  return Math.ceil(filtered.length / itemsPerPage) || 1;
                })()}
              </span>{" "}
              | Total Records:{" "}
              {(() => {
                const searchTerm = filters.search.toLowerCase();
                const filtered = gradeEntries.filter((entry) => {
                  const matchesSearch =
                    entry.student_first_name
                      ?.toLowerCase()
                      .includes(searchTerm) ||
                    entry.student_last_name
                      ?.toLowerCase()
                      .includes(searchTerm) ||
                    entry.course_code?.toLowerCase().includes(searchTerm) ||
                    entry.component_name?.toLowerCase().includes(searchTerm);
                  return matchesSearch;
                });
                return filtered.length;
              })()}
            </span>
            <div className="flex gap-1 mt-2 sm:mt-0">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft
                  size={16}
                  className="text-slate-600 dark:text-slate-400"
                />
              </button>
              {(() => {
                const searchTerm = filters.search.toLowerCase();
                const filtered = gradeEntries.filter((entry) => {
                  const matchesSearch =
                    entry.student_first_name
                      ?.toLowerCase()
                      .includes(searchTerm) ||
                    entry.student_last_name
                      ?.toLowerCase()
                      .includes(searchTerm) ||
                    entry.course_code?.toLowerCase().includes(searchTerm) ||
                    entry.component_name?.toLowerCase().includes(searchTerm);
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
                        : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {i + 1}
                  </button>
                ));
              })()}
              <button
                onClick={() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = gradeEntries.filter((entry) => {
                    const matchesSearch =
                      entry.student_first_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      entry.student_last_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      entry.course_code?.toLowerCase().includes(searchTerm) ||
                      entry.component_name?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  const totalPages =
                    Math.ceil(filtered.length / itemsPerPage) || 1;
                  setCurrentPage(Math.min(totalPages, currentPage + 1));
                }}
                disabled={(() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = gradeEntries.filter((entry) => {
                    const matchesSearch =
                      entry.student_first_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      entry.student_last_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      entry.course_code?.toLowerCase().includes(searchTerm) ||
                      entry.component_name?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  const totalPages =
                    Math.ceil(filtered.length / itemsPerPage) || 1;
                  return currentPage === totalPages;
                })()}
                className="p-1.5 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight
                  size={16}
                  className="text-slate-600 dark:text-slate-400"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Create/Edit Grade Entry Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingEntry ? "Edit" : "Add"} Grade Entry
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <Plus size={18} className="rotate-45" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Student ID *
                    </label>
                    <Select
                      options={students.map((student) => ({
                        value: student.student_id,
                        label: `${student.student_name} (${student.student_number})`,
                      }))}
                      value={
                        formData.student_id
                          ? {
                              value: formData.student_id,
                              label: students.find(
                                (s) => s.student_id === formData.student_id,
                              )
                                ? `${students.find((s) => s.student_id === formData.student_id).student_name} (${students.find((s) => s.student_id === formData.student_id).student_number})`
                                : "",
                            }
                          : null
                      }
                      onChange={(option) =>
                        setFormData({
                          ...formData,
                          student_id: option?.value || "",
                        })
                      }
                      className="text-sm"
                      placeholder="Select student..."
                      isClearable
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Course ID *
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
                      onChange={(option) =>
                        setFormData({
                          ...formData,
                          course_id: option?.value || "",
                        })
                      }
                      className="text-sm"
                      placeholder="Select course..."
                      isClearable
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Period ID *
                    </label>
                    <Select
                      options={periods.map((period) => ({
                        value: period.id,
                        label: `${period.school_year} - ${period.semester}`,
                      }))}
                      value={
                        formData.period_id
                          ? {
                              value: formData.period_id,
                              label: periods.find(
                                (p) => p.id === formData.period_id,
                              )
                                ? `${periods.find((p) => p.id === formData.period_id).school_year} - ${periods.find((p) => p.id === formData.period_id).semester}`
                                : "",
                            }
                          : null
                      }
                      onChange={(option) =>
                        setFormData({
                          ...formData,
                          period_id: option?.value || "",
                        })
                      }
                      className="text-sm"
                      placeholder="Select period..."
                      isClearable
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Component ID *
                    </label>
                    <Select
                      options={components.map((component) => ({
                        value: component.component_id,
                        label: component.component_name,
                      }))}
                      value={
                        formData.component_id
                          ? {
                              value: formData.component_id,
                              label:
                                components.find(
                                  (c) =>
                                    c.component_id === formData.component_id,
                                )?.component_name || "",
                            }
                          : null
                      }
                      onChange={(option) =>
                        setFormData({
                          ...formData,
                          component_id: option?.value || "",
                        })
                      }
                      className="text-sm"
                      placeholder="Select component..."
                      isClearable
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Raw Score *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.raw_score}
                      onChange={(e) =>
                        setFormData({ ...formData, raw_score: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Max Score *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_score}
                      onChange={(e) =>
                        setFormData({ ...formData, max_score: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
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
                    {editingEntry ? "Update" : "Save"} Grade Entry
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

export default GradeEntryApproval;
