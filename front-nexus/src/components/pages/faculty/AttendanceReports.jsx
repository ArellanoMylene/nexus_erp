import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Download,
  Filter,
  Search,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Printer,
  Eye,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AttendanceReports = () => {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    section_id: "",
    course_id: "",
    start_date: "",
    end_date: "",
    status_filter: "all",
  });

  useEffect(() => {
    fetchSections();
    fetchCourses();
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFilters((prev) => ({
      ...prev,
      start_date: firstDay.toISOString().split("T")[0],
      end_date: lastDay.toISOString().split("T")[0],
    }));
  }, []);

  useEffect(() => {
    if (
      (filters.section_id || filters.course_id) &&
      filters.start_date &&
      filters.end_date
    ) {
      fetchAttendanceReport();
    }
  }, [filters]);

  const fetchSections = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/faculty/${userId}/sections`
      );

      if (response.data.success) {
        setSections(response.data.sections);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/faculty/${userId}/courses`
      );

      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchAttendanceReport = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/reports/attendance`,
        {
          params: {
            faculty_id: userId,
            ...filters,
          },
        }
      );

      if (response.data.success) {
        setAttendanceData(response.data.attendance);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error("Error fetching attendance report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleExport = (format) => {
    const params = new URLSearchParams({
      ...filters,
      format,
      faculty_id: localStorage.getItem("userId"),
    });

    window.open(
      `${API_BASE}/api/reports/attendance/export?${params}`,
      "_blank"
    );
  };

  const getAttendanceRate = (present, total) => {
    if (total === 0) return 0;
    return ((present / total) * 100).toFixed(1);
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return "text-green-600 bg-green-50";
    if (rate >= 75) return "text-blue-600 bg-blue-50";
    if (rate >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const filteredData = attendanceData.filter(
    (item) =>
      item.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CalendarCheck className="w-8 h-8 mr-3 text-indigo-600" />
              Attendance Reports
            </h1>
            <p className="text-gray-600 mt-2">
              View and analyze student attendance data
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleExport("csv")}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 transition"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center gap-2 transition"
            >
              <Printer className="w-5 h-5" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <select
              name="section_id"
              value={filters.section_id}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.section_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <select
              name="course_id"
              value={filters.course_id}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Student
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {summary.total_students}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Average Attendance</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {summary.average_attendance?.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Days</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {summary.total_days}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">At Risk (&lt;75%)</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {summary.at_risk_count}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Student Attendance Records ({filteredData.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No attendance data available. Please select filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Days
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => {
                  const rate = getAttendanceRate(
                    item.present_count,
                    item.total_days
                  );
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.course_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.section_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          {item.present_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          {item.absent_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          {item.late_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                        {item.total_days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-3 py-1 rounded-full font-semibold ${getAttendanceColor(
                            rate
                          )}`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReports;
