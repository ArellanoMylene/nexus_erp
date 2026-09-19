import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Users,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Search,
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ClassCapacityMonitor = () => {
  const [sections, setSections] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState(null);
  const [filterCourse, setFilterCourse] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchSections();
    fetchPeriods();
    fetchCourses();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/sections`);
      setSections(response.data);
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/academic-periods`
      );
      setPeriods(response.data);
    } catch (error) {
      console.error("Error fetching periods:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/course/courses`
      );
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const getCapacityPercentage = (current, max) => {
    return Math.round((current / max) * 100);
  };

  const getCapacityStatus = (current, max) => {
    const percentage = getCapacityPercentage(current, max);
    if (percentage >= 100) return "full";
    if (percentage >= 80) return "near-full";
    if (percentage >= 50) return "moderate";
    return "low";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "full":
        return "#e74c3c";
      case "near-full":
        return "#f39c12";
      case "moderate":
        return "#3498db";
      case "low":
        return "#27ae60";
      default:
        return "#95a5a6";
    }
  };

  // Filter sections
  const filteredSections = sections.filter((section) => {
    const matchesPeriod =
      !filterPeriod || section.period_id === filterPeriod.value;
    const matchesCourse =
      !filterCourse || section.course_id === filterCourse.value;

    let matchesStatus = true;
    if (filterStatus) {
      const status = getCapacityStatus(
        section.current_enrolled,
        section.max_capacity
      );
      matchesStatus = status === filterStatus.value;
    }

    const matchesSearch =
      !searchQuery ||
      section.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.section_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.course_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.period_name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPeriod && matchesCourse && matchesStatus && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSections.length / rowsPerPage);
  const paginatedSections = filteredSections.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Calculate statistics
  const totalSections = filteredSections.length;
  const fullSections = filteredSections.filter(
    (s) => getCapacityStatus(s.current_enrolled, s.max_capacity) === "full"
  ).length;
  const nearFullSections = filteredSections.filter(
    (s) => getCapacityStatus(s.current_enrolled, s.max_capacity) === "near-full"
  ).length;
  const totalCapacity = filteredSections.reduce(
    (sum, s) => sum + s.max_capacity,
    0
  );
  const totalEnrolled = filteredSections.reduce(
    (sum, s) => sum + s.current_enrolled,
    0
  );
  const overallUtilization =
    totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  const periodOptions = periods.map((period) => ({
    value: period.period_id,
    label: `${period.period_name} ${period.year}`,
  }));

  const courseOptions = courses.map((course) => ({
    value: course.course_id,
    label: `${course.course_code} - ${course.course_title}`,
  }));

  const statusFilterOptions = [
    { value: "full", label: "Full (100%)" },
    { value: "near-full", label: "Near Full (80-99%)" },
    { value: "moderate", label: "Moderate (50-79%)" },
    { value: "low", label: "Available (<50%)" },
  ];

  // Helper Components
  const StatusBadge = ({ status, percentage }) => {
    let colorClass = "";
    switch (status) {
      case "full":
        colorClass = "bg-red-100 text-red-700";
        break;
      case "near-full":
        colorClass = "bg-yellow-100 text-yellow-700";
        break;
      case "moderate":
        colorClass = "bg-indigo-100 text-indigo-700";
        break;
      case "low":
        colorClass = "bg-green-100 text-green-700";
        break;
      default:
        colorClass = "bg-slate-100 text-slate-700";
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {percentage}%
      </span>
    );
  };

  const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700">
      <span className="text-xs sm:text-sm">
        Page <span className="font-semibold">{currentPage}</span> of{" "}
        <span className="font-semibold">{totalPages}</span> | Total Records:{" "}
        {totalItems}
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

  return (
    <div className=" p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Class Capacity Monitor
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            Real-time Enrollment Tracking
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">
                  Total Sections
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {totalSections}
                </p>
              </div>
              <BookOpen className="text-indigo-600" size={28} />
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">
                  Total Enrolled
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {totalEnrolled}
                </p>
              </div>
              <Users className="text-green-600" size={28} />
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">
                  Total Capacity
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {totalCapacity}
                </p>
              </div>
              <TrendingUp className="text-purple-600" size={28} />
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Utilization</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {overallUtilization}%
                </p>
              </div>
              <Clock className="text-orange-600" size={28} />
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">
                  Full Sections
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {fullSections}
                </p>
              </div>
              <AlertCircle className="text-red-600" size={28} />
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Near Full</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {nearFullSections}
                </p>
              </div>
              <TrendingUp className="text-yellow-600" size={28} />
            </div>
          </div>
        </div>

        {/* Controls and Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input - LEFT */}
            <div className="relative flex-grow max-w-xs">
              <input
                type="text"
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
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
              <div className="w-44">
                <Select
                  options={periodOptions}
                  value={filterPeriod}
                  onChange={(option) => {
                    setFilterPeriod(option);
                    setCurrentPage(1);
                  }}
                  placeholder="Period"
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>
              <div className="w-44">
                <Select
                  options={courseOptions}
                  value={filterCourse}
                  onChange={(option) => {
                    setFilterCourse(option);
                    setCurrentPage(1);
                  }}
                  placeholder="Course"
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>
              <div className="w-44">
                <Select
                  options={statusFilterOptions}
                  value={filterStatus}
                  onChange={(option) => {
                    setFilterStatus(option);
                    setCurrentPage(1);
                  }}
                  placeholder="Status"
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="px-4 py-2.5">Section</th>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5">Room</th>
                  <th className="px-4 py-2.5 text-right">Enrolled</th>
                  <th className="px-4 py-2.5 text-right">Capacity</th>
                  <th className="px-4 py-2.5 text-right">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedSections.length > 0 ? (
                  paginatedSections.map((section) => {
                    const status = getCapacityStatus(
                      section.current_enrolled,
                      section.max_capacity
                    );
                    const percentage = getCapacityPercentage(
                      section.current_enrolled,
                      section.max_capacity
                    );

                    return (
                      <tr
                        key={section.section_id}
                        className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150"
                      >
                        <td className="px-4 py-2">
                          <div className="font-semibold">{section.section_name}</div>
                          <div className="text-xs text-slate-500">
                            {section.course_code}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="max-w-xs truncate">{section.course_title}</div>
                        </td>
                        <td className="px-4 py-2">
                          {section.period_name} {section.year}
                        </td>
                        <td className="px-4 py-2">
                          {section.room || <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {section.current_enrolled}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {section.max_capacity}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <StatusBadge status={status} percentage={percentage} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-4 text-center text-slate-500 italic"
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
    </div>
  );
};

export default ClassCapacityMonitor;
