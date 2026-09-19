import { useState, useEffect } from "react";
import axios from "axios";
import { BookOpen, Plus, Search, ChevronLeft, ChevronRight, Calendar, Users, CheckCircle, XCircle, Clock } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const StudentEnlistment = () => {
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/course/courses`),
        axios.get(`${API_BASE}/api/enrollments`),
      ]);
      const courses = coursesRes.data || [];
      const enrollments = enrollmentsRes.data || [];

      // Map courses to available subjects
      setAvailableSubjects(courses.map(c => ({
        subject_id: c.id || c.course_id,
        subject_code: c.course_code || c.code,
        subject_name: c.course_name || c.name,
        units: c.credits || c.units || 3,
        schedule: c.schedule || 'TBA',
        instructor: c.instructor_name || c.instructor || 'TBA',
        available_slots: c.available_slots || 30,
        max_capacity: c.max_capacity || 40,
      })));

      // Map enrollments to enrolled subjects
      setEnrolledSubjects(enrollments.map(e => ({
        enrollment_id: e.id || e.enrollment_id,
        subject_code: e.course_code || 'N/A',
        subject_name: e.course_name || 'N/A',
        units: e.units || 3,
        schedule: e.schedule || 'TBA',
        instructor: e.instructor || 'TBA',
      })));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleEnlist = async (subjectId) => {
    try {
      await axios.post(`${API_BASE}/api/enrollments`, { course_id: subjectId });
      fetchData();
    } catch (error) {
      console.error("Error enlisting:", error);
    }
  };

  const handleDrop = async (enrollmentId) => {
    try {
      await axios.delete(`${API_BASE}/api/enrollments/${enrollmentId}`);
      fetchData();
    } catch (error) {
      console.error("Error dropping:", error);
    }
  };

  const filteredSubjects = availableSubjects.filter((subject) =>
    subject.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.subject_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const currentSubjects = filteredSubjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-600" />
            Subject Enlistment
          </h2>
        </div>

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
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-5 text-white shadow-lg">
            <p className="text-xs font-medium text-orange-100 uppercase mb-1">Available Slots</p>
            <p className="text-3xl font-bold">{availableSubjects.filter(s => s.available_slots > 0).length}</p>
          </div>
        </div>

        {/* Enrolled Subjects */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">My Enrolled Subjects</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead>
                <tr className="text-left text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2">Subject Code</th>
                  <th className="px-4 py-2">Subject Name</th>
                  <th className="px-4 py-2">Units</th>
                  <th className="px-4 py-2">Schedule</th>
                  <th className="px-4 py-2">Instructor</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {enrolledSubjects.map((subject) => (
                  <tr key={subject.enrollment_id} className="text-sm hover:bg-indigo-50/50 dark:hover:bg-slate-700">
                    <td className="px-4 py-2 font-mono font-semibold text-indigo-600">{subject.subject_code}</td>
                    <td className="px-4 py-2 font-medium">{subject.subject_name}</td>
                    <td className="px-4 py-2">{subject.units}</td>
                    <td className="px-4 py-2 text-xs">{subject.schedule}</td>
                    <td className="px-4 py-2">{subject.instructor}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDrop(subject.enrollment_id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                      >
                        <XCircle size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Available Subjects */}
        <div className="relative max-w-xs">
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>

        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">Subject Code</th>
                <th className="px-4 py-2.5">Subject Name</th>
                <th className="px-4 py-2.5">Units</th>
                <th className="px-4 py-2.5">Schedule</th>
                <th className="px-4 py-2.5">Instructor</th>
                <th className="px-4 py-2.5">Slots</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {currentSubjects.map((subject) => (
                <tr key={subject.subject_id} className="text-sm hover:bg-indigo-50/50 dark:hover:bg-slate-700">
                  <td className="px-4 py-2 font-mono font-semibold text-indigo-600">{subject.subject_code}</td>
                  <td className="px-4 py-2 font-medium">{subject.subject_name}</td>
                  <td className="px-4 py-2">{subject.units}</td>
                  <td className="px-4 py-2 text-xs">{subject.schedule}</td>
                  <td className="px-4 py-2">{subject.instructor}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${subject.available_slots > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {subject.available_slots} / {subject.max_capacity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleEnlist(subject.subject_id)}
                      disabled={subject.available_slots === 0}
                      className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                    >
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm">Page {currentPage} of {totalPages || 1}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border bg-white dark:bg-slate-700 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border bg-white dark:bg-slate-700 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEnlistment;
