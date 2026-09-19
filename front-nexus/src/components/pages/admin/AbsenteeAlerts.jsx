import { useState, useEffect } from "react";
import { Bell, AlertTriangle, CheckCircle, XCircle, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const AbsenteeAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (userTypeFilter !== "all") params.append("user_type", userTypeFilter);

      const response = await fetch(
        `${API_BASE}/api/absentee-alerts?${params}`
      );
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error("Error fetching absentee alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/absentee-alerts/${alertId}/acknowledge`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            acknowledged_by: 1, // Replace with actual admin ID
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error acknowledging alert:", error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return colors[priority] || colors.low;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      acknowledged: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      dismissed: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
    };
    return colors[status] || colors.pending;
  };

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case "consecutive_absence":
        return <AlertTriangle className="text-red-500 dark:text-red-400" size={16} />;
      case "excessive_absence":
        return <XCircle className="text-orange-500 dark:text-orange-400" size={16} />;
      default:
        return <Bell className="text-slate-500 dark:text-slate-400" size={16} />;
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.alert_type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || alert.priority === priorityFilter;
    const matchesUserType = userTypeFilter === "all" || alert.user_type === userTypeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesUserType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAlerts = filteredAlerts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, userTypeFilter]);

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell size={24} className="text-indigo-600" />
            Absentee Alerts
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total Alerts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">156</p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                <Bell className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Pending</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">48</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Critical</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">12</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <XCircle className="text-red-600 dark:text-red-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Resolved</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">96</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm transition-all shadow-inner"
            />
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
          </div>

          {/* Filters - RIGHT */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="all">All Users</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
            </select>
            <button
              onClick={fetchAlerts}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium text-sm transition-colors"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">User Type</th>
                <th className="px-4 py-2.5">Alert Type</th>
                <th className="px-4 py-2.5">Absence Count</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Alert Date</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {currentAlerts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No alerts found
                  </td>
                </tr>
              ) : (
                currentAlerts.map((alert) => (
                  <tr
                    key={alert.alert_id}
                    className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                  >
                    <td className="px-4 py-2">{getAlertTypeIcon(alert.alert_type)}</td>
                    <td className="px-4 py-2 font-semibold">{alert.user_name}</td>
                    <td className="px-4 py-2 capitalize">{alert.user_type}</td>
                    <td className="px-4 py-2 capitalize">
                      {alert.alert_type.replace("_", " ")}
                    </td>
                    <td className="px-4 py-2">{alert.absence_count}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(alert.priority)}`}>
                        {alert.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(alert.alert_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {alert.status === "pending" && (
                          <button
                            onClick={() => handleAcknowledge(alert.alert_id)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium transition-colors px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          title="View Details"
                          className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Eye size={14} />
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
        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
          <span className="text-xs sm:text-sm">
            Page <span className="font-semibold">{currentPage}</span> of{" "}
            <span className="font-semibold">{totalPages || 1}</span> | Total Records:{" "}
            {filteredAlerts.length}
          </span>
          <div className="flex gap-1 items-center mt-2 sm:mt-0">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsenteeAlerts;
