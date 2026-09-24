import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import Select from "react-select";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, FileText, User, Calendar } from "lucide-react";

const ApplicationForms = () => {
  const [applications, setApplications] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [students, setStudents] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    scholarship_id: "",
    academic_period_id: "",
    student_id: "",
    application_date: new Date().toISOString().split('T')[0],
    current_gpa: "",
    family_income: "",
    number_of_siblings: "",
    working_student: false,
    status: "Pending",
    remarks: "",
    approved_amount: "",
  });

  useEffect(() => {
    fetchApplications();
    fetchPrograms();
    fetchPeriods();
    fetchStudents();
    fetchStatistics();
  }, []);


  const fetchApplications = async () => {
    try {
      const response = await api.get(`/api/scholarships/applications`);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
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

  const fetchStatistics = async () => {
    try {
      const response = await api.get(`/api/scholarships/applications/statistics`);
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSelectChange = (selectedOption, field) => {
    setFormData({ ...formData, [field]: selectedOption?.value || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentApp) {
        await api.put(`/api/scholarships/applications/${currentApp.application_id}`, formData);
      } else {
        await api.post(`/api/scholarships/applications`, formData);
      }
      await fetchApplications();
      await fetchStatistics();
      setCurrentPage(1);
      closeModal();
    } catch (error) {
      console.error("Error saving application:", error);
      alert(error.response?.data?.error || "Error saving application");
    }
  };

  const handleEdit = (app) => {
    setCurrentApp(app);
    setFormData({
      scholarship_id: app.scholarship_id,
      academic_period_id: app.academic_period_id,
      student_id: app.student_id,
      application_date: new Date(app.application_date).toISOString().split('T')[0],
      current_gpa: app.current_gpa || "",
      family_income: app.family_income || "",
      number_of_siblings: app.number_of_siblings || "",
      working_student: app.working_student,
      status: app.status,
      remarks: app.remarks || "",
      approved_amount: app.approved_amount || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      try {
        await api.delete(`/api/scholarships/applications/${id}`);
        await fetchApplications();
        await fetchStatistics();
        setCurrentPage(1);
      } catch (error) {
        console.error("Error deleting application:", error);
        alert(error.response?.data?.error || "Error deleting application");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentApp(null);
    setFormData({
      scholarship_id: "",
      academic_period_id: "",
      student_id: "",
      application_date: new Date().toISOString().split('T')[0],
      current_gpa: "",
      family_income: "",
      number_of_siblings: "",
      working_student: false,
      status: "Pending",
      remarks: "",
      approved_amount: "",
    });
  };

  const filteredApplications = applications.filter(a =>
    (!searchTerm || a.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.application_number?.includes(searchTerm)) &&
    (!filterStatus || a.status === filterStatus)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 ">
      <span className="text-xs sm:text-sm">Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> | Total Records: {totalItems}</span>
      <div className="flex gap-1 items-center mt-2 sm:mt-0">
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-md border border-slate-300  bg-white  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100  transition-colors"><ChevronLeft size={16} /></button>
        <span className="px-2 py-1 text-xs font-semibold text-indigo-600 ">{currentPage}</span>
        <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded-md border border-slate-300  bg-white  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100  transition-colors"><ChevronRight size={16} /></button>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const badges = {
      Pending: "bg-yellow-100 text-yellow-700  ",
      "Under Review": "bg-blue-100 text-blue-700  ",
      Approved: "bg-green-100 text-green-700  ",
      Rejected: "bg-red-100 text-red-700  ",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  const programOptions = programs.map(p => ({ value: p.scholarship_id, label: `${p.scholarship_name} (${p.scholarship_code})` }));
  const periodOptions = periods.map(p => ({ value: p.id || p.period_id, label: `${p.school_year} - ${p.semester}` }));
  const studentOptions = students.map(s => ({ value: s.user_id, label: `${s.first_name} ${s.last_name} - ${s.email}` }));

  return (
    <div className=" p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200  pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900  flex items-center gap-2"><FileText size={24} className="text-indigo-600" />Application Forms</h2>
          <span className="text-sm text-slate-500  font-medium">Scholarship Applications</span>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white  rounded-md border border-slate-200  shadow-sm p-4"><p className="text-xs font-medium text-slate-600 ">Total Applications</p><p className="text-2xl font-bold text-indigo-600  mt-1">{statistics.total_applications}</p></div>
            <div className="bg-white  rounded-md border border-slate-200  shadow-sm p-4"><p className="text-xs font-medium text-slate-600 ">Pending</p><p className="text-2xl font-bold text-yellow-600  mt-1">{statistics.pending_count}</p></div>
            <div className="bg-white  rounded-md border border-slate-200  shadow-sm p-4"><p className="text-xs font-medium text-slate-600 ">Approved</p><p className="text-2xl font-bold text-green-600  mt-1">{statistics.approved_count}</p></div>
            <div className="bg-white  rounded-md border border-slate-200  shadow-sm p-4"><p className="text-xs font-medium text-slate-600 ">Rejected</p><p className="text-2xl font-bold text-red-600  mt-1">{statistics.rejected_count}</p></div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-grow max-w-xs">
              <input type="text" placeholder="Search applications..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300  focus:outline-none focus:ring-2 focus:ring-indigo-500   text-sm transition-all shadow-inner" />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="px-3 py-2 text-sm border border-slate-300  rounded-md   focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium border border-indigo-700  shadow-md shadow-indigo-500/30 whitespace-nowrap"><Plus size={14} />New Application</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-slate-200 ">
            <table className="min-w-full divide-y divide-slate-200 ">
              <thead className="bg-slate-100 ">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 ">
                  <th className="px-4 py-2.5">Application #</th>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Scholarship</th>
                  <th className="px-4 py-2.5">Application Date</th>
                  <th className="px-4 py-2.5">Academic Period</th>
                  <th className="px-4 py-2.5">GPA</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100  bg-white ">
                {currentItems.length > 0 ? currentItems.map((app) => (
                  <tr key={app.application_id} className="text-sm text-slate-700  hover:bg-indigo-50/50  transition duration-150">
                    <td className="px-4 py-2"><span className="font-mono text-xs bg-slate-100  px-2 py-0.5 rounded">{app.application_number}</span></td>
                    <td className="px-4 py-2"><div className="flex items-center gap-2"><User size={14} className="text-slate-400" /><div><div className="font-medium">{app.student_name}</div><div className="text-xs text-slate-500 ">{app.student_number}</div></div></div></td>
                    <td className="px-4 py-2"><div className="font-semibold text-slate-900 ">{app.scholarship_name}</div></td>
                    <td className="px-4 py-2"><div className="flex items-center gap-1 text-xs"><Calendar size={12} className="text-slate-400" />{new Date(app.application_date).toLocaleDateString()}</div></td>
                    <td className="px-4 py-2"><span className="text-xs">{app.school_year || 'N/A'} - {app.period_semester || 'N/A'}</span></td>
                    <td className="px-4 py-2"><span className="font-semibold">{app.current_gpa || 'N/A'}</span></td>
                    <td className="px-4 py-2"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(app.status)}`}>{app.status}</span></td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(app)} className="text-blue-600 hover:text-blue-800   transition-colors p-1 rounded-full hover:bg-slate-200 " title="Edit"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(app.application_id)} className="text-red-600 hover:text-red-800   transition-colors p-1 rounded-full hover:bg-slate-200 " title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )) : (<tr><td colSpan="8" className="p-4 text-center text-slate-500  italic">No applications found.</td></tr>)}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} setPage={setCurrentPage} totalItems={filteredApplications.length} />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50" onClick={closeModal}>
          <div className="bg-white  rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200  max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200  bg-slate-50  rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 ">{currentApp ? "Edit Application" : "New Application"}</h3>
              <button onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:text-slate-600  transition-colors"><Plus size={18} className="rotate-45" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">Scholarship Program *</label>
                  <Select options={programOptions} value={programOptions.find(opt => opt.value === formData.scholarship_id)} onChange={(option) => handleSelectChange(option, "scholarship_id")} placeholder="Select program" required className="text-sm" classNamePrefix="react-select" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">Academic Period *</label>
                  <Select options={periodOptions} value={periodOptions.find(opt => opt.value === formData.academic_period_id)} onChange={(option) => handleSelectChange(option, "academic_period_id")} placeholder="Select period" required className="text-sm" classNamePrefix="react-select" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700  mb-1">Student *</label>
                <Select options={studentOptions} value={studentOptions.find(opt => opt.value === formData.student_id)} onChange={(option) => handleSelectChange(option, "student_id")} placeholder="Select student" required className="text-sm" classNamePrefix="react-select" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-slate-700  mb-1">Application Date *</label><input type="date" name="application_date" value={formData.application_date} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300  rounded-md   focus:ring-indigo-500 focus:border-indigo-500 transition-colors" /></div>
                <div><label className="block text-xs font-medium text-slate-700  mb-1">Current GPA</label><input type="number" name="current_gpa" value={formData.current_gpa} onChange={handleInputChange} step="0.01" max="4.00" className="w-full px-3 py-2 text-sm border border-slate-300  rounded-md   focus:ring-indigo-500 focus:border-indigo-500 transition-colors" /></div>
                <div><label className="block text-xs font-medium text-slate-700  mb-1">Family Income</label><input type="number" name="family_income" value={formData.family_income} onChange={handleInputChange} step="0.01" className="w-full px-3 py-2 text-sm border border-slate-300  rounded-md   focus:ring-indigo-500 focus:border-indigo-500 transition-colors" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-700  mb-1">Siblings</label><input type="number" name="number_of_siblings" value={formData.number_of_siblings} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300  rounded-md   focus:ring-indigo-500 focus:border-indigo-500 transition-colors" /></div>
                <div className="flex items-end mb-2"><label className="flex items-center gap-2"><input type="checkbox" name="working_student" checked={formData.working_student} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" /><span className="text-sm text-slate-700 ">Working Student</span></label></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300  rounded-md   focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                {formData.status === 'Approved' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700  mb-1">Approved Amount *</label>
                    <input
                      type="number"
                      name="approved_amount"
                      value={formData.approved_amount}
                      onChange={handleInputChange}
                      required={formData.status === 'Approved'}
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-slate-300  rounded-md   focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                )}
              </div>
              <div><label className="block text-xs font-medium text-slate-700  mb-1">Remarks</label><textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 text-sm border border-slate-300  rounded-md   focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 ">
                <button type="button" onClick={closeModal} className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300    transition-colors border border-slate-300 ">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30">{currentApp ? "Update" : "Submit"} Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationForms;

