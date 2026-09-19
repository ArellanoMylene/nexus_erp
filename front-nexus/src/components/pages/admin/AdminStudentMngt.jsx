import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Users,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Calendar,
  Award,
  FileText,
  Filter,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const colors = {
    Active: "bg-green-100 text-green-800",
    Enrolled: "bg-blue-100 text-blue-800",
    Dropped: "bg-red-100 text-red-800",
    Completed: "bg-purple-100 text-purple-800",
    Inactive: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        colors[status] || colors.Active
      }`}
    >
      {status}
    </span>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
  <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-slate-700">
    <span className="text-xs sm:text-sm">
      Page <span className="font-semibold">{currentPage}</span> of{" "}
      <span className="font-semibold">{totalPages}</span> | Total Students:{" "}
      {totalItems}
    </span>
    <div className="flex gap-1 items-center mt-2 sm:mt-0">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="px-2 py-1 text-xs font-semibold text-indigo-600">
        {currentPage}
      </span>
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

// Student View Modal
const StudentViewModal = ({ isOpen, onClose, student, enrollments }) => {
  if (!isOpen || !student) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 rounded-full p-3">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {student.first_name} {student.middle_name || ""}{" "}
                {student.last_name}
              </h2>
              <p className="text-sm text-gray-600">
                {student.student_number || "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Personal Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={18} /> Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <span className="text-sm font-semibold text-gray-700">
                Email:
              </span>
              <p className="text-gray-900">{student.email}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">
                Phone:
              </span>
              <p className="text-gray-900">{student.phone || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">
                Gender:
              </span>
              <p className="text-gray-900">{student.gender || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">
                Date of Birth:
              </span>
              <p className="text-gray-900">{student.date_of_birth || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <span className="text-sm font-semibold text-gray-700">
                Address:
              </span>
              <p className="text-gray-900">
                {student.permanent_address || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <GraduationCap size={18} /> Academic Information
          </h3>
          <div className="grid grid-cols-2 gap-4 bg-indigo-50 p-4 rounded-lg">
            <div>
              <span className="text-sm font-semibold text-gray-700">
                Course/Program:
              </span>
              <p className="text-gray-900">{student.course || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">
                Major:
              </span>
              <p className="text-gray-900">{student.major || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">
                Year Level:
              </span>
              <p className="text-gray-900">{student.year_level || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">
                Status:
              </span>
              <StatusBadge status={student.status || "Active"} />
            </div>
          </div>
        </div>

        {/* Enrollments */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen size={18} /> Current Enrollments ({enrollments.length})
          </h3>
          {enrollments.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold">
                      Course Code
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">
                      Course Title
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">
                      Period
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">
                      Midterm
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">
                      Final
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrollments.map((enroll) => (
                    <tr key={enroll.enrollment_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm">
                        {enroll.course_code}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {enroll.course_title}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {enroll.school_year} - {enroll.semester}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <StatusBadge status={enroll.status} />
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {enroll.midterm_grade || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {enroll.final_grade || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic text-sm">
              No enrollments found.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const AdminStudentMngt = () => {
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState("");
  const [filterYearLevel, setFilterYearLevel] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [viewStudent, setViewStudent] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Fetch students (all users with role='Student')
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/users`);
      const studentUsers = (res.data || []).filter((u) => u.role === "Student");
      setStudents(studentUsers);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all enrollments
  const fetchEnrollments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/enrollments`);
      setEnrollments(res.data);
    } catch (err) {
      console.error("Error fetching enrollments:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter & paginate
  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        (s.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.last_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.student_number || "").toLowerCase().includes(search.toLowerCase());

      const matchYear =
        !filterYearLevel || s.year_level === filterYearLevel.value;
      const matchStatus = !filterStatus || s.status === filterStatus.value;

      return matchSearch && matchYear && matchStatus;
    });
  }, [students, search, filterYearLevel, filterStatus]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Export functions
  const exportCSV = (data) => {
    const csv = [
      ["Student Number", "Name", "Email", "Year Level", "Course", "Status"],
      ...data.map((s) => [
        s.student_number || "",
        `${s.first_name} ${s.last_name}`,
        s.email,
        s.year_level || "",
        s.course || "",
        s.status || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      "students.csv"
    );
  };

  const exportPDF = (data) => {
    const doc = new jsPDF();
    doc.text("Student List", 14, 16);
    doc.autoTable({
      head: [
        ["Student Number", "Name", "Email", "Year Level", "Course", "Status"],
      ],
      body: data.map((s) => [
        s.student_number || "",
        `${s.first_name} ${s.last_name}`,
        s.email,
        s.year_level || "",
        s.course || "",
        s.status || "",
      ]),
      startY: 20,
    });
    doc.save("students.pdf");
  };

  const handleViewStudent = (student) => {
    setViewStudent(student);
    setViewModalOpen(true);
  };

  const studentEnrollments = useMemo(() => {
    if (!viewStudent) return [];
    return enrollments.filter((e) => e.student_id === viewStudent.user_id);
  }, [viewStudent, enrollments]);

  const yearLevelOptions = [
    { value: "1st Year", label: "1st Year" },
    { value: "2nd Year", label: "2nd Year" },
    { value: "3rd Year", label: "3rd Year" },
    { value: "4th Year", label: "4th Year" },
    { value: "5th Year", label: "5th Year" },
    { value: "Irregular", label: "Irregular" },
  ];

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Graduated", label: "Graduated" },
  ];

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users size={24} /> Student Management
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          View and manage all student records, enrollments, and academic
          information.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, email, or student number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select
            value={filterYearLevel}
            onChange={(selected) => {
              setFilterYearLevel(selected);
              setPage(1);
            }}
            options={yearLevelOptions}
            placeholder="Year Level"
            isClearable
            className="w-40"
          />

          <Select
            value={filterStatus}
            onChange={(selected) => {
              setFilterStatus(selected);
              setPage(1);
            }}
            options={statusOptions}
            placeholder="Status"
            isClearable
            className="w-40"
          />

          <button
            onClick={() => exportCSV(filtered)}
            className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-100 transition flex items-center gap-2"
            title="Export CSV"
          >
            <Download size={16} />
          </button>

          <button
            onClick={() => exportPDF(filtered)}
            className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-100 transition flex items-center gap-2"
            title="Export PDF"
          >
            <FileText size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Student Number
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Name
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Email
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Year Level
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Course
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-3 py-2 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-4 text-slate-500 italic"
                >
                  Loading students...
                </td>
              </tr>
            ) : displayed.length > 0 ? (
              displayed.map((student) => (
                <tr
                  key={student.user_id}
                  className="hover:bg-slate-50 transition"
                >
                  <td className="px-3 py-2 text-sm">
                    {student.student_number || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="px-3 py-2 text-sm">{student.email}</td>
                  <td className="px-3 py-2 text-sm">
                    {student.year_level || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {student.course || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <StatusBadge status={student.status || "Active"} />
                  </td>
                  <td className="px-3 py-2 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleViewStudent(student)}
                      className="text-indigo-600 hover:text-indigo-800"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-4 text-slate-500 italic"
                >
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        setPage={setPage}
        totalItems={filtered.length}
      />

      {/* View Modal */}
      <StudentViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        student={viewStudent}
        enrollments={studentEnrollments}
      />
    </div>
  );
};

export default AdminStudentMngt;
