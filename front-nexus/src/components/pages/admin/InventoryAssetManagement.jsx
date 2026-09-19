import { useState, useEffect } from "react";
import { ClipboardList, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Package, History, Wrench, FileText, TrendingDown, BarChart3 } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const InventoryAssetManagement = () => {
  const [activeTab, setActiveTab] = useState("assets");
  const [assets, setAssets] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("asset"); // asset, transfer, maintenance, request
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    // Asset fields
    asset_code: "",
    asset_name: "",
    asset_type: "equipment",
    category: "",
    description: "",
    serial_number: "",
    model_number: "",
    manufacturer: "",
    supplier: "",
    purchase_date: "",
    purchase_price: "",
    current_value: "",
    warranty_start_date: "",
    warranty_end_date: "",
    location: "",
    building: "",
    department: "",
    status: "available",
    assigned_to: "",
    custodian: "",
    condition: "good",
    depreciation_method: "straight_line",
    useful_life_years: 5,
    // Transfer fields
    from_location: "",
    to_location: "",
    transfer_reason: "",
    // Maintenance fields
    maintenance_type: "preventive",
    maintenance_date: "",
    maintenance_description: "",
    maintenance_cost: "",
    performed_by: "",
    // Request fields
    request_type: "new_asset",
    requested_item_name: "",
    justification: "",
    priority: "medium",
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "assets") {
        await Promise.all([fetchAssets(), fetchCategories()]);
      } else if (activeTab === "transfers") {
        await fetchTransfers();
      } else if (activeTab === "maintenance") {
        await fetchMaintenance();
      } else if (activeTab === "requests") {
        await fetchRequests();
      } else if (activeTab === "reports") {
        await fetchSummary();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/inventory/assets`);
      const data = await response.json();
      if (data.success) {
        setAssets(data.data);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/inventory/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTransfers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/inventory/transfers`);
      const data = await response.json();
      if (data.success) {
        setTransfers(data.data);
      }
    } catch (error) {
      console.error("Error fetching transfers:", error);
    }
  };

  const fetchMaintenance = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/inventory/maintenance`);
      const data = await response.json();
      if (data.success) {
        setMaintenance(data.data);
      }
    } catch (error) {
      console.error("Error fetching maintenance:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/inventory/requests`);
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/inventory/summary`);
      const data = await response.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleApproveRequest = async (requestId, newStatus) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/inventory/requests/${requestId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            status: newStatus,
            approved_by: 1, // TODO: Get from auth
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        fetchRequests();
      }
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let url, method, body;
      
      if (modalType === "asset") {
        url = selectedItem
          ? `${API_BASE}/api/inventory/assets/${selectedItem.asset_id}`
          : `${API_BASE}/api/inventory/assets`;
        method = selectedItem ? "PUT" : "POST";
        body = formData;
      } else if (modalType === "transfer") {
        url = `${API_BASE}/api/inventory/transfers`;
        method = "POST";
        body = {
          asset_id: selectedItem?.asset_id,
          from_location: formData.from_location,
          from_department: selectedItem?.department,
          from_assigned_to: selectedItem?.assigned_to,
          to_location: formData.to_location,
          to_department: formData.department,
          to_assigned_to: formData.assigned_to,
          reason: formData.transfer_reason,
          requested_by: 1, // TODO: Get from auth
        };
      } else if (modalType === "maintenance") {
        url = `${API_BASE}/api/inventory/maintenance`;
        method = "POST";
        body = {
          asset_id: selectedItem?.asset_id,
          maintenance_type: formData.maintenance_type,
          maintenance_date: formData.maintenance_date,
          description: formData.maintenance_description,
          maintenance_cost: formData.maintenance_cost,
          performed_by: formData.performed_by,
          created_by: 1, // TODO: Get from auth
        };
      } else if (modalType === "request") {
        url = `${API_BASE}/api/inventory/requests`;
        method = "POST";
        body = {
          request_type: formData.request_type,
          requested_item_name: formData.requested_item_name,
          justification: formData.justification,
          priority: formData.priority,
          requested_by: 1, // TODO: Get from auth
          department: formData.department,
        };
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success || data.asset_id || data.transfer_id || data.maintenance_id || data.request_id) {
        fetchData();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      try {
        const response = await fetch(`${API_BASE}/api/inventory/assets/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchAssets();
        }
      } catch (error) {
        console.error("Error deleting asset:", error);
      }
    }
  };

  const handleEdit = (asset) => {
    setSelectedItem(asset);
    setModalType("asset");
    setFormData({
      asset_code: asset.asset_code || "",
      asset_name: asset.asset_name,
      asset_type: asset.asset_type,
      category: asset.category || "",
      description: asset.description || "",
      serial_number: asset.serial_number || "",
      model_number: asset.model_number || "",
      manufacturer: asset.manufacturer || "",
      supplier: asset.supplier || "",
      purchase_date: asset.purchase_date?.split("T")[0] || "",
      purchase_price: asset.purchase_price || "",
      current_value: asset.current_value || "",
      warranty_start_date: asset.warranty_start_date?.split("T")[0] || "",
      warranty_end_date: asset.warranty_end_date?.split("T")[0] || "",
      location: asset.location || "",
      building: asset.building || "",
      department: asset.department || "",
      status: asset.status,
      assigned_to: asset.assigned_to || "",
      custodian: asset.custodian || "",
      condition: asset.condition,
      depreciation_method: asset.depreciation_method || "straight_line",
      useful_life_years: asset.useful_life_years || 5,
    });
    setShowModal(true);
  };

  const openTransferModal = (asset) => {
    setSelectedItem(asset);
    setModalType("transfer");
    setFormData({
      from_location: asset.location || "",
      to_location: "",
      department: "",
      assigned_to: "",
      transfer_reason: "",
    });
    setShowModal(true);
  };

  const openMaintenanceModal = (asset) => {
    setSelectedItem(asset);
    setModalType("maintenance");
    setFormData({
      maintenance_type: "preventive",
      maintenance_date: new Date().toISOString().split("T")[0],
      maintenance_description: "",
      maintenance_cost: "",
      performed_by: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setModalType("asset");
    setFormData({
      asset_code: "",
      asset_name: "",
      asset_type: "equipment",
      category: "",
      description: "",
      serial_number: "",
      model_number: "",
      manufacturer: "",
      supplier: "",
      purchase_date: "",
      purchase_price: "",
      current_value: "",
      warranty_start_date: "",
      warranty_end_date: "",
      location: "",
      building: "",
      department: "",
      status: "available",
      assigned_to: "",
      custodian: "",
      condition: "good",
      depreciation_method: "straight_line",
      useful_life_years: 5,
    });
  };

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesType = typeFilter === "all" || asset.asset_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssets = filteredAssets.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, activeTab]);

  const getStatusColor = (status) => {
    const colors = {
      available: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      in_use: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      maintenance: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      repair: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      disposed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      lost: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[status] || colors.available;
  };

  const tabs = [
    { id: "assets", label: "Assets", icon: Package },
    { id: "transfers", label: "Transfers", icon: History },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "requests", label: "Requests", icon: FileText },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList size={24} className="text-indigo-600" />
            Inventory Asset Management
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search assets..."
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
            {activeTab === "assets" && (
              <>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
                >
                  <option value="all">All Types</option>
                  <option value="equipment">Equipment</option>
                  <option value="furniture">Furniture</option>
                  <option value="electronics">Electronics</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="disposed">Disposed</option>
                </select>
              </>
            )}
            {activeTab === "assets" && (
              <button
                onClick={() => {
                  setModalType("asset");
                  setSelectedItem(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
              >
                <Plus size={14} />
                Add Asset
              </button>
            )}
            {activeTab === "requests" && (
              <button
                onClick={() => {
                  setModalType("request");
                  setSelectedItem(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
              >
                <Plus size={14} />
                New Request
              </button>
            )}
          </div>
        </div>

        {/* Assets Tab */}
        {activeTab === "assets" && (
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">Asset Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Serial Number</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Condition</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {currentAssets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No assets found
                  </td>
                </tr>
              ) : (
                currentAssets.map((asset) => (
                  <tr
                    key={asset.asset_id}
                    className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                  >
                    <td className="px-4 py-2">
                      <div className="font-semibold">{asset.asset_name}</div>
                      {asset.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                          {asset.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {asset.asset_type}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {asset.serial_number || "N/A"}
                    </td>
                    <td className="px-4 py-2">{asset.location || "N/A"}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
                        {asset.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs capitalize">{asset.condition}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(asset)}
                          title="Edit Asset"
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => openTransferModal(asset)}
                          title="Transfer Asset"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <History size={14} />
                        </button>
                        <button
                          onClick={() => openMaintenanceModal(asset)}
                          title="Schedule Maintenance"
                          className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Wrench size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.asset_id)}
                          title="Delete Asset"
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
        )}

        {/* Transfers Tab */}
        {activeTab === "transfers" && (
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">Asset Name</th>
                <th className="px-4 py-2.5">From Location</th>
                <th className="px-4 py-2.5">To Location</th>
                <th className="px-4 py-2.5">Transfer Date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Requested By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No transfers found
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr
                    key={transfer.transfer_id}
                    className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                  >
                    <td className="px-4 py-2 font-semibold">{transfer.asset_name || `Asset #${transfer.asset_id}`}</td>
                    <td className="px-4 py-2">{transfer.from_location}</td>
                    <td className="px-4 py-2">{transfer.to_location}</td>
                    <td className="px-4 py-2">{new Date(transfer.transfer_date).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        transfer.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {transfer.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{transfer.requested_by_name || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === "maintenance" && (
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">Asset Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Cost</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {maintenance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No maintenance records found
                  </td>
                </tr>
              ) : (
                maintenance.map((maint) => (
                  <tr
                    key={maint.maintenance_id}
                    className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                  >
                    <td className="px-4 py-2 font-semibold">{maint.asset_name || `Asset #${maint.asset_id}`}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {maint.maintenance_type}
                      </span>
                    </td>
                    <td className="px-4 py-2">{new Date(maint.maintenance_date).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <div className="max-w-xs truncate">{maint.description || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-2">₱{parseFloat(maint.maintenance_cost || 0).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        maint.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        maint.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {maint.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{maint.performed_by || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
        <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="px-4 py-2.5">Request Type</th>
                <th className="px-4 py-2.5">Item Name</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Requested By</th>
                <th className="px-4 py-2.5">Request Date</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.request_id}
                    className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                  >
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {request.request_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-semibold">{request.requested_item_name}</td>
                    <td className="px-4 py-2">{request.department || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        request.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        request.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{request.requested_by_name || 'N/A'}</td>
                    <td className="px-4 py-2">{new Date(request.request_date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      {request.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleApproveRequest(request.request_id, 'approved')}
                            title="Approve"
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors px-2 py-1 rounded text-xs font-medium hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveRequest(request.request_id, 'rejected')}
                            title="Reject"
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors px-2 py-1 rounded text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {request.status !== 'pending' && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">No actions</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && summary && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total Assets</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.total_assets}</p>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                  <Package className="text-indigo-600 dark:text-indigo-400" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total Value</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₱{parseFloat(summary.total_value || 0).toFixed(2)}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <TrendingDown className="text-green-600 dark:text-green-400" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Available</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.available_assets}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <Package className="text-green-600 dark:text-green-400" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">In Use</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.in_use_assets}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                  <Package className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Assets by Type */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-600" />
              Assets by Type
            </h3>
            <div className="space-y-3">
              {summary.by_type?.map((type) => (
                <div key={type.asset_type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize min-w-[100px]">
                      {type.asset_type}
                    </span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${(type.count / summary.total_assets) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white ml-3">{type.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assets by Status */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-600" />
              Assets by Status
            </h3>
            <div className="space-y-3">
              {summary.by_status?.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize min-w-[100px]">
                      {status.status.replace('_', ' ')}
                    </span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getStatusColor(status.status).replace('bg-', 'bg-').split(' ')[0]}`}
                        style={{ width: `${(status.count / summary.total_assets) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white ml-3">{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
          <span className="text-xs sm:text-sm">
            Page <span className="font-semibold">{currentPage}</span> of{" "}
            <span className="font-semibold">{totalPages || 1}</span> | Total Records:{" "}
            {filteredAssets.length}
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
                {modalType === "asset" && <Package className="inline w-5 h-5 text-indigo-600 mr-2" />}
                {modalType === "transfer" && <History className="inline w-5 h-5 text-blue-600 mr-2" />}
                {modalType === "maintenance" && <Wrench className="inline w-5 h-5 text-orange-600 mr-2" />}
                {modalType === "request" && <FileText className="inline w-5 h-5 text-purple-600 mr-2" />}
                {modalType === "asset" && (selectedItem ? "Edit" : "Add") + " Asset"}
                {modalType === "transfer" && "Transfer Asset"}
                {modalType === "maintenance" && "Schedule Maintenance"}
                {modalType === "request" && "New Request"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 rounded-full p-1 transition-all"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Asset Form */}
              {modalType === "asset" && (
              <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Asset Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.asset_name}
                  onChange={(e) =>
                    setFormData({ ...formData, asset_name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Asset Type *
                  </label>
                  <select
                    required
                    value={formData.asset_type}
                    onChange={(e) =>
                      setFormData({ ...formData, asset_type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  >
                    <option value="equipment">Equipment</option>
                    <option value="furniture">Furniture</option>
                    <option value="electronics">Electronics</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) =>
                      setFormData({ ...formData, serial_number: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
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
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_price: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Current Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_value}
                    onChange={(e) =>
                      setFormData({ ...formData, current_value: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  >
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="disposed">Disposed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Condition *
                  </label>
                  <select
                    required
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={formData.assigned_to}
                  onChange={(e) =>
                    setFormData({ ...formData, assigned_to: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  placeholder="Employee name or department"
                />
              </div>
              </>
              )}

              {/* Transfer Form */}
              {modalType === "transfer" && selectedItem && (
              <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Asset: {selectedItem.asset_name}</p>
                <p className="text-xs text-blue-700 dark:text-blue-400">Current Location: {selectedItem.location || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  From Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.from_location}
                  onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  To Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.to_location}
                  onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Employee name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Transfer Reason *
                </label>
                <textarea
                  rows="3"
                  required
                  value={formData.transfer_reason}
                  onChange={(e) => setFormData({ ...formData, transfer_reason: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>
              </>
              )}

              {/* Maintenance Form */}
              {modalType === "maintenance" && selectedItem && (
              <>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-3 mb-3">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-300">Asset: {selectedItem.asset_name}</p>
                <p className="text-xs text-orange-700 dark:text-orange-400">Serial: {selectedItem.serial_number || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Maintenance Type *
                  </label>
                  <select
                    required
                    value={formData.maintenance_type}
                    onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="preventive">Preventive</option>
                    <option value="corrective">Corrective</option>
                    <option value="predictive">Predictive</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Maintenance Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.maintenance_date}
                    onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description *
                </label>
                <textarea
                  rows="3"
                  required
                  value={formData.maintenance_description}
                  onChange={(e) => setFormData({ ...formData, maintenance_description: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  placeholder="Describe the maintenance work"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.maintenance_cost}
                    onChange={(e) => setFormData({ ...formData, maintenance_cost: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Performed By
                  </label>
                  <input
                    type="text"
                    value={formData.performed_by}
                    onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Technician name"
                  />
                </div>
              </div>
              </>
              )}

              {/* Request Form */}
              {modalType === "request" && (
              <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Request Type *
                  </label>
                  <select
                    required
                    value={formData.request_type}
                    onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="new_asset">New Asset</option>
                    <option value="replacement">Replacement</option>
                    <option value="repair">Repair</option>
                    <option value="upgrade">Upgrade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Priority *
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.requested_item_name}
                  onChange={(e) => setFormData({ ...formData, requested_item_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Name of the requested item"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Requesting department"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Justification *
                </label>
                <textarea
                  rows="4"
                  required
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  placeholder="Explain why this request is necessary"
                />
              </div>
              </>
              )}

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
                  {modalType === "asset" && (selectedItem ? "Update" : "Create")}
                  {modalType === "transfer" && "Submit Transfer"}
                  {modalType === "maintenance" && "Schedule"}
                  {modalType === "request" && "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAssetManagement;
