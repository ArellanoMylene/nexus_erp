import { useState, useEffect } from "react";
import {
  CalendarCheck,
  Clock,
  Users,
  Download,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const StaffAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    staff_id: "",
    staff_name: "",
    employee_id: "",
    department: "",
    attendance_date: new Date().toISOString().split("T")[0],
    time_in: "",
    time_out: "",
    status: "present",
    attendance_method: "manual",
    notes: "",
  });

  useEffect(() => {
    fetchAttendanceRecords();
    fetchStaffMembers();
  }, []);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(
        `${API_BASE}/api/staff-attendance?${params}`,
      );
      const data = await response.json();
      if (data.success) {
        setAttendanceRecords(data.data);
      }
    } catch (error) {
      console.error("Error fetching staff attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`);
      const users = await response.json();
      // Filter for staff, faculty, admin, HR, accounting roles
      const staff = users.filter((user) =>
        ["Staff", "Faculty", "Admin", "HR", "Accounting"].includes(user.role),
      );
      setStaffMembers(staff);
    } catch (error) {
      console.error("Error fetching staff members:", error);
    }
  };

  const handleStaffSelect = (e) => {
    const selectedStaff = staffMembers.find(
      (staff) => staff.user_id === parseInt(e.target.value),
    );
    if (selectedStaff) {
      setFormData({
        ...formData,
        staff_id: selectedStaff.user_id,
        staff_name: `${selectedStaff.first_name} ${selectedStaff.last_name}`,
        employee_id: selectedStaff.employee_id || "",
        department: selectedStaff.department || "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data with correct field names for backend
      const submitData = {
        user_id: formData.staff_id, // Backend expects user_id
        attendance_date: formData.attendance_date,
        time_in: formData.time_in || null,
        time_out: formData.time_out || null,
        status: formData.status,
        attendance_method: formData.attendance_method,
        remarks: formData.notes || null,
      };

      console.log("Submitting attendance data:", submitData);

      const url = selectedRecord
        ? `${API_BASE}/api/staff-attendance/${selectedRecord.attendance_id}`
        : `${API_BASE}/api/staff-attendance`;
      const method = selectedRecord ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      console.log("Response:", data);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to save attendance",
        );
      }

      if (data.success || data.attendance_id) {
        alert("Attendance saved successfully!");
        fetchAttendanceRecords();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this attendance record?")
    ) {
      try {
        const response = await fetch(
          `${API_BASE}/api/staff-attendance/${id}`,
          {
            method: "DELETE",
          },
        );
        if (response.ok) {
          fetchAttendanceRecords();
        }
      } catch (error) {
        console.error("Error deleting attendance:", error);
      }
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      staff_id: record.staff_id || "",
      staff_name: record.staff_name || "",
      employee_id: record.employee_id || "",
      department: record.department || "",
      attendance_date: record.attendance_date?.split("T")[0] || "",
      time_in: record.time_in || "",
      time_out: record.time_out || "",
      status: record.status || "present",
      attendance_method: record.attendance_method || "manual",
      notes: record.notes || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
    setFormData({
      staff_id: "",
      staff_name: "",
      employee_id: "",
      department: "",
      attendance_date: new Date().toISOString().split("T")[0],
      time_in: "",
      time_out: "",
      status: "present",
      attendance_method: "manual",
      notes: "",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      present:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      late: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      "half-day":
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "on-leave":
        "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
    };
    return colors[status] || colors.present;
  };

  // Filter records
  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck size={24} className="text-indigo-600" />
            Staff Attendance Management
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
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Total Staff
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  128
                </p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                <Users
                  className="text-indigo-600 dark:text-indigo-400"
                  size={24}
                />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Present Today
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  115
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <CalendarCheck
                  className="text-green-600 dark:text-green-400"
                  size={24}
                />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Absent
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  8
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <CalendarCheck
                  className="text-red-600 dark:text-red-400"
                  size={24}
                />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  On Leave
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  5
                </p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-900/30 p-3 rounded-lg">
                <Clock
                  className="text-slate-600 dark:text-slate-400"
                  size={24}
                />
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
              placeholder="Search staff..."
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
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm"
              placeholder="From Date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm"
              placeholder="To Date"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half-day">Half Day</option>
              <option value="on-leave">On Leave</option>
            </select>
            <button
              onClick={fetchAttendanceRecords}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium text-sm transition-colors"
            >
              Filter
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              Mark Attendance
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">Staff Name</th>
                <th className="px-4 py-2.5">Employee ID</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Time In</th>
                <th className="px-4 py-2.5">Time Out</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Method</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {currentRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No attendance records found
                  </td>
                </tr>
              ) : (
                currentRecords.map((record) => (
                  <tr
                    key={record.attendance_id}
                    className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                  >
                    <td className="px-4 py-2 font-semibold">
                      {record.staff_name}
                    </td>
                    <td className="px-4 py-2">{record.employee_id}</td>
                    <td className="px-4 py-2">{record.department}</td>
                    <td className="px-4 py-2">
                      {new Date(record.attendance_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{record.time_in || "N/A"}</td>
                    <td className="px-4 py-2">{record.time_out || "N/A"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}
                      >
                        {record.status.replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2 capitalize text-xs">
                      {record.attendance_method}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(record)}
                          title="Edit"
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.attendance_id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Trash2 size={14} />
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
            <span className="font-semibold">{totalPages || 1}</span> | Total
            Records: {filteredRecords.length}
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
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                <CalendarCheck className="inline w-5 h-5 text-indigo-600 mr-2" />
                {selectedRecord ? "Edit" : "Mark"} Attendance
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 rounded-full p-1 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Staff Name *
                </label>
                <select
                  required
                  value={formData.staff_id}
                  onChange={handleStaffSelect}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Select Staff Member</option>
                  {staffMembers.map((staff) => (
                    <option key={staff.user_id} value={staff.user_id}>
                      {staff.first_name} {staff.last_name} - {staff.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm"
                    placeholder="Auto-filled"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm"
                    placeholder="Auto-filled"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.attendance_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attendance_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Time In
                  </label>
                  <input
                    type="time"
                    value={formData.time_in}
                    onChange={(e) =>
                      setFormData({ ...formData, time_in: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Time Out
                  </label>
                  <input
                    type="time"
                    value={formData.time_out}
                    onChange={(e) =>
                      setFormData({ ...formData, time_out: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half-day">Half Day</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Method *
                  </label>
                  <select
                    required
                    value={formData.attendance_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attendance_method: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="rfid">RFID</option>
                    <option value="biometric">Biometric</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  placeholder="Additional notes or remarks"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-sm shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-md transition-all text-sm shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40"
                >
                  {selectedRecord ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAttendance;
