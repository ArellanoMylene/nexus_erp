import { useState, useEffect } from "react";
import { Mail, MessageSquare, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, BarChart3, Save, X, Send, Power, CheckCircle } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const EmailSMSGateway = () => {
  const [activeTab, setActiveTab] = useState("email");
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    gateway_name: "",
    gateway_type: "email",
    provider: "",
    configuration: {
      host: "",
      port: 587,
      secure: false,
      auth: {
        user: "",
        pass: "",
      },
    },
    is_active: false,
    is_default: false,
    daily_limit: 1000,
    monthly_limit: 30000,
  });

  const emailProviders = ["SMTP", "Gmail API", "SendGrid", "Mailgun", "Amazon SES"];
  const smsProviders = ["Twilio", "Nexmo", "Plivo", "MessageBird", "AWS SNS"];

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/system-settings/gateways`);
      const data = await response.json();
      if (data.success) {
        setGateways(data.data);
      }
    } catch (error) {
      console.error("Error fetching gateways:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedGateway
        ? `${API_BASE}/api/system-settings/gateways/${selectedGateway.gateway_id}`
        : `${API_BASE}/api/system-settings/gateways`;
      const method = selectedGateway ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert(selectedGateway ? "Gateway updated successfully!" : "Gateway created successfully!");
        setShowModal(false);
        resetForm();
        fetchGateways();
      }
    } catch (error) {
      console.error("Error saving gateway:", error);
      alert("Failed to save gateway");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this gateway?")) return;

    try {
      const response = await fetch(`${API_BASE}/api/system-settings/gateways/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        alert("Gateway deleted successfully!");
        fetchGateways();
      }
    } catch (error) {
      console.error("Error deleting gateway:", error);
      alert("Failed to delete gateway");
    }
  };

  const handleEdit = (gateway) => {
    setSelectedGateway(gateway);
    setFormData({
      gateway_name: gateway.gateway_name,
      gateway_type: gateway.gateway_type,
      provider: gateway.provider,
      configuration: gateway.configuration,
      is_active: gateway.is_active,
      is_default: gateway.is_default,
      daily_limit: gateway.daily_limit,
      monthly_limit: gateway.monthly_limit,
    });
    setShowModal(true);
  };

  const handleTest = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/system-settings/gateways/${id}/test`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        alert("Connection test successful!");
      } else {
        alert("Connection test failed!");
      }
    } catch (error) {
      console.error("Error testing gateway:", error);
      alert("Connection test failed!");
    }
  };

  const resetForm = () => {
    setFormData({
      gateway_name: "",
      gateway_type: activeTab,
      provider: "",
      configuration: activeTab === "email" 
        ? { host: "", port: 587, secure: false, auth: { user: "", pass: "" } }
        : { accountSid: "", authToken: "", fromNumber: "" },
      is_active: false,
      is_default: false,
      daily_limit: 1000,
      monthly_limit: 30000,
    });
    setSelectedGateway(null);
  };

  const filteredData = gateways.filter((item) => {
    const matchesTab = item.gateway_type === activeTab;
    const matchesSearch =
      item.gateway_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.provider.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const emailGateways = gateways.filter((g) => g.gateway_type === "email");
  const smsGateways = gateways.filter((g) => g.gateway_type === "sms");
  const activeGateways = gateways.filter((g) => g.is_active);

  return (
    <div className="min-h-screen dark:bg-slate-900 p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
            <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Email & SMS Gateway</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Configure communication gateways</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Gateway
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Gateways</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{gateways.length}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Email Gateways</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{emailGateways.length}</p>
            </div>
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">SMS Gateways</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{smsGateways.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Gateways</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{activeGateways.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => {
            setActiveTab("email");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "email"
              ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Gateways
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab("sms");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "sms"
              ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS Gateways
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search gateways..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Loading gateways...</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Gateway Name
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Default
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Daily Limit
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                      No gateways found
                    </td>
                  </tr>
                ) : (
                  currentData.map((gateway) => (
                    <tr key={gateway.gateway_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-2 text-sm font-medium text-slate-900 dark:text-white">
                        {gateway.gateway_name}
                      </td>
                      <td className="px-6 py-2 text-sm text-slate-600 dark:text-slate-300">
                        {gateway.provider}
                      </td>
                      <td className="px-6 py-2 text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            gateway.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {gateway.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-sm">
                        {gateway.is_default && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            Default
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-2 text-sm text-slate-600 dark:text-slate-300">
                        {gateway.daily_limit || "N/A"}
                      </td>
                      <td className="px-6 py-2 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTest(gateway.gateway_id)}
                            className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                            title="Test Connection"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(gateway)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(gateway.gateway_id)}
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
                  {selectedGateway ? "Edit Gateway" : "Add Gateway"}
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
                    Gateway Name *
                  </label>
                  <input
                    type="text"
                    value={formData.gateway_name}
                    onChange={(e) => setFormData({ ...formData, gateway_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Gateway Type *
                    </label>
                    <select
                      value={formData.gateway_type}
                      onChange={(e) => setFormData({ ...formData, gateway_type: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Provider *
                    </label>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">Select Provider</option>
                      {(formData.gateway_type === "email" ? emailProviders : smsProviders).map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Configuration Fields */}
                {formData.gateway_type === "email" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          value={formData.configuration.host || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              configuration: { ...formData.configuration, host: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Port
                        </label>
                        <input
                          type="number"
                          value={formData.configuration.port || 587}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              configuration: { ...formData.configuration, port: parseInt(e.target.value) },
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Email/Username
                        </label>
                        <input
                          type="text"
                          value={formData.configuration.auth?.user || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              configuration: {
                                ...formData.configuration,
                                auth: { ...formData.configuration.auth, user: e.target.value },
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={formData.configuration.auth?.pass || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              configuration: {
                                ...formData.configuration,
                                auth: { ...formData.configuration.auth, pass: e.target.value },
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Account SID
                      </label>
                      <input
                        type="text"
                        value={formData.configuration.accountSid || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            configuration: { ...formData.configuration, accountSid: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Auth Token
                      </label>
                      <input
                        type="password"
                        value={formData.configuration.authToken || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            configuration: { ...formData.configuration, authToken: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        From Number
                      </label>
                      <input
                        type="text"
                        value={formData.configuration.fromNumber || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            configuration: { ...formData.configuration, fromNumber: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Daily Limit
                    </label>
                    <input
                      type="number"
                      value={formData.daily_limit}
                      onChange={(e) => setFormData({ ...formData, daily_limit: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Monthly Limit
                    </label>
                    <input
                      type="number"
                      value={formData.monthly_limit}
                      onChange={(e) => setFormData({ ...formData, monthly_limit: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Set as Default</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    {selectedGateway ? "Update Gateway" : "Create Gateway"}
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

export default EmailSMSGateway;
