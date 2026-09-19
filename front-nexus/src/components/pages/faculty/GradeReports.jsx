import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  Printer,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const GradeReports = () => {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    section_id: "",
    course_id: "",
    academic_period_id: "",
    grade_filter: "all",
  });

  useEffect(() => {
    fetchSections();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (filters.section_id || filters.course_id) {
      fetchGradeReport();
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

  const fetchGradeReport = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/reports/grades`,
        {
          params: {
            faculty_id: userId,
            ...filters,
          },
        }
      );

      if (response.data.success) {
        setGradeData(response.data.grades);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error("Error fetching grade report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleExport = (format) => {
    // Export logic for CSV/PDF
    const params = new URLSearchParams({
      ...filters,
      format,
      faculty_id: localStorage.getItem("userId"),
    });

    window.open(
      `${API_BASE}/api/reports/grades/export?${params}`,
      "_blank"
    );
  };

  const getGradeColor = (grade) => {
    const numGrade = parseFloat(grade);
    if (numGrade >= 90) return "text-green-600 bg-green-50";
    if (numGrade >= 80) return "text-blue-600 bg-blue-50";
    if (numGrade >= 75) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getGradeStatus = (grade) => {
    const numGrade = parseFloat(grade);
    if (numGrade >= 75) return { icon: CheckCircle, color: "text-green-600" };
    if (numGrade >= 60) return { icon: AlertCircle, color: "text-yellow-600" };
    return { icon: XCircle, color: "text-red-600" };
  };

  const filteredData = gradeData.filter(
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
              <FileText className="w-8 h-8 mr-3 text-indigo-600" />
              Grade Reports
            </h1>
            <p className="text-gray-600 mt-2">
              Generate and analyze comprehensive grade reports
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              Grade Filter
            </label>
            <select
              name="grade_filter"
              value={filters.grade_filter}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Grades</option>
              <option value="passed">Passed (&ge;75)</option>
              <option value="failed">Failed (&lt;75)</option>
              <option value="high">High Grades (&ge;90)</option>
              <option value="low">Low Grades (&lt;60)</option>
            </select>
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
                <p className="text-gray-500 text-sm">Average Grade</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {summary.average_grade?.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Passing Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {summary.passing_rate?.toFixed(1)}%
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
                <p className="text-gray-500 text-sm">Failed Students</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {summary.failed_count}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Student Grades ({filteredData.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No grade data available. Please select filters.
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prelim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Midterm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Finals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => {
                  const StatusIcon = getGradeStatus(item.final_grade);
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded ${getGradeColor(
                            item.prelim_grade
                          )}`}
                        >
                          {item.prelim_grade || "--"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded ${getGradeColor(
                            item.midterm_grade
                          )}`}
                        >
                          {item.midterm_grade || "--"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded ${getGradeColor(
                            item.finals_grade
                          )}`}
                        >
                          {item.finals_grade || "--"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 rounded-full font-semibold ${getGradeColor(
                            item.final_grade
                          )}`}
                        >
                          {item.final_grade?.toFixed(2) || "--"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <StatusIcon.icon
                          className={`w-5 h-5 ${StatusIcon.color}`}
                        />
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

export default GradeReports;
