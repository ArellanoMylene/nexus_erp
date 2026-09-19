import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import Select from "react-select";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Users, Award, DollarSign, TrendingUp } from "lucide-react";

const BeneficiaryList = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [applications, setApplications] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [students, setStudents] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentBen, setCurrentBen] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    application_id: "",
    scholarship_id: "",
    academic_period_id: "",
    student_id: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    total_grant_amount: "",
    tuition_discount: "",
    allowance_amount: "",
    required_gpa: "",
    current_gpa: "",
    community_service_hours: "",
    renewable: false,
    status: "Active",
  });

  useEffect(() => {
    fetchBeneficiaries();
    fetchApplications();
    fetchPrograms();
    fetchPeriods();
    fetchStudents();
    fetchStatistics();
  }, []);


  const fetchBeneficiaries = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (searchTerm) params.append("search", searchTerm);
      const response = await api.get(`/api/scholarships/beneficiaries?${params}`);
      setBeneficiaries(response.data);
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get(`/api/scholarships/beneficiaries/statistics`);
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get(`/api/scholarships/applications?status=Approved`);
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get(`/api/scholarships/programs?is_active=1`);
      const data = response.data.data || response.data || [];
      setPrograms(data);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await api.get(`/api/academic-periods`);
      const data = response.data.data || response.data || [];
      setPeriods(data);
    } catch (error) {
      console.error("Error fetching periods:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get(`/api/users?role=Student`);
      const data = response.data.data || response.data || [];
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSelectChange = async (selectedOption, field) => {
    const value = selectedOption?.value || "";
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-fill logic when application is selected
    if (field === "application_id" && value) {
      try {
        const response = await api.get(`/api/scholarships/applications/${value}`);
        const app = response.data;
        if (app) {
          setFormData(prev => ({
            ...prev,
            scholarship_id: app.scholarship_id || prev.scholarship_id,
            academic_period_id: app.academic_period_id || prev.academic_period_id,
            student_id: app.student_id || prev.student_id,
            total_grant_amount: app.approved_amount || prev.total_grant_amount,
            current_gpa: app.current_gpa || prev.current_gpa,
          }));
        }
      } catch (error) {
        console.error("Error fetching application details for auto-fill:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentBen) {
        await api.put(`/api/scholarships/beneficiaries/${currentBen.beneficiary_id}`, formData);
      } else {
        await api.post(`/api/scholarships/beneficiaries`, formData);
      }
      fetchBeneficiaries();
      fetchStatistics();
      closeModal();
    } catch (error) {
      console.error("Error saving beneficiary:", error);
      alert(error.response?.data?.error || "Error saving beneficiary");
    }
  };

  const handleEdit = (ben) => {
    setCurrentBen(ben);
    setFormData({
      application_id: ben.application_id,
      scholarship_id: ben.scholarship_id,
      academic_period_id: ben.academic_period_id,
      student_id: ben.student_id,
      start_date: new Date(ben.start_date).toISOString().split('T')[0],
      end_date: ben.end_date ? new Date(ben.end_date).toISOString().split('T')[0] : "",
      total_grant_amount: ben.total_grant_amount || "",
      tuition_discount: ben.tuition_discount || "",
      allowance_amount: ben.allowance_amount || "",
      required_gpa: ben.required_gpa || "",
      current_gpa: ben.current_gpa || "",
      community_service_hours: ben.community_service_hours || "",
      renewable: ben.renewable,
      status: ben.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this beneficiary?")) {
      try {
        await api.delete(`/api/scholarships/beneficiaries/${id}`);
        fetchBeneficiaries();
        fetchStatistics();
      } catch (error) {
        console.error("Error deleting beneficiary:", error);
        alert(error.response?.data?.error || "Error deleting beneficiary");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentBen(null);
    setFormData({
      application_id: "",
      scholarship_id: "",
      academic_period_id: "",
      student_id: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      total_grant_amount: "",
      tuition_discount: "",
      allowance_amount: "",
      required_gpa: "",
      current_gpa: "",
      community_service_hours: "",
      renewable: false,
      status: "Active",
    });
  };

  const filteredBeneficiaries = beneficiaries.filter(b =>
    (!searchTerm || b.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.student_number?.includes(searchTerm)) &&
    (!filterStatus || b.status === filterStatus)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBeneficiaries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBeneficiaries.length / itemsPerPage);

  const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
      <span className="text-xs sm:text-sm">Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> | Total Records: {totalItems}</span>
      <div className="flex gap-1 items-center mt-2 sm:mt-0">
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"><ChevronLeft size={16} /></button>
        <span className="px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">{currentPage}</span>
        <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"><ChevronRight size={16} /></button>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const badges = {
      Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      Revoked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      Suspended: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  const programOptions = programs.map(p => ({ value: p.scholarship_id, label: `${p.scholarship_name} (${p.scholarship_code})` }));
  const periodOptions = periods.map(p => ({ value: p.id || p.period_id, label: `${p.school_year} - ${p.semester}` }));
  const applicationOptions = applications.map(app => ({ value: app.application_id, label: `${app.application_number} - ${app.student_name}` }));
  const studentOptions = students.map(s => ({ value: s.user_id, label: `${s.first_name} ${s.last_name} - ${s.email}` }));

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users size={24} className="text-indigo-600" />Beneficiary List</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Scholarship Beneficiaries</span>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4"><p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Beneficiaries</p><p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{statistics.total_beneficiaries}</p></div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4"><p className="text-xs font-medium text-slate-600 dark:text-slate-400">Active</p><p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{statistics.active_count}</p></div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4"><p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Grants</p><p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">₱{parseFloat(statistics.total_grants || 0).toFixed(2)}</p></div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4"><p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Disbursed</p><p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">₱{parseFloat(statistics.total_disbursed || 0).toFixed(2)}</p></div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-grow max-w-xs">
              <input type="text" placeholder="Search beneficiaries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm transition-all shadow-inner" />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Revoked">Revoked</option>
                <option value="Suspended">Suspended</option>
              </select>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium border border-indigo-700 dark:border-indigo-600 shadow-md shadow-indigo-500/30 whitespace-nowrap"><Plus size={14} />Add Beneficiary</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5 text-left">Student</th>
                  <th className="px-4 py-2.5 text-left">Scholarship</th>
                  <th className="px-4 py-2.5 text-left">Period</th>
                  <th className="px-4 py-2.5 text-left">Grant Amount</th>
                  <th className="px-4 py-2.5 text-left">Disbursed</th>
                  <th className="px-4 py-2.5 text-left">GPA</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {currentItems.length > 0 ? currentItems.map((ben) => (
                  <tr key={ben.beneficiary_id} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150">
                    <td className="px-4 py-2"><div className="font-medium">{ben.student_name}</div><div className="text-xs text-slate-500 dark:text-slate-400">{ben.student_number}</div></td>
                    <td className="px-4 py-2"><div className="font-semibold text-slate-900 dark:text-white">{ben.scholarship_name}</div></td>
                    <td className="px-4 py-2"><span className="text-xs">{ben.school_year || 'N/A'} - {ben.period_semester || 'N/A'}</span></td>
                    <td className="px-4 py-2"><span className="font-semibold text-indigo-600">₱{parseFloat(ben.total_grant_amount || 0).toLocaleString()}</span></td>
                    <td className="px-4 py-2"><span className="text-emerald-600">₱{parseFloat(ben.total_disbursed || 0).toLocaleString()}</span></td>
                    <td className="px-4 py-2"><span className={`font-semibold ${ben.gpa_maintained ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{ben.current_gpa || 'N/A'}</span></td>
                    <td className="px-4 py-2"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(ben.status)}`}>{ben.status}</span></td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(ben)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Edit"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(ben.beneficiary_id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )) : (<tr><td colSpan="8" className="p-4 text-center text-slate-500 dark:text-slate-400 italic">No beneficiaries found.</td></tr>)}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} setPage={setCurrentPage} totalItems={filteredBeneficiaries.length} />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50" onClick={closeModal}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentBen ? "Edit Beneficiary" : "Add Beneficiary"}</h3>
              <button onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><Plus size={18} className="rotate-45" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Approved Application *</label>
                <Select options={applicationOptions} value={applicationOptions.find(opt => opt.value === formData.application_id)} onChange={(option) => handleSelectChange(option, "application_id")} placeholder="Select application" required className="text-sm" classNamePrefix="react-select" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Scholarship Program *</label>
                  <Select options={programOptions} value={programOptions.find(opt => opt.value === formData.scholarship_id)} onChange={(option) => handleSelectChange(option, "scholarship_id")} placeholder="Select program" required className="text-sm" classNamePrefix="react-select" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Period *</label>
                  <Select options={periodOptions} value={periodOptions.find(opt => opt.value === formData.academic_period_id)} onChange={(option) => handleSelectChange(option, "academic_period_id")} placeholder="Select period" required className="text-sm" classNamePrefix="react-select" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Student / Recipient *</label>
                <Select options={studentOptions} value={studentOptions.find(opt => opt.value === formData.student_id)} onChange={(option) => handleSelectChange(option, "student_id")} placeholder="Select student" required className="text-sm" classNamePrefix="react-select" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date *</label><input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" /></div>
                <div><label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label><input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Grant Amount *</label><input type="number" name="total_grant_amount" value={formData.total_grant_amount} onChange={handleInputChange} step="0.01" required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" /></div>
                <div><label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tuition Disc.</label><input type="number" name="tuition_discount" value={formData.tuition_discount} onChange={handleInputChange} step="0.01" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" /></div>
                <div><label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Allowance</label><input type="number" name="allowance_amount" value={formData.allowance_amount} onChange={handleInputChange} step="0.01" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Required GPA</label><input type="number" name="required_gpa" value={formData.required_gpa} onChange={handleInputChange} step="0.01" max="4.00" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" /></div>
                <div><label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Current GPA</label><input type="number" name="current_gpa" value={formData.current_gpa} onChange={handleInputChange} step="0.01" max="4.00" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label><select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"><option value="Active">Active</option><option value="Completed">Completed</option><option value="Suspended">Suspended</option><option value="Revoked">Revoked</option></select></div>
                <div className="flex items-end mb-2"><label className="flex items-center gap-2"><input type="checkbox" name="renewable" checked={formData.renewable} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" /><span className="text-sm text-slate-700 dark:text-slate-300">Renewable</span></label></div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={closeModal} className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30">{currentBen ? "Update" : "Add"} Beneficiary</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeneficiaryList;
