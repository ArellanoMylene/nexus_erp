import { useState, useEffect } from "react";
import { Settings, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, BarChart3, Save, X } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const GeneralSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    setting_key: "",
    setting_value: "",
    description: "",
    category: "general",
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "general", label: "General" },
    { value: "academic", label: "Academic" },
    { value: "security", label: "Security" },
    { value: "notifications", label: "Notifications" },
    { value: "maintenance", label: "Maintenance" },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/system-settings/settings`);
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = `${API_BASE}/api/system-settings/settings`;
      const method = "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert(selectedSetting ? "Setting updated successfully!" : "Setting created successfully!");
        setShowModal(false);
        resetForm();
        fetchSettings();
      }
    } catch (error) {
      console.error("Error saving setting:", error);
      alert("Failed to save setting");
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm("Are you sure you want to delete this setting?")) return;

    try {
      const response = await fetch(`${API_BASE}/api/system-settings/settings/${key}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        alert("Setting deleted successfully!");
        fetchSettings();
      }
    } catch (error) {
      console.error("Error deleting setting:", error);
      alert("Failed to delete setting");
    }
  };

  const handleEdit = (setting) => {
    setSelectedSetting(setting);
    setFormData({
      setting_key: setting.setting_key,
      setting_value: setting.setting_value,
      description: setting.description || "",
      category: setting.category || "general",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      setting_key: "",
      setting_value: "",
      description: "",
      category: "general",
    });
    setSelectedSetting(null);
  };

  const filteredData = settings.filter((item) => {
    const matchesSearch =
      item.setting_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.setting_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="min-h-screen dark:bg-slate-900 p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
            <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">General Settings</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage system configuration settings</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Setting
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Settings</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{settings.length}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        {categories.slice(1).map((cat) => {
          const count = settings.filter((s) => s.category === cat.value).length;
          return (
            <div key={cat.value} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{cat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{count}</p>
                </div>
                <Settings className="h-8 w-8 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Loading settings...</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Setting Key
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                      No settings found
                    </td>
                  </tr>
                ) : (
                  currentData.map((setting) => (
                    <tr key={setting.setting_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-2 text-sm font-medium text-slate-900 dark:text-white">
                        {setting.setting_key}
                      </td>
                      <td className="px-6 py-2 text-sm text-slate-600 dark:text-slate-300">
                        {setting.setting_value}
                      </td>
                      <td className="px-6 py-2 text-sm text-slate-600 dark:text-slate-300">
                        {setting.description || "N/A"}
                      </td>
                      <td className="px-6 py-2 text-sm">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {setting.category}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(setting)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(setting.setting_key)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
        <div>
          Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {selectedSetting ? "Edit Setting" : "Add Setting"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Setting Key *
                  </label>
                  <input
                    type="text"
                    value={formData.setting_key}
                    onChange={(e) => setFormData({ ...formData, setting_key: e.target.value })}
                    disabled={!!selectedSetting}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Setting Value *
                  </label>
                  <input
                    type="text"
                    value={formData.setting_value}
                    onChange={(e) => setFormData({ ...formData, setting_value: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    {categories.slice(1).map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    {selectedSetting ? "Update Setting" : "Create Setting"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralSettings;
