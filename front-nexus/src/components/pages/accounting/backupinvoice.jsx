import { useState, useEffect } from "react";
import api from "../../../api/axios";
import { Plus, Edit, Trash2, Search, FileText, ChevronLeft, ChevronRight } from "lucide-react";

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({
    status: "",
    academic_period_id: "",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    invoice_id: null,
    student_id: "",
    academic_period_id: "",
    tuition_fee: 0,
    laboratory_fee: 0,
    library_fee: 0,
    athletic_fee: 0,
    registration_fee: 0,
    id_fee: 0,
    miscellaneous_fee: 0,
    other_fees: 0,
    discount_amount: 0,
    scholarship_amount: 0,
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchInvoices();
    fetchSummary();
    fetchPeriods();
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchStudents = async () => {
    try {
      const response = await api.get(`/api/users`);
      const allUsers = response.data.users || response.data.data || response.data || [];
      const studentList = allUsers.filter((u) => u.role === "Student");
      setStudents(studentList);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get(`/api/invoices`, { params: filters });
      setInvoices(response.data.data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get(`/api/invoices/summary`, {
        params: { academic_period_id: filters.academic_period_id },
      });
      setSummary(response.data.data || {});
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await api.get(`/api/academic-periods`);
      setPeriods(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching periods:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const calculateSubtotal = () => {
    return (
      parseFloat(formData.tuition_fee || 0) +
      parseFloat(formData.laboratory_fee || 0) +
      parseFloat(formData.library_fee || 0) +
      parseFloat(formData.athletic_fee || 0) +
      parseFloat(formData.registration_fee || 0) +
      parseFloat(formData.id_fee || 0) +
      parseFloat(formData.miscellaneous_fee || 0) +
      parseFloat(formData.other_fees || 0)
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return (
      subtotal -
      parseFloat(formData.discount_amount || 0) -
      parseFloat(formData.scholarship_amount || 0)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const invoiceData = {
        ...formData,
        subtotal: calculateSubtotal(),
        total_amount: calculateTotal(),
        status: "Pending",
      };

      if (formData.invoice_id) {
        await api.put(`/api/invoices/${formData.invoice_id}`, invoiceData);
      } else {
        await api.post(`/api/invoices`, invoiceData);
      }
      setShowModal(false);
      resetForm();
      fetchInvoices();
      fetchSummary();
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice");
    }
  };

  const handleEdit = (invoice) => {
    setFormData(invoice);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await api.delete(`/api/invoices/${id}`);
        fetchInvoices();
        fetchSummary();
      } catch (error) {
        console.error("Error deleting invoice:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_id: null,
      student_id: "",
      academic_period_id: "",
      tuition_fee: 0,
      laboratory_fee: 0,
      library_fee: 0,
      athletic_fee: 0,
      registration_fee: 0,
      id_fee: 0,
      miscellaneous_fee: 0,
      other_fees: 0,
      discount_amount: 0,
      scholarship_amount: 0,
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: "",
      notes: "",
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Invoice Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create and manage student invoices
            </p>
          </div>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Data Integrity: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Billed</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ₱{parseFloat(summary.total_billed || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ₱{parseFloat(summary.total_paid || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Outstanding Balance</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            ₱{parseFloat(summary.total_balance || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Invoices</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.total_invoices || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 flex gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search student, invoice..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
              <select
                value={filters.academic_period_id}
                onChange={(e) => {
                  setFilters({ ...filters, academic_period_id: e.target.value });
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Periods</option>
                {periods.map((period) => (
                  <option key={period.period_id} value={period.period_id}>
                    {period.school_year} - {period.semester}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30"
              >
                <Plus size={18} />
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Student
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Paid
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
            {(() => {
              const searchTerm = filters.search.toLowerCase();
              const filtered = invoices.filter((invoice) => {
                const matchesSearch =
                  invoice.invoice_number?.toLowerCase().includes(searchTerm) ||
                  invoice.student_name?.toLowerCase().includes(searchTerm) ||
                  invoice.student_number?.toLowerCase().includes(searchTerm);
                return matchesSearch;
              });

              const totalPages = Math.ceil(filtered.length / itemsPerPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

              if (paginatedData.length === 0) {
                return (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No invoices found matching your search criteria.
                    </td>
                  </tr>
                );
              }

              return paginatedData.map((invoice) => (
                <tr key={invoice.invoice_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-slate-900 dark:text-white">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-sm text-slate-900 dark:text-white">{invoice.student_name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {invoice.student_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                    {new Date(invoice.invoice_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-semibold text-sm text-slate-900 dark:text-white">
                    ₱{parseFloat(invoice.total_amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-emerald-600 dark:text-emerald-400">
                    ₱{parseFloat(invoice.amount_paid).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-semibold text-sm text-red-600 dark:text-red-400">
                    ₱{parseFloat(invoice.balance).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${invoice.status === "Paid"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : invoice.status === "Partially Paid"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : invoice.status === "Overdue"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.invoice_id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
        <span className="text-xs sm:text-sm">
          Page <span className="font-semibold">{currentPage}</span> of{" "}
          <span className="font-semibold">{(() => {
            const searchTerm = filters.search.toLowerCase();
            const filtered = invoices.filter((invoice) => {
              const matchesSearch =
                invoice.invoice_number?.toLowerCase().includes(searchTerm) ||
                invoice.student_name?.toLowerCase().includes(searchTerm) ||
                invoice.student_number?.toLowerCase().includes(searchTerm);
              return matchesSearch;
            });
            return Math.ceil(filtered.length / itemsPerPage) || 1;
          })()}</span> | Total Records:{" "}
          {(() => {
            const searchTerm = filters.search.toLowerCase();
            const filtered = invoices.filter((invoice) => {
              const matchesSearch =
                invoice.invoice_number?.toLowerCase().includes(searchTerm) ||
                invoice.student_name?.toLowerCase().includes(searchTerm) ||
                invoice.student_number?.toLowerCase().includes(searchTerm);
              return matchesSearch;
            });
            return filtered.length;
          })()}
        </span>
        <div className="flex gap-1 mt-2 sm:mt-0">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
          </button>
          {(() => {
            const searchTerm = filters.search.toLowerCase();
            const filtered = invoices.filter((invoice) => {
              const matchesSearch =
                invoice.invoice_number?.toLowerCase().includes(searchTerm) ||
                invoice.student_name?.toLowerCase().includes(searchTerm) ||
                invoice.student_number?.toLowerCase().includes(searchTerm);
              return matchesSearch;
            });
            const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

            return [...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${currentPage === i + 1
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
              >
                {i + 1}
              </button>
            ));
          })()}
          <button
            onClick={() => {
              const searchTerm = filters.search.toLowerCase();
              const filtered = invoices.filter((invoice) => {
                const matchesSearch =
                  invoice.invoice_number?.toLowerCase().includes(searchTerm) ||
                  invoice.student_name?.toLowerCase().includes(searchTerm) ||
                  invoice.student_number?.toLowerCase().includes(searchTerm);
                return matchesSearch;
              });
              const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
              setCurrentPage(Math.min(totalPages, currentPage + 1));
            }}
            disabled={(() => {
              const searchTerm = filters.search.toLowerCase();
              const filtered = invoices.filter((invoice) => {
                const matchesSearch =
                  invoice.invoice_number?.toLowerCase().includes(searchTerm) ||
                  invoice.student_name?.toLowerCase().includes(searchTerm) ||
                  invoice.student_number?.toLowerCase().includes(searchTerm);
                return matchesSearch;
              });
              const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
              return currentPage === totalPages;
            })()}
            className="p-1.5 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {formData.invoice_id ? "Edit" : "Create"} Invoice
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
                    Student *
                  </label>
                  <select
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.user_id} value={student.user_id}>
                        {student.student_number ? `${student.student_number} - ` : ""}{student.first_name} {student.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Academic Period *
                  </label>
                  <select
                    name="academic_period_id"
                    value={formData.academic_period_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Select Period</option>
                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.school_year} - {period.semester}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    name="invoice_date"
                    value={formData.invoice_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  "tuition_fee",
                  "laboratory_fee",
                  "library_fee",
                  "athletic_fee",
                  "registration_fee",
                  "id_fee",
                  "miscellaneous_fee",
                  "other_fees",
                ].map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {field
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </label>
                    <input
                      type="number"
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    name="discount_amount"
                    value={formData.discount_amount}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Scholarship Amount
                  </label>
                  <input
                    type="number"
                    name="scholarship_amount"
                    value={formData.scholarship_amount}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₱{calculateSubtotal().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Total Discounts:</span>
                  <span className="text-red-600 dark:text-red-400">
                    -₱
                    {(
                      parseFloat(formData.discount_amount || 0) +
                      parseFloat(formData.scholarship_amount || 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-indigo-200 dark:border-indigo-800 pt-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total:</span>
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₱{calculateTotal().toLocaleString()}
                  </span>
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
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;
