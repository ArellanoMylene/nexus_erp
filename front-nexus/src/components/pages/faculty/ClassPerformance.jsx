import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  AlertTriangle,
  Download,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Minus,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ClassPerformance = () => {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [lowPerformers, setLowPerformers] = useState([]);
  const [filters, setFilters] = useState({
    section_id: "",
    course_id: "",
    academic_period_id: "",
  });

  useEffect(() => {
    fetchSections();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (filters.section_id || filters.course_id) {
      fetchPerformanceData();
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

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/reports/performance`,
        {
          params: {
            faculty_id: userId,
            ...filters,
          },
        }
      );

      if (response.data.success) {
        setPerformanceData(response.data.performance);
        setTopPerformers(response.data.top_performers || []);
        setLowPerformers(response.data.low_performers || []);
      }
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      ...filters,
      faculty_id: localStorage.getItem("userId"),
    });

    window.open(
      `${API_BASE}/api/reports/performance/export?${params}`,
      "_blank"
    );
  };

  const getGradeDistribution = () => {
    if (!performanceData) return [];

    return [
      {
        grade: "A (90-100)",
        count: performanceData.grade_a || 0,
        color: "bg-green-500",
        percentage:
          ((performanceData.grade_a || 0) /
            (performanceData.total_students || 1)) *
          100,
      },
      {
        grade: "B (80-89)",
        count: performanceData.grade_b || 0,
        color: "bg-blue-500",
        percentage:
          ((performanceData.grade_b || 0) /
            (performanceData.total_students || 1)) *
          100,
      },
      {
        grade: "C (75-79)",
        count: performanceData.grade_c || 0,
        color: "bg-yellow-500",
        percentage:
          ((performanceData.grade_c || 0) /
            (performanceData.total_students || 1)) *
          100,
      },
      {
        grade: "D (60-74)",
        count: performanceData.grade_d || 0,
        color: "bg-orange-500",
        percentage:
          ((performanceData.grade_d || 0) /
            (performanceData.total_students || 1)) *
          100,
      },
      {
        grade: "F (<60)",
        count: performanceData.grade_f || 0,
        color: "bg-red-500",
        percentage:
          ((performanceData.grade_f || 0) /
            (performanceData.total_students || 1)) *
          100,
      },
    ];
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-indigo-600" />
              Class Performance Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive analysis of class performance metrics
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={!performanceData}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2 transition"
          >
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          Select Class
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section *
            </label>
            <select
              name="section_id"
              value={filters.section_id}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a section...</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.section_name} - {section.course_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course *
            </label>
            <select
              name="course_id"
              value={filters.course_id}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : !performanceData ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            Please select a section or course to view performance analytics
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {performanceData.total_students}
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
                  <p className="text-gray-500 text-sm">Class Average</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {performanceData.class_average?.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Passing Rate</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {performanceData.passing_rate?.toFixed(1)}%
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
                  <p className="text-gray-500 text-sm">At Risk</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {performanceData.at_risk_count}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Grade Distribution
            </h2>
            <div className="space-y-4">
              {getGradeDistribution().map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {item.grade}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {item.count} students ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${item.color} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top and Low Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-500" />
                Top Performers
              </h2>
              <div className="space-y-3">
                {topPerformers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No data available
                  </p>
                ) : (
                  topPerformers.map((student, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {student.student_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {student.student_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {student.final_grade?.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Grade</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Low Performers */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                Students Needing Support
              </h2>
              <div className="space-y-3">
                {lowPerformers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No students at risk
                  </p>
                ) : (
                  lowPerformers.map((student, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                          !
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {student.student_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {student.student_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          {student.final_grade?.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Grade</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClassPerformance;
