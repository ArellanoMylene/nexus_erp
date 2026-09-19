import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Award,
} from "lucide-react";

const ScholarshipTypeSetup = () => {
  const [scholarshipTypes, setScholarshipTypes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    scholarship_name: "",
    scholarship_code: "",
    description: "",
    funding_source: "",
    total_budget: "",
    allocated_budget: "",
    remaining_budget: "",
    min_gpa: "",
    max_family_income: "",
    year_level_requirement: "",
    course_restriction: "",
    tuition_coverage_percentage: "",
    covers_miscellaneous: false,
    covers_books: false,
    covers_allowance: false,
    monthly_allowance: "",
    application_start: "",
    application_end: "",
    total_slots: "",
    slots_filled: "",
    slots_available: "",
    status: "Active",
    renewable: false,
  });

  useEffect(() => {
    fetchScholarshipTypes();
    fetchStatistics();

    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setFormData(prev => ({ ...prev, created_by: user.user_id }));
    }
  }, []);

  const fetchScholarshipTypes = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (searchTerm) params.append("search", searchTerm);

      const response = await api.get(`/api/scholarships/types?${params}`);
      setScholarshipTypes(response.data);
    } catch (error) {
      console.error("Error fetching scholarship types:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get(`/api/scholarships/types/statistics`);
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentType) {
        await api.put(`/api/scholarships/types/${currentType.scholarship_type_id}`, formData);
      } else {
        await api.post(`/api/scholarships/types`, formData);
      }
      fetchScholarshipTypes();
      fetchStatistics();
      closeModal();
    } catch (error) {
      console.error("Error saving scholarship type:", error);
      alert(error.response?.data?.error || "Error saving scholarship type");
    }
  };

  const handleEdit = (type) => {
    setCurrentType(type);
    setFormData({
      scholarship_name: type.scholarship_name,
      scholarship_code: type.scholarship_code,
      description: type.description || "",
      funding_source: type.funding_source || "",
      total_budget: type.total_budget,
      allocated_budget: type.allocated_budget,
      remaining_budget: type.remaining_budget,
      min_gpa: type.min_gpa || "",
      max_family_income: type.max_family_income || "",
      year_level_requirement: type.year_level_requirement || "",
      course_restriction: type.course_restriction || "",
      tuition_coverage_percentage: type.tuition_coverage_percentage,
      covers_miscellaneous: type.covers_miscellaneous,
      covers_books: type.covers_books,
      covers_allowance: type.covers_allowance,
      monthly_allowance: type.monthly_allowance,
      application_start: type.application_start ? new Date(type.application_start).toISOString().split('T')[0] : "",
      application_end: type.application_end ? new Date(type.application_end).toISOString().split('T')[0] : "",
      total_slots: type.total_slots,
      slots_filled: type.slots_filled,
      slots_available: type.slots_available,
      status: type.status,
      renewable: type.renewable,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this scholarship type?")) {
      try {
        await api.delete(`/api/scholarships/types/${id}`);
        fetchScholarshipTypes();
        fetchStatistics();
      } catch (error) {
        console.error("Error deleting scholarship type:", error);
        alert("Error deleting scholarship type");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentType(null);
    setFormData({
      scholarship_name: "",
      scholarship_code: "",
      description: "",
      funding_source: "",
      total_budget: "",
      allocated_budget: "",
      remaining_budget: "",
      min_gpa: "",
      max_family_income: "",
      year_level_requirement: "",
      course_restriction: "",
      tuition_coverage_percentage: "",
      covers_miscellaneous: false,
      covers_books: false,
      covers_allowance: false,
      monthly_allowance: "",
      application_start: "",
      application_end: "",
      total_slots: "",
      slots_filled: "",
      slots_available: "",
      status: "Active",
      renewable: false,
    });
  };

  const filteredTypes = (() => {
    let filtered = [...scholarshipTypes];
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.scholarship_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.scholarship_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus) {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    return filtered;
  })();

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);

  const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
      <span className="text-xs sm:text-sm">
        Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> | Total Records: {totalItems}
      </span>
      <div className="flex gap-1 items-center mt-2 sm:mt-0">
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">{currentPage}</span>
        <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const badges = {
      Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Inactive: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      Closed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award size={24} className="text-indigo-600" />
            Scholarship Type Setup
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Scholarship Management</span>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Scholarships</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{statistics.total_scholarships}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Budget</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">₱{parseFloat(statistics.total_budget || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Slots</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{statistics.total_slots}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Slots Filled</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{statistics.total_filled}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-grow max-w-xs">
              <input type="text" placeholder="Search scholarships..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm transition-all shadow-inner" />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>

            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Closed">Closed</option>
              </select>

              <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium border border-indigo-700 dark:border-indigo-600 shadow-md shadow-indigo-500/30 whitespace-nowrap">
                <Plus size={14} />
                Add Scholarship
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">Scholarship Name</th>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Funding Source</th>
                  <th className="px-4 py-2.5">Total Budget</th>
                  <th className="px-4 py-2.5">Coverage</th>
                  <th className="px-4 py-2.5">Slots</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {currentItems.length > 0 ? (
                  currentItems.map((type) => (
                    <tr key={type.scholarship_type_id} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150">
                      <td className="px-4 py-2">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{type.scholarship_name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{type.description?.substring(0, 50)}{type.description?.length > 50 ? '...' : ''}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{type.scholarship_code}</span>
                      </td>
                      <td className="px-4 py-2">{type.funding_source || 'N/A'}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <DollarSign size={12} className="text-slate-400" />
                          <span className="font-semibold">₱{parseFloat(type.total_budget).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs font-medium">{type.tuition_coverage_percentage}%</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-slate-400" />
                          <span className="font-semibold">{type.slots_filled}/{type.total_slots}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(type.status)}`}>
                          {type.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEdit(type)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(type.scholarship_type_id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-slate-500 dark:text-slate-400 italic">No scholarship types found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} setPage={setCurrentPage} totalItems={filteredTypes.length} />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50" onClick={closeModal}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentType ? "Edit Scholarship Type" : "Add Scholarship Type"}</h3>
              <button onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Scholarship Name *</label>
                  <input type="text" name="scholarship_name" value={formData.scholarship_name} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Scholarship Code *</label>
                  <input type="text" name="scholarship_code" value={formData.scholarship_code} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Funding Source</label>
                  <input type="text" name="funding_source" value={formData.funding_source} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Total Budget</label>
                  <input type="number" name="total_budget" value={formData.total_budget} onChange={handleInputChange} step="0.01" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Total Slots</label>
                  <input type="number" name="total_slots" value={formData.total_slots} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Min GPA</label>
                  <input type="number" name="min_gpa" value={formData.min_gpa} onChange={handleInputChange} step="0.01" max="4.00" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Max Family Income</label>
                  <input type="number" name="max_family_income" value={formData.max_family_income} onChange={handleInputChange} step="0.01" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tuition Coverage %</label>
                  <input type="number" name="tuition_coverage_percentage" value={formData.tuition_coverage_percentage} onChange={handleInputChange} min="0" max="100" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Application Start</label>
                  <input type="date" name="application_start" value={formData.application_start} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Application End</label>
                  <input type="date" name="application_end" value={formData.application_end} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Allowance</label>
                  <input type="number" name="monthly_allowance" value={formData.monthly_allowance} onChange={handleInputChange} step="0.01" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="covers_miscellaneous" checked={formData.covers_miscellaneous} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Covers Miscellaneous</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="covers_books" checked={formData.covers_books} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Covers Books</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="covers_allowance" checked={formData.covers_allowance} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Covers Allowance</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="renewable" checked={formData.renewable} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Renewable</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={closeModal} className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30">{currentType ? "Update" : "Create"} Scholarship</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipTypeSetup;
