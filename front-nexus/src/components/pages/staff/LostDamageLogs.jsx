import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  User,
  DollarSign,
  CheckCircle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LostDamageLogs = () => {
  const [incidents, setIncidents] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentIncident, setCurrentIncident] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    book_id: "",
    user_id: "",
    incident_type: "Lost",
    severity: "Moderate",
    incident_date: new Date().toISOString().split('T')[0],
    replacement_cost: "",
    payment_status: "Pending",
    amount_paid: "0.00",
    description: "",
    resolved: false,
  });

  useEffect(() => {
    fetchIncidents();
    fetchBooks();
    fetchUsers();
    fetchStatistics();

    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setFormData(prev => ({ ...prev, reported_by: user.user_id }));
    }
  }, []);

  const fetchIncidents = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("incident_type", filterType);
      if (filterStatus) params.append("payment_status", filterStatus);
      if (searchTerm) params.append("search", searchTerm);

      const response = await axios.get(`${API_BASE}/api/library/incidents?${params}`);
      setIncidents(response.data);
    } catch (error) {
      console.error("Error fetching incidents:", error);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/library/books`);
      setBooks(response.data);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/library/incidents/statistics`);
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
      if (currentIncident) {
        await axios.put(`${API_BASE}/api/library/incidents/${currentIncident.incident_id}`, formData);
      } else {
        await axios.post(`${API_BASE}/api/library/incidents`, formData);
      }
      fetchIncidents();
      fetchStatistics();
      closeModal();
    } catch (error) {
      console.error("Error saving incident:", error);
      alert(error.response?.data?.error || "Error saving incident");
    }
  };

  const handleEdit = (incident) => {
    setCurrentIncident(incident);
    setFormData({
      book_id: incident.book_id,
      user_id: incident.user_id,
      incident_type: incident.incident_type,
      severity: incident.severity,
      incident_date: new Date(incident.incident_date).toISOString().split('T')[0],
      replacement_cost: incident.replacement_cost,
      payment_status: incident.payment_status,
      amount_paid: incident.amount_paid,
      description: incident.description || "",
      resolved: incident.resolved,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this incident?")) {
      try {
        await axios.delete(`${API_BASE}/api/library/incidents/${id}`);
        fetchIncidents();
        fetchStatistics();
      } catch (error) {
        console.error("Error deleting incident:", error);
        alert("Error deleting incident");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentIncident(null);
    setFormData({
      book_id: "",
      user_id: "",
      incident_type: "Lost",
      severity: "Moderate",
      incident_date: new Date().toISOString().split('T')[0],
      replacement_cost: "",
      payment_status: "Pending",
      amount_paid: "0.00",
      description: "",
      resolved: false,
    });
  };

  const filteredIncidents = (() => {
    let filtered = [...incidents];
    if (searchTerm) {
      filtered = filtered.filter(i =>
        i.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterType) {
      filtered = filtered.filter(i => i.incident_type === filterType);
    }
    if (filterStatus) {
      filtered = filtered.filter(i => i.payment_status === filterStatus);
    }
    return filtered;
  })();

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIncidents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);

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

  const getTypeBadge = (type) => {
    const badges = {
      Lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      Damaged: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      Missing: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return badges[type] || "bg-gray-100 text-gray-700";
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      Minor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Moderate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      Severe: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return badges[severity] || "bg-gray-100 text-gray-700";
  };

  const getPaymentBadge = (status) => {
    const badges = {
      Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      Partial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      Paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  const bookOptions = books.map(book => ({
    value: book.book_id,
    label: `${book.title} - ${book.author}`,
  }));

  const userOptions = users.map(user => ({
    value: user.user_id,
    label: `${user.first_name} ${user.last_name} - ${user.role}`,
  }));

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-600" />
            Lost & Damage Logs
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Incident Management</span>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Incidents</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{statistics.total_incidents}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Lost Books</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{statistics.lost_count}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Damaged Books</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{statistics.damaged_count}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Outstanding Balance</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">₱{statistics.outstanding_amount?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-grow max-w-xs">
              <input type="text" placeholder="Search incidents..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm transition-all shadow-inner" />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>

            <div className="flex items-center gap-2">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                <option value="">All Types</option>
                <option value="Lost">Lost</option>
                <option value="Damaged">Damaged</option>
                <option value="Missing">Missing</option>
              </select>

              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                <option value="">All Payment Status</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>

              <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium border border-indigo-700 dark:border-indigo-600 shadow-md shadow-indigo-500/30 whitespace-nowrap">
                <Plus size={14} />
                Report Incident
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">Book</th>
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Severity</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Cost</th>
                  <th className="px-4 py-2.5">Payment</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {currentItems.length > 0 ? (
                  currentItems.map((incident) => (
                    <tr key={incident.incident_id} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="text-indigo-600 dark:text-indigo-400" size={16} />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{incident.book_title}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">by {incident.book_author}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <div>
                            <div className="font-medium">{incident.user_name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{incident.user_role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadge(incident.incident_type)}`}>
                          {incident.incident_type}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityBadge(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {new Date(incident.incident_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <DollarSign size={12} className="text-slate-400" />
                          <span className="font-semibold">₱{parseFloat(incident.replacement_cost).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentBadge(incident.payment_status)}`}>
                            {incident.payment_status}
                          </span>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Paid: ₱{parseFloat(incident.amount_paid).toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {incident.resolved ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                            <CheckCircle size={14} />
                            Resolved
                          </span>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400 text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEdit(incident)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(incident.incident_id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="p-4 text-center text-slate-500 dark:text-slate-400 italic">No incidents found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} setPage={setCurrentPage} totalItems={filteredIncidents.length} />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50" onClick={closeModal}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentIncident ? "Edit Incident" : "Report Incident"}</h3>
              <button onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Select Book *</label>
                  <Select options={bookOptions} value={bookOptions.find(opt => opt.value === formData.book_id)} onChange={(option) => handleSelectChange(option, "book_id")} placeholder="Choose a book" required className="text-sm" classNamePrefix="react-select" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Select User *</label>
                  <Select options={userOptions} value={userOptions.find(opt => opt.value === formData.user_id)} onChange={(option) => handleSelectChange(option, "user_id")} placeholder="Choose user" required className="text-sm" classNamePrefix="react-select" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Incident Type *</label>
                  <select name="incident_type" value={formData.incident_type} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                    <option value="Lost">Lost</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Missing">Missing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Severity *</label>
                  <select name="severity" value={formData.severity} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                    <option value="Minor">Minor</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Incident Date *</label>
                  <input type="date" name="incident_date" value={formData.incident_date} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Replacement Cost *</label>
                  <input type="number" name="replacement_cost" value={formData.replacement_cost} onChange={handleInputChange} step="0.01" min="0" required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Status</label>
                  <select name="payment_status" value={formData.payment_status} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amount Paid</label>
                  <input type="number" name="amount_paid" value={formData.amount_paid} onChange={handleInputChange} step="0.01" min="0" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical" placeholder="Describe the incident..." />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="resolved" name="resolved" checked={formData.resolved} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                <label htmlFor="resolved" className="text-sm text-slate-700 dark:text-slate-300 font-medium">Mark as Resolved</label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={closeModal} className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30">{currentIncident ? "Update" : "Report"} Incident</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostDamageLogs;
