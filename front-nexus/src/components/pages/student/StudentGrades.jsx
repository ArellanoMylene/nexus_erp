import { useState, useEffect } from "react";
import axios from "axios";
import { GraduationCap, TrendingUp, Award, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [expandedSemesters, setExpandedSemesters] = useState({});

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(`${API_BASE}/api/grades?student_user_id=${userId}`);
      const gradesData = response.data || [];
      const grouped = gradesData.reduce((acc, grade) => {
        const key = `${grade.academic_year || 'Current'} - ${grade.semester || 'Semester'}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          subject_code: grade.course_code || grade.subject_code,
          subject_name: grade.course_name || grade.subject_name,
          units: grade.units || 3,
          prelim: grade.prelim_grade,
          midterm: grade.midterm_grade,
          finals: grade.final_grade,
          final_grade: grade.grade || grade.final_grade,
          remarks: parseFloat(grade.grade) >= 75 ? 'Passed' : 'Failed',
        });
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
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap size={24} className="text-indigo-600" />
            My Grades
          </h2>
        </div>

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
                  <Award size={20} className="text-indigo-600" />
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{semester}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{semesterGrades.length} subjects</p>
                  </div>
                </div>
                {expandedSemesters[semester] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {expandedSemesters[semester] && (
                <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-700">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr className="text-left text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                        <th className="px-4 py-2">Subject Code</th>
                        <th className="px-4 py-2">Subject Name</th>
                        <th className="px-4 py-2">Units</th>
                        <th className="px-4 py-2">Prelim</th>
                        <th className="px-4 py-2">Midterm</th>
                        <th className="px-4 py-2">Finals</th>
                        <th className="px-4 py-2">Final Grade</th>
                        <th className="px-4 py-2">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {semesterGrades.map((grade, index) => (
                        <tr key={index} className="text-sm hover:bg-indigo-50/50 dark:hover:bg-slate-700">
                          <td className="px-4 py-2 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{grade.subject_code}</td>
                          <td className="px-4 py-2 font-medium">{grade.subject_name}</td>
                          <td className="px-4 py-2">{grade.units}</td>
                          <td className="px-4 py-2">{grade.prelim || "-"}</td>
                          <td className="px-4 py-2">{grade.midterm || "-"}</td>
                          <td className="px-4 py-2">{grade.finals || "-"}</td>
                          <td className={`px-4 py-2 font-bold text-lg ${getGradeColor(grade.final_grade)}`}>
                            {grade.final_grade || "-"}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${grade.remarks === "Passed"
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
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;
