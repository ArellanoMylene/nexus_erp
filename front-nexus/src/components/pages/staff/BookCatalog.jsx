import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  BookOpen,
  Package,
  AlertCircle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const BookCatalog = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBook, setCurrentBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    publisher: "",
    publication_year: "",
    edition: "",
    category: "",
    subcategory: "",
    language: "English",
    pages: "",
    quantity_total: 1,
    quantity_available: 1,
    shelf_location: "",
    dewey_decimal: "",
    call_number: "",
    description: "",
    cover_image_url: "",
    price: "",
    date_acquired: "",
    status: "Available",
    is_reference: false,
    borrowable: true,
  });

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    fetchStatistics();

    // Get current user
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setFormData((prev) => ({ ...prev, created_by: user.user_id }));
    }
  }, []);

  const fetchBooks = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append("category", filterCategory);
      if (filterStatus) params.append("status", filterStatus);
      if (searchTerm) params.append("search", searchTerm);

      const response = await axios.get(
        `${API_BASE}/api/library/books?${params}`
      );
      setBooks(response.data);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/library/books/categories`
      );
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/library/books/statistics`
      );
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(
          `${API_BASE}/api/library/books/${currentBook.book_id}`,
          formData
        );
      } else {
        await axios.post(`${API_BASE}/api/library/books`, formData);
      }
      fetchBooks();
      fetchStatistics();
      closeModal();
    } catch (error) {
      console.error("Error saving book:", error);
      alert(error.response?.data?.error || "Error saving book");
    }
  };

  const handleEdit = (book) => {
    setCurrentBook(book);
    setFormData({
      isbn: book.isbn || "",
      title: book.title,
      author: book.author,
      publisher: book.publisher || "",
      publication_year: book.publication_year || "",
      edition: book.edition || "",
      category: book.category,
      subcategory: book.subcategory || "",
      language: book.language || "English",
      pages: book.pages || "",
      quantity_total: book.quantity_total,
      quantity_available: book.quantity_available,
      shelf_location: book.shelf_location || "",
      dewey_decimal: book.dewey_decimal || "",
      call_number: book.call_number || "",
      description: book.description || "",
      cover_image_url: book.cover_image_url || "",
      price: book.price || "",
      date_acquired: book.date_acquired || "",
      status: book.status,
      is_reference: book.is_reference || false,
      borrowable: book.borrowable !== undefined ? book.borrowable : true,
      created_by: book.created_by,
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      try {
        await axios.delete(`${API_BASE}/api/library/books/${id}`);
        fetchBooks();
        fetchStatistics();
      } catch (error) {
        console.error("Error deleting book:", error);
        alert(error.response?.data?.error || "Error deleting book");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentBook(null);
    const user = JSON.parse(localStorage.getItem("user"));
    setFormData({
      isbn: "",
      title: "",
      author: "",
      publisher: "",
      publication_year: "",
      edition: "",
      category: "",
      subcategory: "",
      language: "English",
      pages: "",
      quantity_total: 1,
      quantity_available: 1,
      shelf_location: "",
      dewey_decimal: "",
      call_number: "",
      description: "",
      cover_image_url: "",
      price: "",
      date_acquired: "",
      status: "Available",
      is_reference: false,
      borrowable: true,
      created_by: user?.user_id || "",
    });
  };

  const handleFilter = () => {
    fetchBooks();
  };

  // Filter books
  const filteredBooks = (() => {
    let filtered = [...books];

    if (searchTerm) {
      filtered = filtered.filter(
        (book) =>
          book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory) {
      filtered = filtered.filter((book) => book.category === filterCategory);
    }

    if (filterStatus) {
      filtered = filtered.filter((book) => book.status === filterStatus);
    }

    return filtered;
  })();

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBooks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

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
      Available: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Limited: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      Unavailable: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return badges[status] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  };

  const bookCategories = [
    "Fiction",
    "Non-Fiction",
    "Science",
    "Mathematics",
    "History",
    "Literature",
    "Technology",
    "Arts",
    "Philosophy",
    "Religion",
    "Biography",
    "Reference",
    "Children",
    "Young Adult",
    "Comics",
    "Other",
  ];

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            Book Catalog
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Library Management System
          </span>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Total Books
              </p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {statistics.total_books}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Total Copies
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {statistics.total_copies}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Available
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {statistics.available_copies}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Borrowed
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {statistics.borrowed_copies}
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input - LEFT */}
            <div className="relative flex-grow max-w-xs">
              <input
                type="text"
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm transition-all shadow-inner"
              />
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
            </div>

            {/* Filters and Action Buttons - RIGHT */}
            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Categories</option>
                {bookCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Status</option>
                <option value="Available">Available</option>
                <option value="Limited">Limited</option>
                <option value="Unavailable">Unavailable</option>
              </select>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium border border-indigo-700 dark:border-indigo-600 shadow-md shadow-indigo-500/30 whitespace-nowrap"
              >
                <Plus size={14} />
                Add Book
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">Book Details</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">ISBN</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Availability</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {currentItems.length > 0 ? (
                  currentItems.map((book) => (
                    <tr
                      key={book.book_id}
                      className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-start gap-2">
                          <BookOpen
                            className="text-indigo-600 dark:text-indigo-400 mt-0.5"
                            size={18}
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {book.title}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              by {book.author}
                            </div>
                            {book.publisher && (
                              <div className="text-xs text-slate-400 dark:text-slate-500">
                                {book.publisher} ({book.publication_year})
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{book.category}</div>
                        {book.subcategory && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {book.subcategory}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className="font-mono text-xs">
                          {book.isbn || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs">
                          {book.shelf_location || "Unassigned"}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-slate-400" />
                          <span className="font-semibold">
                            {book.quantity_available}/{book.quantity_total}
                          </span>
                        </div>
                        {book.is_reference && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            Reference
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(
                            book.computed_status || book.status
                          )}`}
                        >
                          {book.computed_status || book.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(book)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(book.book_id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-4 text-center text-slate-500 dark:text-slate-400 italic"
                    >
                      No books found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setPage={setCurrentPage}
            totalItems={filteredBooks.length}
          />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editMode ? "Edit Book" : "Add New Book"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Enter book title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Author *
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Enter author name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="ISBN-10 or ISBN-13"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Publisher
                  </label>
                  <input
                    type="text"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Publisher name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Publication Year
                  </label>
                  <input
                    type="number"
                    name="publication_year"
                    value={formData.publication_year}
                    onChange={handleInputChange}
                    min="1000"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Select Category</option>
                    {bookCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Subcategory"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Edition
                  </label>
                  <input
                    type="text"
                    name="edition"
                    value={formData.edition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="e.g., 1st, 2nd"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pages
                  </label>
                  <input
                    type="number"
                    name="pages"
                    value={formData.pages}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Total Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity_total"
                    value={formData.quantity_total}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Available Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity_available"
                    value={formData.quantity_available}
                    onChange={handleInputChange}
                    min="0"
                    max={formData.quantity_total}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Shelf Location
                  </label>
                  <input
                    type="text"
                    name="shelf_location"
                    value={formData.shelf_location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="e.g., A-101"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Call Number
                  </label>
                  <input
                    type="text"
                    name="call_number"
                    value={formData.call_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date Acquired
                  </label>
                  <input
                    type="date"
                    name="date_acquired"
                    value={formData.date_acquired}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical"
                    placeholder="Brief description or synopsis..."
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      name="is_reference"
                      checked={formData.is_reference}
                      onChange={handleInputChange}
                      className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    Reference Book
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      name="borrowable"
                      checked={formData.borrowable}
                      onChange={handleInputChange}
                      className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    Borrowable
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
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
                  {editMode ? "Update Book" : "Add Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCatalog;
