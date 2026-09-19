import { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  SendHorizonal,
} from "lucide-react";

const TuitionFeeSetup = () => {
  const [fees, setFees] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    program_id: "",
    academic_period_id: "",
    year_level: "",
    search: "",
  });
  const [generatingId, setGeneratingId] = useState(null);
  const [genFeedback, setGenFeedback] = useState(null); // { type: 'success'|'error', message }

  const [formData, setFormData] = useState({
    fee_setup_id: null,
    program_id: "",
    year_level: "1st Year",
    academic_period_id: "",
    tuition_fee: 0,
    laboratory_fee: 0,
    library_fee: 0,
    athletic_fee: 0,
    registration_fee: 0,
    id_fee: 0,
    miscellaneous_fee: 0,
    other_fees: 0,
    is_active: true,
  });

  const yearLevels = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
    "5th Year",
  ];

  useEffect(() => {
    fetchFees();
    fetchPrograms();
    fetchPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchFees = async () => {
    try {
      const response = await api.get(`/api/tuition-fees`, {
        params: filters,
      });
      setFees(response.data.data || []);
    } catch (error) {
      console.error("Error fetching tuition fees:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get(`/api/programs`);
      setPrograms(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.fee_setup_id) {
        await api.put(`/api/tuition-fees/${formData.fee_setup_id}`, formData);
      } else {
        await api.post(`/api/tuition-fees`, formData);
      }
      setShowModal(false);
      resetForm();
      fetchFees();
    } catch (error) {
      console.error("Error saving fee:", error);
      alert("Failed to save tuition fee setup");
    }
  };

  const handleEdit = (fee) => {
    setFormData(fee);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this fee setup?")) {
      try {
        await api.delete(`/api/tuition-fees/${id}`);
        fetchFees();
      } catch (error) {
        console.error("Error deleting fee:", error);
      }
    }
  };

  const handleGenerateInvoices = async (feeSetupId) => {
    if (
      !window.confirm(
        "Generate invoices for all matching enrolled students who don't have one yet for this period?",
      )
    )
      return;
    setGeneratingId(feeSetupId);
    setGenFeedback(null);
    try {
      const res = await api.post(
        `/api/tuition-fees/${feeSetupId}/generate-invoices`,
      );
      const { created, skipped } = res.data.data || {};
      setGenFeedback({
        type: "success",
        message: `Done! ${created} invoice(s) created, ${skipped} already existed.`,
      });
    } catch (error) {
      setGenFeedback({
        type: "error",
        message:
          error.response?.data?.message || "Failed to generate invoices.",
      });
    } finally {
      setGeneratingId(null);
      setTimeout(() => setGenFeedback(null), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      fee_setup_id: null,
      program_id: "",
      year_level: "1st Year",
      academic_period_id: "",
      tuition_fee: 0,
      laboratory_fee: 0,
      library_fee: 0,
      athletic_fee: 0,
      registration_fee: 0,
      id_fee: 0,
      miscellaneous_fee: 0,
      other_fees: 0,
      is_active: true,
    });
  };

  const calculateTotal = () => {
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

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign size={24} className="text-indigo-600" />
            Tuition Fee Setup
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Generate feedback toast */}
        {genFeedback && (
          <div
            className={`px-4 py-2.5 rounded-md text-sm font-medium ${
              genFeedback.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
            }`}
          >
            {genFeedback.message}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search fees..."
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
              value={filters.program_id}
              onChange={(e) =>
                setFilters({ ...filters, program_id: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="">All Programs</option>
              {programs.map((prog) => (
                <option key={prog.program_id} value={prog.program_id}>
                  {prog.program_name}
                </option>
              ))}
            </select>
            <select
              value={filters.academic_period_id}
              onChange={(e) =>
                setFilters({ ...filters, academic_period_id: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="">All Periods</option>
              {periods.map((period) => (
                <option key={period.period_id} value={period.period_id}>
                  {period.school_year} - {period.semester}
                </option>
              ))}
            </select>
            <select
              value={filters.year_level}
              onChange={(e) =>
                setFilters({ ...filters, year_level: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-32"
            >
              <option value="">All Year Levels</option>
              {yearLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
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
              Add Fee Setup
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">Program</th>
                <th className="px-4 py-2.5">Year Level</th>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5">Total Fee</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 w-1/12 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {fees
                .filter(
                  (fee) =>
                    filters.search === "" ||
                    fee.program_name
                      ?.toLowerCase()
                      .includes(filters.search.toLowerCase()) ||
                    fee.year_level
                      ?.toLowerCase()
                      .includes(filters.search.toLowerCase()),
                )
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage,
                ).length ? (
                fees
                  .filter(
                    (fee) =>
                      filters.search === "" ||
                      fee.program_name
                        ?.toLowerCase()
                        .includes(filters.search.toLowerCase()) ||
                      fee.year_level
                        ?.toLowerCase()
                        .includes(filters.search.toLowerCase()),
                  )
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage,
                  )
                  .map((fee) => (
                    <tr
                      key={fee.fee_setup_id}
                      className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                    >
                      <td className="px-4 py-2">{fee.program_name || "N/A"}</td>
                      <td className="px-4 py-2">{fee.year_level}</td>
                      <td className="px-4 py-2">
                        {fee.school_year} - {fee.semester}
                      </td>
                      <td className="px-4 py-2 font-semibold">
                        ₱{parseFloat(fee.total_fee || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            fee.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {fee.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          onClick={() =>
                            handleGenerateInvoices(fee.fee_setup_id)
                          }
                          title="Generate Invoices for matching students"
                          disabled={
                            generatingId === fee.fee_setup_id || !fee.is_active
                          }
                          className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {generatingId === fee.fee_setup_id ? (
                            <span className="text-[10px] font-bold animate-pulse">
                              ...
                            </span>
                          ) : (
                            <SendHorizonal size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(fee)}
                          title="Edit"
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(fee.fee_setup_id)}
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
                    colSpan={6}
                    className="p-4 text-center text-slate-500 italic"
                  >
                    No tuition fee setups found matching your search criteria.
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
              {Math.ceil(
                fees.filter(
                  (fee) =>
                    filters.search === "" ||
                    fee.program_name
                      ?.toLowerCase()
                      .includes(filters.search.toLowerCase()) ||
                    fee.year_level
                      ?.toLowerCase()
                      .includes(filters.search.toLowerCase()),
                ).length / itemsPerPage,
              ) || 1}
            </span>{" "}
            | Total Records:{" "}
            {
              fees.filter(
                (fee) =>
                  filters.search === "" ||
                  fee.program_name
                    ?.toLowerCase()
                    .includes(filters.search.toLowerCase()) ||
                  fee.year_level
                    ?.toLowerCase()
                    .includes(filters.search.toLowerCase()),
              ).length
            }
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
                  Math.min(
                    prev + 1,
                    Math.ceil(
                      fees.filter(
                        (fee) =>
                          filters.search === "" ||
                          fee.program_name
                            ?.toLowerCase()
                            .includes(filters.search.toLowerCase()) ||
                          fee.year_level
                            ?.toLowerCase()
                            .includes(filters.search.toLowerCase()),
                      ).length / itemsPerPage,
                    ),
                  ),
                )
              }
              disabled={
                currentPage ===
                Math.ceil(
                  fees.filter(
                    (fee) =>
                      filters.search === "" ||
                      fee.program_name
                        ?.toLowerCase()
                        .includes(filters.search.toLowerCase()) ||
                      fee.year_level
                        ?.toLowerCase()
                        .includes(filters.search.toLowerCase()),
                  ).length / itemsPerPage,
                )
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
            className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {formData.fee_setup_id ? "Edit" : "Add"} Tuition Fee Setup
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
                    Program *
                  </label>
                  <select
                    name="program_id"
                    value={formData.program_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Select Program</option>
                    {programs.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Year Level *
                  </label>
                  <select
                    name="year_level"
                    value={formData.year_level}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    {yearLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
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
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <label className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    Active
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tuition Fee
                  </label>
                  <input
                    type="number"
                    name="tuition_fee"
                    value={formData.tuition_fee}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Laboratory Fee
                  </label>
                  <input
                    type="number"
                    name="laboratory_fee"
                    value={formData.laboratory_fee}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Library Fee
                  </label>
                  <input
                    type="number"
                    name="library_fee"
                    value={formData.library_fee}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Athletic Fee
                  </label>
                  <input
                    type="number"
                    name="athletic_fee"
                    value={formData.athletic_fee}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Registration Fee
                  </label>
                  <input
                    type="number"
                    name="registration_fee"
                    value={formData.registration_fee}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ID Fee
                  </label>
                  <input
                    type="number"
                    name="id_fee"
                    value={formData.id_fee}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Miscellaneous Fee
                  </label>
                  <input
                    type="number"
                    name="miscellaneous_fee"
                    value={formData.miscellaneous_fee}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Other Fees
                  </label>
                  <input
                    type="number"
                    name="other_fees"
                    value={formData.other_fees}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Total Fee:
                  </span>
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
                  Save Fee Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TuitionFeeSetup;
