import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CalendarCheck,
  Users,
  Save,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import dayjs from "dayjs";

// Configure your API base URL
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
// Ensure /api is present and no trailing slash
if (API_BASE_URL.endsWith("/")) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}
if (!API_BASE_URL.endsWith("/api")) {
  API_BASE_URL = API_BASE_URL + "/api";
}

const MarkAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [remarks, setRemarks] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [periods, setPeriods] = useState([]);
  const [sections, setSections] = useState([]);
  const itemsPerPage = 10;

  // Get faculty user ID from auth context or localStorage
  const facultyUserId = localStorage.getItem("userId") || localStorage.getItem("user_id");
  
  if (!facultyUserId) {
    console.warn("Warning: Faculty user ID not found in localStorage. Attendance records may not save correctly.");
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudentsByCourse();
    }
  }, [selectedCourse, selectedSection, selectedPeriod]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch courses
      const coursesResponse = await axios.get(`${API_BASE_URL}/course/courses`);
      let coursesData = coursesResponse.data;

      let normalizedCourses = [];
      if (Array.isArray(coursesData)) {
        normalizedCourses = coursesData;
      } else if (Array.isArray(coursesData.data)) {
        normalizedCourses = coursesData.data;
      }

      normalizedCourses = normalizedCourses.map((course) => ({
        ...course,
        course_id: course.id || course.course_id,
      }));

      setCourses(normalizedCourses);

      // Fetch academic periods
      const periodsResponse = await axios.get(
        `${API_BASE_URL}/academic-periods`,
      );
      let periodsData = periodsResponse.data;

      let normalizedPeriods = [];
      if (Array.isArray(periodsData)) {
        normalizedPeriods = periodsData;
      } else if (Array.isArray(periodsData.data)) {
        normalizedPeriods = periodsData.data;
      }

      normalizedPeriods = normalizedPeriods.map((period) => ({
        ...period,
        period_id: period.id || period.period_id,
      }));

      setPeriods(normalizedPeriods);

      // DON'T fetch sections here - we'll fetch them when course/period is selected
    } catch (error) {
      console.error("Error fetching initial data:", error);
      alert("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };
  // Add this new useEffect
  useEffect(() => {
    if (selectedCourse && selectedPeriod) {
      fetchSectionsForCourse();
    }
  }, [selectedCourse, selectedPeriod]);

  // Add this new function
  const fetchSectionsForCourse = async () => {
    try {
      const params = {
        course_id: selectedCourse,
        period_id: selectedPeriod,
      };

      console.log("Fetching sections with params:", params);

      const response = await axios.get(`${API_BASE_URL}/sections`, { params });

      let sectionsData = response.data;
      let normalizedSections = [];

      if (Array.isArray(sectionsData)) {
        normalizedSections = sectionsData;
      } else if (Array.isArray(sectionsData.data)) {
        normalizedSections = sectionsData.data;
      }

      normalizedSections = normalizedSections.map((section) => ({
        ...section,
        section_id: section.id || section.section_id,
      }));

      console.log("Sections for selected course/period:", normalizedSections);
      setSections(normalizedSections);
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };
  const fetchStudentsByCourse = async () => {
    if (!selectedCourse || !selectedPeriod) return;

    setLoading(true);
    try {
      // Fetch students enrolled in the selected course
      const params = {
        course_id: selectedCourse,
        period_id: selectedPeriod,
      };

      // Only include section_id if a section is actually selected
      if (selectedSection && selectedSection !== "") {
        params.section_id = selectedSection;
      }

      const response = await axios.get(`${API_BASE_URL}/enrollments`, {
        params,
      });
      
      let enrolledStudents = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      
      // Ensure all students have required fields for attendance marking
      enrolledStudents = enrolledStudents.map((student) => ({
        ...student,
        student_id: student.student_id || student.user_id,
      }));
      
      console.log("Enrolled students fetched:", enrolledStudents);
      setStudents(enrolledStudents);

      // Check if attendance already exists for this date
      await fetchExistingAttendance(enrolledStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      alert("Failed to load students. Check browser console for details.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async (studentsList) => {
    try {
      const params = {
        course_id: selectedCourse,
        period_id: selectedPeriod,
        date_from: selectedDate,
        date_to: selectedDate,
      };

      if (selectedSection) {
        params.section_id = selectedSection;
      }

      const response = await axios.get(`${API_BASE_URL}/student-attendance`, {
        params,
      });
      const existingAttendance = response.data.data || [];

      console.log("Existing attendance for selected date:", existingAttendance);
      
      // Initialize attendance and remarks
      const initialAttendance = {};
      const initialRemarks = {};

      studentsList.forEach((student) => {
        const studentId = student.student_id || student.user_id;
        
        const existing = existingAttendance.find(
          (att) =>
            att.student_id === studentId ||
            att.student_id === student.user_id,
        );

        if (existing) {
          initialAttendance[studentId] = existing.status;
          initialRemarks[studentId] = existing.remarks || "";
        } else {
          initialAttendance[studentId] = "present";
          initialRemarks[studentId] = "";
        }
      });

      setAttendance(initialAttendance);
      setRemarks(initialRemarks);
    } catch (error) {
      console.error("Error fetching existing attendance:", error);

      // Initialize with default values if fetch fails
      const initialAttendance = {};
      const initialRemarks = {};
      studentsList.forEach((student) => {
        const studentId = student.student_id || student.user_id;
        initialAttendance[studentId] = "present";
        initialRemarks[studentId] = "";
      });
      setAttendance(initialAttendance);
      setRemarks(initialRemarks);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleRemarkChange = (studentId, remark) => {
    setRemarks((prev) => ({
      ...prev,
      [studentId]: remark,
    }));
  };

  const markAllPresent = () => {
    const allPresent = {};
    filteredStudents.forEach((student) => {
      allPresent[student.student_id || student.user_id] = "present";
    });
    setAttendance((prev) => ({ ...prev, ...allPresent }));
  };

  const markAllAbsent = () => {
    const allAbsent = {};
    filteredStudents.forEach((student) => {
      allAbsent[student.student_id || student.user_id] = "absent";
    });
    setAttendance((prev) => ({ ...prev, ...allAbsent }));
  };

  const handleSubmit = async () => {
    if (!selectedCourse || !selectedPeriod) {
      alert("Please select a course and academic period");
      return;
    }

    if (filteredStudents.length === 0) {
      alert("No students to save attendance for");
      return;
    }

    if (!facultyUserId) {
      alert("Error: User ID not found. Please log in again.");
      return;
    }

    try {
      setLoading(true);

      // Prepare attendance records for bulk insert
      const attendanceRecords = filteredStudents.map((student) => {
        // Use the correct student identifier
        const studentId = student.student_id || student.user_id;
        
        if (!studentId) {
          throw new Error("Student ID is missing for one or more students");
        }

        return {
          student_id: studentId,
          course_id: parseInt(selectedCourse),
          section_id: selectedSection ? parseInt(selectedSection) : null,
          period_id: parseInt(selectedPeriod),
          attendance_date: selectedDate,
          time_in: dayjs().format("HH:mm:ss"),
          status: attendance[studentId] || "present",
          attendance_method: "manual",
          marked_by: parseInt(facultyUserId),
          remarks: remarks[studentId] || null,
        };
      });

      console.log("Sending attendance records:", attendanceRecords);

      // Use bulk endpoint
      const response = await axios.post(
        `${API_BASE_URL}/student-attendance/bulk`,
        {
          attendanceRecords,
        },
      );

      console.log("Response from server:", response.data);

      if (response.data.success) {
        alert(
          `✓ Attendance saved successfully! ${response.data.recordsCreated || attendanceRecords.length} records created.`,
        );
        // Refresh the attendance data
        await fetchExistingAttendance(filteredStudents);
      } else {
        alert(`Error: ${response.data.message || "Failed to save attendance"}`);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save attendance";
      alert(`Error saving attendance: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter((student) => {
    const studentId = student.student_number || student.student_id || "";
    const firstName = student.first_name || "";
    const lastName = student.last_name || "";
    const fullName = `${firstName} ${lastName}`;

    const matchesSearch =
      studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const selectedCourseData = courses.find(
    (c) => c.id === parseInt(selectedCourse),
  );

  // Calculate attendance counts
  const presentCount = Object.values(attendance).filter(
    (s) => s === "present",
  ).length;
  const absentCount = Object.values(attendance).filter(
    (s) => s === "absent",
  ).length;
  const lateCount = Object.values(attendance).filter(
    (s) => s === "late",
  ).length;

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-indigo-600" />
          Mark Attendance
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Record student attendance for your classes
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {/* Course Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Course *
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section.section_id} value={section.section_id}>
                  {section.section_name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Academic Period *
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            >
              <option value="">Select Period</option>
              {periods.map((period) => (
                <option key={period.period_id} value={period.period_id}>
                  {period.school_year} - {period.semester}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={dayjs().format("YYYY-MM-DD")}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-grow max-w-xs">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-inner"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={markAllPresent}
              disabled={filteredStudents.length === 0}
              className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-3 h-3" />
              All Present
            </button>
            <button
              onClick={markAllAbsent}
              disabled={filteredStudents.length === 0}
              className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-3 h-3" />
              All Absent
            </button>
          </div>
        </div>

        {/* Selected Info */}
        {selectedCourseData && (
          <div className="mt-3 p-2 bg-indigo-50 rounded border border-indigo-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-600">Course: </span>
              <span className="font-semibold text-gray-900">
                {selectedCourseData.code} - {selectedCourseData.title}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Date: </span>
              <span className="font-semibold text-gray-900">
                {dayjs(selectedDate).format("MMM DD, YYYY")}
              </span>
            </div>
          </div>
        )}

        {/* Attendance Summary */}
        <div className="mt-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Present: {presentCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Absent: {absentCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Late: {lateCount}</span>
          </div>
          <div className="ml-auto">
            <span className="text-gray-600">Total Students: </span>
            <span className="font-semibold">{filteredStudents.length}</span>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Student ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      Loading students...
                    </div>
                  </td>
                </tr>
              ) : currentStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    {selectedCourse && selectedPeriod
                      ? "No students found"
                      : "Please select a course and academic period to view students"}
                  </td>
                </tr>
              ) : (
                currentStudents.map((student) => {
                  const studentId = student.student_id || student.user_id;
                  const studentNumber =
                    student.student_number || student.studentId || studentId;
                  const firstName =
                    student.first_name || student.firstName || "";
                  const lastName = student.last_name || student.lastName || "";

                  return (
                    <tr
                      key={studentId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-indigo-600">
                          {studentNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                            <span className="text-indigo-600 font-semibold text-xs">
                              {firstName[0]}
                              {lastName[0]}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900">
                            {firstName} {lastName}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() =>
                              handleAttendanceChange(studentId, "present")
                            }
                            className={`px-3 py-1.5 rounded text-xs transition-colors ${attendance[studentId] === "present"
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-green-100"
                              }`}
                          >
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            Present
                          </button>
                          <button
                            onClick={() =>
                              handleAttendanceChange(studentId, "late")
                            }
                            className={`px-3 py-1.5 rounded text-xs transition-colors ${attendance[studentId] === "late"
                                ? "bg-yellow-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-yellow-100"
                              }`}
                          >
                            <Clock className="w-3 h-3 inline mr-1" />
                            Late
                          </button>
                          <button
                            onClick={() =>
                              handleAttendanceChange(studentId, "absent")
                            }
                            className={`px-3 py-1.5 rounded text-xs transition-colors ${attendance[studentId] === "absent"
                                ? "bg-red-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-red-100"
                              }`}
                          >
                            <XCircle className="w-3 h-3 inline mr-1" />
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={remarks[studentId] || ""}
                          onChange={(e) =>
                            handleRemarkChange(studentId, e.target.value)
                          }
                          placeholder="Add remarks..."
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs sm:text-sm text-slate-700">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages || 1}</span> | Showing{" "}
              {currentStudents.length} of {filteredStudents.length} students
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 py-1 text-xs font-semibold text-indigo-600">
                {currentPage}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedCourse("");
                  setSelectedSection("");
                  setSelectedPeriod("");
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-white transition-colors text-xs"
              >
                Reset
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !selectedCourse ||
                  !selectedPeriod ||
                  filteredStudents.length === 0
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    Save Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
