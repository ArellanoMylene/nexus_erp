import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import Select from "react-select";
import api from "../../../api/axios";
import { Plus, Edit, Trash2, Search, FileText, ChevronLeft, ChevronRight, Users } from "lucide-react";

const STAFF_ROLES = ["Faculty", "Admin", "HR", "Accounting", "Staff"];
const STAFF_ROLE_KEYS = new Set(STAFF_ROLES.map((role) => role.toLowerCase()));
const formatDateInput = (value) => {
  if (!value) return "";
  if (!(value instanceof Date)) return String(value).slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};

const ALL_FEE_FIELDS = [
  { name: "tuition_fee",       label: "Tuition Fee" },
  { name: "laboratory_fee",    label: "Laboratory Fee" },
  { name: "library_fee",       label: "Library Fee" },
  { name: "athletic_fee",      label: "Athletic Fee" },
  { name: "registration_fee",  label: "Registration Fee" },
  { name: "id_fee",            label: "School ID Fee" },
  { name: "miscellaneous_fee", label: "Miscellaneous Fee" },
  { name: "admission_fee",     label: "Admission Fee" },
  { name: "entrance_fee",      label: "Entrance Fee" },
  { name: "guidance_fee",      label: "Guidance Fee" },
  { name: "handbook_fee",      label: "Handbook Fee" },
  { name: "medical_dental_fee",label: "Medical & Dental Fee" },
  { name: "computer_fee",      label: "Computer Fee" },
  { name: "cultural_fee",      label: "Cultural Fee" },
  { name: "development_fee",   label: "Development Fee" },
  { name: "nstp_fee",          label: "NSTP Fee" },
  { name: "other_fees",        label: "Other Fees" },
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
  miscellaneous_fee:   0,
  admission_fee:       0,
  entrance_fee:        0,
  guidance_fee:        0,
  handbook_fee:        0,
  medical_dental_fee:  0,
  computer_fee:        0,
  cultural_fee:        0,
  development_fee:     0,
  nstp_fee:            0,
  other_fees:          0,
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
  const [deleteInvoiceTarget, setDeleteInvoiceTarget] = useState(null);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);
  const [summary,        setSummary]        = useState({});
  const [filters,        setFilters]        = useState({ status: "", academic_period_id: "", search: "" });
  const [currentPage,    setCurrentPage]    = useState(1);
  const [itemsPerPage]                      = useState(10);
  const [formData,       setFormData]       = useState(EMPTY_FORM);
  const [staffFormData,  setStaffFormData]  = useState({
    invoice_id:         null,
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
      const res = await api.get(`/api/users`, { params: { role: "Student" } });
      const all = res.data.users || res.data.data || res.data || [];
      setStudents(all.filter((u) => String(u.role || "").trim().toLowerCase() === "student"));
    } catch (e) {
      console.error("Error fetching students:", e);
      toast.error(e.response?.data?.message || "Could not load students for invoices.");
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const responses = await Promise.all(STAFF_ROLES.map((role) =>
        api.get(`/api/users`, { params: { role } }),
      ));
      const users = responses.flatMap((res) => res.data.users || res.data.data || res.data || []);
      const uniqueUsers = [...new Map(users.map((user) => [String(user.user_id), user])).values()];
      setStaffUsers(uniqueUsers.filter((user) => STAFF_ROLE_KEYS.has(String(user.role || "").trim().toLowerCase())));
    } catch (e) {
      console.error("Error fetching staff:", e);
      toast.error(e.response?.data?.message || "Could not load faculty and staff for invoices.");
    }
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
    if (!formData.student_id || !formData.academic_period_id) {
      toast.error("Select a student and academic period for the student invoice.");
      return;
    }
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
      toast.success(formData.invoice_id ? "Invoice updated successfully." : "Invoice created successfully.");
    } catch (e) {
      console.error("Error saving invoice:", e);
      toast.error(e.response?.data?.error || e.response?.data?.message || "Failed to save invoice.");
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
      if (staffFormData.invoice_id) {
        await api.put(`/api/invoices/${staffFormData.invoice_id}`, invoiceData);
      } else {
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
      }

      setShowStaffModal(false);
      resetStaffForm();
      fetchInvoices();
      fetchSummary();
      toast.success(staffFormData.invoice_id ? "Staff invoice updated successfully." : "Staff invoice created and recorded as income successfully.");
    } catch (e) {
      console.error("Error saving staff invoice:", e);
      toast.error("Failed to save staff invoice: " + JSON.stringify(e.response?.data || e.message));
    }
  };

  const handleEdit = (invoice) => {
    if (invoice.notes?.startsWith("[STAFF INVOICE]")) {
      const staffNote = invoice.notes.replace(/^\[STAFF INVOICE\]\s*/, "");
      const [feeLabel, ...noteParts] = staffNote.split(" — ");
      setStaffFormData({
        invoice_id: invoice.invoice_id,
        user_id: invoice.student_id == null ? "" : String(invoice.student_id),
        academic_period_id: invoice.academic_period_id == null ? "" : String(invoice.academic_period_id),
        fee_label: feeLabel || "",
        amount: invoice.other_fees ?? invoice.total_amount ?? 0,
        invoice_date: formatDateInput(invoice.invoice_date),
        due_date: formatDateInput(invoice.due_date),
        notes: noteParts.join(" — "),
      });
      setShowStaffModal(true);
      return;
    }
    // Keep the exact linked user and nullable period selected in the form.
    setFormData({
      ...EMPTY_FORM,
      ...invoice,
      student_id: invoice.student_id == null ? "" : String(invoice.student_id),
      academic_period_id: invoice.academic_period_id == null ? "" : String(invoice.academic_period_id),
      invoice_date: formatDateInput(invoice.invoice_date) || EMPTY_FORM.invoice_date,
      due_date: formatDateInput(invoice.due_date),
    });
    setShowModal(true);
  };

  const handleDelete = (invoice) => setDeleteInvoiceTarget(invoice);

  const confirmDeleteInvoice = async () => {
    if (!deleteInvoiceTarget || isDeletingInvoice) return;
    setIsDeletingInvoice(true);
    try {
      await api.delete(`/api/invoices/${deleteInvoiceTarget.invoice_id}`);
      await Promise.all([fetchInvoices(), fetchSummary()]);
      setDeleteInvoiceTarget(null);
      toast.success("Invoice deleted successfully.");
    } catch (e) {
      console.error("Error deleting invoice:", e);
      toast.error(e.response?.data?.error || e.response?.data?.message || "Failed to delete invoice.");
    } finally {
      setIsDeletingInvoice(false);
    }
  };

  const studentOptions = students.map((student) => ({
    value: String(student.user_id),
    label: `${student.student_number ? `${student.student_number} - ` : ""}${student.first_name} ${student.last_name}`.trim(),
  }));

  const resetForm      = () => setFormData(EMPTY_FORM);
  const resetStaffForm = () => setStaffFormData({
    invoice_id: null, user_id: "", academic_period_id: "", fee_label: "", amount: 0,
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
  const inputCls = "w-full px-3 py-2 text-sm border border-slate-300  rounded-md   focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50  rounded-lg">
            <FileText className="w-6 h-6 text-indigo-600 " />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 ">Invoice Management</h1>
            <p className="text-sm text-slate-500 ">Create and manage student invoices</p>
          </div>
        </div>
        <div className="text-sm text-slate-600 ">
          Data Integrity: <span className="text-emerald-600  font-semibold">Online</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Billed",        value: summary.total_billed   || 0, color: "text-indigo-600 " },
          { label: "Total Paid",          value: summary.total_paid     || 0, color: "text-emerald-600 " },
          { label: "Outstanding Balance", value: summary.total_balance  || 0, color: "text-red-600 " },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white  p-4 rounded-lg shadow-md border border-slate-200 ">
            <p className="text-xs font-medium text-slate-500  uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>₱{parseFloat(value).toLocaleString()}</p>
          </div>
        ))}
        <div className="bg-white  p-4 rounded-lg shadow-md border border-slate-200 ">
          <p className="text-xs font-medium text-slate-500  uppercase tracking-wide">Total Invoices</p>
          <p className="text-2xl font-bold text-slate-900  mt-1">{summary.total_invoices || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white  rounded-lg shadow-md border border-slate-200  mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search student, invoice..." value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300  rounded-md   focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-slate-300  rounded-md  ">
              <option value="">All Status</option>
              {["Pending","Partially Paid","Paid","Overdue"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.academic_period_id}
              onChange={(e) => { setFilters({ ...filters, academic_period_id: e.target.value }); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-slate-300  rounded-md  ">
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
      <div className="bg-white  rounded-lg shadow-md border border-slate-200  overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 ">
          <thead className="bg-slate-50 ">
            <tr>
              {["Invoice #","Student / Staff","Date","Total","Paid","Balance","Status","Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-700  uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white  divide-y divide-slate-100 ">
            {paginatedData.length === 0 ? (
              <tr><td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500 ">No invoices found.</td></tr>
            ) : paginatedData.map((inv) => {
              const isStaff = inv.notes?.startsWith("[STAFF INVOICE]");
              return (
                <tr key={inv.invoice_id} className="hover:bg-slate-50  transition-colors">
                  <td className="px-4 py-2 font-mono text-sm text-slate-900  whitespace-nowrap">
                    {inv.invoice_number}
                    {isStaff && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded">STAFF</span>}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="font-medium text-sm text-slate-900 ">{inv.student_name}</div>
                    <div className="text-xs text-slate-500 ">{inv.student_number}</div>
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700  whitespace-nowrap">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 font-semibold text-sm text-slate-900  whitespace-nowrap">₱{parseFloat(inv.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-emerald-600  whitespace-nowrap">₱{parseFloat(inv.amount_paid || 0).toLocaleString()}</td>
                  <td className="px-4 py-2 font-semibold text-sm text-red-600  whitespace-nowrap">₱{parseFloat(inv.balance || 0).toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      inv.status === "Paid"           ? "bg-emerald-100 text-emerald-800  "
                      : inv.status === "Partially Paid" ? "bg-amber-100 text-amber-800  "
                      : inv.status === "Overdue"      ? "bg-red-100 text-red-800  "
                      : "bg-slate-100 text-slate-800  "
                    }`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(inv)} className="text-indigo-600 hover:text-indigo-800  " title="Edit"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(inv)} className="text-red-600 hover:text-red-800  " title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 ">
        <span className="text-xs sm:text-sm">
          Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> | Total: {filteredInvoices.length}
        </span>
        <div className="flex gap-1 mt-2 sm:mt-0">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-300  disabled:opacity-50 hover:bg-slate-100 ">
            <ChevronLeft size={16} />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i + 1} onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                currentPage === i + 1 ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300  text-slate-700  hover:bg-slate-100 "
              }`}>{i + 1}</button>
          ))}
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-slate-300  disabled:opacity-50 hover:bg-slate-100 ">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Student Invoice Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white  rounded-lg shadow-2xl w-full max-w-4xl border border-slate-200  max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200  bg-slate-50  rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 ">
                {formData.invoice_id ? "Edit" : "Create"} Invoice
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 text-slate-400 hover:text-slate-600 ">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Student + Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">Student *</label>
                  <Select
                    inputId="student-invoice-recipient"
                    options={studentOptions}
                    value={studentOptions.find((option) => option.value === String(formData.student_id)) || null}
                    onChange={(option) => setFormData((current) => ({ ...current, student_id: option?.value || "" }))}
                    placeholder="Search or select a student..."
                    isSearchable
                    isClearable
                    noOptionsMessage={() => "No students found"}
                    className="text-sm"
                    classNamePrefix="react-select"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">Academic Period *</label>
                  <select
                    name="academic_period_id"
                    value={formData.academic_period_id}
                    onChange={handleInputChange}
                    required
                    className={inputCls}
                  >
                    <option value="">Select Period</option>
                    {periods.map((p) => <option key={p.period_id} value={p.period_id}>{p.school_year} - {p.semester}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">Invoice Date *</label>
                  <input type="date" name="invoice_date" value={formData.invoice_date} onChange={handleInputChange} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">Due Date</label>
                  <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} className={inputCls} />
                </div>
              </div>

              {/* All Fee Fields */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Fee Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ALL_FEE_FIELDS.map((f) => (
                    <div key={f.name}>
                      <label className="block text-xs font-medium text-slate-700  mb-1">{f.label}</label>
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
                    <label className="block text-xs font-medium text-slate-700  mb-1">Discount Amount</label>
                    <input type="number" name="discount_amount" value={formData.discount_amount} onChange={handleInputChange} step="0.01" min="0" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700  mb-1">Scholarship Amount</label>
                    <input type="number" name="scholarship_amount" value={formData.scholarship_amount} onChange={handleInputChange} step="0.01" min="0" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-indigo-50  p-4 rounded-lg border border-indigo-200 ">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-slate-700 ">Subtotal:</span>
                  <span className="font-semibold text-slate-900 ">₱{calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-slate-700 ">Total Discounts:</span>
                  <span className="text-red-600 ">
                    -₱{(parseFloat(formData.discount_amount || 0) + parseFloat(formData.scholarship_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-indigo-200  pt-2">
                  <span className="text-sm font-semibold text-slate-700 ">Total:</span>
                  <span className="text-xl font-bold text-indigo-600 ">₱{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 ">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300   border border-slate-300 ">
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
          <div className="bg-white  rounded-lg shadow-2xl w-full max-w-lg border border-slate-200  max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200  bg-amber-50  rounded-t-lg z-10">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-amber-600 " />
                <h3 className="text-lg font-bold text-slate-900 ">{staffFormData.invoice_id ? "Edit Staff / Faculty Invoice" : "Staff / Faculty Invoice"}</h3>
              </div>
              <button onClick={() => { setShowStaffModal(false); resetStaffForm(); }} className="p-1 text-slate-400 hover:text-slate-600 ">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleStaffSubmit} className="p-4 space-y-3">
              <p className="text-xs text-slate-500  bg-amber-50  border border-amber-200  rounded px-3 py-2">
                This invoice will also be recorded as an <strong>Income transaction</strong> automatically.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700  mb-1">Staff / Faculty Member *</label>
                <select name="user_id" value={staffFormData.user_id} onChange={handleStaffInputChange} required
                  className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")}>
                  <option value="">Select Member</option>
                  {STAFF_ROLES.map((role) => {
                    const group = staffUsers.filter((u) => String(u.role || "").trim().toLowerCase() === role.toLowerCase());
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
                <label className="block text-xs font-medium text-slate-700  mb-1">Academic Period</label>
                <select name="academic_period_id" value={staffFormData.academic_period_id} onChange={handleStaffInputChange}
                  className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")}>
                  <option value="">None / Not Applicable</option>
                  {periods.map((p) => <option key={p.period_id} value={p.period_id}>{p.school_year} - {p.semester}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700  mb-1">Fee / Charge Label *</label>
                <input type="text" name="fee_label" value={staffFormData.fee_label} onChange={handleStaffInputChange} required
                  placeholder="e.g. ID Replacement Fee, Training Fee..."
                  className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700  mb-1">Amount *</label>
                <input type="number" name="amount" value={staffFormData.amount} onChange={handleStaffInputChange} step="0.01" required min="0.01"
                  className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">Invoice Date *</label>
                  <input type="date" name="invoice_date" value={staffFormData.invoice_date} onChange={handleStaffInputChange} required
                    className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">Due Date</label>
                  <input type="date" name="due_date" value={staffFormData.due_date} onChange={handleStaffInputChange}
                    className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700  mb-1">Notes</label>
                <textarea name="notes" value={staffFormData.notes} onChange={handleStaffInputChange} rows="2"
                  className={inputCls.replace("focus:ring-indigo-500 focus:border-indigo-500", "focus:ring-amber-500 focus:border-amber-500")} />
              </div>
              <div className="bg-amber-50  border border-amber-200  rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 ">Total Amount:</span>
                <span className="text-xl font-bold text-amber-600 ">
                  ₱{parseFloat(staffFormData.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 ">
                <button type="button" onClick={() => { setShowStaffModal(false); resetStaffForm(); }}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300   border border-slate-300 ">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 shadow-md shadow-amber-500/30">
                  {staffFormData.invoice_id ? "Update Staff Invoice" : "Create Staff Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteInvoiceTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => !isDeletingInvoice && setDeleteInvoiceTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-invoice-title"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="delete-invoice-title" className="text-lg font-bold text-slate-900">Delete invoice?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete invoice <strong>{deleteInvoiceTarget.invoice_number}</strong> for <strong>{deleteInvoiceTarget.student_name}</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteInvoiceTarget(null)}
                disabled={isDeletingInvoice}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >Cancel</button>
              <button
                type="button"
                onClick={confirmDeleteInvoice}
                disabled={isDeletingInvoice}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >{isDeletingInvoice ? "Deleting..." : "Yes, delete invoice"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;
