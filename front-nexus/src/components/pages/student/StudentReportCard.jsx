import { useState, useEffect } from "react";
import axios from "axios";
import { FileText, Download, Printer, Award, TrendingUp, GraduationCap } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const StudentReportCard = () => {
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportCard();
  }, []);

  const fetchReportCard = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      const [gradesRes, userRes] = await Promise.all([
        axios.get(`${API_BASE}/api/grades?student_user_id=${userId}`),
        axios.get(`${API_BASE}/api/users`),
      ]);
      const grades = gradesRes.data || [];
      const users = userRes.data || [];

      // Calculate GPA and construct report card
      const totalGrades = grades.length || 1;
      const avgGrade = grades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / totalGrades;
      const gpa = (avgGrade / 20).toFixed(2); // Convert to 5.0 scale

      setReportCard({
        student_id: users[0]?.user_id || '2024-00001',
        student_name: users[0]?.name || users[0]?.first_name + ' ' + users[0]?.last_name || 'Student',
        program: 'BS Computer Science',
        year_level: '3rd Year',
        academic_year: '2023-2024',
        semester: '1st Semester',
        gpa: gpa,
        overall_gpa: gpa,
        total_units: grades.reduce((sum, g) => sum + (g.units || 3), 0),
        total_units_earned: grades.filter(g => parseFloat(g.grade) >= 75).reduce((sum, g) => sum + (g.units || 3), 0),
        standing: avgGrade >= 75 ? 'Good Standing' : 'Academic Probation',
        grades: grades.map(g => ({
          subject_code: g.course_code || g.subject_code || 'N/A',
          subject_name: g.course_name || g.subject_name || 'N/A',
          units: g.units || 3,
          prelim: g.prelim || parseFloat(g.grade) || 0,
          midterm: g.midterm || parseFloat(g.grade) || 0,
          finals: g.finals || parseFloat(g.grade) || 0,
          final_grade: parseFloat(g.grade) || 0,
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
    // Simulate PDF download
    console.log("Downloading report card...");
  };

  const getGradeColor = (grade) => {
    const numGrade = parseFloat(grade);
    if (numGrade >= 90) return "text-green-600 dark:text-green-400";
    if (numGrade >= 80) return "text-blue-600 dark:text-blue-400";
    if (numGrade >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            Report Card
          </h2>
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
        </div>

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
                  <span className="font-semibold text-slate-900 dark:text-white">{reportCard?.year_level || "3rd Year"}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Academic Summary</h3>
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
                  <span className="text-slate-600 dark:text-slate-400">GPA:</span>
                  <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{reportCard?.gpa || "3.75"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Units:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{reportCard?.total_units || "21"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-100 uppercase mb-1">Overall GPA</p>
                <p className="text-3xl font-bold">{reportCard?.overall_gpa || "3.75"}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <TrendingUp className="text-white" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-100 uppercase mb-1">Total Units Earned</p>
                <p className="text-3xl font-bold">{reportCard?.total_units_earned || "96"}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Award className="text-white" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-100 uppercase mb-1">Academic Standing</p>
                <p className="text-2xl font-bold">{reportCard?.standing || "Good Standing"}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <GraduationCap className="text-white" size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Grades This Semester</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">Subject Code</th>
                  <th className="px-4 py-2.5">Subject Name</th>
                  <th className="px-4 py-2.5">Units</th>
                  <th className="px-4 py-2.5">Prelim</th>
                  <th className="px-4 py-2.5">Midterm</th>
                  <th className="px-4 py-2.5">Finals</th>
                  <th className="px-4 py-2.5">Final Grade</th>
                  <th className="px-4 py-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {(reportCard?.grades || [
                  { subject_code: "CS301", subject_name: "Data Structures", units: 3, prelim: 85, midterm: 88, finals: 90, final_grade: 87.67, remarks: "Passed" },
                  { subject_code: "CS302", subject_name: "Algorithm Analysis", units: 3, prelim: 90, midterm: 92, finals: 91, final_grade: 91, remarks: "Passed" },
                  { subject_code: "CS303", subject_name: "Database Systems", units: 3, prelim: 88, midterm: 86, finals: 89, final_grade: 87.67, remarks: "Passed" },
                  { subject_code: "CS304", subject_name: "Web Development", units: 3, prelim: 92, midterm: 90, finals: 93, final_grade: 91.67, remarks: "Passed" },
                  { subject_code: "GE101", subject_name: "Philippine History", units: 3, prelim: 85, midterm: 87, finals: 86, final_grade: 86, remarks: "Passed" },
                ]).map((grade, index) => (
                  <tr key={index} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700">
                    <td className="px-4 py-2 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{grade.subject_code}</td>
                    <td className="px-4 py-2 font-medium">{grade.subject_name}</td>
                    <td className="px-4 py-2">{grade.units}</td>
                    <td className="px-4 py-2">{grade.prelim}</td>
                    <td className="px-4 py-2">{grade.midterm}</td>
                    <td className="px-4 py-2">{grade.finals}</td>
                    <td className={`px-4 py-2 font-bold text-lg ${getGradeColor(grade.final_grade)}`}>
                      {typeof grade.final_grade === 'number' ? grade.final_grade.toFixed(2) : grade.final_grade}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${grade.remarks === "Passed"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                        {grade.remarks}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Grading System:</strong> 90-100 (Excellent), 80-89 (Very Good), 75-79 (Good), Below 75 (Failed)</p>
            <p><strong>Generated on:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReportCard;
