import { useState, useEffect } from "react";
import axios from "axios";
import { GraduationCap, TrendingUp, Award, ChevronDown, ChevronUp, FileText, Download, Printer, CheckCircle, BookOpen, Search, Users, AlertCircle, Info, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const StudentAcademic = () => {
  const [activeTab, setActiveTab] = useState("enrollment");

  // Enrollment state
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [filterYear, setFilterYear] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  // Grades state
  const [grades, setGrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [expandedSemesters, setExpandedSemesters] = useState({});

  // Report Card state
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === "enrollment") {
      fetchEnrollmentData();
      fetchEnrollmentStatus();
    } else if (activeTab === "grades") {
      fetchGrades();
    } else {
      fetchReportCard();
    }
  }, [activeTab]);

  const fetchGrades = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(`${API_BASE}/api/grades?student_user_id=${userId}`);
      const gradesData = response.data || [];
      const grouped = gradesData.reduce((acc, grade) => {
        const key = `${grade.academic_year || 'Current'} - ${grade.semester || 'Semester'}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(grade);
        return acc;
      }, {});
      setGrades(grouped);
      const initialExpanded = {};
      Object.keys(grouped).forEach(key => initialExpanded[key] = true);
      setExpandedSemesters(initialExpanded);
      // Calculate summary from grades
      const totalGrades = gradesData.length || 1;
      const avgGpa = gradesData.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / totalGrades;
      setSummary({
        overall_gpa: avgGpa.toFixed(2),
        completed_units: gradesData.reduce((sum, g) => sum + (g.units || 0), 0),
        current_semester_gpa: avgGpa.toFixed(2),
      });
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  const fetchEnrollmentStatus = async () => {
    try {
      // Get enrollment status from enrollments endpoint
      const response = await axios.get(`${API_BASE}/api/enrollments`);
      const enrollments = response.data || [];
      setEnrollmentStatus({
        isOpen: true,
        message: 'Enrollment is currently open',
        maxUnits: 24,
        currentUnits: enrollments.reduce((sum, e) => sum + (e.units || 0), 0),
      });
    } catch (error) {
      console.error("Error fetching enrollment status:", error);
    }
  };

  const fetchEnrollmentData = async () => {
    try {
      const [coursesRes, enrolledRes] = await Promise.all([
        axios.get(`${API_BASE}/api/course/courses`),
        axios.get(`${API_BASE}/api/enrollments`),
      ]);
      const courses = coursesRes.data || [];
      const enrolled = enrolledRes.data || [];
      setAvailableSubjects(courses.map(c => ({
        subject_id: c.id || c.course_id,
        subject_code: c.course_code || c.code,
        subject_name: c.course_name || c.name,
        units: c.units || 3,
        schedule: c.schedule || 'TBA',
        instructor: c.instructor_name || 'TBA',
        capacity: c.capacity || 40,
        enrolled: c.enrolled_count || 0,
        year_level: c.year_level,
        semester: c.semester,
      })));
      setEnrolledSubjects(enrolled.map(e => ({
        enrollment_id: e.id || e.enrollment_id,
        subject_id: e.course_id,
        subject_code: e.course_code,
        subject_name: e.course_name,
        units: e.units || 3,
        schedule: e.schedule || 'TBA',
      })));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleEnlist = async (subject) => {
    setSelectedSubject(subject);
    setShowConfirmModal(true);
  };

  const confirmEnlist = async () => {
    try {
      await axios.post(`${API_BASE}/api/enrollments`, {
        course_id: selectedSubject.subject_id,
      });
      fetchEnrollmentData();
      fetchEnrollmentStatus();
      setShowConfirmModal(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error("Error enlisting:", error);
    }
  };

  const handleDrop = async (enrollmentId) => {
    if (!confirm("Are you sure you want to drop this subject?")) return;

    try {
      await axios.delete(`${API_BASE}/api/enrollments/${enrollmentId}`);
      fetchEnrollmentData();
      fetchEnrollmentStatus();
    } catch (error) {
      console.error("Error dropping subject:", error);
    }
  };

  const handlePrintEnrollment = () => {
    window.print();
  };

  const handleDownloadEnrollment = () => {
    console.log("Downloading enrollment form...");
  };

  const fetchReportCard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/grades`);
      const grades = response.data || [];
      // Calculate report card from grades data
      const totalGrades = grades.length || 1;
      const gpa = (grades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / totalGrades).toFixed(2);
      setReportCard({
        student_id: '2024-00001',
        student_name: 'Student User',
        program: 'BS Computer Science',
        year_level: '2nd Year',
        academic_year: '2024-2025',
        semester: '1st Semester',
        gpa: gpa,
        total_units: grades.reduce((sum, g) => sum + (g.units || 0), 0),
        passed_subjects: grades.filter(g => parseFloat(g.grade) >= 75).length,
        grades: grades.map(g => ({
          subject_code: g.course_code || g.subject_code,
          subject_name: g.course_name || g.subject_name,
          units: g.units || 3,
          midterm: g.midterm_grade,
          finals: g.final_grade,
          final_grade: g.grade || g.final_grade,
          remarks: parseFloat(g.grade) >= 75 ? 'Passed' : 'Failed',
        })),
      });
    } catch (error) {
      console.error("Error fetching report card:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log("Downloading report card...");
  };

  const getGradeColor = (grade) => {
    const numGrade = parseFloat(grade);
    if (numGrade >= 90) return "text-green-600 dark:text-green-400";
    if (numGrade >= 80) return "text-blue-600 dark:text-blue-400";
    if (numGrade >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const tabs = [
    { id: "enrollment", label: "Online Enrollment", icon: BookOpen },
    { id: "grades", label: "Grades", icon: TrendingUp },
    { id: "report-card", label: "Report Card", icon: FileText },
  ];

  // Filter and pagination for enrollment
  const filteredSubjects = availableSubjects.filter((subject) => {
    const matchesSearch = subject.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.subject_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = !filterYear || subject.year_level?.toString() === filterYear;
    const matchesSemester = !filterSemester || subject.semester?.toString() === filterSemester;
    return matchesSearch && matchesYear && matchesSemester;
  });

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const currentSubjects = filteredSubjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap size={24} className="text-indigo-600" />
            Academic Records
          </h2>
          {activeTab === "report-card" && (
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-md"
              >
                <Printer size={14} />
                Print
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-md"
              >
                <Download size={14} />
                Download PDF
              </button>
            </div>
          )}
          {activeTab === "enrollment" && (
            <div className="flex gap-2">
              <button
                onClick={handlePrintEnrollment}
                className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors"
              >
                <Printer size={14} />
                Print
              </button>
              <button
                onClick={handleDownloadEnrollment}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors"
              >
                <Download size={14} />
                Download
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "enrollment" ? (
          // Online Enrollment Tab
          <div className="space-y-4">
            {/* Enrollment Status Banner */}
            {enrollmentStatus && (
              <div className={`rounded-lg p-4 border ${enrollmentStatus.isOpen
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}>
                <div className="flex items-start gap-3">
                  {enrollmentStatus.isOpen ? (
                    <CheckCircle size={20} className="text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                      {enrollmentStatus.isOpen ? 'Enrollment Period Active' : 'Enrollment Period Closed'}
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {enrollmentStatus.message || 'Check with the registrar for enrollment schedules'}
                    </p>
                    {enrollmentStatus.deadline && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Deadline: {new Date(enrollmentStatus.deadline).toLocaleDateString()}
                      </p>
                    )}
                    {enrollmentStatus.maxUnits && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Units: {enrolledSubjects.reduce((sum, s) => sum + (s.units || 0), 0)} / {enrollmentStatus.maxUnits}
                        </span>
                        <div className="flex-1 max-w-xs bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((enrolledSubjects.reduce((sum, s) => sum + (s.units || 0), 0) / enrollmentStatus.maxUnits) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Enrolled Subjects Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-indigo-100 uppercase mb-1">Enrolled Subjects</p>
                <p className="text-3xl font-bold">{enrolledSubjects.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-green-100 uppercase mb-1">Total Units</p>
                <p className="text-3xl font-bold">{enrolledSubjects.reduce((sum, s) => sum + (s.units || 0), 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-blue-100 uppercase mb-1">Available Subjects</p>
                <p className="text-3xl font-bold">{availableSubjects.length}</p>
              </div>
            </div>

            {/* Enrolled Subjects */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Currently Enrolled</h3>
              {enrolledSubjects.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No subjects enrolled yet</p>
              ) : (
                <div className="space-y-2">
                  {enrolledSubjects.map((subject) => (
                    <div
                      key={subject.enrollment_id}
                      className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CheckCircle size={18} className="text-green-600" />
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{subject.subject_name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {subject.subject_code} • {subject.units} units • {subject.schedule}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDrop(subject.enrollment_id)}
                        className="text-red-600 hover:text-red-700 px-3 py-1 rounded-md text-sm font-medium"
                      >
                        Drop
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Subjects */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Available Subjects</h3>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* Filters */}
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm"
                  >
                    <option value="">All Year Levels</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                  <select
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                    className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm"
                  >
                    <option value="">All Semesters</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {currentSubjects.length === 0 ? (
                  <p className="text-center text-slate-500 dark:text-slate-400 py-8">No available subjects found</p>
                ) : (
                  currentSubjects.map((subject) => (
                    <div
                      key={subject.subject_id}
                      className="flex items-center justify-between p-3 rounded-md border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white">{subject.subject_name}</h4>
                          {subject.prerequisites && subject.prerequisites.length > 0 && (
                            <span className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
                              <Info size={12} />
                              Has Prerequisites
                            </span>
                          )}
                          {subject.enrolled >= subject.capacity && (
                            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                              Full
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {subject.subject_code} • {subject.units} units • {subject.schedule}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Users size={12} />
                            {subject.enrolled}/{subject.capacity}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">{subject.instructor}</span>
                          {subject.year_level && (
                            <span className="text-slate-600 dark:text-slate-400">
                              Year {subject.year_level}
                            </span>
                          )}
                          {subject.semester && (
                            <span className="text-slate-600 dark:text-slate-400">
                              Sem {subject.semester}
                            </span>
                          )}
                        </div>
                        {subject.prerequisites && subject.prerequisites.length > 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Prerequisites: {subject.prerequisites.join(', ')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleEnlist(subject)}
                        disabled={subject.enrolled >= subject.capacity}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        {subject.enrolled >= subject.capacity ? "Full" : "Enlist"}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSubjects.length)} of {filteredSubjects.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md border border-slate-300 dark:border-slate-600 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md ${currentPage === page
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-300 dark:border-slate-600"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-md border border-slate-300 dark:border-slate-600 disabled:opacity-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "grades" ? (
          // Grades Tab
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-indigo-100 uppercase mb-1">Overall GPA</p>
                <p className="text-3xl font-bold">{summary?.overall_gpa || "0.00"}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-green-100 uppercase mb-1">Completed Units</p>
                <p className="text-3xl font-bold">{summary?.completed_units || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-orange-100 uppercase mb-1">Current Semester GPA</p>
                <p className="text-3xl font-bold">{summary?.current_semester_gpa || "0.00"}</p>
              </div>
            </div>

            {/* Grades by Semester */}
            <div className="space-y-3">
              {Object.entries(grades).map(([semester, semesterGrades]) => (
                <div key={semester} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setExpandedSemesters({ ...expandedSemesters, [semester]: !expandedSemesters[semester] })}
                    className="w-full flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GraduationCap size={20} className="text-indigo-600" />
                      <div className="text-left">
                        <h3 className="font-bold text-slate-900 dark:text-white">{semester}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {semesterGrades.length} subjects
                        </p>
                      </div>
                    </div>
                    {expandedSemesters[semester] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {expandedSemesters[semester] && (
                    <div className="p-4 pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                              <th className="text-left p-2 font-semibold text-slate-700 dark:text-slate-300">Subject Code</th>
                              <th className="text-left p-2 font-semibold text-slate-700 dark:text-slate-300">Subject Name</th>
                              <th className="text-center p-2 font-semibold text-slate-700 dark:text-slate-300">Units</th>
                              <th className="text-center p-2 font-semibold text-slate-700 dark:text-slate-300">Midterm</th>
                              <th className="text-center p-2 font-semibold text-slate-700 dark:text-slate-300">Final</th>
                              <th className="text-center p-2 font-semibold text-slate-700 dark:text-slate-300">Grade</th>
                              <th className="text-center p-2 font-semibold text-slate-700 dark:text-slate-300">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semesterGrades.map((grade, index) => (
                              <tr key={index} className="border-t border-slate-200 dark:border-slate-700">
                                <td className="p-2 text-slate-900 dark:text-white font-medium">{grade.subject_code}</td>
                                <td className="p-2 text-slate-900 dark:text-white">{grade.subject_name}</td>
                                <td className="p-2 text-center text-slate-900 dark:text-white">{grade.units}</td>
                                <td className={`p-2 text-center font-semibold ${getGradeColor(grade.midterm_grade)}`}>
                                  {grade.midterm_grade || "-"}
                                </td>
                                <td className={`p-2 text-center font-semibold ${getGradeColor(grade.final_grade)}`}>
                                  {grade.final_grade || "-"}
                                </td>
                                <td className={`p-2 text-center font-bold text-lg ${getGradeColor(grade.final_grade)}`}>
                                  {grade.final_grade || "-"}
                                </td>
                                <td className="p-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${grade.remarks === "Passed"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    }`}>
                                    {grade.remarks || "Pending"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Report Card Tab
          <div className="space-y-4">
            {/* Student Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Student Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Student ID:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{reportCard?.student_id || "2024-00001"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Name:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{reportCard?.student_name || "John Doe"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Program:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{reportCard?.program || "BS Computer Science"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Year Level:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{reportCard?.year_level || "2nd Year"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Academic Period</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Academic Year:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{reportCard?.academic_year || "2023-2024"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Semester:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{reportCard?.semester || "1st Semester"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Date Issued:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {reportCard?.issue_date ? new Date(reportCard.issue_date).toLocaleDateString() : new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-indigo-100 uppercase mb-1">GPA</p>
                <p className="text-3xl font-bold">{reportCard?.gpa || "0.00"}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-green-100 uppercase mb-1">Total Units</p>
                <p className="text-3xl font-bold">{reportCard?.total_units || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-orange-100 uppercase mb-1">Passed</p>
                <p className="text-3xl font-bold">{reportCard?.passed_subjects || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-purple-100 uppercase mb-1">Rank</p>
                <p className="text-3xl font-bold">{reportCard?.rank || "-"}</p>
              </div>
            </div>

            {/* Grades Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Academic Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Subject Code</th>
                      <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Subject Description</th>
                      <th className="text-center p-3 font-semibold text-slate-700 dark:text-slate-300">Units</th>
                      <th className="text-center p-3 font-semibold text-slate-700 dark:text-slate-300">Midterm</th>
                      <th className="text-center p-3 font-semibold text-slate-700 dark:text-slate-300">Finals</th>
                      <th className="text-center p-3 font-semibold text-slate-700 dark:text-slate-300">Final Grade</th>
                      <th className="text-center p-3 font-semibold text-slate-700 dark:text-slate-300">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCard?.grades?.map((grade, index) => (
                      <tr key={index} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="p-3 text-slate-900 dark:text-white font-medium">{grade.subject_code}</td>
                        <td className="p-3 text-slate-900 dark:text-white">{grade.subject_name}</td>
                        <td className="p-3 text-center text-slate-900 dark:text-white">{grade.units}</td>
                        <td className={`p-3 text-center font-semibold ${getGradeColor(grade.midterm)}`}>
                          {grade.midterm || "-"}
                        </td>
                        <td className={`p-3 text-center font-semibold ${getGradeColor(grade.finals)}`}>
                          {grade.finals || "-"}
                        </td>
                        <td className={`p-3 text-center font-bold text-lg ${getGradeColor(grade.final_grade)}`}>
                          {grade.final_grade}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${grade.remarks === "Passed"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}>
                            {grade.remarks}
                          </span>
                        </td>
                      </tr>
                    )) || (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-500 dark:text-slate-400">
                            No grades available yet
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="space-y-2">
                  <div className="border-t-2 border-slate-900 dark:border-slate-300 pt-2 mt-12">
                    <p className="font-semibold text-slate-900 dark:text-white">Adviser</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="border-t-2 border-slate-900 dark:border-slate-300 pt-2 mt-12">
                    <p className="font-semibold text-slate-900 dark:text-white">Registrar</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="border-t-2 border-slate-900 dark:border-slate-300 pt-2 mt-12">
                    <p className="font-semibold text-slate-900 dark:text-white">Dean</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedSubject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-2">
                  <FileText size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    Confirm Enrollment
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Review the subject details before enrolling
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4 space-y-2">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Subject Name</p>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedSubject.subject_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Subject Code</p>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedSubject.subject_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Units</p>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedSubject.units}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Schedule</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedSubject.schedule}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Instructor</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedSubject.instructor}</p>
                </div>
                {selectedSubject.prerequisites && selectedSubject.prerequisites.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Prerequisites Required</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedSubject.prerequisites.map((prereq, index) => (
                        <span
                          key={index}
                          className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded"
                        >
                          {prereq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {enrollmentStatus && !enrollmentStatus.isOpen && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Enrollment period is currently closed. Contact the registrar for assistance.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedSubject(null);
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEnlist}
                  disabled={enrollmentStatus && !enrollmentStatus.isOpen}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Confirm Enlist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAcademic;
