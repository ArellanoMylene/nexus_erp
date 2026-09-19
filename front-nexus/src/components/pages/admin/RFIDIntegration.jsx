import { useState, useEffect } from "react";
import { CreditCard, Users, Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const RFIDIntegration = () => {
  const [rfidCards, setRfidCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    card_number: "",
    user_id: "",
    user_name: "",
    user_identifier: "",
    card_type: "student",
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    fetchRfidCards();
  }, []);

  const fetchRfidCards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (typeFilter !== "all") params.append("card_type", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(
        `${API_BASE}/api/rfid-cards?${params}`
      );
      const data = await response.json();
      if (data.success) {
        setRfidCards(data.data);
      }
    } catch (error) {
      console.error("Error fetching RFID cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedCard
        ? `${API_BASE}/api/rfid-cards/${selectedCard.rfid_id}`
        : `${API_BASE}/api/rfid-cards`;
      const method = selectedCard ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success || data.rfid_id) {
        fetchRfidCards();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving RFID card:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this RFID card?")) {
      try {
        const response = await fetch(`${API_BASE}/api/rfid-cards/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchRfidCards();
        }
      } catch (error) {
        console.error("Error deleting RFID card:", error);
      }
    }
  };

  const handleEdit = (card) => {
    setSelectedCard(card);
    setFormData({
      card_number: card.card_number || "",
      user_id: card.user_id || "",
      user_name: card.user_name || "",
      user_identifier: card.user_identifier || "",
      card_type: card.card_type || "student",
      issue_date: card.issue_date?.split("T")[0] || "",
      expiry_date: card.expiry_date?.split("T")[0] || "",
      status: card.status || "active",
      notes: card.notes || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCard(null);
    setFormData({
      card_number: "",
      user_id: "",
      user_name: "",
      user_identifier: "",
      card_type: "student",
      issue_date: new Date().toISOString().split("T")[0],
      expiry_date: "",
      status: "active",
      notes: "",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      inactive: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
      lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      damaged: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
    return colors[status] || colors.active;
  };

  const getCardTypeColor = (type) => {
    const colors = {
      student: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      faculty: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      staff: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    };
    return colors[type] || colors.student;
  };

  // Filter cards
  const filteredCards = rfidCards.filter((card) => {
    const matchesSearch =
      card.card_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.user_identifier?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || card.card_type === typeFilter;
    const matchesStatus = statusFilter === "all" || card.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCards = filteredCards.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard size={24} className="text-indigo-600" />
            RFID Card Integration
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total Cards</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">1,376</p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                <CreditCard className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Active Cards</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">1,295</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <CreditCard className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Inactive</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">58</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-900/30 p-3 rounded-lg">
                <CreditCard className="text-slate-600 dark:text-slate-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Lost/Damaged</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">23</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <CreditCard className="text-red-600 dark:text-red-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="all">All Types</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="lost">Lost</option>
              <option value="damaged">Damaged</option>
            </select>
            <button
              onClick={fetchRfidCards}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium text-sm transition-colors"
            >
              Filter
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              Register Card
            </button>
          </div>
        </div>

        {/* RFID Cards Table */}
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">Card Number</th>
                <th className="px-4 py-2.5">User Name</th>
                <th className="px-4 py-2.5">Identifier</th>
                <th className="px-4 py-2.5">Card Type</th>
                <th className="px-4 py-2.5">Issue Date</th>
                <th className="px-4 py-2.5">Expiry Date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Last Used</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {currentCards.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No RFID cards found
                  </td>
                </tr>
              ) : (
                currentCards.map((card) => (
                  <tr
                    key={card.rfid_id}
                    className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                  >
                    <td className="px-4 py-2 font-semibold">{card.card_number}</td>
                    <td className="px-4 py-2">{card.user_name}</td>
                    <td className="px-4 py-2">{card.user_identifier || "N/A"}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getCardTypeColor(card.card_type)}`}>
                        {card.card_type}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(card.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {card.expiry_date
                        ? new Date(card.expiry_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(card.status)}`}>
                        {card.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {card.last_used
                        ? new Date(card.last_used).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(card)}
                          title="Edit"
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(card.rfid_id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
          <span className="text-xs sm:text-sm">
            Page <span className="font-semibold">{currentPage}</span> of{" "}
            <span className="font-semibold">{totalPages || 1}</span> | Total Records:{" "}
            {filteredCards.length}
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
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
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
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                <CreditCard className="inline w-5 h-5 text-indigo-600 mr-2" />
                {selectedCard ? "Edit" : "Register"} RFID Card
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 rounded-full p-1 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Card Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.card_number}
                  onChange={(e) =>
                    setFormData({ ...formData, card_number: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g., RFC123456789"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    User Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.user_name}
                    onChange={(e) =>
                      setFormData({ ...formData, user_name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    User Identifier
                  </label>
                  <input
                    type="text"
                    value={formData.user_identifier}
                    onChange={(e) =>
                      setFormData({ ...formData, user_identifier: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Student/Employee ID"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Card Type *
                  </label>
                  <select
                    required
                    value={formData.card_type}
                    onChange={(e) =>
                      setFormData({ ...formData, card_type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="lost">Lost</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issue_date}
                    onChange={(e) =>
                      setFormData({ ...formData, issue_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expiry_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  placeholder="Additional notes or remarks"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-sm shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-md transition-all text-sm shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40"
                >
                  {selectedCard ? "Update" : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFIDIntegration;
