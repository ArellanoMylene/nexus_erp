import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import Select from "react-select";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Shield } from "lucide-react";

const EligibilityScreening = () => {
  const [screenings, setScreenings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentScreening, setCurrentScreening] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    application_id: "",
    scholarship_id: "",
    student_id: "",
    screening_date: new Date().toISOString().split('T')[0],
    gpa_requirement_met: false,
    year_level_eligible: false,
    course_eligible: false,
    income_requirement_met: false,
    documents_complete: false,
    interview_required: false,
    interview_completed: false,
    interview_date: "",
    interview_score: "",
    interview_notes: "",
    overall_eligible: false,
    eligibility_score: "",
    screening_status: "Pending Review",
    disqualification_reasons: "",
    recommendations: "",
  });

  useEffect(() => {
    fetchScreenings();
    fetchApplications();
    fetchPrograms();
    fetchStatistics();
  }, []);

  const fetchScreenings = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("screening_status", filterStatus);
      if (searchTerm) params.append("search", searchTerm);
      const response = await api.get(`/api/scholarships/screening?${params}`);
      const data = response.data.data || response.data || [];
      setScreenings(data);
    } catch (error) {
      console.error("Error fetching screenings:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get(`/api/scholarships/screening/statistics`);
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get(`/api/scholarships/applications`);
      const data = response.data.data || response.data || [];
      setApplications(data);
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


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSelectChange = async (selectedOption, field) => {
    const value = selectedOption?.value || "";
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-fill logic
    if (field === "application_id" && value) {
      try {
        const response = await api.get(`/api/scholarships/applications/${value}`);
        const app = response.data;
        if (app) {
          setFormData(prev => ({
            ...prev,
            scholarship_id: app.scholarship_id || prev.scholarship_id,
            student_id: app.student_id || prev.student_id,
          }));
        }
      } catch (error) {
        console.error("Error auto-filling from application:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentScreening) {
        await api.put(`/api/scholarships/screening/${currentScreening.screening_id}`, formData);
      } else {
        await api.post(`/api/scholarships/screening`, formData);
      }
      fetchScreenings();
      fetchStatistics();
      closeModal();
    } catch (error) {
      console.error("Error saving screening:", error);
      alert(error.response?.data?.error || "Error saving screening");
    }
  };

  const handleEdit = (scr) => {
    setCurrentScreening(scr);
    setFormData({
      application_id: scr.application_id,
      scholarship_id: scr.scholarship_id,
      student_id: scr.student_id,
      screening_date: new Date(scr.screening_date).toISOString().split('T')[0],
      gpa_requirement_met: scr.gpa_requirement_met,
      year_level_eligible: scr.year_level_eligible,
      course_eligible: scr.course_eligible,
      income_requirement_met: scr.income_requirement_met,
      documents_complete: scr.documents_complete,
      interview_required: scr.interview_required,
      interview_completed: scr.interview_completed,
      interview_date: scr.interview_date ? new Date(scr.interview_date).toISOString().split('T')[0] : "",
      interview_score: scr.interview_score || "",
      interview_notes: scr.interview_notes || "",
      overall_eligible: scr.overall_eligible,
      eligibility_score: scr.eligibility_score || "",
      screening_status: scr.screening_status,
      disqualification_reasons: scr.disqualification_reasons || "",
      recommendations: scr.recommendations || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this screening?")) {
      try {
        await api.delete(`/api/scholarships/screening/${id}`);
        fetchScreenings();
        fetchStatistics();
      } catch (error) {
        console.error("Error deleting screening:", error);
        alert(error.response?.data?.error || "Error deleting screening");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentScreening(null);
    setFormData({
      application_id: "",
      scholarship_id: "",
      student_id: "",
      screening_date: new Date().toISOString().split('T')[0],
      gpa_requirement_met: false,
      year_level_eligible: false,
      course_eligible: false,
      income_requirement_met: false,
      documents_complete: false,
      interview_required: false,
      interview_completed: false,
      interview_date: "",
      interview_score: "",
      interview_notes: "",
      overall_eligible: false,
      eligibility_score: "",
      screening_status: "Pending Review",
      disqualification_reasons: "",
      recommendations: "",
    });
  };

  const filteredScreenings = screenings.filter(s =>
    (!searchTerm || s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.application_number?.includes(searchTerm)) &&
    (!filterStatus || s.screening_status === filterStatus)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredScreenings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredScreenings.length / itemsPerPage);

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
      Passed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      "Pending Review": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      Conditional: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  const applicationOptions = applications.map(app => ({ value: app.application_id, label: `${app.application_number} - ${app.student_name}` }));
  const programOptions = programs.map(p => ({ value: p.scholarship_id, label: `${p.scholarship_name} (${p.scholarship_code})` }));

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><CheckSquare size={24} className="text-indigo-600" />Eligibility Screening</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Application Screening</span>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4"><p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Screenings</p><p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{statistics.total_screenings}</p></div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4"><p className="text-xs font-medium text-slate-600 dark:text-slate-400">Passed</p><p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{statistics.passed_count}</p></div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4"><p className="text-xs font-medium text-slate-600 dark:text-slate-400">Failed</p><p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{statistics.failed_count}</p></div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4"><p className="text-xs font-medium text-slate-600 dark:text-slate-400">Pending</p><p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{statistics.pending_count}</p></div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-grow max-w-xs">
              <input type="text" placeholder="Search screenings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm transition-all shadow-inner" />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                <option value="">All Status</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Conditional">Conditional</option>
              </select>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium border border-indigo-700 dark:border-indigo-600 shadow-md shadow-indigo-500/30 whitespace-nowrap"><Plus size={14} />New Screening</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">Application</th>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Scholarship</th>
                  <th className="px-4 py-2.5">Screening Date</th>
                  <th className="px-4 py-2.5">GPA Check</th>
                  <th className="px-4 py-2.5">Docs</th>
                  <th className="px-4 py-2.5">Eligible</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {currentItems.length > 0 ? currentItems.map((scr) => (
                  <tr key={scr.screening_id} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150">
                    <td className="px-4 py-2"><span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{scr.application_number}</span></td>
                    <td className="px-4 py-2"><div className="font-medium">{scr.student_name}</div><div className="text-xs text-slate-500 dark:text-slate-400">{scr.student_number}</div></td>
                    <td className="px-4 py-2"><div className="font-semibold text-slate-900 dark:text-white">{scr.scholarship_name}</div></td>
                    <td className="px-4 py-2"><span className="text-xs">{new Date(scr.screening_date).toLocaleDateString()}</span></td>
                    <td className="px-4 py-2">{scr.gpa_requirement_met ? <CheckSquare size={16} className="text-green-600" /> : <AlertTriangle size={16} className="text-red-600" />}</td>
                    <td className="px-4 py-2">{scr.documents_complete ? <CheckSquare size={16} className="text-green-600" /> : <AlertTriangle size={16} className="text-red-600" />}</td>
                    <td className="px-4 py-2">{scr.overall_eligible ? <span className="text-green-600 font-semibold">Yes</span> : <span className="text-red-600 font-semibold">No</span>}</td>
                    <td className="px-4 py-2"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(scr.screening_status)}`}>{scr.screening_status}</span></td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(scr)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Edit"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(scr.screening_id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )) : (<tr><td colSpan="9" className="p-4 text-center text-slate-500 dark:text-slate-400 italic">No screenings found.</td></tr>)}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} setPage={setCurrentPage} totalItems={filteredScreenings.length} />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50" onClick={closeModal}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentScreening ? "Edit Screening" : "New Screening"}</h3>
              <button onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><Plus size={18} className="rotate-45" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Application *</label>
                <Select options={applicationOptions} value={applicationOptions.find(opt => opt.value === formData.application_id)} onChange={(option) => handleSelectChange(option, "application_id")} placeholder="Select application" required className="text-sm" classNamePrefix="react-select" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Screening Date *</label>
                <input type="date" name="screening_date" value={formData.screening_date} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
              </div>
              <div className="border border-slate-200 dark:border-slate-600 rounded-md p-3">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Eligibility Criteria</h4>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="gpa_requirement_met" checked={formData.gpa_requirement_met} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">GPA Requirement Met</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="year_level_eligible" checked={formData.year_level_eligible} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Year Level Eligible</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="course_eligible" checked={formData.course_eligible} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Course Eligible</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="income_requirement_met" checked={formData.income_requirement_met} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Income Requirement Met</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="documents_complete" checked={formData.documents_complete} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Documents Complete</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="overall_eligible" checked={formData.overall_eligible} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Overall Eligible</span>
                  </label>
                </div>
              </div>
              <div className="border border-slate-200 dark:border-slate-600 rounded-md p-3">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Interview Details</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="interview_required" checked={formData.interview_required} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Interview Required</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="interview_completed" checked={formData.interview_completed} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Interview Completed</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Interview Date</label>
                    <input type="date" name="interview_date" value={formData.interview_date} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Interview Score</label>
                    <input type="number" name="interview_score" value={formData.interview_score} onChange={handleInputChange} step="0.01" max="100" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Interview Notes</label>
                  <textarea name="interview_notes" value={formData.interview_notes} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Eligibility Score</label>
                  <input type="number" name="eligibility_score" value={formData.eligibility_score} onChange={handleInputChange} step="0.01" max="100" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Screening Status *</label>
                  <select name="screening_status" value={formData.screening_status} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Conditional">Conditional</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Disqualification Reasons</label>
                <textarea name="disqualification_reasons" value={formData.disqualification_reasons} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Recommendations</label>
                <textarea name="recommendations" value={formData.recommendations} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={closeModal} className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30">{currentScreening ? "Update" : "Create"} Screening</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EligibilityScreening;
