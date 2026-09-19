import { useState, useEffect } from "react";
import api from "../../../api/axios";
import { Plus, Edit, Trash2, Search, FileText, ChevronLeft, ChevronRight, Users } from "lucide-react";

const STAFF_ROLES = ["Faculty", "Admin", "HR", "Accounting", "Staff"];

const ALL_FEE_FIELDS = [
  { name: "tuition_fee",       label: "Tuition Fee" },
  { name: "laboratory_fee",    label: "Laboratory Fee" },
  { name: "library_fee",       label: "Library Fee" },
  { name: "athletic_fee",      label: "Athletic Fee" },
  { name: "registration_fee",  label: "Registration Fee" },
  { name: "id_fee",            label: "School ID Fee" },
  { name: "admission_fee",     label: "Admission Fee" },
  { name: "entrance_fee",      label: "Entrance Fee" },
  { name: "guidance_fee",      label: "Guidance Fee" },
  { name: "handbook_fee",      label: "Handbook Fee" },
  { name: "medical_dental_fee",label: "Medical & Dental Fee" },
  { name: "computer_fee",      label: "Computer Fee" },
  { name: "cultural_fee",      label: "Cultural Fee" },
  { name: "development_fee",   label: "Development Fee" },
  { name: "nstp_fee",          label: "NSTP Fee" },
];

const EMPTY_FORM = {
  invoice_id:          null,
  student_id:          "",
  academic_period_id:  "",
  tuition_fee:         0,
  laboratory_fee:      0,
  library_fee:         0,
  athletic_fee:        0,
  registration_fee:    0,
  id_fee:              0,
  admission_fee:       0,
  entrance_fee:        0,
  guidance_fee:        0,
  handbook_fee:        0,
  medical_dental_fee:  0,
  computer_fee:        0,
  cultural_fee:        0,
  development_fee:     0,
  nstp_fee:            0,
  discount_amount:     0,
  scholarship_amount:  0,
  invoice_date:        new Date().toISOString().split("T")[0],
  due_date:            "",
  notes:               "",
};

