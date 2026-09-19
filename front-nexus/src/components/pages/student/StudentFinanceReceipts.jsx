import { useState, useEffect } from "react";
import axios from "axios";
import { Receipt, Download, Eye, Printer, Search, ChevronLeft, ChevronRight, Plus, Calendar, CreditCard } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const StudentFinanceReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/payments`);
      const payments = response.data || [];
      setReceipts(payments.map(p => ({
        receipt_id: p.id || p.payment_id,
        receipt_number: `REC-${String(p.id || p.payment_id).padStart(6, '0')}`,
        payment_date: p.payment_date || p.created_at,
        description: p.description || 'Tuition Payment',
        payment_method: p.payment_method || 'Cash',
        amount: p.amount,
        status: p.status || 'paid',
      })));
    } catch (error) {
      console.error("Error fetching receipts:", error);
    }
  };

  const handleDownloadReceipt = async (receiptId) => {
    try {
      const response = await fetch(`${API_BASE}/api/student/finance/receipts/${receiptId}/download`);
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

  const filteredReceipts = receipts.filter((receipt) =>
    receipt.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const currentReceipts = filteredReceipts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusColor = (status) => {
    const colors = {
      paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[status] || colors.paid;
  };

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt size={24} className="text-indigo-600" />
            Payment Receipts
          </h2>
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <input
            type="text"
            placeholder="Search receipts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>

        {/* Receipts Table */}
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
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No receipts found
                  </td>
                </tr>
              ) : (
                currentReceipts.map((receipt) => (
                  <tr key={receipt.receipt_id} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700">
                    <td className="px-4 py-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {receipt.receipt_number}
                    </td>
                    <td className="px-4 py-2">{new Date(receipt.payment_date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 font-medium">{receipt.description}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <CreditCard size={12} />
                        {receipt.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-bold text-green-600 dark:text-green-400">
                      ₱{parseFloat(receipt.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(receipt.status)}`}>
                        {receipt.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedReceipt(receipt);
                            setShowModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDownloadReceipt(receipt.receipt_id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
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

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            Page {currentPage} of {totalPages || 1} | Total: {filteredReceipts.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                <Receipt className="inline w-5 h-5 text-green-600 mr-2" />
                Payment Receipt
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="text-center mb-6">
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Official Receipt</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Receipt No: {selectedReceipt.receipt_number}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Date</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(selectedReceipt.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Payment Method</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{selectedReceipt.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Description</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedReceipt.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedReceipt.status)}`}>
                      {selectedReceipt.status}
                    </span>
                  </div>
                </div>
                <div className="border-t border-b border-slate-300 dark:border-slate-600 py-4 my-4">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Amount Paid</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      ₱{parseFloat(selectedReceipt.amount).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                  <p>This is an official receipt issued by the institution.</p>
                  <p>Thank you for your payment!</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => handleDownloadReceipt(selectedReceipt.receipt_id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                >
                  <Download size={14} />
                  Download PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                >
                  <Printer size={14} />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFinanceReceipts;
