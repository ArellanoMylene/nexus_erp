import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  CalendarCheck,
  Bell,
  TrendingUp,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";

dayjs.extend(relativeTime);

const StatCard = ({ title, value, icon: Icon, color, detail, trend }) => (
  <div className="bg-white p-4 rounded-lg shadow border border-gray-100 hover:shadow-md transition-shadow duration-200">
    <div className={`absolute top-0 left-0 w-full h-1 ${color}`}></div>
    <div className="flex items-center justify-between mb-2">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
        <h2 className="text-2xl font-bold text-gray-900">{value}</h2>
        {trend && (
          <div className="flex items-center mt-1 text-xs">
            <TrendingUp
              className={`w-3 h-3 mr-1 ${trend > 0 ? "text-green-500" : "text-red-500"}`}
            />
            <span className={trend > 0 ? "text-green-600" : "text-red-600"}>
              {Math.abs(trend)}% {trend > 0 ? "increase" : "decrease"}
            </span>
          </div>
        )}
      </div>
      <div
        className={`p-3 rounded-full ${color.replace("bg-", "bg-opacity-10 ")}`}
      >
        <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
      </div>
    </div>
    <p className="text-xs text-gray-500">{detail}</p>
  </div>
);

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

const UpcomingPayroll = ({ payroll }) => (
  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border border-green-100">
    <div className="flex items-center justify-between mb-1">
      <h4 className="font-semibold text-gray-900 text-sm">{payroll.period}</h4>
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          payroll.status === "pending"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {payroll.status}
      </span>
    </div>
    <p className="text-xs text-gray-700 mb-2">{payroll.description}</p>
    <div className="flex items-center justify-between text-xs text-gray-600">
      <div className="flex items-center">
        <DollarSign className="w-3 h-3 mr-1" />
        <span>{payroll.amount}</span>
      </div>
      <div className="flex items-center">
        <Users className="w-3 h-3 mr-1" />
        <span>{payroll.employees} employees</span>
      </div>
    </div>
  </div>
);

const HRDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEmployees: 0,
      pendingLeaves: 0,
      payrollsProcessed: 0,
      deductionRequests: 0,
    },
    recentActivities: [],
    upcomingPayrolls: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsRes = await api.get("/api/hr/stats");
      // Fetch recent activities
      const activitiesRes = await api.get("/api/hr/activities");
      // Fetch upcoming payrolls
      const payrollsRes = await api.get("/api/hr/upcoming-payrolls");

      setDashboardData({
        stats: statsRes.data || {
          totalEmployees: 0,
          pendingLeaves: 0,
          payrollsProcessed: 0,
          deductionRequests: 0,
        },
        recentActivities: (activitiesRes.data || []).map((a) => ({
          ...a,
          icon:
            a.type === "payroll"
              ? FileText
              : a.type === "leave"
                ? CalendarCheck
                : a.type === "deduction"
                  ? CheckSquare
                  : Bell,
          color:
            a.type === "payroll"
              ? "bg-green-500"
              : a.type === "leave"
                ? "bg-blue-500"
                : a.type === "deduction"
                  ? "bg-yellow-500"
                  : "bg-indigo-500",
        })),
        upcomingPayrolls: payrollsRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <LayoutDashboard className="w-6 h-6 mr-2 text-indigo-600" />
          HR Dashboard
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Welcome back! Here's your HR overview for today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          title="Total Employees"
          value={dashboardData.stats.totalEmployees}
          icon={Users}
          color="bg-blue-500"
          detail="Active employees in system"
          trend={2}
        />
        <StatCard
          title="Pending Leaves"
          value={dashboardData.stats.pendingLeaves}
          icon={CalendarCheck}
          color="bg-yellow-500"
          detail="Awaiting approval"
          trend={-1}
        />
        <StatCard
          title="Payrolls Processed"
          value={dashboardData.stats.payrollsProcessed}
          icon={FileText}
          color="bg-green-500"
          detail="This fiscal year"
          trend={5}
        />
        <StatCard
          title="Deduction Requests"
          value={dashboardData.stats.deductionRequests}
          icon={CheckSquare}
          color="bg-purple-500"
          detail="Require your action"
          trend={0}
        />
      </div>

      {/* Main Content Grid - All sections side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-indigo-600" />
            Quick Actions
          </h2>
          <div className="space-y-2">
            <QuickAction
              title="Process Payroll"
              description="Run payroll for current period"
              icon={FileText}
              color="bg-green-500"
              onClick={() => (window.location.href = "/hr_payslip_generator")}
            />
            <QuickAction
              title="Approve Leave"
              description="Review and approve leave requests"
              icon={CalendarCheck}
              color="bg-blue-500"
              onClick={() => (window.location.href = "/hr_staff_leave")}
            />
            <QuickAction
              title="Manage Deductions"
              description="Review deduction requests"
              icon={CheckSquare}
              color="bg-purple-500"
              onClick={() =>
                (window.location.href = "/hr_deduction_management")
              }
            />
            <QuickAction
              title="View Employees"
              description="Access employee records"
              icon={Users}
              color="bg-blue-500"
              onClick={() => (window.location.href = "/hr_employee_records")}
            />
          </div>
        </div>

        {/* Upcoming Payrolls */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-indigo-600" />
            Upcoming Payrolls
          </h2>
          <div className="space-y-2">
            {dashboardData.upcomingPayrolls.map((payroll) => (
              <UpcomingPayroll key={payroll.id} payroll={payroll} />
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
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
