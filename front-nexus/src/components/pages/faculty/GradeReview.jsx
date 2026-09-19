import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckSquare, Search, ChevronLeft, ChevronRight, Eye, Send, Download, CheckCircle, Clock, AlertCircle } from "lucide-react";

const GradeReview = () => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [studentGrades, setStudentGrades] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState("midterm");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCoursesAndGrades();
  }, [selectedAssessment]);

  const fetchCoursesAndGrades = async () => {
    setLoading(true);
    // TODO: Replace with actual API
    const mockCourses = [
      { id: 1, code: 'CS101', name: 'Introduction to Programming', section: 'A' },
      { id: 2, code: 'CS102', name: 'Data Structures', section: 'B' },
      { id: 3, code: 'MATH201', name: 'Calculus II', section: 'A' },
    ];
    setCourses(mockCourses);

    // Mock student grades data
    const mockGrades = [
      {
        id: 1,
        studentId: '2024-00001',
        firstName: 'John',
        lastName: 'Doe',
        courseId: 1,
        course: 'CS101',
        quiz: 85,
        assignment: 90,
        exam: 88,
        project: 92,
        average: 88.75,
        finalGrade: 89,
        letterGrade: '1.25',
        status: 'draft', // draft, submitted, finalized
        submittedAt: null,
        remarks: ''
      },
      {
        id: 2,
        studentId: '2024-00002',
        firstName: 'Jane',
        lastName: 'Smith',
        courseId: 1,
        course: 'CS101',
        quiz: 92,
        assignment: 88,
        exam: 95,
        project: 90,
        average: 91.25,
        finalGrade: 91,
        letterGrade: '1.0',
        status: 'submitted',
        submittedAt: '2024-01-08',
        remarks: ''
      },
      {
        id: 3,
        studentId: '2024-00003',
        firstName: 'Michael',
        lastName: 'Johnson',
        courseId: 2,
        course: 'CS102',
        quiz: 78,
        assignment: 82,
        exam: 80,
        project: 85,
        average: 81.25,
        finalGrade: 81,
        letterGrade: '1.75',
        status: 'draft',
        submittedAt: null,
        remarks: ''
      },
      {
        id: 4,
        studentId: '2024-00004',
        firstName: 'Sarah',
        lastName: 'Williams',
        courseId: 2,
        course: 'CS102',
        quiz: 95,
        assignment: 93,
        exam: 91,
        project: 94,
        average: 93.25,
        finalGrade: 93,
        letterGrade: '1.0',
        status: 'finalized',
        submittedAt: '2024-01-05',
        remarks: 'Excellent performance'
      },
      {
        id: 5,
        studentId: '2024-00005',
        firstName: 'David',
        lastName: 'Brown',
        courseId: 3,
        course: 'MATH201',
        quiz: 88,
        assignment: 85,
        exam: 87,
        project: 89,
        average: 87.25,
        finalGrade: 87,
        letterGrade: '1.5',
        status: 'submitted',
        submittedAt: '2024-01-07',
        remarks: ''
      },
    ];
    
    setStudentGrades(mockGrades);
    setLoading(false);
  };

  const handleSubmitGrades = async (studentIds) => {
    if (studentIds.length === 0) {
      alert('No grades to submit');
      return;
    }

    if (!window.confirm(`Submit grades for ${studentIds.length} student(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Replace with actual API
      // await axios.post('/api/faculty/grades/submit', {
      //   studentIds,
      //   assessment: selectedAssessment,
      // });

      // Update status locally
      setStudentGrades(prev => prev.map(grade => {
        if (studentIds.includes(grade.id)) {
          return {
            ...grade,
            status: 'submitted',
            submittedAt: new Date().toISOString().split('T')[0]
          };
        }
        return grade;
      }));

      alert('Grades submitted successfully!');
      setLoading(false);
    } catch (error) {
      console.error('Error submitting grades:', error);
      alert('Failed to submit grades');
      setLoading(false);
    }
  };

  const handleExportGrades = () => {
    // TODO: Implement export to CSV/PDF
    alert('Export feature coming soon');
  };

  // Filter students based on search, course, and status
  const filteredGrades = studentGrades.filter(grade => {
    const matchesSearch = 
      grade.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = !selectedCourse || grade.courseId === parseInt(selectedCourse);
    const matchesStatus = !selectedStatus || grade.status === selectedStatus;
    
    return matchesSearch && matchesCourse && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGrades = filteredGrades.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage);

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      submitted: 'bg-blue-100 text-blue-700 border-blue-300',
      finalized: 'bg-green-100 text-green-700 border-green-300'
    };
    const icons = {
      draft: <Clock className="w-3 h-3" />,
      submitted: <Send className="w-3 h-3" />,
      finalized: <CheckCircle className="w-3 h-3" />
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Statistics
  const stats = {
    total: filteredGrades.length,
    draft: filteredGrades.filter(g => g.status === 'draft').length,
    submitted: filteredGrades.filter(g => g.status === 'submitted').length,
    finalized: filteredGrades.filter(g => g.status === 'finalized').length,
  };

  const selectedCourseData = courses.find(c => c.id === parseInt(selectedCourse));

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-indigo-600" />
          Grade Review
        </h1>
        <p className="text-sm text-gray-600 mt-1">Review and finalize grades before submission</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase">Total Grades</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-indigo-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase">Draft</p>
              <p className="text-xl font-bold text-gray-700">{stats.draft}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase">Submitted</p>
              <p className="text-xl font-bold text-blue-700">{stats.submitted}</p>
            </div>
            <Send className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase">Finalized</p>
              <p className="text-xl font-bold text-green-700">{stats.finalized}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
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

          {/* Course Filter */}
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-52"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>

          {/* Assessment Type */}
          <select
            value={selectedAssessment}
            onChange={(e) => setSelectedAssessment(e.target.value)}
            className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-40"
          >
            <option value="midterm">Midterm</option>
            <option value="finals">Finals</option>
            <option value="prelim">Prelim</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-36"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="finalized">Finalized</option>
          </select>

          <button
            onClick={handleExportGrades}
            className="ml-auto px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors flex items-center gap-1 text-xs"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Quiz</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Assignment</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Exam</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Project</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Final Grade</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentGrades.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                    No grades found
                  </td>
                </tr>
              ) : (
                currentGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                          <span className="text-indigo-600 font-semibold text-xs">
                            {grade.firstName[0]}{grade.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {grade.firstName} {grade.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{grade.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{grade.course}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium">{grade.quiz}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium">{grade.assignment}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium">{grade.exam}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium">{grade.project}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-base font-bold ${getGradeColor(grade.finalGrade)}`}>
                          {grade.finalGrade}
                        </span>
                        <span className="text-xs text-gray-500">({grade.letterGrade})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(grade.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {grade.status === 'draft' && (
                          <button
                            onClick={() => handleSubmitGrades([grade.id])}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Submit Grade"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => alert('View details feature coming soon')}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs sm:text-sm text-slate-700">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span> | Showing {currentGrades.length} of {filteredGrades.length} grades
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 py-1 text-xs font-semibold text-indigo-600">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const draftGrades = filteredGrades.filter(g => g.status === 'draft');
                  if (draftGrades.length > 0) {
                    handleSubmitGrades(draftGrades.map(g => g.id));
                  } else {
                    alert('No draft grades to submit');
                  }
                }}
                disabled={loading || stats.draft === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 flex items-center gap-1 text-xs"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    Submit All Draft ({stats.draft})
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

export default GradeReview;
