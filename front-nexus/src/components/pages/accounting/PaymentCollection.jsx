import { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
  Plus,
  Search,
  Eye,
  DollarSign,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PaymentCollection = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({
    payment_method: "",
    payment_status: "",
    start_date: "",
    end_date: "",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    invoice_id: "",
    student_id: "",
    amount_paid: "",
    payment_method: "Cash",
    payment_date: new Date().toISOString().split("T")[0],
    bank_name: "",
    check_number: "",
    reference_number: "",
    notes: "",
  });

  const paymentMethods = [
    "Cash",
    "Check",
    "Bank Transfer",
    "Credit Card",
    "Debit Card",
    "Online Payment",
    "GCash",
    "PayMaya",
  ];

  useEffect(() => {
    fetchPayments();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPayments = async () => {
    try {
      const response = await api.get(`/api/payments`, { params: filters });
      setPayments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get(`/api/payments/summary`, {
        params: {
          start_date: filters.start_date,
          end_date: filters.end_date,
        },
      });
      setSummary(response.data.data || {});
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const fetchInvoices = async (studentId = null) => {
    try {
      const url = studentId
        ? `/api/invoices/student/${studentId}`
        : `/api/invoices`;
      const response = await api.get(url, {
        params: { status: "Pending,Partially Paid" },
      });
      setInvoices(response.data.data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "invoice_id" && value) {
      const selectedInvoice = invoices.find(inv => String(inv.invoice_id) === String(value));
      if (selectedInvoice) {
        setFormData({
          ...formData,
          invoice_id: value,
          student_id: selectedInvoice.student_id,
          amount_paid: selectedInvoice.balance || ""
        });
        return;
      }
    }

    setFormData({ ...formData, [name]: value });

    if (name === "student_id" && value) {
      fetchInvoices(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/payments`, formData);
      setShowModal(false);
      resetForm();
      fetchPayments();
      fetchSummary();
      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("Error creating payment:", error);
      alert("Failed to record payment");
    }
  };

  const handleVerify = async (id) => {
    if (window.confirm("Verify this payment?")) {
      try {
        await api.patch(`/api/payments/${id}/verify`);
        fetchPayments();
      } catch (error) {
        console.error("Error verifying payment:", error);
      }
    }
  };

  const viewReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const resetForm = () => {
    setFormData({
      invoice_id: "",
      student_id: "",
      amount_paid: "",
      payment_method: "Cash",
      payment_date: new Date().toISOString().split("T")[0],
      bank_name: "",
      check_number: "",
      reference_number: "",
      notes: "",
    });
    setInvoices([]);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Payment Collection
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Record and manage student payments
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
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Collected</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ₱{parseFloat(summary.total_collected || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Verified</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ₱{parseFloat(summary.verified_amount || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending Verification</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ₱{parseFloat(summary.pending_amount || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.total_payments || 0}
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
                  placeholder="Search..."
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
                value={filters.payment_method}
                onChange={(e) => {
                  setFilters({ ...filters, payment_method: e.target.value });
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Methods</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <select
                value={filters.payment_status}
                onChange={(e) => {
                  setFilters({ ...filters, payment_status: e.target.value });
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Cleared">Cleared</option>
              </select>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters({ ...filters, start_date: e.target.value })
                }
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) =>
                  setFilters({ ...filters, end_date: e.target.value })
                }
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={() => {
                  resetForm();
                  fetchInvoices();
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30"
              >
                <Plus size={18} />
                Record Payment
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
                Reference
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Student
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Method
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Date
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
              const filtered = payments.filter((payment) => {
                const matchesSearch =
                  payment.payment_reference?.toLowerCase().includes(searchTerm) ||
                  payment.student_name?.toLowerCase().includes(searchTerm) ||
                  payment.student_number?.toLowerCase().includes(searchTerm) ||
                  payment.invoice_number?.toLowerCase().includes(searchTerm);
                return matchesSearch;
              });

              const totalPages = Math.ceil(filtered.length / itemsPerPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

              if (paginatedData.length === 0) {
                return (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No payments found matching your search criteria.
                    </td>
                  </tr>
                );
              }

              return paginatedData.map((payment) => (
                <tr key={payment.payment_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-slate-900 dark:text-white">
                    {payment.payment_reference}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-sm text-slate-900 dark:text-white">{payment.student_name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {payment.student_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                    {payment.invoice_number}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                    ₱{parseFloat(payment.amount_paid).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                    {payment.payment_method}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${payment.payment_status === "Verified"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : payment.payment_status === "Pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
                        }`}
                    >
                      {payment.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewReceipt(payment)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                        title="View Receipt"
                      >
                        <Eye size={18} />
                      </button>
                      {payment.payment_status === "Pending" && (
                        <button
                          onClick={() => handleVerify(payment.payment_id)}
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
                          title="Verify Payment"
                        >
                          <FileText size={18} />
                        </button>
                      )}
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
            const filtered = payments.filter((payment) => {
              const matchesSearch =
                payment.payment_reference?.toLowerCase().includes(searchTerm) ||
                payment.student_name?.toLowerCase().includes(searchTerm) ||
                payment.student_number?.toLowerCase().includes(searchTerm) ||
                payment.invoice_number?.toLowerCase().includes(searchTerm);
              return matchesSearch;
            });
            return Math.ceil(filtered.length / itemsPerPage) || 1;
          })()}</span> | Total Records:{" "}
          {(() => {
            const searchTerm = filters.search.toLowerCase();
            const filtered = payments.filter((payment) => {
              const matchesSearch =
                payment.payment_reference?.toLowerCase().includes(searchTerm) ||
                payment.student_name?.toLowerCase().includes(searchTerm) ||
                payment.student_number?.toLowerCase().includes(searchTerm) ||
                payment.invoice_number?.toLowerCase().includes(searchTerm);
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
            const filtered = payments.filter((payment) => {
              const matchesSearch =
                payment.payment_reference?.toLowerCase().includes(searchTerm) ||
                payment.student_name?.toLowerCase().includes(searchTerm) ||
                payment.student_number?.toLowerCase().includes(searchTerm) ||
                payment.invoice_number?.toLowerCase().includes(searchTerm);
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
              const filtered = payments.filter((payment) => {
                const matchesSearch =
                  payment.payment_reference?.toLowerCase().includes(searchTerm) ||
                  payment.student_name?.toLowerCase().includes(searchTerm) ||
                  payment.student_number?.toLowerCase().includes(searchTerm) ||
                  payment.invoice_number?.toLowerCase().includes(searchTerm);
                return matchesSearch;
              });
              const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
              setCurrentPage(Math.min(totalPages, currentPage + 1));
            }}
            disabled={(() => {
              const searchTerm = filters.search.toLowerCase();
              const filtered = payments.filter((payment) => {
                const matchesSearch =
                  payment.payment_reference?.toLowerCase().includes(searchTerm) ||
                  payment.student_name?.toLowerCase().includes(searchTerm) ||
                  payment.student_number?.toLowerCase().includes(searchTerm) ||
                  payment.invoice_number?.toLowerCase().includes(searchTerm);
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

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Record Payment
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
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Invoice *
                  </label>
                  <select
                    name="invoice_id"
                    value={formData.invoice_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Select Invoice</option>
                    {invoices.map((inv) => (
                      <option key={inv.invoice_id} value={inv.invoice_id}>
                        {inv.invoice_number} - {inv.student_name} (Balance: ₱
                        {parseFloat(inv.balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Amount Paid *
                  </label>
                  <input
                    type="number"
                    name="amount_paid"
                    value={formData.amount_paid}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method *
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Check/Reference Number
                  </label>
                  <input
                    type="text"
                    name="reference_number"
                    value={formData.reference_number}
                    onChange={handleInputChange}
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
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300" onClick={() => setShowReceiptModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Payment Receipt
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {selectedPayment.payment_reference}
                </p>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Student</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedPayment.student_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Student Number</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedPayment.student_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Invoice</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedPayment.invoice_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Date</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {new Date(
                      selectedPayment.payment_date
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Payment Method</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedPayment.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Amount Paid</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    ₱{parseFloat(selectedPayment.amount_paid).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 rounded-b-lg">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCollection;
