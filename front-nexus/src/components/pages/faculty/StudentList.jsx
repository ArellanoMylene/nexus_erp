import React, { useState, useEffect } from "react";
import axios from "axios";
import { Users, Search, Mail, FileText, Download, Filter, Eye, BookOpen } from "lucide-react";

const StudentList = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, [selectedCourse]);

  const fetchCourses = async () => {
    // TODO: Replace with actual API
    setCourses([
      { id: 1, code: 'CS101', name: 'Introduction to Programming', section: 'A' },
      { id: 2, code: 'CS102', name: 'Data Structures', section: 'B' },
      { id: 3, code: 'MATH201', name: 'Calculus II', section: 'A' },
    ]);
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API
      // const response = await axios.get(`/api/faculty/students?course=${selectedCourse}`);
      
      // Mock data
      setTimeout(() => {
        setStudents([
          {
            id: 1,
            studentId: '2024-00001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            course: 'CS101',
            section: 'A',
            program: 'BS Computer Science',
            yearLevel: '1st Year',
            status: 'Active',
            attendance: 95,
            grade: 88
          },
          {
            id: 2,
            studentId: '2024-00002',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            course: 'CS101',
            section: 'A',
            program: 'BS Computer Science',
            yearLevel: '1st Year',
            status: 'Active',
            attendance: 92,
            grade: 91
          },
          {
            id: 3,
            studentId: '2024-00003',
            firstName: 'Michael',
            lastName: 'Johnson',
            email: 'michael.j@example.com',
            course: 'CS102',
            section: 'B',
            program: 'BS Computer Science',
            yearLevel: '2nd Year',
            status: 'Active',
            attendance: 88,
            grade: 85
          },
          {
            id: 4,
            studentId: '2024-00004',
            firstName: 'Sarah',
            lastName: 'Williams',
            email: 'sarah.w@example.com',
            course: 'MATH201',
            section: 'A',
            program: 'BS Mathematics',
            yearLevel: '2nd Year',
            status: 'Active',
            attendance: 97,
            grade: 93
          },
        ]);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse === 'all' || student.course === selectedCourse;
    
    return matchesSearch && matchesCourse;
  });

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    alert('Exporting student list...');
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option key={course.id} value={course.code}>
                  {course.code} - Section {course.section}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredStudents.length > 0 
                  ? Math.round(filteredStudents.reduce((acc, s) => acc + s.attendance, 0) / filteredStudents.length)
                  : 0}%
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Grade</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredStudents.length > 0
                  ? Math.round(filteredStudents.reduce((acc, s) => acc + s.grade, 0) / filteredStudents.length)
                  : 0}
              </p>
            </div>
            <FileText className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredStudents.filter(s => s.status === 'Active').length}
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
                    <span className="text-gray-500 text-sm"> - Sec {student.section}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.program}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.yearLevel}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            student.attendance >= 90 ? 'bg-green-500' :
                            student.attendance >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${student.attendance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{student.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      student.grade >= 90 ? 'bg-green-100 text-green-700' :
                      student.grade >= 75 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
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
