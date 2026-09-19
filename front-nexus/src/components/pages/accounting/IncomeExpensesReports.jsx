import { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

const IncomeExpensesReports = () => {
  const [transactions, setTransactions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({
    transaction_type: "",
    category: "",
    department: "",
    start_date: "",
    end_date: "",
    search: "",
  });

  const [formData, setFormData] = useState({
    transaction_id: null,
    transaction_type: "Income",
    category: "",
    amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    department: "",
    description: "",
    reference_number: "",
    payment_method: "Cash",
    recorded_by: "",
  });

  const incomeCategories = [
    "Tuition Fees",
    "Laboratory Fees",
    "Other Fees",
    "Donations",
    "Grants",
    "Services",
    "Other Income",
  ];

  const expenseCategories = [
    "Salaries",
    "Utilities",
    "Supplies",
    "Maintenance",
    "Equipment",
    "Services",
    "Scholarships",
    "Other Expenses",
  ];

  const paymentMethods = [
    "Cash",
    "Check",
    "Bank Transfer",
    "Credit Card",
    "Online Payment",
  ];

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/api/dept/departments");
      setDepartments(response.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get(`/api/income-expenses`, {
        params: filters,
      });
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get(`/api/income-expenses/summary`, {
        params: {
          start_date: filters.start_date,
          end_date: filters.end_date,
          department: filters.department,
        },
      });
      setSummary(response.data.data || {});
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.transaction_id) {
        await api.put(
          `/api/income-expenses/${formData.transaction_id}`,
          formData
        );
      } else {
        await api.post(`/api/income-expenses`, formData);
      }
      setShowModal(false);
      resetForm();
      fetchTransactions();
      fetchSummary();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction");
    }
  };

  const handleEdit = (transaction) => {
    setFormData(transaction);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      try {
        await api.delete(`/api/income-expenses/${id}`);
        fetchTransactions();
        fetchSummary();
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      transaction_id: null,
      transaction_type: "Income",
      category: "",
      amount: "",
      transaction_date: new Date().toISOString().split("T")[0],
      department: "",
      description: "",
      reference_number: "",
      payment_method: "Cash",
      recorded_by: "",
    });
  };

  const netIncome =
    parseFloat(summary.total_income || 0) -
    parseFloat(summary.total_expenses || 0);

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <DollarSign className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Income & Expenses Reports
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Track financial transactions and budget
            </p>
          </div>
        </div>
        {/*  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Data Integrity: Online</span>
          </div>
        </div> */}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Income</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₱{parseFloat(summary.total_income || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="text-green-600 dark:text-green-400" size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                ₱{parseFloat(summary.total_expenses || 0).toLocaleString()}
              </p>
            </div>
            <TrendingDown className="text-red-600 dark:text-red-400" size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Net Income</p>
              <p
                className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
              >
                ₱{netIncome.toLocaleString()}
              </p>
            </div>
            <DollarSign
              className={netIncome >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
              size={32}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Transactions</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {summary.total_transactions || 0}
              </p>
            </div>
            <Calendar className="text-indigo-600 dark:text-indigo-400" size={32} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="space-y-3">
          {/* Top Row: Search + New Transaction Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Plus size={18} />
              New Transaction
            </button>
          </div>

          {/* Bottom Row: Filter Dropdowns and Date Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <select
              value={filters.transaction_type}
              onChange={(e) => {
                setFilters({ ...filters, transaction_type: e.target.value });
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {[...incomeCategories, ...expenseCategories].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={filters.department}
              onChange={(e) => {
                setFilters({ ...filters, department: e.target.value });
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => {
                const departmentName = dept.name || dept.department_name || "";
                return (
                  <option
                    key={dept.id || dept.department_id || departmentName}
                    value={departmentName}
                  >
                    {departmentName}
                  </option>
                );
              })}
            </select>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => {
                setFilters({ ...filters, start_date: e.target.value });
                setCurrentPage(1);
              }}
              placeholder="Start Date"
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => {
                setFilters({ ...filters, end_date: e.target.value });
                setCurrentPage(1);
              }}
              placeholder="End Date"
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Department
                </th>
               {/*  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Description
                </th> */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {(() => {
                const searchTerm = filters.search.toLowerCase();
                const filtered = transactions.filter((transaction) => {
                  const matchesSearch =
                    transaction.category?.toLowerCase().includes(searchTerm) ||
                    transaction.department?.toLowerCase().includes(searchTerm) ||
                    transaction.description?.toLowerCase().includes(searchTerm) ||
                    transaction.reference_number?.toLowerCase().includes(searchTerm);
                  return matchesSearch;
                });

                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

                if (paginatedData.length === 0) {
                  return (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        No transactions found matching your search criteria.
                      </td>
                    </tr>
                  );
                }

                return paginatedData.map((transaction) => (
                  <tr key={transaction.transaction_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${transaction.transaction_type === "Income"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                          }`}
                      >
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {transaction.category}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {transaction.department}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                      <div className="max-w-xs truncate">
                        {transaction.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold text-sm ${transaction.transaction_type === "Income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                          }`}
                      >
                        {transaction.transaction_type === "Income" ? "+" : "-"}₱
                        {parseFloat(transaction.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.transaction_id)}
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
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
        <span className="text-xs sm:text-sm">
          Page <span className="font-semibold">{currentPage}</span> of{" "}
          <span className="font-semibold">{(() => {
            const searchTerm = filters.search.toLowerCase();
            const filtered = transactions.filter((transaction) => {
              const matchesSearch =
                transaction.category?.toLowerCase().includes(searchTerm) ||
                transaction.department?.toLowerCase().includes(searchTerm) ||
                transaction.description?.toLowerCase().includes(searchTerm) ||
                transaction.reference_number?.toLowerCase().includes(searchTerm);
              return matchesSearch;
            });
            return Math.ceil(filtered.length / itemsPerPage) || 1;
          })()}</span> | Total Records:{" "}
          {(() => {
            const searchTerm = filters.search.toLowerCase();
            const filtered = transactions.filter((transaction) => {
              const matchesSearch =
                transaction.category?.toLowerCase().includes(searchTerm) ||
                transaction.department?.toLowerCase().includes(searchTerm) ||
                transaction.description?.toLowerCase().includes(searchTerm) ||
                transaction.reference_number?.toLowerCase().includes(searchTerm);
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
            const filtered = transactions.filter((transaction) => {
              const matchesSearch =
                transaction.category?.toLowerCase().includes(searchTerm) ||
                transaction.department?.toLowerCase().includes(searchTerm) ||
                transaction.description?.toLowerCase().includes(searchTerm) ||
                transaction.reference_number?.toLowerCase().includes(searchTerm);
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
              const filtered = transactions.filter((transaction) => {
                const matchesSearch =
                  transaction.category?.toLowerCase().includes(searchTerm) ||
                  transaction.department?.toLowerCase().includes(searchTerm) ||
                  transaction.description?.toLowerCase().includes(searchTerm) ||
                  transaction.reference_number?.toLowerCase().includes(searchTerm);
                return matchesSearch;
              });
              const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
              setCurrentPage(Math.min(totalPages, currentPage + 1));
            }}
            disabled={(() => {
              const searchTerm = filters.search.toLowerCase();
              const filtered = transactions.filter((transaction) => {
                const matchesSearch =
                  transaction.category?.toLowerCase().includes(searchTerm) ||
                  transaction.department?.toLowerCase().includes(searchTerm) ||
                  transaction.description?.toLowerCase().includes(searchTerm) ||
                  transaction.reference_number?.toLowerCase().includes(searchTerm);
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

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-slate-50 dark:bg-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600 rounded-t-lg flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                {formData.transaction_id ? "Edit" : "New"} Transaction
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Type *
                    </label>
                    <select
                      name="transaction_type"
                      value={formData.transaction_type}
                      onChange={handleInputChange}
                      required
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {formData.transaction_type === "Income"
                        ? incomeCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))
                        : expenseCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      step="0.01"
                      required
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="transaction_date"
                      value={formData.transaction_date}
                      onChange={handleInputChange}
                      required
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Department *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => {
                        const departmentName = dept.name || dept.department_name || "";
                        return (
                          <option key={dept.id || dept.department_id || departmentName} value={departmentName}>
                            {departmentName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Payment Method
                    </label>
                    <select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      Reference Number
                    </label>
                    <input
                      type="text"
                      name="reference_number"
                      value={formData.reference_number}
                      onChange={handleInputChange}
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Recorded By
                    </label>
                    <input
                      type="text"
                      name="recorded_by"
                      value={formData.recorded_by}
                      onChange={handleInputChange}
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-600 rounded-b-lg flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeExpensesReports;
