import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  LayoutDashboard,
  Book,
  ClipboardList,
  BookOpen,
  FileText,
  Mail,
} from "lucide-react";

dayjs.extend(relativeTime);

// ---------- Helper Components ----------

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

const RecentActivity = ({ activities, loading }) => (
  <div className="bg-white p-4 rounded-xl shadow border border-gray-100 h-full">
    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center space-x-2">
      <LayoutDashboard className="w-5 h-5 text-indigo-500" />
      <span>Recent Staff Activity</span>
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

const UpcomingCalendar = () => {
  const today = dayjs();
  const startOfMonth = today.startOf("month");
  const endOfMonth = today.endOf("month");
  const daysInMonth = endOfMonth.date();
  const firstDayIndex = startOfMonth.day();

  const events = {
    [today.date()]: "Current Day",
    12: "Inventory Check",
    20: "Library Audit",
  };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white p-4 rounded-xl shadow border border-gray-100 h-full">
      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center space-x-2">
        <ClipboardList className="w-5 h-5 text-indigo-500" />
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

export default function StaffDashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    inventoryItems: 0,
    borrowRequests: 0,
    maintenanceRequests: 0,
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
      const [booksRes, inventoryRes, borrowRes, maintenanceRes] =
        await Promise.all([
          axios.get(`${API_BASE}/api/library/books`),
          axios.get(`${API_BASE}/api/inventory/assets`),
          axios.get(`${API_BASE}/api/library/transactions`),
          axios.get(`${API_BASE}/api/inventory/maintenance`),
        ]);
      const books = booksRes.data || [];
      const inventory = inventoryRes.data || [];
      const borrowRequests =
        borrowRes.data?.filter((t) => t.type === "borrow") || [];
      const maintenanceRequests = maintenanceRes.data?.data || [];
      setStats({
        totalBooks: books.length,
        inventoryItems: inventory.length,
        borrowRequests: borrowRequests.length,
        maintenanceRequests: maintenanceRequests.length,
      });
      // Generate recent activity
      const activities = [];
      borrowRequests.slice(0, 2).forEach((req) => {
        activities.push({
          type: "Borrow Request",
          detail: `${req.user_name} borrowed ${req.book_title}`,
          time: dayjs(req.created_at).fromNow(),
          color: "border-green-500",
          icon: BookOpen,
        });
      });
      maintenanceRequests.slice(0, 2).forEach((req) => {
        activities.push({
          type: "Maintenance Request",
          detail: `${req.asset_name} - ${req.status}`,
          time: dayjs(req.created_at).fromNow(),
          color: "border-yellow-500",
          icon: ClipboardList,
        });
      });
      setRecentActivity(activities.slice(0, 4));
      setLoading(false);
    } catch (err) {
      console.error("Error fetching staff dashboard data:", err);
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: "Total Books",
      value: loading ? "..." : stats.totalBooks.toLocaleString(),
      icon: Book,
      color: "bg-indigo-600",
      detail: "Books in catalog",
    },
    /*  {
      title: "Inventory Items",
      value: loading ? "..." : stats.inventoryItems.toString(),
      icon: ClipboardList,
      color: "bg-green-600",
      detail: "Assets managed",
    }, */
    {
      title: "Borrow Requests",
      value: loading ? "..." : stats.borrowRequests.toString(),
      icon: BookOpen,
      color: "bg-yellow-600",
      detail: "Pending borrowings",
    },
    {
      title: "Maintenance Requests",
      value: loading ? "..." : stats.maintenanceRequests.toString(),
      icon: FileText,
      color: "bg-red-600",
      detail: "Open maintenance tickets",
    },
  ];

  return (
    <div className="h-[80vh] font-sans text-gray-800">
      <main className="p-4">
        <div className="space-y-4">
          {/* Dashboard Header */}
          <div className="border-b-4 border-indigo-600 pb-4">
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-8 h-8 text-indigo-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return "Good Morning, Staff";
                  else if (hour < 18) return "Good Afternoon, Staff";
                  else return "Good Evening, Staff";
                })()}
              </h2>
            </div>
            <p className="mt-1 text-gray-500 text-base">
              Staff dashboard for library and inventory operations.
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
    </div>
  );
}
