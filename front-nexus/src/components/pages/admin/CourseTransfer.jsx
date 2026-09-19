import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  FileText,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const StatusBadge = ({ status }) => {
  const colors = {
    Pending: "bg-yellow-100 text-yellow-800",
    "Under Review": "bg-blue-100 text-blue-800",
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        colors[status] || colors.Pending
      }`}
    >
      {status}
    </span>
  );
};

const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
  <div className="flex justify-between items-center mt-4 text-sm text-slate-700">
    <span>
      Page {currentPage} of {totalPages} | Total: {totalItems}
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="p-1.5 rounded-md border disabled:opacity-50 hover:bg-slate-100"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="px-2 py-1">{currentPage}</span>
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-md border disabled:opacity-50 hover:bg-slate-100"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

const TransferModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  students,
}) => {
  const [formData, setFormData] = useState({
    student_id: null,
    current_program: "",
    target_program: "",
    reason: "",
    request_date: new Date().toISOString().split("T")[0],
    status: "Pending",
  });

  useEffect(() => {
    if (initialData) {
      // Ensure request_date is formatted as yyyy-MM-dd for input type="date"
      let formattedDate = "";
      if (initialData.request_date) {
        // Handles both ISO and other date formats
        const d = new Date(initialData.request_date);
        if (!isNaN(d)) {
          formattedDate = d.toISOString().split("T")[0];
        } else {
          // fallback: use as is
          formattedDate = initialData.request_date;
        }
      } else {
        formattedDate = new Date().toISOString().split("T")[0];
      }
      setFormData({
        student_id: initialData.student_id,
        current_program: initialData.current_program || "",
        target_program: initialData.target_program || "",
        reason: initialData.reason || "",
        request_date: formattedDate,
        status: initialData.status || "Pending",
        transfer_id: initialData.transfer_id,
      });
    } else {
      setFormData({
        student_id: null,
        current_program: "",
        target_program: "",
        reason: "",
        request_date: new Date().toISOString().split("T")[0],
        status: "Pending",
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">
              {mode === "add"
                ? "New Transfer Request"
                : "Edit Transfer Request"}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Plus size={24} className="rotate-45" />
            </button>
          </div>
        </div>

        {/* Form Wrapper */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Student */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Student *
              </label>
              <Select
                value={
                  students.find((s) => s.value === formData.student_id) || null
                }
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    student_id: selected?.value || null,
                  }))
                }
                options={students}
                placeholder="Select student..."
                isDisabled={mode === "edit"}
                required
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    boxShadow: "none",
                    minHeight: "42px",
                    "&:hover": {
                      borderColor: "#CBD5E1",
                    },
                    "&:focus-within": {
                      borderColor: "#4F46E5",
                      boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)",
                    },
                  }),
                  input: (base) => ({
                    ...base,
                    color: "#1E293B",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? "#4F46E5" : "#FFFFFF",
                    color: state.isSelected ? "#FFFFFF" : "#1E293B",
                    "&:hover": {
                      backgroundColor: "#EEF2FF",
                      color: "#1E293B",
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Program */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Current Program
                </label>
                <input
                  type="text"
                  value={formData.current_program}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      current_program: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. BSIT"
                />
              </div>

              {/* Target Program */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Target Program *
                </label>
                <input
                  type="text"
                  value={formData.target_program}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      target_program: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. BSCS"
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Reason
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Enter reason for transfer..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Request Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Request Date *
                </label>
                <input
                  type="date"
                  value={formData.request_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      request_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-lg">
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                {mode === "add" ? "Create Request" : "Update Request"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const CourseTransfer = () => {
  const [transfers, setTransfers] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchTransfers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/course-transfers`);
      setTransfers(res.data);
    } catch (err) {
      console.error("Error fetching transfers:", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/users`);
      const studentList = (res.data || [])
        .filter((u) => u.role === "Student")
        .map((s) => ({
          value: s.user_id,
          label: `${s.first_name} ${s.last_name} (${
            s.student_number || s.email
          })`,
        }));
      setStudents(studentList);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = transfers.filter((t) => {
    const matchSearch =
      (t.student_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.current_program || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.target_program || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || t.status === filterStatus.value;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const handleSubmit = async (data) => {
    try {
      if (modalMode === "add") {
        await axios.post(`${API_BASE}/api/course-transfers`, data);
      } else {
        await axios.put(
          `${API_BASE}/api/course-transfers/${data.transfer_id}`,
          data,
        );
      }
      fetchTransfers();
      setModalOpen(false);
      setCurrentRecord(null);
    } catch (err) {
      console.error("Error saving transfer:", err);
      alert(err.response?.data?.message || "Failed to save transfer request");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transfer request?")) return;
    try {
      await axios.delete(`${API_BASE}/api/course-transfers/${id}`);
      fetchTransfers();
    } catch (err) {
      console.error("Error deleting transfer:", err);
    }
  };

  const openModal = (mode, record = null) => {
    setModalMode(mode);
    setCurrentRecord(record);
    setModalOpen(true);
  };

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Under Review", label: "Under Review" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
  ];

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText size={24} /> Course Transfer & Shifting
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage student course transfer and program shifting requests.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by student name or program..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select
            value={filterStatus}
            onChange={(selected) => {
              setFilterStatus(selected);
              setPage(1);
            }}
            options={statusOptions}
            placeholder="Status"
            isClearable
            className="w-40"
          />
          <button
            onClick={() => openModal("add")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus size={16} /> New Request
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full divide-y">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold">ID</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Student
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Current Program
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Target Program
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Request Date
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-3 py-2 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {displayed.length > 0 ? (
              displayed.map((transfer) => (
                <tr key={transfer.transfer_id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-sm">{transfer.transfer_id}</td>
                  <td className="px-3 py-2 text-sm">{transfer.student_name}</td>
                  <td className="px-3 py-2 text-sm">
                    {transfer.current_program || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {transfer.target_program}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {transfer.request_date
                      ? transfer.request_date.split("T")[0]
                      : ""}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <StatusBadge status={transfer.status} />
                  </td>
                  <td className="px-3 py-2 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openModal("edit", transfer)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(transfer.transfer_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-4 text-slate-500 italic"
                >
                  No transfer requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        setPage={setPage}
        totalItems={filtered.length}
      />

      <TransferModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCurrentRecord(null);
        }}
        onSubmit={handleSubmit}
        mode={modalMode}
        initialData={currentRecord}
        students={students}
      />
    </div>
  );
};

export default CourseTransfer;
