import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, DollarSign, TrendingDown, Search, ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DeductionManagement = () => {
  const [deductions, setDeductions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    deduction_type: "",
    status: "",
    search: "",
  });

  const [formData, setFormData] = useState({
    deduction_id: null,
    employee_id: "",
    deduction_type: "SSS",
    amount: "",
    frequency: "Monthly",
    start_date: "",
    end_date: "",
    total_balance: "",
    remaining_balance: "",
    status: "Active",
    notes: "",
  });

  const deductionTypes = [
    "SSS",
    "PhilHealth",
    "Pag-IBIG",
    "Tax",
    "Loan",
    "Cash Advance",
    "Other Deduction",
    "Penalty",
  ];

  const frequencies = ["Monthly", "Semi-Monthly", "Weekly", "One-time"];
  const statuses = ["Active", "Inactive", "Completed"];

  useEffect(() => {
    fetchDeductions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchDeductions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/deductions`, { params: filters });
      setDeductions(response.data.data || []);
    } catch (error) {
      console.error("Error fetching deductions:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.deduction_id) {
        await axios.put(`${API_BASE}/api/deductions/${formData.deduction_id}`, formData);
      } else {
        await axios.post(`${API_BASE}/api/deductions`, formData);
      }
      setShowModal(false);
      resetForm();
      fetchDeductions();
    } catch (error) {
      console.error("Error saving deduction:", error);
      alert("Failed to save deduction");
    }
  };

  const handleEdit = (deduction) => {
    setFormData(deduction);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this deduction?")) {
      try {
        await axios.delete(`${API_BASE}/api/deductions/${id}`);
        fetchDeductions();
      } catch (error) {
        console.error("Error deleting deduction:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      deduction_id: null,
      employee_id: "",
      deduction_type: "SSS",
      amount: "",
      frequency: "Monthly",
      start_date: "",
      end_date: "",
      total_balance: "",
      remaining_balance: "",
      status: "Active",
      notes: "",
    });
  };

  const calculateProgress = (remaining, total) => {
    if (!total || total === 0) return 0;
    const paid = total - remaining;
    return (paid / total) * 100;
  };

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign size={24} className="text-indigo-600" />
            Deduction Management
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm p-4 border-l-4 border-indigo-500 dark:border-indigo-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Deductions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {deductions.length}
                </p>
              </div>
              <TrendingDown className="text-indigo-600 dark:text-indigo-400" size={28} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm p-4 border-l-4 border-green-500 dark:border-green-600">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Active Deductions</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {deductions.filter((d) => d.status === "Active").length}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm p-4 border-l-4 border-blue-500 dark:border-blue-600">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                ₱
                {deductions
                  .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
                  .toLocaleString()}
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
              placeholder="Search employee..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
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
              value={filters.deduction_type}
              onChange={(e) =>
                setFilters({ ...filters, deduction_type: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-44"
            >
              <option value="">All Deduction Types</option>
              {deductionTypes.map((type) => (
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
              Add Deduction
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">
                  Employee
                </th>
                <th className="px-4 py-2.5">
                  Deduction Type
                </th>
                <th className="px-4 py-2.5">
                  Amount
                </th>
                <th className="px-4 py-2.5">
                  Frequency
                </th>
                <th className="px-4 py-2.5">
                  Balance Progress
                </th>
                <th className="px-4 py-2.5">
                  Status
                </th>
                <th className="px-4 py-2.5 w-1/12 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {deductions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).length ? (
                deductions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((deduction) => (
                  <tr key={deduction.deduction_id} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150">
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {deduction.first_name} {deduction.last_name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {deduction.employee_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                        {deduction.deduction_type}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      ₱{parseFloat(deduction.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {deduction.frequency}
                    </td>
                    <td className="px-4 py-2">
                      {deduction.total_balance > 0 ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                                style={{
                                  width: `${calculateProgress(
                                    deduction.remaining_balance,
                                    deduction.total_balance
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {calculateProgress(
                                deduction.remaining_balance,
                                deduction.total_balance
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            ₱{parseFloat(deduction.remaining_balance || 0).toLocaleString()} / ₱{parseFloat(deduction.total_balance || 0).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500 dark:text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${deduction.status === "Active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : deduction.status === "Completed"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                      >
                        {deduction.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(deduction)}
                        title="Edit"
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(deduction.deduction_id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-4 text-center text-slate-500 italic"
                  >
                    No deductions found matching your search criteria.
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
            <span className="font-semibold">{Math.ceil(deductions.length / itemsPerPage) || 1}</span> | Total Records:{" "}
            {deductions.length}
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
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(deductions.length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(deductions.length / itemsPerPage) || deductions.length === 0}
              className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {formData.deduction_id ? "Edit" : "Add"} Deduction
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
                    Employee ID *
                  </label>
                  <input
                    type="number"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Deduction Type *
                  </label>
                  <select
                    name="deduction_type"
                    value={formData.deduction_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    {deductionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
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
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Frequency *
                  </label>
                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    {frequencies.map((freq) => (
                      <option key={freq} value={freq}>
                        {freq}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
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
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Total Balance
                  </label>
                  <input
                    type="number"
                    name="total_balance"
                    value={formData.total_balance}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="For loans/advances"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Remaining Balance
                  </label>
                  <input
                    type="number"
                    name="remaining_balance"
                    value={formData.remaining_balance}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="For loans/advances"
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
                  Save Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeductionManagement;
