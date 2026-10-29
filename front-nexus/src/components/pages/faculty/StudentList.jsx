import React, { useState, useEffect } from "react";
import axios from "axios";
import { Users, Search, Mail, FileText, Download, Filter, Eye, BookOpen } from "lucide-react";
import { downloadPDF, downloadExcel } from "../../../utils/exportHelpers";

const StudentList = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const facultyUserId = localStorage.getItem("userId") || sessionStorage.getItem("userId");

  useEffect(() => {
    const fetchFacultyRoster = async () => {
      if (!facultyUserId) {
        setError("User ID not found. Please log in again.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const [response, assignmentsResponse] = await Promise.all([
          axios.get(`${API_BASE}/api/enrollments/faculty/${facultyUserId}/students`),
          axios.get(`${API_BASE}/api/faculty-assignments/faculty/${facultyUserId}`),
        ]);
        const rows = Array.isArray(response.data?.data) ? response.data.data : [];
        const assignedCourses = Array.isArray(assignmentsResponse.data?.data)
          ? assignmentsResponse.data.data
          : [];
        const roster = rows.map((row) => ({
          id: row.enrollment_id || row.id,
          assignmentId: row.assignment_id,
          studentId: row.student_id || row.user_id,
          firstName: row.first_name || "",
          lastName: row.last_name || "",
          email: row.email || "",
          course: row.course_code || "",
          courseTitle: row.course_title || "",
          section: row.section || "",
          program: row.program || "N/A",
          yearLevel: row.year_level || "N/A",
          status: row.status || "Enrolled",
          attendance: null,
          grade: row.final_grade ?? row.midterm_grade ?? null,
        }));
        setStudents(roster);
        setCourses(assignedCourses.map((assignment) => ({
          id: assignment.assignment_id,
          code: assignment.course_code || "",
          name: assignment.course_title || "",
          section: assignment.section || "",
        })));
      } catch (fetchError) {
        console.error("Error fetching faculty student roster:", fetchError);
        setStudents([]);
        setCourses([]);
        setError(fetchError.response?.data?.message || "Failed to load students in your assigned courses.");
      } finally {
        setLoading(false);
      }
    };
    fetchFacultyRoster();
  }, [API_BASE, facultyUserId]);

  const filteredStudents = students.filter(student => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = [student.studentId, student.firstName, student.lastName, student.email, student.course, student.courseTitle]
      .some((value) => String(value || "").toLowerCase().includes(query));
    
    const matchesCourse = selectedCourse === 'all' || String(student.assignmentId) === selectedCourse;
    
    return matchesSearch && matchesCourse;
  });
  const gradedStudents = filteredStudents.filter((student) => Number.isFinite(Number(student.grade)) && student.grade !== null);
  const averageGrade = gradedStudents.length
    ? Math.round(gradedStudents.reduce((sum, student) => sum + Number(student.grade), 0) / gradedStudents.length)
    : null;

  const handleExportCSV = () => {
    if (!filteredStudents.length) return;
    const exportData = filteredStudents.map((s) => ({
      student_id: s.studentId || "",
      student_name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      email: s.email || "",
      course_code: s.course || "",
      section: s.section || "",
      program_name: s.program || "",
      year_level: s.yearLevel || "",
      status: s.status || "",
      attendance_rate: s.attendance ? `${s.attendance}%` : "",
      final_grade: s.grade || "",
    }));

    downloadExcel(exportData, {
      title: "Faculty Student Roster",
      officeLabel: "Academic Affairs",
      headers: [
        "student_id",
        "student_name",
        "email",
        "course_code",
        "section",
        "program_name",
        "year_level",
        "status",
        "attendance_rate",
        "final_grade",
      ],
    });
  };

  const handleExportPDF = () => {
    if (!filteredStudents.length) return;
    const exportData = filteredStudents.map((s) => ({
      student_id: s.studentId || "",
      student_name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      email: s.email || "",
      course_code: s.course || "",
      section: s.section || "",
      program_name: s.program || "",
      year_level: s.yearLevel || "",
      status: s.status || "",
      attendance_rate: s.attendance ? `${s.attendance}%` : "",
      final_grade: s.grade || "",
    }));

    downloadPDF(exportData, {
      title: "Faculty Student Roster",
      officeLabel: "Academic Affairs",
      orientation: "portrait",
      headers: [
        "student_id",
        "student_name",
        "email",
        "course_code",
        "section",
        "program_name",
        "year_level",
        "status",
        "attendance_rate",
        "final_grade",
      ],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Users className="w-8 h-8 mr-3 text-indigo-600" />
          Student List
        </h1>
        <p className="text-gray-600 mt-2">View and manage students in your courses</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ID, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name} · Section {course.section}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            title="Export Excel"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            title="Export PDF"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            PDF
          </button>
        </div>
      </div>

      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Course Enrollments</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned Courses</p>
              <p className="text-2xl font-bold text-gray-900">{selectedCourse === "all" ? courses.length : 1}</p>
            </div>
            <BookOpen className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Grade</p>
              <p className="text-2xl font-bold text-gray-900">
                {averageGrade ?? "—"}
              </p>
            </div>
            <FileText className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredStudents.filter(s => String(s.status).toLowerCase() === 'enrolled').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Student ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Program</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Year Level</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Attendance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Grade</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-indigo-600">{student.studentId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium">{student.course}</span>
                    <span className="block text-gray-500 text-sm">{student.courseTitle} · Sec {student.section}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.program}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.yearLevel}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">—</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${student.grade === null ? 'bg-gray-100 text-gray-500' :
                      student.grade >= 90 ? 'bg-green-100 text-green-700' :
                      student.grade >= 75 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {student.grade ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      String(student.status).toLowerCase() === 'enrolled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Records"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No students found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentList;
