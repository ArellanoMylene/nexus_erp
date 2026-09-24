import { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

const PaymentGateway = () => {
  const [gateways, setGateways] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [summary, setSummary] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({
    gateway_name: "",
    transaction_status: "",
    start_date: "",
    end_date: "",
    search: "",
  });

  const [gatewayForm, setGatewayForm] = useState({
    gateway_id: null,
    gateway_name: "PayMaya",
    api_key: "",
    api_secret: "",
    merchant_id: "",
    is_active: true,
    is_test_mode: true,
    webhook_url: "",
    success_url: "",
    cancel_url: "",
    transaction_fee_percentage: 2.5,
    fixed_transaction_fee: 0,
    settings: "",
  });

  const gatewayProviders = [
    "PayMaya",
    "GCash",
    "PayPal",
    "Stripe",
    "Paynamics",
    "DragonPay",
    "PayMongo",
  ];

  const transactionStatuses = [
    "Pending",
    "Processing",
    "Success",
    "Failed",
    "Refunded",
  ];

  useEffect(() => {
    fetchGateways();
    fetchTransactions();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchGateways = async () => {
    try {
      const response = await api.get(`/api/payment-gateway/config`);
      setGateways(response.data.data || []);
    } catch (error) {
      console.error("Error fetching gateways:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get(`/api/payment-gateway/transactions`, {
        params: filters,
      });
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get(`/api/payment-gateway/summary`, {
        params: {
          start_date: filters.start_date,
          end_date: filters.end_date,
          gateway_name: filters.gateway_name,
        },
      });
      setSummary(response.data.data || {});
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleGatewaySubmit = async (e) => {
    e.preventDefault();
    try {
      if (gatewayForm.gateway_id) {
        await api.put(
          `/api/payment-gateway/config/${gatewayForm.gateway_id}`,
          gatewayForm
        );
      } else {
        await api.post(`/api/payment-gateway/config`, gatewayForm);
      }
      setShowGatewayModal(false);
      resetGatewayForm();
      fetchGateways();
      alert("Gateway configuration saved!");
    } catch (error) {
      console.error("Error saving gateway:", error);
      alert("Failed to save gateway configuration");
    }
  };

  const handleEditGateway = (gateway) => {
    setGatewayForm(gateway);
    setShowGatewayModal(true);
  };

  const handleDeleteGateway = async (id) => {
    if (window.confirm("Delete this gateway configuration?")) {
      try {
        await api.delete(`/api/payment-gateway/config/${id}`);
        fetchGateways();
      } catch (error) {
        console.error("Error deleting gateway:", error);
      }
    }
  };

  const handleVerifyTransaction = async (id) => {
    try {
      await api.post(`/api/payment-gateway/transactions/${id}/verify`);
      fetchTransactions();
      fetchSummary();
      alert("Transaction verified!");
    } catch (error) {
      console.error("Error verifying transaction:", error);
      alert("Failed to verify transaction");
    }
  };

  const resetGatewayForm = () => {
    setGatewayForm({
      gateway_id: null,
      gateway_name: "PayMaya",
      api_key: "",
      api_secret: "",
      merchant_id: "",
      is_active: true,
      is_test_mode: true,
      webhook_url: "",
      success_url: "",
      cancel_url: "",
      transaction_fee_percentage: 2.5,
      fixed_transaction_fee: 0,
      settings: "",
    });
  };

  return (
    <div className=" p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200  pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900  flex items-center gap-2">
            <CreditCard size={24} className="text-indigo-600" />
            Payment Gateway
          </h2>
          <span className="text-sm text-slate-500  font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white  p-4 rounded-lg shadow-sm border border-slate-200 ">
            <p className="text-sm text-slate-600 ">Total Processed</p>
            <p className="text-2xl font-bold text-indigo-600 ">
              ₱{parseFloat(summary.total_amount || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white  p-4 rounded-lg shadow-sm border border-slate-200 ">
            <p className="text-sm text-slate-600 ">Successful</p>
            <p className="text-2xl font-bold text-green-600 ">
              ₱{parseFloat(summary.successful_amount || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white  p-4 rounded-lg shadow-sm border border-slate-200 ">
            <p className="text-sm text-slate-600 ">Failed</p>
            <p className="text-2xl font-bold text-red-600 ">
              ₱{parseFloat(summary.failed_amount || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white  p-4 rounded-lg shadow-sm border border-slate-200 ">
            <p className="text-sm text-slate-600 ">Transactions</p>
            <p className="text-2xl font-bold text-slate-800 ">
              {summary.total_transactions || 0}
            </p>
          </div>
        </div>

        {/* Gateway Configurations */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800  flex items-center gap-2">
              <Settings className="text-indigo-600 " />
              Gateway Configurations
            </h2>
            <button
              onClick={() => {
                resetGatewayForm();
                setShowGatewayModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              Add Gateway
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gateways.map((gateway) => (
              <div
                key={gateway.gateway_id}
                className="bg-white  p-4 rounded-lg shadow-sm border border-slate-200  hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-indigo-600 " size={24} />
                    <h3 className="font-bold text-lg text-slate-800 ">{gateway.gateway_name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditGateway(gateway)}
                      className="text-indigo-600  hover:text-indigo-800  transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGateway(gateway.gateway_id)}
                      className="text-red-600  hover:text-red-800  transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 ">Status:</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${gateway.is_active
                        ? "bg-green-100  text-green-800 "
                        : "bg-slate-100  text-slate-800 "
                        }`}
                    >
                      {gateway.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 ">Mode:</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${gateway.is_test_mode
                        ? "bg-yellow-100  text-yellow-800 "
                        : "bg-indigo-100  text-indigo-800 "
                        }`}
                    >
                      {gateway.is_test_mode ? "Test" : "Live"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 ">Transaction Fee:</span>
                    <span className="font-semibold text-slate-800 ">
                      {gateway.transaction_fee_percentage}% + ₱
                      {parseFloat(gateway.fixed_transaction_fee).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 ">Merchant ID:</span>
                    <span className="font-mono text-xs truncate max-w-[150px] text-slate-800 ">
                      {gateway.merchant_id || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300  focus:outline-none focus:ring-2 focus:ring-indigo-500   text-sm transition-all shadow-inner"
            />
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
          </div>

          {/* Filters - RIGHT */}
          <div className="flex items-center gap-2">
            <select
              value={filters.gateway_name}
              onChange={(e) => {
                setFilters({ ...filters, gateway_name: e.target.value });
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-md border border-slate-300  focus:outline-none focus:ring-2 focus:ring-indigo-500   text-sm w-40"
            >
              <option value="">All Gateways</option>
              {gatewayProviders.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
            <select
              value={filters.transaction_status}
              onChange={(e) => {
                setFilters({ ...filters, transaction_status: e.target.value });
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-md border border-slate-300  focus:outline-none focus:ring-2 focus:ring-indigo-500   text-sm w-32"
            >
              <option value="">All Status</option>
              {transactionStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => {
                setFilters({ ...filters, start_date: e.target.value });
                setCurrentPage(1);
              }}
              placeholder="Start Date"
              className="px-3 py-2 rounded-md border border-slate-300  focus:outline-none focus:ring-2 focus:ring-indigo-500   text-sm w-36"
            />
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => {
                setFilters({ ...filters, end_date: e.target.value });
                setCurrentPage(1);
              }}
              placeholder="End Date"
              className="px-3 py-2 rounded-md border border-slate-300  focus:outline-none focus:ring-2 focus:ring-indigo-500   text-sm w-36"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800 ">Transaction History</h2>
          <div className="overflow-x-auto rounded border border-slate-200 ">
            <table className="min-w-full divide-y divide-slate-200 ">
              <thead className="bg-slate-100 ">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 ">
                  <th className="px-4 py-2.5">
                    Transaction ID
                  </th>
                  <th className="px-4 py-2.5">
                    Student
                  </th>
                  <th className="px-4 py-2.5">
                    Gateway
                  </th>
                  <th className="px-4 py-2.5">
                    Amount
                  </th>
                  <th className="px-4 py-2.5">
                    Date
                  </th>
                  <th className="px-4 py-2.5">
                    Status
                  </th>
                  <th className="px-4 py-2.5 w-1/12 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100  bg-white ">
                {(() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = transactions.filter((transaction) => {
                    const matchesSearch =
                      transaction.gateway_transaction_id?.toLowerCase().includes(searchTerm) ||
                      transaction.student_name?.toLowerCase().includes(searchTerm) ||
                      transaction.student_number?.toLowerCase().includes(searchTerm) ||
                      transaction.gateway_name?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });

                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

                  if (paginatedData.length === 0) {
                    return (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-4 text-center text-slate-500 italic"
                        >
                          No transactions found matching your search criteria.
                        </td>
                      </tr>
                    );
                  }

                  return paginatedData.map((transaction) => (
                    <tr key={transaction.transaction_id} className="text-sm text-slate-700  hover:bg-indigo-50/50  transition duration-150">
                      <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">
                        {transaction.gateway_transaction_id}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-sm">
                            {transaction.student_name}
                          </div>
                          <div className="text-sm text-slate-500 ">
                            {transaction.student_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-indigo-600 " />
                          <span className="text-sm">{transaction.gateway_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-semibold text-sm">
                        ₱{parseFloat(transaction.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {new Date(transaction.transaction_date).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {transaction.transaction_status === "Success" && (
                            <CheckCircle size={16} className="text-green-600 " />
                          )}
                          {transaction.transaction_status === "Failed" && (
                            <XCircle size={16} className="text-red-600 " />
                          )}
                          {(transaction.transaction_status === "Pending" ||
                            transaction.transaction_status === "Processing") && (
                              <Clock size={16} className="text-yellow-600 " />
                            )}
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${transaction.transaction_status === "Success"
                              ? "bg-green-100  text-green-800 "
                              : transaction.transaction_status === "Failed"
                                ? "bg-red-100  text-red-800 "
                                : transaction.transaction_status === "Refunded"
                                  ? "bg-purple-100  text-purple-800 "
                                  : "bg-yellow-100  text-yellow-800 "
                              }`}
                          >
                            {transaction.transaction_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right space-x-2">
                        {transaction.transaction_status === "Pending" && (
                          <button
                            onClick={() =>
                              handleVerifyTransaction(transaction.transaction_id)
                            }
                            className="text-indigo-600  hover:text-indigo-800  text-sm transition-colors"
                          >
                            Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 ">
          <span className="text-xs sm:text-sm">
            Page <span className="font-semibold">{currentPage}</span> of{" "}
            <span className="font-semibold">{(() => {
              const searchTerm = filters.search.toLowerCase();
              const filtered = transactions.filter((transaction) => {
                const matchesSearch =
                  transaction.gateway_transaction_id?.toLowerCase().includes(searchTerm) ||
                  transaction.student_name?.toLowerCase().includes(searchTerm) ||
                  transaction.student_number?.toLowerCase().includes(searchTerm) ||
                  transaction.gateway_name?.toLowerCase().includes(searchTerm);
                return matchesSearch;
              });
              return Math.ceil(filtered.length / itemsPerPage) || 1;
            })()}</span> | Total Records:{" "}
            {(() => {
              const searchTerm = filters.search.toLowerCase();
              const filtered = transactions.filter((transaction) => {
                const matchesSearch =
                  transaction.gateway_transaction_id?.toLowerCase().includes(searchTerm) ||
                  transaction.student_name?.toLowerCase().includes(searchTerm) ||
                  transaction.student_number?.toLowerCase().includes(searchTerm) ||
                  transaction.gateway_name?.toLowerCase().includes(searchTerm);
                return matchesSearch;
              });
              return filtered.length;
            })()}
          </span>
          <div className="flex gap-1 mt-2 sm:mt-0">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-300  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100  transition-colors"
            >
              <ChevronLeft size={16} className="text-slate-600 " />
            </button>
            {(() => {
              const searchTerm = filters.search.toLowerCase();
              const filtered = transactions.filter((transaction) => {
                const matchesSearch =
                  transaction.gateway_transaction_id?.toLowerCase().includes(searchTerm) ||
                  transaction.student_name?.toLowerCase().includes(searchTerm) ||
                  transaction.student_number?.toLowerCase().includes(searchTerm) ||
                  transaction.gateway_name?.toLowerCase().includes(searchTerm);
                return matchesSearch;
              });
              const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

              return [...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${currentPage === i + 1
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-slate-300  text-slate-700  hover:bg-slate-100 "
                    }`}
                >
                  {i + 1}
                </button>
              ));
            })()}
            <button
              onClick={() => {
                const searchTerm = filters.search.toLowerCase();
                const filtered = transactions.filter((transaction) => {
                  const matchesSearch =
                    transaction.gateway_transaction_id?.toLowerCase().includes(searchTerm) ||
                    transaction.student_name?.toLowerCase().includes(searchTerm) ||
                    transaction.student_number?.toLowerCase().includes(searchTerm) ||
                    transaction.gateway_name?.toLowerCase().includes(searchTerm);
                  return matchesSearch;
                });
                const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
                setCurrentPage(Math.min(totalPages, currentPage + 1));
              }}
              disabled={(() => {
                const searchTerm = filters.search.toLowerCase();
                const filtered = transactions.filter((transaction) => {
                  const matchesSearch =
                    transaction.gateway_transaction_id?.toLowerCase().includes(searchTerm) ||
                    transaction.student_name?.toLowerCase().includes(searchTerm) ||
                    transaction.student_number?.toLowerCase().includes(searchTerm) ||
                    transaction.gateway_name?.toLowerCase().includes(searchTerm);
                  return matchesSearch;
                });
                const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
                return currentPage === totalPages;
              })()}
              className="p-1.5 rounded border border-slate-300  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100  transition-colors"
            >
              <ChevronRight size={16} className="text-slate-600 " />
            </button>
          </div>
        </div>
      </div>

      {/* Gateway Configuration Modal */}
      {showGatewayModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowGatewayModal(false);
            resetGatewayForm();
          }}
        >
          <div
            className="bg-white  rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200 "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-slate-50  border-b border-slate-200  px-6 py-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 ">
                  {gatewayForm.gateway_id ? "Edit" : "Add"} Gateway Configuration
                </h2>
                <button
                  onClick={() => {
                    setShowGatewayModal(false);
                    resetGatewayForm();
                  }}
                  className="text-slate-400 hover:text-slate-600  transition-colors"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
            </div>

            {/* Form Wrapper */}
            <form onSubmit={handleGatewaySubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700  mb-1.5">
                      Gateway Provider *
                    </label>
                    <select
                      value={gatewayForm.gateway_name}
                      onChange={(e) =>
                        setGatewayForm({
                          ...gatewayForm,
                          gateway_name: e.target.value,
                        })
                      }
                      required
                      className="w-full border border-slate-300  rounded-lg px-3 py-2 text-sm bg-white  text-slate-900  focus:outline-none focus:ring-2 focus:ring-indigo-500 "
                    >
                      {gatewayProviders.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700  mb-1.5">
                      Merchant ID
                    </label>
                    <input
                      type="text"
                      value={gatewayForm.merchant_id}
                      onChange={(e) =>
                        setGatewayForm({
                          ...gatewayForm,
                          merchant_id: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300  rounded-lg px-3 py-2 text-sm bg-white  text-slate-900  focus:outline-none focus:ring-2 focus:ring-indigo-500 "
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1.5">
                    API Key *
                  </label>
                  <input
                    type="text"
                    value={gatewayForm.api_key}
                    onChange={(e) =>
                      setGatewayForm({
                        ...gatewayForm,
                        api_key: e.target.value,
                      })
                    }
                    required
                    className="w-full border border-slate-300  rounded-lg px-3 py-2 text-sm bg-white  text-slate-900  focus:outline-none focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1.5">
                    API Secret *
                  </label>
                  <input
                    type="password"
                    value={gatewayForm.api_secret}
                    onChange={(e) =>
                      setGatewayForm({
                        ...gatewayForm,
                        api_secret: e.target.value,
                      })
                    }
                    required
                    className="w-full border border-slate-300  rounded-lg px-3 py-2 text-sm bg-white  text-slate-900  focus:outline-none focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700  mb-1.5">
                      Fee Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={gatewayForm.transaction_fee_percentage}
                      onChange={(e) =>
                        setGatewayForm({
                          ...gatewayForm,
                          transaction_fee_percentage: e.target.value,
                        })
                      }
                      step="0.01"
                      className="w-full border border-slate-300  rounded-lg px-3 py-2 text-sm bg-white  text-slate-900  focus:outline-none focus:ring-2 focus:ring-indigo-500 "
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700  mb-1.5">
                      Fixed Fee (₱)
                    </label>
                    <input
                      type="number"
                      value={gatewayForm.fixed_transaction_fee}
                      onChange={(e) =>
                        setGatewayForm({
                          ...gatewayForm,
                          fixed_transaction_fee: e.target.value,
                        })
                      }
                      step="0.01"
                      className="w-full border border-slate-300  rounded-lg px-3 py-2 text-sm bg-white  text-slate-900  focus:outline-none focus:ring-2 focus:ring-indigo-500 "
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1.5">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={gatewayForm.webhook_url}
                    onChange={(e) =>
                      setGatewayForm({
                        ...gatewayForm,
                        webhook_url: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300  rounded-lg px-3 py-2 text-sm bg-white  text-slate-900  focus:outline-none focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700  mb-1.5">
                      Success URL
                    </label>
                    <input
                      type="url"
                      value={gatewayForm.success_url}
                      onChange={(e) =>
                        setGatewayForm({
                          ...gatewayForm,
                          success_url: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300  rounded-lg px-3 py-2 text-sm bg-white  text-slate-900  focus:outline-none focus:ring-2 focus:ring-indigo-500 "
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700  mb-1.5">
                      Cancel URL
                    </label>
                    <input
                      type="url"
                      value={gatewayForm.cancel_url}
                      onChange={(e) =>
                        setGatewayForm({
                          ...gatewayForm,
                          cancel_url: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300  rounded-lg px-3 py-2 text-sm bg-white  text-slate-900  focus:outline-none focus:ring-2 focus:ring-indigo-500 "
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={gatewayForm.is_active}
                    onChange={(e) =>
                      setGatewayForm({
                        ...gatewayForm,
                        is_active: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300  text-indigo-600 focus:ring-indigo-500 "
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-medium text-slate-700 "
                  >
                    Gateway Active
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_test_mode"
                    checked={gatewayForm.is_test_mode}
                    onChange={(e) =>
                      setGatewayForm({
                        ...gatewayForm,
                        is_test_mode: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300  text-indigo-600 focus:ring-indigo-500 "
                  />
                  <label
                    htmlFor="is_test_mode"
                    className="text-sm font-medium text-slate-700 "
                  >
                    Enable Test Mode
                  </label>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-slate-50  border-t border-slate-200  px-6 py-4 rounded-b-lg">
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGatewayModal(false);
                      resetGatewayForm();
                    }}
                    className="px-4 py-2 border border-slate-300  rounded-lg text-slate-700  hover:bg-slate-100  transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700  transition-colors text-sm font-medium"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentGateway;