const InvoiceManagement = () => {
  const [invoices,       setInvoices]       = useState([]);
  const [students,       setStudents]       = useState([]);
  const [staffUsers,     setStaffUsers]     = useState([]);
  const [periods,        setPeriods]        = useState([]);
  const [showModal,      setShowModal]      = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [summary,        setSummary]        = useState({});
  const [filters,        setFilters]        = useState({ status: "", academic_period_id: "", search: "" });
  const [currentPage,    setCurrentPage]    = useState(1);
  const [itemsPerPage]                      = useState(10);
  const [formData,       setFormData]       = useState(EMPTY_FORM);
  const [staffFormData,  setStaffFormData]  = useState({
    user_id:            "",
    academic_period_id: "",
    fee_label:          "",
    amount:             0,
    invoice_date:       new Date().toISOString().split("T")[0],
    due_date:           "",
    notes:              "",
  });

  useEffect(() => {
    fetchInvoices();
    fetchSummary();
    fetchPeriods();
    fetchStudents();
    fetchStaffUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/api/users`);
      const all = res.data.users || res.data.data || res.data || [];
      setStudents(all.filter((u) => u.role === "Student"));
    } catch (e) { console.error("Error fetching students:", e); }
  };

  const fetchStaffUsers = async () => {
    try {
      const res = await api.get(`/api/users`);
      const all = res.data.users || res.data.data || res.data || [];
      setStaffUsers(all.filter((u) => STAFF_ROLES.includes(u.role)));
    } catch (e) { console.error("Error fetching staff:", e); }
  };

  const fetchInvoices = async () => {
    try {
      const res = await api.get(`/api/invoices`, { params: filters });
      setInvoices(res.data.data || []);
    } catch (e) { console.error("Error fetching invoices:", e); }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/api/invoices/summary`, {
        params: { academic_period_id: filters.academic_period_id },
      });
      setSummary(res.data.data || {});
    } catch (e) { console.error("Error fetching summary:", e); }
  };

  const fetchPeriods = async () => {
    try {
      const res = await api.get(`/api/academic-periods`);
      setPeriods(res.data.data || res.data || []);
    } catch (e) { console.error("Error fetching periods:", e); }
  };

  const handleInputChange      = (e) => { const { name, value } = e.target; setFormData((p) => ({ ...p, [name]: value })); };
  const handleStaffInputChange = (e) => { const { name, value } = e.target; setStaffFormData((p) => ({ ...p, [name]: value })); };

  // ── Subtotal = all fee fields added together ──────────────────────────────
  const calculateSubtotal = () =>
    ALL_FEE_FIELDS.reduce((sum, f) => sum + parseFloat(formData[f.name] || 0), 0);

  const calculateTotal = () =>
    calculateSubtotal() -
    parseFloat(formData.discount_amount   || 0) -
    parseFloat(formData.scholarship_amount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const invoiceData = {
        ...formData,
        subtotal:     calculateSubtotal(),
        total_amount: calculateTotal(),
        status:       formData.status || "Pending",
      };
      if (formData.invoice_id) {
        await api.put(`/api/invoices/${formData.invoice_id}`, invoiceData);
      } else {
        await api.post(`/api/invoices`, invoiceData);
      }
      setShowModal(false);
      resetForm();
      fetchInvoices();
      fetchSummary();
    } catch (e) {
      console.error("Error saving invoice:", e);
      alert("Failed to save invoice");
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedUser = staffUsers.find(
        (u) => u.user_id?.toString() === staffFormData.user_id?.toString()
      );
      const amount = parseFloat(staffFormData.amount || 0);

      const invoiceData = {
        student_id:         staffFormData.user_id,
        academic_period_id: staffFormData.academic_period_id || null,
        // all fee fields default 0 except other_fees carries the amount
        ...Object.fromEntries(ALL_FEE_FIELDS.map((f) => [f.name, 0])),
        other_fees:         amount,
        subtotal:           amount,
        discount_amount:    0,
        scholarship_amount: 0,
        total_amount:       amount,
        invoice_date:       staffFormData.invoice_date,
        due_date:           staffFormData.due_date || staffFormData.invoice_date,
        status:             "Pending",
        notes:              `[STAFF INVOICE] ${staffFormData.fee_label}${staffFormData.notes ? " — " + staffFormData.notes : ""}`,
      };
      await api.post(`/api/invoices`, invoiceData);

      await api.post(`/api/income-expenses`, {
        transaction_type: "Income",
        category:         "Other Fees",
        amount,
        transaction_date: staffFormData.invoice_date,
        department:       selectedUser?.department || "General",
        description:      `Staff invoice — ${staffFormData.fee_label} for ${selectedUser?.first_name ?? ""} ${selectedUser?.last_name ?? ""} (${selectedUser?.role ?? ""})`,
        reference_number: "",
        payment_method:   "Cash",
        recorded_by:      "Accounting",
      });

      setShowStaffModal(false);
      resetStaffForm();
      fetchInvoices();
      fetchSummary();
      alert("Staff invoice created and recorded as income successfully.");
    } catch (e) {
      console.error("Error saving staff invoice:", e);
      alert("Failed to save staff invoice: " + JSON.stringify(e.response?.data || e.message));
    }
  };

  const handleEdit = (invoice) => {
    // Merge invoice data into EMPTY_FORM so new fee fields are always present
    setFormData({ ...EMPTY_FORM, ...invoice });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await api.delete(`/api/invoices/${id}`);
      fetchInvoices();
      fetchSummary();
    } catch (e) { console.error("Error deleting invoice:", e); }
  };

  const resetForm      = () => setFormData(EMPTY_FORM);
  const resetStaffForm = () => setStaffFormData({
    user_id: "", academic_period_id: "", fee_label: "", amount: 0,
    invoice_date: new Date().toISOString().split("T")[0], due_date: "", notes: "",
  });

  // Search + paginate
  const searchTerm       = filters.search.toLowerCase();
  const filteredInvoices = invoices.filter((inv) =>
    inv.invoice_number?.toLowerCase().includes(searchTerm) ||
    inv.student_name?.toLowerCase().includes(searchTerm)   ||
    inv.student_number?.toLowerCase().includes(searchTerm)
  );
  const totalPages    = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedData = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── shared input style ───────────────────────────────────────────────────
  const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoice Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage student invoices</p>
          </div>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Data Integrity: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Billed",        value: summary.total_billed   || 0, color: "text-indigo-600 dark:text-indigo-400" },
          { label: "Total Paid",          value: summary.total_paid     || 0, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Outstanding Balance", value: summary.total_balance  || 0, color: "text-red-600 dark:text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>₱{parseFloat(value).toLocaleString()}</p>
          </div>
        ))}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Invoices</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.total_invoices || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search student, invoice..." value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white">
              <option value="">All Status</option>
              {["Pending","Partially Paid","Paid","Overdue"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.academic_period_id}
              onChange={(e) => { setFilters({ ...filters, academic_period_id: e.target.value }); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white">
              <option value="">All Periods</option>
              {periods.map((p) => <option key={p.period_id} value={p.period_id}>{p.school_year} - {p.semester}</option>)}
            </select>
            <button onClick={() => { resetStaffForm(); setShowStaffModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 shadow-md shadow-amber-500/30">
              <Users size={18} /> Staff Invoice
            </button>
            <button onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-md shadow-indigo-500/30">
              <Plus size={18} /> Create Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              {["Invoice #","Student / Staff","Date","Total","Paid","Balance","Status","Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
            {paginatedData.length === 0 ? (
              <tr><td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No invoices found.</td></tr>
            ) : paginatedData.map((inv) => {
              const isStaff = inv.notes?.startsWith("[STAFF INVOICE]");
              return (
                <tr key={inv.invoice_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-2 font-mono text-sm text-slate-900 dark:text-white whitespace-nowrap">
                    {inv.invoice_number}
                    {isStaff && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded">STAFF</span>}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="font-medium text-sm text-slate-900 dark:text-white">{inv.student_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{inv.student_number}</div>
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 font-semibold text-sm text-slate-900 dark:text-white whitespace-nowrap">₱{parseFloat(inv.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">₱{parseFloat(inv.amount_paid || 0).toLocaleString()}</td>
                  <td className="px-4 py-2 font-semibold text-sm text-red-600 dark:text-red-400 whitespace-nowrap">₱{parseFloat(inv.balance || 0).toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      inv.status === "Paid"           ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : inv.status === "Partially Paid" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      : inv.status === "Overdue"      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                    }`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(inv)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300" title="Edit"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(inv.invoice_id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
        <span className="text-xs sm:text-sm">
          Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> | Total: {filteredInvoices.length}
        </span>
        <div className="flex gap-1 mt-2 sm:mt-0">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700">
            <ChevronLeft size={16} />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i + 1} onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                currentPage === i + 1 ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}>{i + 1}</button>
          ))}
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Student Invoice Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {formData.invoice_id ? "Edit" : "Create"} Invoice
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Student + Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Student *</label>
                  <select name="student_id" value={formData.student_id} onChange={handleInputChange} required className={inputCls}>
                    <option value="">Select Student</option>
                    {students.map((s) => (
                      <option key={s.user_id} value={s.user_id}>
                        {s.student_number ? `${s.student_number} - ` : ""}{s.first_name} {s.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Period *</label>
                  <select name="academic_period_id" value={formData.academic_period_id} onChange={handleInputChange} required className={inputCls}>
                    <option value="">Select Period</option>
                    {periods.map((p) => <option key={p.period_id} value={p.period_id}>{p.school_year} - {p.semester}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Invoice Date *</label>
                  <input type="date" name="invoice_date" value={formData.invoice_date} onChange={handleInputChange} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                  <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} className={inputCls} />
                </div>
              </div>

              {/* All Fee Fields */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Fee Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ALL_FEE_FIELDS.map((f) => (
                    <div key={f.name}>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{f.label}</label>
                      <input type="number" name={f.name} value={formData[f.name]} onChange={handleInputChange} step="0.01" min="0" className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Discounts</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Discount Amount</label>
                    <input type="number" name="discount_amount" value={formData.discount_amount} onChange={handleInputChange} step="0.01" min="0" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Scholarship Amount</label>
                    <input type="number" name="scholarship_amount" value={formData.scholarship_amount} onChange={handleInputChange} step="0.01" min="0" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">₱{calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Total Discounts:</span>
                  <span className="text-red-600 dark:text-red-400">
                    -₱{(parseFloat(formData.discount_amount || 0) + parseFloat(formData.scholarship_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-indigo-200 dark:border-indigo-800 pt-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total:</span>
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">₱{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-md shadow-indigo-500/30">
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Staff Invoice Modal ───────────────────────────────────────────── */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50" onClick={() => setShowStaffModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20 rounded-t-lg z-10">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Staff / Faculty Invoice</h3>
              </div>
              <button onClick={() => { setShowStaffModal(false); resetStaffForm(); }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleStaffSubmit} className="p-4 space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-3 py-2">
                This invoice will also be recorded as an <strong>Income transaction</strong> automatically.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Staff / Faculty Member *</label>
                <select name="user_id" value={staffFormData.user_id} onChange={handleStaffInputChange} required
                  className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")}>
                  <option value="">Select Member</option>
                  {STAFF_ROLES.map((role) => {
                    const group = staffUsers.filter((u) => u.role === role);
                    if (!group.length) return null;
                    return (
                      <optgroup key={role} label={role}>
                        {group.map((u) => <option key={u.user_id} value={u.user_id}>{u.first_name} {u.last_name}</option>)}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Period</label>
                <select name="academic_period_id" value={staffFormData.academic_period_id} onChange={handleStaffInputChange}
                  className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")}>
                  <option value="">None / Not Applicable</option>
                  {periods.map((p) => <option key={p.period_id} value={p.period_id}>{p.school_year} - {p.semester}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Fee / Charge Label *</label>
                <input type="text" name="fee_label" value={staffFormData.fee_label} onChange={handleStaffInputChange} required
                  placeholder="e.g. ID Replacement Fee, Training Fee..."
                  className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amount *</label>
                <input type="number" name="amount" value={staffFormData.amount} onChange={handleStaffInputChange} step="0.01" required min="0.01"
                  className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Invoice Date *</label>
                  <input type="date" name="invoice_date" value={staffFormData.invoice_date} onChange={handleStaffInputChange} required
                    className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                  <input type="date" name="due_date" value={staffFormData.due_date} onChange={handleStaffInputChange}
                    className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <textarea name="notes" value={staffFormData.notes} onChange={handleStaffInputChange} rows="2"
                  className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")} />
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Amount:</span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  ₱{parseFloat(staffFormData.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={() => { setShowStaffModal(false); resetStaffForm(); }}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 shadow-md shadow-amber-500/30">
                  Create Staff Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;