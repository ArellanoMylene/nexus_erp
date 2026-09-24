import { useState, useEffect } from "react";
import { FileText, Search, ChevronLeft, ChevronRight, BarChart3, Trash2, AlertCircle, Activity, Database, Shield, Download } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7"); // days
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const logTypes = [
    { value: "all", label: "All Types", icon: FileText },
    { value: "info", label: "Info", icon: Activity },
    { value: "warning", label: "Warning", icon: AlertCircle },
    { value: "error", label: "Error", icon: AlertCircle },
    { value: "security", label: "Security", icon: Shield },
    { value: "audit", label: "Audit", icon: FileText },
    { value: "database", label: "Database", icon: Database },
    { value: "api", label: "API", icon: Activity },
    { value: "user_activity", label: "User Activity", icon: Activity },
  ];

  useEffect(() => {
    fetchLogs();
    fetchStatistics();
  }, [logTypeFilter, dateFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: 100,
        offset: 0,
      });
      
      if (logTypeFilter !== "all") {
        params.append("log_type", logTypeFilter);
      }

      const response = await fetch(`${API_BASE}/api/system-settings/logs?${params}`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/system-settings/logs/statistics?days=${dateFilter}`);
      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleCleanup = async () => {
    const days = prompt("Delete logs older than how many days? (default: 90)", "90");
    if (!days) return;

    if (!window.confirm(`Are you sure you want to delete logs older than ${days} days? This cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/system-settings/logs/cleanup?days=${days}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully deleted ${data.deleted_count} log entries`);
        fetchLogs();
        fetchStatistics();
      }
    } catch (error) {
      console.error("Error cleaning up logs:", error);
      alert("Failed to cleanup logs");
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Date/Time", "Type", "Message", "User", "IP Address", "Module"].join(","),
      ...filteredData.map((log) =>
        [
          new Date(log.created_at).toLocaleString(),
          log.log_type,
          `"${log.message.replace(/"/g, '""')}"`,
          log.username || "System",
          log.ip_address || "N/A",
          log.module || "N/A",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredData = logs.filter((item) => {
    const matchesSearch =
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.username && item.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.module && item.module.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const getLogTypeColor = (type) => {
    switch (type) {
      case "error":
        return "bg-red-100 text-red-800  ";
      case "warning":
        return "bg-yellow-100 text-yellow-800  ";
      case "security":
        return "bg-purple-100 text-purple-800  ";
      case "audit":
        return "bg-blue-100 text-blue-800  ";
      case "info":
        return "bg-green-100 text-green-800  ";
      default:
        return "bg-slate-100 text-slate-800  ";
    }
  };

  return (
    <div className="min-h-screen  p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10  rounded-lg">
            <FileText className="h-6 w-6 text-orange-600 " />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 ">System Logs</h1>
            <p className="text-sm text-slate-600 ">Monitor system activity and errors</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Logs
          </button>
          <button
            onClick={handleCleanup}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Cleanup Old Logs
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white  p-4 rounded-lg shadow-sm border border-slate-200 ">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 ">Total Logs</p>
              <p className="text-2xl font-bold text-slate-800  mt-1">{logs.length}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-600 " />
          </div>
        </div>
        {statistics &&
          ["info", "warning", "error", "security"].map((type) => {
            const stat = statistics.find((s) => s.log_type === type);
            const Icon = logTypes.find((t) => t.value === type)?.icon || FileText;
            const colors = {
              info: "text-green-600",
              warning: "text-yellow-600",
              error: "text-red-600",
              security: "text-purple-600",
            };
            return (
              <div
                key={type}
                className="bg-white  p-4 rounded-lg shadow-sm border border-slate-200 "
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600  capitalize">{type}</p>
                    <p className="text-2xl font-bold text-slate-800  mt-1">
                      {stat?.count || 0}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${colors[type]}`} />
                </div>
              </div>
            );
          })}
      </div>

      {/* Filters */}
      <div className="bg-white  rounded-lg shadow-sm border border-slate-200  mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300  rounded-lg focus:ring-2 focus:ring-orange-500  "
              />
            </div>
            <select
              value={logTypeFilter}
              onChange={(e) => {
                setLogTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-slate-300  rounded-lg focus:ring-2 focus:ring-orange-500  "
            >
              {logTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-slate-300  rounded-lg focus:ring-2 focus:ring-orange-500  "
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white  rounded-lg shadow-sm border border-slate-200  overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <p className="text-slate-600  mt-2">Loading logs...</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 ">
              <thead className="bg-slate-100 ">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700  uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700  uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700  uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700  uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700  uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700  uppercase tracking-wider">
                    Module
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white  divide-y divide-slate-200 ">
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500 ">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  currentData.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-50 ">
                      <td className="px-6 py-2 text-sm text-slate-600  whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-2 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLogTypeColor(log.log_type)}`}>
                          {log.log_type}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-sm text-slate-900  max-w-md truncate">
                        {log.message}
                      </td>
                      <td className="px-6 py-2 text-sm text-slate-600 ">
                        {log.username || "System"}
                      </td>
                      <td className="px-6 py-2 text-sm text-slate-600 ">
                        {log.ip_address || "N/A"}
                      </td>
                      <td className="px-6 py-2 text-sm text-slate-600 ">
                        {log.module || "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 ">
        <div>
          Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-slate-300  rounded hover:bg-slate-50  disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-slate-300  rounded hover:bg-slate-50  disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
