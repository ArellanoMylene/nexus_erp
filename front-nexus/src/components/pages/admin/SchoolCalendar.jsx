import { useState, useEffect } from "react";
import { Calendar, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SchoolCalendar = () => {
  const [calendarItems, setCalendarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    event_type: "",
    month: "",
    search: "",
  });

  const [formData, setFormData] = useState({
    event_name: "",
    event_type: "holiday",
    start_date: "",
    end_date: "",
    description: "",
    is_recurring: false,
  });

  useEffect(() => {
    fetchCalendarItems();
  }, []);

  const fetchCalendarItems = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(
        `${API_BASE}/api/events/calendar?${queryParams}`
      );
      const data = await response.json();
      if (data.success) {
        setCalendarItems(data.data);
      }
    } catch (error) {
      console.error("Error fetching calendar items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedItem
        ? `${API_BASE}/api/events/calendar/${selectedItem.calendar_id}`
        : `${API_BASE}/api/events/calendar`;

      const response = await fetch(url, {
        method: selectedItem ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success || data.calendar_id) {
        fetchCalendarItems();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving calendar item:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this calendar item?")) {
      try {
        const response = await fetch(
          `${API_BASE}/api/events/calendar/${id}`,
          {
            method: "DELETE",
          }
        );
        if (response.ok) {
          fetchCalendarItems();
        }
      } catch (error) {
        console.error("Error deleting calendar item:", error);
      }
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      event_name: item.event_name,
      event_type: item.event_type,
      start_date: item.start_date?.split("T")[0] || "",
      end_date: item.end_date?.split("T")[0] || "",
      description: item.description || "",
      is_recurring: item.is_recurring || false,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setFormData({
      event_name: "",
      event_type: "holiday",
      start_date: "",
      end_date: "",
      description: "",
      is_recurring: false,
    });
  };

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar size={24} className="text-indigo-600" />
            School Calendar
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search calendar items..."
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
              value={filters.event_type}
              onChange={(e) =>
                setFilters({ ...filters, event_type: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            >
              <option value="">All Types</option>
              <option value="holiday">Holiday</option>
              <option value="exam">Exam</option>
              <option value="break">Break</option>
              <option value="enrollment">Enrollment</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
            />
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              Add Calendar Item
            </button>
          </div>
        </div>

        {/* Calendar Items Table */}
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">
                    Event Name
                  </th>
                  <th className="px-4 py-2.5">
                    Type
                  </th>
                  <th className="px-4 py-2.5">
                    Start Date
                  </th>
                  <th className="px-4 py-2.5">
                    End Date
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
                {calendarItems
                  .filter(item => 
                    (filters.search === "" || 
                      item.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                      item.description?.toLowerCase().includes(filters.search.toLowerCase()))
                  )
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No calendar items found
                    </td>
                  </tr>
                ) : (
                  calendarItems
                    .filter(item => 
                      (filters.search === "" || 
                        item.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                        item.description?.toLowerCase().includes(filters.search.toLowerCase()))
                    )
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item) => (
                    <tr key={item.calendar_id} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150">
                      <td className="px-4 py-2">
                        <div className="font-semibold">
                          {item.event_name}
                        </div>
                        {item.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {item.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {new Date(item.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        {item.end_date ? new Date(item.end_date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {item.is_recurring && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Recurring
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          title="Edit"
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.calendar_id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Trash2 size={14} />
                        </button>
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
            <span className="font-semibold">{Math.ceil(calendarItems.filter(item => 
              (filters.search === "" || 
                item.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                item.description?.toLowerCase().includes(filters.search.toLowerCase()))
            ).length / itemsPerPage) || 1}</span> | Total Records:{" "}
            {calendarItems.filter(item => 
              (filters.search === "" || 
                item.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                item.description?.toLowerCase().includes(filters.search.toLowerCase()))
            ).length}
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
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(calendarItems.filter(item => 
                (filters.search === "" || 
                  item.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                  item.description?.toLowerCase().includes(filters.search.toLowerCase()))
              ).length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(calendarItems.filter(item => 
                (filters.search === "" || 
                  item.event_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                  item.description?.toLowerCase().includes(filters.search.toLowerCase()))
              ).length / itemsPerPage)}
              className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300" onClick={handleCloseModal}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedItem ? "Edit" : "Add"} Calendar Item
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.event_name}
                  onChange={(e) =>
                    setFormData({ ...formData, event_name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Event Type
                </label>
                <select
                  value={formData.event_type}
                  onChange={(e) =>
                    setFormData({ ...formData, event_type: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="holiday">Holiday</option>
                  <option value="exam">Exam</option>
                  <option value="break">Break</option>
                  <option value="enrollment">Enrollment</option>
                  <option value="event">Event</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) =>
                    setFormData({ ...formData, is_recurring: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="is_recurring"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Recurring Event
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {selectedItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolCalendar;
