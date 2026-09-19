import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckSquare,
} from "lucide-react";
import NexusAIChat from "../../NexusAIChat";

dayjs.extend(relativeTime);

// ---------- Helper Components ----------

// Smaller Stats Card
const Card = ({ title, value, icon: Icon, color, detail }) => (
  <div className="bg-white p-4 rounded-xl shadow border border-gray-100 transform hover:scale-[1.02] transition duration-300 relative overflow-hidden h-36 flex flex-col justify-between">
    <div className={`absolute top-0 left-0 w-full h-1 ${color}`}></div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">{value}</h2>
      </div>
      <div
        className={`p-3 rounded-full flex items-center justify-center ${color}`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <p className="mt-2 text-[10px] font-semibold text-gray-500">{detail}</p>
  </div>
);

// Recent Activity
const RecentActivity = ({ activities, loading }) => (
  <div className="bg-white p-4 rounded-xl shadow border border-gray-100 h-full">
    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center space-x-2">
      <LayoutDashboard className="w-5 h-5 text-indigo-500" />
      <span>Recent System Activity</span>
    </h3>
    {loading ? (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    ) : activities.length === 0 ? (
      <p className="text-center text-gray-500 text-sm py-8">
        No recent activity
      </p>
    ) : (
      <ul className="space-y-3 text-sm">
        {activities.map((item, index) => (
          <li
            key={index}
            className={`flex items-start space-x-2 p-2 rounded-lg hover:bg-gray-50 transition border-l-4 ${item.color}`}
          >
            <item.icon
              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${item.color.replace(
                "border-",
                "text-",
              )}`}
            />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-800">{item.detail}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{item.time}</p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

// Upcoming Calendar using dayjs
const UpcomingCalendar = () => {
  const today = dayjs();
  const startOfMonth = today.startOf("month");
  const endOfMonth = today.endOf("month");
  const daysInMonth = endOfMonth.date();
  const firstDayIndex = startOfMonth.day(); // Sunday = 0

  const events = {
    [today.date()]: "Current Day",
    10: "Registration Deadline",
    18: "Faculty Meeting",
  };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white p-4 rounded-xl shadow border border-gray-100 h-full">
      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center space-x-2">
        <CalendarDays className="w-5 h-5 text-indigo-500" />
        <span>Upcoming Events: {today.format("MMMM YYYY")}</span>
      </h3>
      <div className="grid grid-cols-7 text-center text-xs font-medium gap-1">
        {days.map((day) => (
          <div key={day} className="text-gray-500 font-semibold">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className="p-1"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const isToday = day === today.date();
          const event = events[day];

          let classes =
            "p-1 text-xs rounded transition duration-150 cursor-pointer h-8 flex items-center justify-center relative ";

          if (isToday) {
            classes +=
              "bg-indigo-600 text-white font-bold shadow transform scale-105";
          } else if (event) {
            classes +=
              "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-semibold border-2 border-yellow-500";
          } else {
            classes += "text-gray-700 hover:bg-gray-50";
          }

          return (
            <div key={day} className={classes} title={event || ""}>
              {day}
              {event && (
                <span className="absolute bottom-0.5 right-0.5 h-1 w-1 bg-yellow-600 rounded-full"></span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Admin Dashboard Page ----------
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    facultyMembers: 0,
    pendingAdmissions: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        usersRes,
        coursesRes,
        admissionsRes,
        enrollmentsRes,
        clearancesRes,
      ] = await Promise.all([
        axios.get(`${API_BASE}/api/users`),
        axios.get(`${API_BASE}/api/course/courses`),
        axios.get(`${API_BASE}/api/admissions`),
        axios.get(`${API_BASE}/api/enrollments`),
        axios.get(`${API_BASE}/api/clearances`),
      ]);

      const users = usersRes.data || [];
      const courses = coursesRes.data || [];
      const admissions = admissionsRes.data || [];
      const enrollments = enrollmentsRes.data || [];
      const clearances = clearancesRes.data || [];

      // Calculate statistics
      const students = users.filter((u) => u.role === "Student");
      const faculty = users.filter((u) => u.role === "Faculty");
      const pendingAdmissions = admissions.filter(
        (a) => a.status === "Pending",
      ).length;

      setStats({
        totalStudents: students.length,
        activeCourses: courses.length,
        facultyMembers: faculty.length,
        pendingAdmissions,
      });

      // Generate recent activity from multiple sources
      const activities = [];

      // Recent enrollments
      enrollments.slice(0, 2).forEach((enrollment) => {
        activities.push({
          type: "Student Enrollment",
          detail: `${enrollment.student_name} enrolled in ${enrollment.course_code}`,
          time: dayjs(enrollment.created_at).fromNow(),
          color: "border-green-500",
          icon: Users,
        });
      });

      // Recent admissions
      admissions.slice(0, 2).forEach((admission) => {
        activities.push({
          type: "New Admission",
          detail: `${admission.first_name} ${admission.last_name} applied for ${admission.program_applied}`,
          time: dayjs(admission.created_at).fromNow(),
          color: "border-indigo-500",
          icon: Users,
        });
      });

      // Recent clearances
      clearances.slice(0, 1).forEach((clearance) => {
        activities.push({
          type: "Clearance Update",
          detail: `${clearance.student_name} clearance status: ${clearance.overall_status}`,
          time: dayjs(clearance.updated_at).fromNow(),
          color: "border-yellow-500",
          icon: CheckSquare,
        });
      });

      // Sort by most recent
      activities.sort((a, b) => {
        const timeA = a.time.includes("ago") ? a.time : "999 days ago";
        const timeB = b.time.includes("ago") ? b.time : "999 days ago";
        return timeA.localeCompare(timeB);
      });

      setRecentActivity(activities.slice(0, 4));
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: "Total Students",
      value: loading ? "..." : stats.totalStudents.toLocaleString(),
      icon: Users,
      color: "bg-indigo-600",
      detail: "Active student accounts",
    },
    {
      title: "Active Courses",
      value: loading ? "..." : stats.activeCourses.toString(),
      icon: BookOpen,
      color: "bg-green-600",
      detail: "Available for enrollment",
    },
    {
      title: "Faculty Members",
      value: loading ? "..." : stats.facultyMembers.toString(),
      icon: Briefcase,
      color: "bg-red-600",
      detail: "Teaching staff registered",
    },
    {
      title: "Pending Admissions",
      value: loading ? "..." : stats.pendingAdmissions.toString(),
      icon: LayoutDashboard,
      color: "bg-yellow-600",
      detail: "Awaiting review",
    },
  ];

  return (
    <div className="h-[80vh] font-sans text-gray-800">
      <main className="p-4">
        <div className="space-y-4">
          {/* Dashboard Header */}
          <div className="border-b-4 border-indigo-600 pb-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return "Good Morning, Admin";
                  else if (hour < 18) return "Good Afternoon, Admin";
                  else return "Good Evening, Admin";
                })()}
              </h2>
            </div>
            <p className="mt-1 text-gray-500 text-base">
              Central management and real-time overview of college operations.
            </p>
          </div>

          {/* Stats */}
          <h3 className="text-xl font-bold text-gray-700">
            Key Performance Indicators
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsData.map((stat) => (
              <Card key={stat.title} {...stat} />
            ))}
          </div>

          {/* Recent Activity & Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecentActivity activities={recentActivity} loading={loading} />
            <UpcomingCalendar />
          </div>
        </div>
      </main>

      {/* Nexus AI Chatbot */}
      <NexusAIChat />
    </div>
  );
}
