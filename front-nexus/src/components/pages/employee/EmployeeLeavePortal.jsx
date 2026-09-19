import { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Generic Confirm Modal (same pattern as AcademicCalendar.jsx) ---
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  confirmLabel = "Yes",
  tone = "danger",
}) => {
  if (!isOpen) return null;

  const confirmClasses =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-green-600 hover:bg-green-700";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-gray-900 dark:text-white text-center mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-700 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const EmployeeLeavePortal = () => {
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    leave_type: "",
    status: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const leaveTypes = [
    "Sick Leave",
    "Vacation Leave",
    "Emergency Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Bereavement Leave",
    "Other",
  ];

  const statuses = ["Pending", "Approved", "Rejected"];

  // Turn a raw axios error into a short, human-readable message
  const getErrorMessage = (err, fallback) => {
    const serverMessage =
      err.response?.data?.message || err.response?.data?.error;
    if (serverMessage) return serverMessage;
    if (err.response?.status === 400)
      return "Some fields are missing or invalid. Please check the form and try again.";
    if (err.response?.status === 404)
      return "This leave request no longer exists. It may have already been deleted.";
    if (err.response?.status === 409)
      return "A conflicting leave request already exists.";
    if (err.response?.status === 500)
      return "Something went wrong on the server. Please try again later.";
    if (!err.response)
      return "Can't reach the server. Check your connection and try again.";
    return fallback;
  };

  // Get current user and fetch their employee ID
  useEffect(() => {
    const userData = localStorage.getItem("user");
    // Try multiple keys for userId
    const userId =
      localStorage.getItem("userId") ||
      localStorage.getItem("user_id") ||
      (userData ? JSON.parse(userData)?.user_id : null);

    if (userData && userId) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      console.log("📋 Fetching employee records for userId:", userId);
      fetchEmployeeId(userId);
    } else {
      console.warn("⚠️ No user data found in localStorage");
      setLoading(false);
    }
  }, []);

  const fetchEmployeeId = async (userId) => {
    try {
      const response = await api.get(`/api/employees/by-user/${userId}`);
      console.log("✅ Employee records response:", response.data);
      if (response.data && response.data.data && response.data.data[0]) {
        const empId = response.data.data[0].employee_id;
        console.log("👤 Set employeeId to:", empId);
        setEmployeeId(empId);
      } else {
        console.warn("❌ No employee record found for userId:", userId);
      }
    } catch (error) {
      console.error("❌ Error fetching employee ID:", error);
      toast.error(getErrorMessage(error, "Failed to load employee record."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchLeaves();
      // Calculate summary locally from leaves instead
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, employeeId]);

  const fetchLeaves = async () => {
    try {
      const params = {
        ...filters,
        employee_id: employeeId,
      };
      console.log("🔄 Fetching leaves with params:", params);
      const response = await api.get(`/api/staff-leave`, { params });
      console.log("✅ Leaves fetched:", response.data.data?.length, "records");
      setLeaves(response.data.data || []);
    } catch (error) {
      console.error("❌ Error fetching leaves:", error);
      toast.error(getErrorMessage(error, "Failed to load leave requests."));
    }
  };

  // Calculate summary locally from leaves array instead of calling API
  useEffect(() => {
    if (leaves && leaves.length > 0) {
      const calculatedSummary = {
        total_requests: leaves.length,
        pending_requests: leaves.filter((l) => l.status === "Pending").length,
        approved_requests: leaves.filter((l) => l.status === "Approved").length,
        rejected_requests: leaves.filter((l) => l.status === "Rejected").length,
      };
      console.log("📊 Calculated summary:", calculatedSummary);
      setSummary(calculatedSummary);
    } else {
      setSummary({
        total_requests: 0,
        pending_requests: 0,
        approved_requests: 0,
        rejected_requests: 0,
      });
    }
  }, [leaves]);

  const [formData, setFormData] = useState({
    leave_id: null,
    leave_type: "Sick Leave",
    start_date: "",
    end_date: "",
    reason: "",
    status: "Pending",
    notes: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        user_id: currentUser?.user_id,
        status: "Pending", // Always set pending for new/edited requests
      };

      console.log("📝 Submitting leave request:", submitData);

      if (formData.leave_id) {
        console.log("✏️ Updating leave ID:", formData.leave_id);
        await api.put(`/api/staff-leave/${formData.leave_id}`, submitData);
      } else {
        console.log("➕ Creating new leave request");
        await api.post(`/api/staff-leave`, submitData);
      }

      console.log("✅ Leave request saved successfully");
      setShowModal(false);
      resetForm();

      // Refetch leaves to update the table and summary
      console.log("🔄 Refetching leaves after submission");
      await fetchLeaves();

      toast.success("Leave request submitted successfully!");
    } catch (error) {
      console.error("❌ Error saving leave:", error);
      toast.error(getErrorMessage(error, "Failed to save leave request."));
    }
  };

  const handleEdit = (leave) => {
    setFormData(leave);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteTargetId(id);
  };

  const cancelDelete = () => {
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    if (!id) return;
    try {
      console.log("🗑️ Deleting leave ID:", id);
      await api.delete(`/api/staff-leave/${id}`);
      console.log("✅ Leave deleted successfully");

      // Refetch leaves to update the table
      console.log("🔄 Refetching leaves after deletion");
      await fetchLeaves();

      toast.success("Leave request deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting leave:", error);
      toast.error(getErrorMessage(error, "Failed to delete leave request."));
    } finally {
      setDeleteTargetId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      leave_id: null,
      leave_type: "Sick Leave",
      start_date: "",
      end_date: "",
      reason: "",
      status: "Pending",
      notes: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <ToastContainer position="top-right" />

      <div className="w-full max-w-8xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar size={24} className="text-indigo-600" />
            My Leave Requests
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm p-4 border-l-4 border-indigo-500 dark:border-indigo-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Total Requests
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {leaves.length}
                </p>
              </div>
              <Calendar
                className="text-indigo-600 dark:text-indigo-400"
                size={28}
              />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm p-4 border-l-4 border-yellow-500 dark:border-yellow-600">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {leaves.filter((l) => l.status === "Pending").length}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm p-4 border-l-4 border-green-500 dark:border-green-600">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Approved
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {leaves.filter((l) => l.status === "Approved").length}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm p-4 border-l-4 border-red-500 dark:border-red-600">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Rejected
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {leaves.filter((l) => l.status === "Rejected").length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search leave type..."
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
              value={filters.leave_type}
              onChange={(e) =>
                setFilters({ ...filters, leave_type: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="">All Leave Types</option>
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-32"
            >
              <option value="">All Status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              Add Leave Request
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">Leave Type</th>
                <th className="px-4 py-2.5">Start Date</th>
                <th className="px-4 py-2.5">End Date</th>
                <th className="px-4 py-2.5">Total Days</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 w-1/12 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {leaves.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage,
              ).length ? (
                leaves
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage,
                  )
                  .map((leave) => (
                    <tr
                      key={leave.leave_id}
                      className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                    >
                      <td className="px-4 py-2">{leave.leave_type}</td>
                      <td className="px-4 py-2">
                        {new Date(leave.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(leave.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 font-semibold">
                        {leave.total_days}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            leave.status === "Approved"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : leave.status === "Rejected"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        {leave.status === "Pending" && (
                          <>
                            <button
                              onClick={() => handleEdit(leave)}
                              title="Edit"
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(leave.leave_id)}
                              title="Delete"
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-center text-slate-500 italic"
                  >
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
          <span className="text-xs sm:text-sm">
            Page <span className="font-semibold">{currentPage}</span> of{" "}
            <span className="font-semibold">
              {Math.ceil(leaves.length / itemsPerPage) || 1}
            </span>{" "}
            | Total Records: {leaves.length}
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
                setCurrentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(leaves.length / itemsPerPage)),
                )
              }
              disabled={
                currentPage === Math.ceil(leaves.length / itemsPerPage) ||
                leaves.length === 0
              }
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
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {formData.leave_id ? "Edit" : "Add"} Leave Request
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Leave Type *
                  </label>
                  <select
                    name="leave_type"
                    value={formData.leave_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    {leaveTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reason *
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30"
                >
                  Save Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message={
          <>
            Are you sure you want to delete this leave request?{" "}
            <span className="text-red-400">This action cannot be undone!</span>
          </>
        }
        confirmLabel="Yes"
        tone="danger"
      />
    </div>
  );
};

export default EmployeeLeavePortal;