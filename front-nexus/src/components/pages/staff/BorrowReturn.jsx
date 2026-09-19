import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Plus,
  Edit,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  BookOpen,
  Calendar,
  User,
  AlertCircle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const BorrowReturn = () => {
  const [transactions, setTransactions] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    book_id: "",
    borrower_id: "",
    borrow_date: new Date().toISOString().split("T")[0],
    due_date: "",
    condition_out: "Good",
    remarks: "",
  });

  const [returnData, setReturnData] = useState({
    return_date: new Date().toISOString().split("T")[0],
    condition_in: "Good",
    remarks: "",
  });

  useEffect(() => {
    fetchTransactions();
    fetchBooks();
    fetchUsers();
    fetchStatistics();

    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setFormData((prev) => ({ ...prev, issued_by: user.user_id }));
      setReturnData((prev) => ({ ...prev, returned_to: user.user_id }));
    }
  }, []);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (searchTerm) params.append("search", searchTerm);

      const response = await axios.get(
        `${API_BASE}/api/library/transactions?${params}`,
      );
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/library/books`,
      );
      setBooks(
        response.data.filter(
          (book) => book.borrowable && book.quantity_available > 0,
        ),
      );
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/users`);
      setUsers(
        response.data.filter(
          (user) => user.role === "Student" || user.role === "Faculty",
        ),
      );
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/library/transactions/statistics`,
      );
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleReturnInputChange = (e) => {
    const { name, value } = e.target;
    setReturnData({ ...returnData, [name]: value });
  };

  const handleSelectChange = (selectedOption, field) => {
    setFormData({ ...formData, [field]: selectedOption?.value || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE}/api/library/transactions`,
        formData,
      );
      fetchTransactions();
      fetchStatistics();
      fetchBooks();
      closeModal();
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert(error.response?.data?.error || "Error creating transaction");
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_BASE}/api/library/transactions/${currentTransaction.transaction_id}/return`,
        returnData,
      );
      fetchTransactions();
      fetchStatistics();
      fetchBooks();
      closeReturnModal();
    } catch (error) {
      console.error("Error returning book:", error);
      alert(error.response?.data?.error || "Error returning book");
    }
  };

  const openReturnModal = (transaction) => {
    setCurrentTransaction(transaction);
    setShowReturnModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      book_id: "",
      borrower_id: "",
      borrow_date: new Date().toISOString().split("T")[0],
      due_date: "",
      condition_out: "Good",
      remarks: "",
    });
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setCurrentTransaction(null);
    setReturnData({
      return_date: new Date().toISOString().split("T")[0],
      condition_in: "Good",
      remarks: "",
    });
  };

  const filteredTransactions = (() => {
    let filtered = [...transactions];
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (filterStatus) {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }
    return filtered;
  })();

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
      <span className="text-xs sm:text-sm">
        Page <span className="font-semibold">{currentPage}</span> of{" "}
        <span className="font-semibold">{totalPages}</span> | Total Records:{" "}
        {totalItems}
      </span>
      <div className="flex gap-1 items-center mt-2 sm:mt-0">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          {currentPage}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const badges = {
      Active:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      Returned:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      Lost: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      Damaged:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  const bookOptions = books.map((book) => ({
    value: book.book_id,
    label: `${book.title} - ${book.author} (Available: ${book.quantity_available})`,
  }));

  const userOptions = users.map((user) => ({
    value: user.user_id,
    label: `${user.first_name} ${user.last_name} - ${user.role} (${user.email})`,
  }));

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            Borrow & Return
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Library Transactions
          </span>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Active Borrows
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {statistics.active_borrows}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Overdue
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {statistics.overdue_count}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Total Returned
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {statistics.returned_count}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Total Penalties
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                ₱
                {typeof statistics.total_penalties === "number"
                  ? statistics.total_penalties.toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-grow max-w-xs">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm transition-all shadow-inner"
              />
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Returned">Returned</option>
                <option value="Overdue">Overdue</option>
              </select>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium border border-indigo-700 dark:border-indigo-600 shadow-md shadow-indigo-500/30 whitespace-nowrap"
              >
                <Plus size={14} />
                Borrow Book
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">Book</th>
                  <th className="px-4 py-2.5">Borrower</th>
                  <th className="px-4 py-2.5">Borrow Date</th>
                  <th className="px-4 py-2.5">Due Date</th>
                  <th className="px-4 py-2.5">Return Date</th>
                  <th className="px-4 py-2.5">Penalty</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {currentItems.length > 0 ? (
                  currentItems.map((transaction) => (
                    <tr
                      key={transaction.transaction_id}
                      className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <BookOpen
                            className="text-indigo-600 dark:text-indigo-400"
                            size={16}
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {transaction.book_title}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              by {transaction.book_author}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <div>
                            <div className="font-medium">
                              {transaction.borrower_name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {transaction.borrower_role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(
                            transaction.borrow_date,
                          ).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(transaction.due_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {transaction.return_date ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar size={12} className="text-green-500" />
                            {new Date(
                              transaction.return_date,
                            ).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            Not returned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {transaction.penalty_amount > 0 ? (
                          <div className="text-red-600 dark:text-red-400 font-semibold">
                            ₱{transaction.penalty_amount}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(transaction.status)}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {transaction.status === "Active" && (
                          <button
                            onClick={() => openReturnModal(transaction)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Return Book"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="p-4 text-center text-slate-500 dark:text-slate-400 italic"
                    >
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setPage={setCurrentPage}
            totalItems={filteredTransactions.length}
          />
        </div>
      </div>

      {/* Borrow Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Borrow Book
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Select Book *
                  </label>
                  <Select
                    options={bookOptions}
                    onChange={(option) => handleSelectChange(option, "book_id")}
                    placeholder="Choose a book"
                    required
                    className="text-sm"
                    classNamePrefix="react-select"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Select Borrower *
                  </label>
                  <Select
                    options={userOptions}
                    onChange={(option) =>
                      handleSelectChange(option, "borrower_id")
                    }
                    placeholder="Choose borrower"
                    required
                    className="text-sm"
                    classNamePrefix="react-select"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Borrow Date *
                  </label>
                  <input
                    type="date"
                    name="borrow_date"
                    value={formData.borrow_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Book Condition
                </label>
                <select
                  name="condition_out"
                  value={formData.condition_out}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30"
                >
                  Borrow Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && currentTransaction && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50"
          onClick={closeReturnModal}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Return Book
              </h3>
              <button
                onClick={closeReturnModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleReturn} className="p-4 space-y-3">
              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md border border-slate-200 dark:border-slate-600">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Book: {currentTransaction.book_title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Borrower: {currentTransaction.borrower_name}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Due:{" "}
                  {new Date(currentTransaction.due_date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Return Date *
                </label>
                <input
                  type="date"
                  name="return_date"
                  value={returnData.return_date}
                  onChange={handleReturnInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Book Condition on Return
                </label>
                <select
                  name="condition_in"
                  value={returnData.condition_in}
                  onChange={handleReturnInputChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={returnData.remarks}
                  onChange={handleReturnInputChange}
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical"
                  placeholder="Return notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={closeReturnModal}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-md shadow-green-500/30"
                >
                  Return Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowReturn;
