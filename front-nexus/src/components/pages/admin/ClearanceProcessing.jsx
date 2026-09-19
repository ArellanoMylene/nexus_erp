import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  CheckSquare,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";

const StatusBadge = ({ status }) => {
  const colors = {
    Incomplete: "bg-red-100 text-red-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Cleared: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        colors[status] || colors.Incomplete
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

const ClearanceModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  students,
  periods,
  existingClearances,
}) => {
  const [formData, setFormData] = useState({
    student_id: null,
    period_id: null,
    library_cleared: 0,
    registrar_cleared: 0,
    accounting_cleared: 0,
    dean_cleared: 0,
    guidance_cleared: 0,
    student_affairs_cleared: 0,
    library_remarks: "",
    registrar_remarks: "",
    accounting_remarks: "",
    dean_remarks: "",
    guidance_remarks: "",
    student_affairs_remarks: "",
    overall_status: "Incomplete",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        student_id: initialData.student_id,
        period_id: initialData.period_id,
        library_cleared: initialData.library_cleared || 0,
        registrar_cleared: initialData.registrar_cleared || 0,
        accounting_cleared: initialData.accounting_cleared || 0,
        dean_cleared: initialData.dean_cleared || 0,
        guidance_cleared: initialData.guidance_cleared || 0,
        student_affairs_cleared: initialData.student_affairs_cleared || 0,
        library_remarks: initialData.library_remarks || "",
        registrar_remarks: initialData.registrar_remarks || "",
        accounting_remarks: initialData.accounting_remarks || "",
        dean_remarks: initialData.dean_remarks || "",
        guidance_remarks: initialData.guidance_remarks || "",
        student_affairs_remarks: initialData.student_affairs_remarks || "",
        overall_status: initialData.overall_status || "Incomplete",
        clearance_id: initialData.clearance_id,
      });
    } else {
      setFormData({
        student_id: null,
        period_id: null,
        library_cleared: 0,
        registrar_cleared: 0,
        accounting_cleared: 0,
        dean_cleared: 0,
        guidance_cleared: 0,
        student_affairs_cleared: 0,
        library_remarks: "",
        registrar_remarks: "",
        accounting_remarks: "",
        dean_remarks: "",
        guidance_remarks: "",
        student_affairs_remarks: "",
        overall_status: "Incomplete",
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Automatically set cleared_date if status is Cleared and date is not set
    const submitData = { ...formData };
    if (submitData.overall_status === "Cleared" && !submitData.cleared_date) {
      submitData.cleared_date = new Date().toISOString().split("T")[0];
    }
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  // Filter out students who already have clearance for the selected period
  const getAvailableStudents = () => {
    if (!formData.period_id || mode === "edit" || mode === "view") {
      return students;
    }

    const studentsWithClearance = existingClearances
      .filter((c) => c.period_id === formData.period_id)
      .map((c) => c.student_id);

    return students.filter((s) => !studentsWithClearance.includes(s.value));
  };

  const availableStudents = getAvailableStudents();

  const departments = [
    { key: "library", label: "Library" },
    { key: "registrar", label: "Registrar" },
    { key: "accounting", label: "Accounting" },
    { key: "dean", label: "Dean" },
    { key: "guidance", label: "Guidance" },
    { key: "student_affairs", label: "Student Affairs" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">
              {mode === "add"
                ? "New Clearance"
                : mode === "edit"
                  ? "Edit Clearance"
                  : "View Clearance"}
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
            {/* Academic Period and Student */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Academic Period *
                </label>
                <Select
                  value={
                    periods.find((p) => p.value === formData.period_id) || null
                  }
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      period_id: selected?.value || null,
                      student_id: null, // Reset student when period changes
                    }))
                  }
                  options={periods}
                  placeholder="Select period..."
                  isDisabled={mode === "edit" || mode === "view"}
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

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Student *
                </label>
                <Select
                  value={
                    availableStudents.find(
                      (s) => s.value === formData.student_id,
                    ) || null
                  }
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      student_id: selected?.value || null,
                    }))
                  }
                  options={availableStudents}
                  placeholder={
                    !formData.period_id
                      ? "Select period first..."
                      : availableStudents.length === 0
                        ? "No available students"
                        : "Select student..."
                  }
                  isDisabled={
                    mode === "edit" || mode === "view" || !formData.period_id
                  }
                  required
                  noOptionsMessage={() =>
                    !formData.period_id
                      ? "Please select a period first"
                      : "All students have clearance records for this period"
                  }
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
            </div>

            {/* Department Clearances */}
            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-semibold mb-3 text-slate-800">
                Department Clearances
              </h4>
              <div className="space-y-3">
                {departments.map((dept) => (
                  <div
                    key={dept.key}
                    className="border border-slate-300 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-slate-800">
                        {dept.label}
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData[`${dept.key}_cleared`] === 1}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [`${dept.key}_cleared`]: e.target.checked ? 1 : 0,
                            }))
                          }
                          className="w-4 h-4 text-indigo-600 rounded"
                          disabled={mode === "view"}
                        />
                        <span className="text-sm text-slate-700">Cleared</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="Remarks..."
                      value={formData[`${dept.key}_remarks`]}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [`${dept.key}_remarks`]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={mode === "view"}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Status and Cleared Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Overall Status
                </label>
                <select
                  value={formData.overall_status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      overall_status: newStatus,
                      cleared_date:
                        newStatus === "Cleared" && !prev.cleared_date
                          ? new Date().toISOString().split("T")[0]
                          : prev.cleared_date,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                >
                  <option value="Incomplete">Incomplete</option>
                  <option value="Pending">Pending</option>
                  <option value="Cleared">Cleared</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Cleared Date {formData.overall_status === "Cleared" && "*"}
                </label>
                <input
                  type="date"
                  value={formData.cleared_date || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cleared_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={
                    mode === "view" || formData.overall_status !== "Cleared"
                  }
                  required={formData.overall_status === "Cleared"}
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          {mode !== "view" && (
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
                  {mode === "add" ? "Create Clearance" : "Update Clearance"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const printReceipt = (clearance) => {
  const printWindow = window.open("", "_blank");
  const departments = [
    { key: "library", label: "Library" },
    { key: "registrar", label: "Registrar" },
    { key: "accounting", label: "Accounting" },
    { key: "dean", label: "Dean" },
    { key: "guidance", label: "Guidance" },
    { key: "student_affairs", label: "Student Affairs" },
  ];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Clearance Receipt - ${clearance.student_name}</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }
        .header h2 {
          margin: 5px 0;
          font-size: 18px;
          color: #666;
        }
        .receipt-info {
          margin: 20px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px;
          background: #f5f5f5;
        }
        .info-label {
          font-weight: bold;
          color: #555;
        }
        .clearance-section {
          margin: 30px 0;
        }
        .clearance-section h3 {
          background: #333;
          color: white;
          padding: 10px;
          margin: 0 0 15px 0;
        }
        .dept-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          border: 1px solid #ddd;
          margin-bottom: 10px;
        }
        .dept-name {
          font-weight: bold;
        }
        .status-cleared {
          color: #059669;
          font-weight: bold;
        }
        .status-pending {
          color: #dc2626;
          font-weight: bold;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          border-top: 2px solid #333;
          padding-top: 20px;
        }
        .signature {
          margin-top: 50px;
          text-align: right;
        }
        .signature-line {
          border-top: 1px solid #333;
          width: 250px;
          margin: 40px 0 5px auto;
        }
        .print-btn {
          background: #4f46e5;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin: 20px 0;
        }
        .print-btn:hover {
          background: #4338ca;
        }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">🖨️ Print Receipt</button>
      
      <div class="header">
        <h1>STUDENT CLEARANCE CERTIFICATE</h1>
        <h2>Academic Year ${clearance.school_year || "N/A"} - ${
          clearance.semester || "N/A"
        }</h2>
      </div>

      <div class="receipt-info">
        <div class="info-row">
          <span class="info-label">Student Name:</span>
          <span>${clearance.student_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Student Number:</span>
          <span>${clearance.student_number || "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Clearance ID:</span>
          <span>${clearance.clearance_id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Overall Status:</span>
          <span style="color: #059669; font-weight: bold;">${
            clearance.overall_status
          }</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date Cleared:</span>
          <span>${
            clearance.cleared_date || new Date().toLocaleDateString()
          }</span>
        </div>
      </div>

      <div class="clearance-section">
        <h3>Department Clearances</h3>
        ${departments
          .map(
            (dept) => `
          <div class="dept-item">
            <span class="dept-name">${dept.label}</span>
            <span class="${
              clearance[`${dept.key}_cleared`] === 1
                ? "status-cleared"
                : "status-pending"
            }">
              ${
                clearance[`${dept.key}_cleared`] === 1
                  ? "✓ CLEARED"
                  : "✗ PENDING"
              }
            </span>
          </div>
          ${
            clearance[`${dept.key}_remarks`]
              ? `<div style="padding: 0 12px 10px 12px; color: #666; font-size: 14px;">Remarks: ${
                  clearance[`${dept.key}_remarks`]
                }</div>`
              : ""
          }
        `,
          )
          .join("")}
      </div>

      <div class="footer">
        <p><em>This certifies that the above-named student has completed all clearance requirements for the specified academic period.</em></p>
        
        <div class="signature">
          <div class="signature-line"></div>
          <p style="margin: 0;">Authorized Signatory</p>
          <p style="margin: 0; color: #666; font-size: 12px;">Registrar's Office</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
        Generated on ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

const ClearanceProcessing = () => {
  const [clearances, setClearances] = useState([]);
  const [students, setStudents] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchClearances = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/clearances`);
      console.log("Clearances API response:", res.data);
      setClearances(res.data);
    } catch (err) {
      console.error("Error fetching clearances:", err);
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

  const fetchPeriods = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/academic-periods`);
      const periodList = (res.data || [])
        .filter((p) => p && (p.id || p.period_id))
        .map((p) => ({
          value: p.id || p.period_id,
          label: `${p.school_year || "N/A"} - ${p.semester || "N/A"}`,
        }));
      setPeriods(periodList);
    } catch (err) {
      console.error("Error fetching periods:", err);
      setPeriods([]);
    }
  };

  useEffect(() => {
    fetchClearances();
    fetchStudents();
    fetchPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = clearances.filter((c) => {
    const matchSearch = (c.student_name || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus =
      !filterStatus || c.overall_status === filterStatus.value;
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
        await axios.post(`${API_BASE}/api/clearances`, data);
      } else {
        await axios.put(
          `${API_BASE}/api/clearances/${data.clearance_id}`,
          data,
        );
      }
      fetchClearances();
      setModalOpen(false);
      setCurrentRecord(null);
    } catch (err) {
      console.error("Error saving clearance:", err);
      alert(err.response?.data?.message || "Failed to save clearance");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this clearance record?")) return;
    try {
      await axios.delete(`${API_BASE}/api/clearances/${id}`);
      fetchClearances();
    } catch (err) {
      console.error("Error deleting clearance:", err);
    }
  };

  const openModal = (mode, record = null) => {
    setModalMode(mode);
    setCurrentRecord(record);
    setModalOpen(true);
  };

  const statusOptions = [
    { value: "Incomplete", label: "Incomplete" },
    { value: "Pending", label: "Pending" },
    { value: "Cleared", label: "Cleared" },
  ];

  const getClearedCount = (clearance) => {
    const cleared = [
      clearance.library_cleared,
      clearance.registrar_cleared,
      clearance.accounting_cleared,
      clearance.dean_cleared,
      clearance.guidance_cleared,
      clearance.student_affairs_cleared,
    ].filter((v) => v === 1).length;
    return `${cleared}/6`;
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckSquare size={24} /> Clearance Processing
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage student clearance requirements across departments.
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
              placeholder="Search by student name..."
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
            <Plus size={16} /> New Clearance
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
                Period
              </th>
              <th className="px-3 py-2 text-center text-sm font-semibold">
                Cleared Depts
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Overall Status
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Cleared Date
              </th>
              <th className="px-3 py-2 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {displayed.length > 0 ? (
              displayed.map((clearance) => (
                <tr key={clearance.clearance_id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-sm">
                    {clearance.clearance_id}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {clearance.student_name}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {clearance.school_year && clearance.semester
                      ? `${clearance.school_year} - ${clearance.semester}`
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm text-center font-mono">
                    {getClearedCount(clearance)}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <StatusBadge status={clearance.overall_status} />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {clearance.cleared_date || "-"}
                  </td>
                  <td className="px-3 py-2 text-right flex justify-end gap-2">
                    {clearance.overall_status === "Cleared" && (
                      <button
                        onClick={() => printReceipt(clearance)}
                        className="text-green-600 hover:text-green-800"
                        title="Print Receipt"
                      >
                        <Printer size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => openModal("view", clearance)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openModal("edit", clearance)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(clearance.clearance_id)}
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
                  No clearance records found.
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

      <ClearanceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCurrentRecord(null);
        }}
        onSubmit={handleSubmit}
        mode={modalMode}
        initialData={currentRecord}
        students={students}
        periods={periods}
        existingClearances={clearances}
      />
    </div>
  );
};

export default ClearanceProcessing;
