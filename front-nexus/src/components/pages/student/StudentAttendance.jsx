import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar as CalendarIcon, ClipboardList, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const StudentAttendance = () => {
  const [activeTab, setActiveTab] = useState("logs");
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, [activeTab]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      if (activeTab === "logs") {
        await fetchAttendanceLogs();
      } else {
        await fetchAttendanceRecords();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceLogs = async () => {
    try {
      const studentId = localStorage.getItem("userId");
      const response = await axios.get(`${API_BASE}/api/student-attendance`, {
        params: { student_id: studentId }
      });
      const data = response.data.data || [];
      setAttendanceLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching attendance logs:", error);
      setAttendanceLogs([]);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const studentId = localStorage.getItem("userId");
      const response = await axios.get(`${API_BASE}/api/student-attendance`, {
        params: { student_id: studentId }
      });
      const data = response.data.data || [];
      setAttendanceRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      setAttendanceRecords([]);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      present: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: CheckCircle },
      absent: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: XCircle },
      late: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: Clock },
      excused: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: AlertCircle },
    };

    const style = statusStyles[status] || statusStyles.absent;
    const Icon = style.icon;

    return (
      <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${style.bg} ${style.text}`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const getAttendanceForDate = (day) => {
    if (!day) return null;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendanceRecords.find((record) => {
      if (!record.attendance_date) return false;
      const recordDate = new Date(record.attendance_date).toISOString().split('T')[0];
      return recordDate === dateStr;
    });
  };

  const tabs = [
    { id: "logs", label: "Attendance Logs", icon: ClipboardList },
    { id: "records", label: "Daily Records", icon: CalendarIcon },
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
   <div className="dark:bg-slate-900 px-4 py-3 transition-colors duration-500">
      <div className="w-full space-y-2 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList size={24} className="text-indigo-600" />
            Attendance Tracking
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Monitor Your Attendance
          </span>
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
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Attendance Logs Tab */}
        {activeTab === "logs" && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Date</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Subject</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Time In</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Time Out</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <ClipboardList size={48} className="mx-auto mb-3 text-slate-400" />
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    attendanceLogs.map((log, index) => (
                      <tr
                        key={log.attendance_id || log.id || index}
                        className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="p-3 text-sm text-slate-900 dark:text-white">
                          {log.attendance_date ? new Date(log.attendance_date).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-3 text-sm text-slate-900 dark:text-white">{log.course_title || log.course_code || "General"}</td>
                        <td className="p-3 text-sm text-slate-700 dark:text-slate-300">
                          {log.time_in ? new Date(`2000-01-01T${log.time_in}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                        <td className="p-3 text-sm text-slate-700 dark:text-slate-300">
                          {log.time_out ? new Date(`2000-01-01T${log.time_out}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                        <td className="p-3">{getStatusBadge(log.status)}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{log.remarks || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Daily Records Tab (Calendar View) */}
        {activeTab === "records" && (
          <div className="space-y-4">
            {/* Month Navigator */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-sm transition-colors"
              >
                Previous
              </button>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h3>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-sm transition-colors"
              >
                Next
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center font-semibold text-sm text-slate-700 dark:text-slate-300 p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentMonth).map((day, index) => {
                  const attendance = getAttendanceForDate(day);
                  const isToday = day && new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth();

                  return (
                    <div
                      key={index}
                      className={`aspect-square border rounded-lg p-2 text-center ${!day
                        ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                        : isToday
                          ? "border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                          : attendance
                            ? attendance.status === "present"
                              ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                              : attendance.status === "absent"
                                ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                                : attendance.status === "late"
                                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700"
                                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        }`}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-medium ${isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`}>
                            {day}
                          </div>
                          {attendance && (
                            <div className="mt-1">
                              {attendance.status === "present" && <CheckCircle size={14} className="mx-auto text-green-600 dark:text-green-400" />}
                              {attendance.status === "absent" && <XCircle size={14} className="mx-auto text-red-600 dark:text-red-400" />}
                              {attendance.status === "late" && <Clock size={14} className="mx-auto text-yellow-600 dark:text-yellow-400" />}
                              {attendance.status === "excused" && <AlertCircle size={14} className="mx-auto text-blue-600 dark:text-blue-400" />}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-4 justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900/40 border border-green-400"></div>
                    <span className="text-slate-700 dark:text-slate-300">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-200 dark:bg-red-900/40 border border-red-400"></div>
                    <span className="text-slate-700 dark:text-slate-300">Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-900/40 border border-yellow-400"></div>
                    <span className="text-slate-700 dark:text-slate-300">Late</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900/40 border border-blue-400"></div>
                    <span className="text-slate-700 dark:text-slate-300">Excused</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
