import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
  DollarSign,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CreditCard,
  Calendar,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  TrendingUp,
  Wallet,
  BarChart3,
  Eye,
  Printer,
  Award,
} from "lucide-react";

const StudentFinance = () => {
  const [activeTab, setActiveTab] = useState("balance");
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [balance, setBalance] = useState(null);
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("payment"); // payment, receipt
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    invoice_id: "",
    amount: "",
    payment_method: "cash",
    reference_number: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "balance") {
        await Promise.all([fetchBalance(), fetchPaymentSchedule()]);
      } else if (activeTab === "receipts") {
        await fetchReceipts();
      } else if (activeTab === "history") {
        await fetchPayments();
      } else if (activeTab === "summary") {
        await fetchSummary();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const studentId = localStorage.getItem("userId");
      if (!studentId) return;

      const [invoiceRes, scholarshipRes] = await Promise.all([
        api.get(`/api/invoices`, { params: { student_id: studentId } }),
        api.get(`/api/scholarships/student/${studentId}`),
      ]);

      let scheduleData = {};
      try {
        const setupRes = await api.get(`/api/tuition-fees/student-schedule`);
        scheduleData = setupRes.data?.data || {};
        // eslint-disable-next-line no-empty
      } catch {}

      const invoices = invoiceRes.data.data || [];
      const scholarships = scholarshipRes.data.data || [];

      const activeGrant = scholarships.find(
        (s) => s.status === "Approved" || s.status === "Active",
      );

      // Calculate balance from invoices OR fall back to fee setup
      let totalBilled = invoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.total_amount) || 0),
        0,
      );
      let totalPaid = invoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.amount_paid) || 0),
        0,
      );
      let currentBalance = invoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.balance) || 0),
        0,
      );

      // If no invoices yet but fee setup exists, use the setup totals as expected fees
      if (invoices.length === 0 && scheduleData?.has_setup) {
        const s = scheduleData;
        totalBilled =
          parseFloat(s.tuition_fee || 0) +
          parseFloat(s.laboratory_fee || 0) +
          parseFloat(s.library_fee || 0) +
          parseFloat(s.athletic_fee || 0) +
          parseFloat(s.registration_fee || 0) +
          parseFloat(s.id_fee || 0) +
          parseFloat(s.miscellaneous_fee || 0) +
          parseFloat(s.other_fees || 0);
        totalPaid = 0;
        currentBalance = totalBilled;
      }

      let scholarshipDeduction = 0;
      if (activeGrant) {
        if (activeGrant.discount_type === "Percentage") {
          const tuitionBase = scheduleData.tuition_fee || 0;
          scholarshipDeduction =
            tuitionBase * (activeGrant.discount_value / 100);
        } else {
          scholarshipDeduction = parseFloat(activeGrant.discount_value) || 0;
        }
      }

      setBalance({
        total_tuition: totalBilled,
        total_paid: totalPaid,
        scholarship_deduction: scholarshipDeduction,
        remaining_balance: currentBalance,
      });
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchPaymentSchedule = async () => {
    try {
      const studentId = localStorage.getItem("userId");
      const [invoiceRes, setupRes] = await Promise.allSettled([
        api.get(`/api/invoices`, { params: { student_id: studentId } }),
        api.get(`/api/tuition-fees/student-schedule`),
      ]);

      const invoices =
        invoiceRes.status === "fulfilled"
          ? invoiceRes.value.data?.data || []
          : [];
      const scheduleData =
        setupRes.status === "fulfilled" ? setupRes.value.data?.data || {} : {};

      if (invoices.length > 0) {
        setPaymentSchedule(
          invoices.map((inv) => ({
            schedule_id: inv.invoice_id,
            due_date: inv.due_date,
            description: inv.notes || `Invoice #${inv.invoice_number}`,
            amount: inv.total_amount,
            paid_amount: inv.amount_paid,
            balance: inv.balance,
            status: inv.status,
          })),
        );
        return;
      }

      // No invoices yet — show expected fees from the tuition setup
      if (scheduleData?.has_setup) {
        const s = scheduleData;
        const feeItems = [
          { label: "Tuition Fee", amount: s.tuition_fee },
          { label: "Laboratory Fee", amount: s.laboratory_fee },
          { label: "Library Fee", amount: s.library_fee },
          { label: "Athletic Fee", amount: s.athletic_fee },
          { label: "Registration Fee", amount: s.registration_fee },
          { label: "ID Fee", amount: s.id_fee },
          { label: "Miscellaneous Fee", amount: s.miscellaneous_fee },
          { label: "Other Fees", amount: s.other_fees },
        ].filter((f) => parseFloat(f.amount) > 0);

        setPaymentSchedule(
          feeItems.map((f, idx) => ({
            schedule_id: `setup-${idx}`,
            due_date: new Date().toISOString(),
            description: `${f.label} — ${s.school_year} ${s.semester} (Expected)`,
            amount: f.amount,
            paid_amount: 0,
            balance: f.amount,
            status: "Pending",
          })),
        );
      } else {
        setPaymentSchedule([]);
      }
    } catch (error) {
      console.error("Error fetching payment schedule:", error);
    }
  };

  const fetchReceipts = async () => {
    try {
      const studentId = localStorage.getItem("userId");
      const response = await api.get(`/api/payments/student/${studentId}`);
      const paymentsData = response.data.data || [];
      setReceipts(
        paymentsData.map((p) => ({
          receipt_id: p.payment_id,
          receipt_number: p.receipt_number || p.payment_reference,
          payment_date: p.payment_date,
          description: p.notes || "Payment",
          payment_method: p.payment_method,
          amount: p.amount_paid,
          status: p.payment_status,
          semester: p.semester,
        })),
      );
    } catch (error) {
      console.error("Error fetching receipts:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const studentId = localStorage.getItem("userId");
      const response = await api.get(`/api/payments/student/${studentId}`);
      const paymentsData = response.data.data || [];
      setPayments(
        paymentsData.map((p) => ({
          payment_id: p.payment_id,
          reference_number: p.payment_reference,
          payment_date: p.payment_date,
          payment_method: p.payment_method,
          amount: p.amount_paid,
          status: p.payment_status,
          processed_by: p.collected_by_name,
          notes: p.notes,
        })),
      );
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const studentId = localStorage.getItem("userId");
      const [invoicesRes, paymentsRes] = await Promise.all([
        api.get(`/api/invoices`, { params: { student_id: studentId } }),
        api.get(`/api/payments/student/${studentId}`),
      ]);
      const invoices = invoicesRes.data.data || [];
      const paymentsData = paymentsRes.data.data || [];

      const totalTuition = invoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.total_amount) || 0),
        0,
      );
      const totalPaid = invoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.amount_paid) || 0),
        0,
      );
      const outstanding = invoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.balance) || 0),
        0,
      );

      setSummary({
        total_payments: paymentsData.length,
        total_amount_paid: totalPaid,
        outstanding_balance: outstanding,
        total_tuition: totalTuition,
        payment_progress:
          totalTuition > 0 ? Math.round((totalPaid / totalTuition) * 100) : 0,
        by_payment_method: Object.values(
          paymentsData.reduce((acc, p) => {
            const method = p.payment_method || "cash";
            if (!acc[method])
              acc[method] = { payment_method: method, total_amount: 0 };
            acc[method].total_amount += parseFloat(p.amount_paid) || 0;
            return acc;
          }, {}),
        ),
      });
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleDownloadReceipt = async (receiptId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/student/finance/receipts/${receiptId}/download`,
        { method: "GET" },
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt_${receiptId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Error downloading receipt:", error);
    }
  };

  const handlePrintReceipt = (receipt) => {
    // Open print dialog for receipt
    window.print();
  };

  const handleViewReceipt = (receipt) => {
    setSelectedItem(receipt);
    setModalType("receipt");
    setShowModal(true);
  };

  const handleMakePayment = () => {
    setModalType("payment");
    setSelectedItem(null);
    const firstUnpaid = paymentSchedule.find(
      (s) => !s.status || s.status.toLowerCase() !== "paid",
    );
    setFormData({
      invoice_id: firstUnpaid?.schedule_id
        ? String(firstUnpaid.schedule_id)
        : "",
      amount:
        firstUnpaid && parseFloat(firstUnpaid.balance) > 0
          ? String(parseFloat(firstUnpaid.balance).toFixed(2))
          : "",
      payment_method: "cash",
      reference_number: "",
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const studentId = localStorage.getItem("userId");
    try {
      await api.post(`/api/payments`, {
        invoice_id: formData.invoice_id,
        amount_paid: formData.amount,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number,
        payment_date: formData.payment_date,
        notes: formData.notes,
        student_id: studentId,
      });
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error("Error submitting payment:", error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setModalType("payment");
    setFormData({
      invoice_id: "",
      amount: "",
      payment_method: "cash",
      reference_number: "",
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  // Filter receipts
  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.receipt_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      receipt.payment_method
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      receipt.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || receipt.status === statusFilter;
    const matchesSemester =
      semesterFilter === "all" || receipt.semester === semesterFilter;

    return matchesSearch && matchesStatus && matchesSemester;
  });

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.reference_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.payment_method
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination for receipts
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReceipts = filteredReceipts.slice(startIndex, endIndex);

  // Pagination for payments
  const totalPagesPayments = Math.ceil(filteredPayments.length / itemsPerPage);
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, semesterFilter, activeTab]);

  const getStatusColor = (status) => {
    const colors = {
      // Invoice statuses
      Paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "Partially Paid":
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      Pending:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      Overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      Cancelled:
        "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      // Payment statuses
      Verified:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Cleared:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return colors[status] || colors.Pending;
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "cash":
        return <Wallet size={14} />;
      case "credit_card":
      case "debit_card":
        return <CreditCard size={14} />;
      case "bank_transfer":
        return <DollarSign size={14} />;
      default:
        return <Receipt size={14} />;
    }
  };

  const tabs = [
    { id: "balance", label: "Tuition Balance", icon: DollarSign },
    { id: "receipts", label: "Payment Receipts", icon: Receipt },
    { id: "history", label: "Payment History", icon: Clock },
    { id: "summary", label: "Financial Summary", icon: BarChart3 },
  ];

  return (
  <div className="dark:bg-slate-900 px-4 py-3 transition-colors duration-500">
      <div className="w-full space-y-2 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign size={24} className="text-indigo-600" />
            Student Finance
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Academic Year 2025-2026
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

        {/* Balance Overview Cards */}
        {activeTab === "balance" && balance && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-indigo-100 uppercase mb-1">
                    Total Fees
                  </p>
                  <p className="text-2xl font-bold">
                    ₱{parseFloat(balance.total_tuition || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <FileText className="text-white" size={28} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-100 uppercase mb-1">
                    Total Paid
                  </p>
                  <p className="text-2xl font-bold">
                    ₱{parseFloat(balance.total_paid || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <CheckCircle className="text-white" size={28} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-100 uppercase mb-1">
                    Scholarship
                  </p>
                  <p className="text-2xl font-bold">
                    ₱
                    {parseFloat(
                      balance.scholarship_deduction || 0,
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Award className="text-white" size={28} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-100 uppercase mb-1">
                    Remaining Balance
                  </p>
                  <p className="text-2xl font-bold">
                    ₱
                    {parseFloat(
                      balance.remaining_balance || 0,
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <AlertCircle className="text-white" size={28} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {(activeTab === "receipts" || activeTab === "history") && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input - LEFT */}
            <div className="relative flex-grow max-w-xs">
              <input
                type="text"
                placeholder={`Search ${activeTab === "receipts" ? "receipts" : "payments"}...`}
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
              {activeTab === "receipts" && (
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
                >
                  <option value="all">All Semesters</option>
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              )}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm w-40"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
              {activeTab === "balance" && (
                <button
                  onClick={handleMakePayment}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
                >
                  <Plus size={14} />
                  Make Payment
                </button>
              )}
            </div>
          </div>
        )}

        {/* Balance Tab - Payment Schedule */}
        {activeTab === "balance" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Payment Schedule
              </h3>
              <button
                onClick={handleMakePayment}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm border shadow-md shadow-indigo-500/30"
              >
                <Plus size={14} />
                Make Payment
              </button>
            </div>
            <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-700/70">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <th className="px-4 py-2.5">Due Date</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Paid Amount</th>
                    <th className="px-4 py-2.5">Balance</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {paymentSchedule.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                      >
                        No payment schedule found
                      </td>
                    </tr>
                  ) : (
                    paymentSchedule.map((schedule) => (
                      <tr
                        key={schedule.schedule_id}
                        className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(schedule.due_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {schedule.description}
                        </td>
                        <td className="px-4 py-2">
                          ₱{parseFloat(schedule.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          ₱
                          {parseFloat(
                            schedule.paid_amount || 0,
                          ).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 font-semibold">
                          ₱
                          {parseFloat(
                            schedule.amount - (schedule.paid_amount || 0),
                          ).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(schedule.status)}`}
                          >
                            {schedule.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Receipts Tab */}
        {activeTab === "receipts" && (
          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">Receipt #</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Payment Method</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {currentReceipts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      No receipts found
                    </td>
                  </tr>
                ) : (
                  currentReceipts.map((receipt) => (
                    <tr
                      key={receipt.receipt_id}
                      className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                    >
                      <td className="px-4 py-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {receipt.receipt_number}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(receipt.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{receipt.description}</div>
                        {receipt.semester && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {receipt.semester}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {getPaymentMethodIcon(receipt.payment_method)}
                          {receipt.payment_method.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-bold text-green-600 dark:text-green-400">
                        ₱{parseFloat(receipt.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(receipt.status)}`}
                        >
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewReceipt(receipt)}
                            title="View Receipt"
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadReceipt(receipt.receipt_id)
                            }
                            title="Download PDF"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(receipt)}
                            title="Print Receipt"
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <Printer size={14} />
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

        {/* Payment History Tab */}
        {activeTab === "history" && (
          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">Payment Date</th>
                  <th className="px-4 py-2.5">Reference #</th>
                  <th className="px-4 py-2.5">Payment Method</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Processed By</th>
                  <th className="px-4 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {currentPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      No payment history found
                    </td>
                  </tr>
                ) : (
                  currentPayments.map((payment) => (
                    <tr
                      key={payment.payment_id}
                      className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {payment.reference_number || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {getPaymentMethodIcon(payment.payment_method)}
                          {payment.payment_method.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-bold text-green-600 dark:text-green-400">
                        ₱{parseFloat(payment.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {payment.processed_by || "Self-Service"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate text-xs text-slate-500 dark:text-slate-400">
                          {payment.notes || "-"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === "summary" && summary && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Total Payments
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {summary.total_payments}
                    </p>
                  </div>
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                    <Receipt
                      className="text-indigo-600 dark:text-indigo-400"
                      size={24}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Total Amount Paid
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      ₱
                      {parseFloat(
                        summary.total_amount_paid || 0,
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                    <TrendingUp
                      className="text-green-600 dark:text-green-400"
                      size={24}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Outstanding Balance
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      ₱
                      {parseFloat(
                        summary.outstanding_balance || 0,
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                    <AlertCircle
                      className="text-red-600 dark:text-red-400"
                      size={24}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Payment Progress
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {summary.payment_progress}%
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                    <BarChart3
                      className="text-blue-600 dark:text-blue-400"
                      size={24}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Progress Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Payment Progress
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    ₱
                    {parseFloat(
                      summary.total_amount_paid || 0,
                    ).toLocaleString()}{" "}
                    of ₱
                    {parseFloat(summary.total_tuition || 0).toLocaleString()}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {summary.payment_progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-4 rounded-full transition-all flex items-center justify-end pr-2"
                    style={{ width: `${summary.payment_progress}%` }}
                  >
                    <span className="text-xs font-bold text-white">
                      {summary.payment_progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-600" />
                Payment Methods
              </h3>
              <div className="space-y-3">
                {summary.by_payment_method?.map((method) => (
                  <div
                    key={method.payment_method}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 capitalize min-w-[120px]">
                        {getPaymentMethodIcon(method.payment_method)}
                        {method.payment_method.replace("_", " ")}
                      </span>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${(method.total_amount / summary.total_amount_paid) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white ml-3">
                      ₱{parseFloat(method.total_amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {(activeTab === "receipts" || activeTab === "history") && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
            <span className="text-xs sm:text-sm">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">
                {activeTab === "receipts"
                  ? totalPages || 1
                  : totalPagesPayments || 1}
              </span>{" "}
              | Total Records:{" "}
              {activeTab === "receipts"
                ? filteredReceipts.length
                : filteredPayments.length}
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
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      prev + 1,
                      activeTab === "receipts"
                        ? totalPages
                        : totalPagesPayments,
                    ),
                  )
                }
                disabled={
                  currentPage ===
                  (activeTab === "receipts" ? totalPages : totalPagesPayments)
                }
                className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
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
                {modalType === "payment" && (
                  <>
                    <CreditCard className="inline w-5 h-5 text-indigo-600 mr-2" />
                    Make Payment
                  </>
                )}
                {modalType === "receipt" && (
                  <>
                    <Receipt className="inline w-5 h-5 text-green-600 mr-2" />
                    Payment Receipt
                  </>
                )}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 rounded-full p-1 transition-all"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            {/* Payment Form */}
            {modalType === "payment" && (
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Invoice *
                  </label>
                  <select
                    required
                    value={formData.invoice_id}
                    onChange={(e) => {
                      const inv = paymentSchedule.find(
                        (s) => String(s.schedule_id) === e.target.value,
                      );
                      setFormData({
                        ...formData,
                        invoice_id: e.target.value,
                        amount: inv
                          ? String((parseFloat(inv.balance) || 0).toFixed(2))
                          : formData.amount,
                      });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  >
                    <option value="">Select invoice…</option>
                    {paymentSchedule
                      .filter(
                        (s) => !s.status || s.status.toLowerCase() !== "paid",
                      )
                      .map((s) => {
                        const bal = parseFloat(s.balance) || 0;
                        return (
                          <option
                            key={s.schedule_id}
                            value={String(s.schedule_id)}
                          >
                            {s.description} — ₱
                            {bal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}{" "}
                            balance{s.due_date ? ` (due ${s.due_date})` : ""}
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Payment Method *
                    </label>
                    <select
                      required
                      value={formData.payment_method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_method: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    >
                      <option value="cash">Cash</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="online_payment">Online Payment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.payment_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reference_number: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    placeholder="Transaction or check number"
                  />
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
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all resize-none"
                    placeholder="Additional payment details"
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
                    Submit Payment
                  </button>
                </div>
              </form>
            )}

            {/* Receipt View */}
            {modalType === "receipt" && selectedItem && (
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  {/* Receipt Header */}
                  <div className="text-center mb-6">
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                      Official Receipt
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Receipt No: {selectedItem.receipt_number}
                    </p>
                  </div>

                  {/* Receipt Details */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Date
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {new Date(
                          selectedItem.payment_date,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Payment Method
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                        {selectedItem.payment_method.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Description
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {selectedItem.description}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Status
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                          selectedItem.status,
                        )}`}
                      >
                        {selectedItem.status}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="border-t border-b border-slate-300 dark:border-slate-600 py-4 my-4">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        Amount Paid
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        ₱{parseFloat(selectedItem.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                    <p>
                      This is an official receipt issued by the institution.
                    </p>
                    <p>Thank you for your payment!</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() =>
                      handleDownloadReceipt(selectedItem.receipt_id)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all text-sm shadow-md"
                  >
                    <Download size={14} />
                    Download PDF
                  </button>
                  <button
                    onClick={() => handlePrintReceipt(selectedItem)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-all text-sm shadow-md"
                  >
                    <Printer size={14} />
                    Print
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFinance;
