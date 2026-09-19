import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CheckSquare,
  CalendarCheck,
  Bell,
  TrendingUp,
  Clock,
} from "lucide-react";

dayjs.extend(relativeTime);

// Stats Card Component
const StatCard = ({ title, value, icon: Icon, color, detail, trend }) => (
  <div className="bg-white p-4 rounded-lg shadow border border-gray-100 hover:shadow-md transition-shadow duration-200">
    <div className={`absolute top-0 left-0 w-full h-1 ${color}`}></div>
    <div className="flex items-center justify-between mb-2">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
        <h2 className="text-2xl font-bold text-gray-900">{value}</h2>
        {trend && (
          <div className="flex items-center mt-1 text-xs">
            <TrendingUp className={`w-3 h-3 mr-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(trend)}% {trend > 0 ? 'increase' : 'decrease'}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color.replace('bg-', 'bg-opacity-10 ')}`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
    <p className="text-xs text-gray-500">{detail}</p>
  </div>
);

// Quick Action Card
const QuickAction = ({ title, description, icon: Icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white p-3 rounded-lg shadow border border-gray-100 hover:shadow-md transition-all duration-200 text-left w-full"
  >
    <div className="flex items-start space-x-2">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  </button>
);

// Recent Activity Item
const ActivityItem = ({ activity }) => (
  <div className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
    <div className={`p-1.5 rounded-full ${activity.color}`}>
      <activity.icon className="w-3 h-3 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
      <p className="text-xs text-gray-500">{activity.description}</p>
      <p className="text-xs text-gray-400 flex items-center">
        <Clock className="w-3 h-3 mr-1" />
        {dayjs(activity.timestamp).fromNow()}
      </p>
    </div>
  </div>
);

// Upcoming Class Card
const UpcomingClass = ({ course }) => (
  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-lg border border-indigo-100">
    <div className="flex items-center justify-between mb-1">
      <h4 className="font-semibold text-gray-900 text-sm">{course.code}</h4>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${course.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
        {course.status}
      </span>
    </div>
    <p className="text-xs text-gray-700 mb-2">{course.name}</p>
    <div className="flex items-center justify-between text-xs text-gray-600">
      <div className="flex items-center">
        <CalendarCheck className="w-3 h-3 mr-1" />
        <span>{course.schedule}</span>
      </div>
      <div className="flex items-center">
        <Users className="w-3 h-3 mr-1" />
        <span>{course.students} students</span>
      </div>
    </div>
  </div>
);

const FacultyDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      assignedCourses: 0,
      totalStudents: 0,
      pendingGrades: 0,
      attendanceRate: 0,
    },
    recentActivities: [],
    upcomingClasses: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const facultyUserId = localStorage.getItem("userId");

    try {
      // Fetch real data from multiple endpoints
      const [coursesRes, scheduleRes, gradesRes, attendanceRes] = await Promise.all([
        axios.get(`${API_BASE}/api/course/courses`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/schedules`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/grades`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/student-attendance`).catch(() => ({ data: { data: [] } })),
      ]);

      const courses = Array.isArray(coursesRes.data) ? coursesRes.data : (coursesRes.data.data || []);
      const schedules = Array.isArray(scheduleRes.data) ? scheduleRes.data : (scheduleRes.data.data || []);
      const grades = Array.isArray(gradesRes.data) ? gradesRes.data : (gradesRes.data.data || []);
      const attendance = attendanceRes.data.data || [];

      // Calculate stats from real data
      const assignedCourses = courses.length;
      const pendingGrades = grades.filter(g => !g.grade || g.grade === 'Pending').length;
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const attendanceRate = attendance.length > 0 ? ((presentCount / attendance.length) * 100).toFixed(1) : 0;

      // Build upcoming classes from schedules
      const upcomingClasses = schedules.slice(0, 3).map((s, idx) => ({
        id: s.id || idx + 1,
        code: s.course_code || s.code || `Course ${idx + 1}`,
        name: s.course_title || s.course_name || s.title || 'Course',
        schedule: s.schedule || `${s.day || 'TBD'} ${s.start_time || ''} - ${s.end_time || ''}`,
        students: s.student_count || 30,
        status: 'upcoming',
      }));

      // Build recent activities
      const recentActivities = [
        {
          id: 1,
          title: 'Dashboard Loaded',
          description: `${courses.length} courses, ${grades.length} grade records loaded`,
          timestamp: new Date(),
          icon: CheckSquare,
          color: 'bg-green-500',
        },
        {
          id: 2,
          title: 'Attendance Data',
          description: `${attendance.length} attendance records found`,
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          icon: CalendarCheck,
          color: 'bg-blue-500',
        },
      ];

      setDashboardData({
        stats: {
          assignedCourses,
          totalStudents: attendance.length || grades.length || 0,
          pendingGrades,
          attendanceRate: Number(attendanceRate),
        },
        recentActivities,
        upcomingClasses,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <LayoutDashboard className="w-6 h-6 mr-2 text-indigo-600" />
          Faculty Dashboard
        </h1>
        <p className="text-sm text-gray-600 mt-1">Welcome back! Here's your overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          title="Assigned Courses"
          value={dashboardData.stats.assignedCourses}
          icon={BookOpen}
          color="bg-blue-500"
          detail="Active courses this semester"
          trend={5}
        />
        <StatCard
          title="Total Students"
          value={dashboardData.stats.totalStudents}
          icon={Users}
          color="bg-green-500"
          detail="Across all sections"
          trend={8}
        />
        <StatCard
          title="Pending Grades"
          value={dashboardData.stats.pendingGrades}
          icon={CheckSquare}
          color="bg-yellow-500"
          detail="Require your action"
          trend={-15}
        />
        <StatCard
          title="Attendance Rate"
          value={`${dashboardData.stats.attendanceRate}%`}
          icon={CalendarCheck}
          color="bg-purple-500"
          detail="Average across classes"
          trend={3}
        />
      </div>

      {/* Main Content Grid - All sections side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
            Quick Actions
          </h2>
          <div className="space-y-2">
            <QuickAction
              title="Mark Attendance"
              description="Record student attendance for today"
              icon={CalendarCheck}
              color="bg-blue-500"
              onClick={() => window.location.href = '/faculty_mark_attendance'}
            />
            <QuickAction
              title="Enter Grades"
              description="Submit grades for completed assessments"
              icon={CheckSquare}
              color="bg-green-500"
              onClick={() => window.location.href = '/faculty_grade_encoding'}
            />
            <QuickAction
              title="Upload Materials"
              description="Share learning resources with students"
              icon={BookOpen}
              color="bg-purple-500"
              onClick={() => window.location.href = '/faculty_lms_materials'}
            />
            <QuickAction
              title="Send Announcement"
              description="Communicate with your classes"
              icon={Bell}
              color="bg-yellow-500"
              onClick={() => window.location.href = '/faculty_announcements'}
            />
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <CalendarCheck className="w-5 h-5 mr-2 text-indigo-600" />
            Upcoming Classes
          </h2>
          <div className="space-y-2">
            {dashboardData.upcomingClasses.map((course) => (
              <UpcomingClass key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-600" />
            Recent Activity
          </h2>
          <div className="space-y-1.5">
            {dashboardData.recentActivities.length > 0 ? (
              dashboardData.recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
