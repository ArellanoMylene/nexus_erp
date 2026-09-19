import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  HardDrive,
  TrendingUp,
  Lock,
  Unlock,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DigitalLibrary = () => {
  const [resources, setResources] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentResource, setCurrentResource] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAccessLevel, setFilterAccessLevel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    description: "",
    file_name: "",
    file_type: "",
    file_size: "",
    file_path: "",
    access_level: "Public",
    allow_download: true,
    tags: "",
  });

  useEffect(() => {
    fetchResources();
    fetchStatistics();

    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setFormData(prev => ({ ...prev, uploaded_by: user.user_id }));
    }
  }, []);

  const fetchResources = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append("category", filterCategory);
      if (filterAccessLevel) params.append("access_level", filterAccessLevel);
      if (searchTerm) params.append("search", searchTerm);

      const response = await axios.get(`${API_BASE}/api/library/digital?${params}`);
      setResources(response.data);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/library/digital/statistics`);
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        file_name: file.name,
        file_type: file.type || file.name.split('.').pop(),
        file_size: (file.size / 1024).toFixed(2), // KB
        file_path: `/uploads/digital-library/${file.name}`,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentResource) {
        await axios.put(`${API_BASE}/api/library/digital/${currentResource.resource_id}`, formData);
      } else {
        await axios.post(`${API_BASE}/api/library/digital`, formData);
      }
      fetchResources();
      fetchStatistics();
      closeModal();
    } catch (error) {
      console.error("Error saving resource:", error);
      alert(error.response?.data?.error || "Error saving resource");
    }
  };

  const handleEdit = (resource) => {
    setCurrentResource(resource);
    setFormData({
      title: resource.title,
      author: resource.author || "",
      category: resource.category,
      description: resource.description || "",
      file_name: resource.file_name,
      file_type: resource.file_type,
      file_size: resource.file_size,
      file_path: resource.file_path,
      access_level: resource.access_level,
      allow_download: resource.allow_download,
      tags: resource.tags || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await axios.delete(`${API_BASE}/api/library/digital/${id}`);
        fetchResources();
        fetchStatistics();
      } catch (error) {
        console.error("Error deleting resource:", error);
        alert("Error deleting resource");
      }
    }
  };

  const handleView = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/library/digital/${id}/view`);
      fetchResources();
      fetchStatistics();
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleDownload = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/library/digital/${id}/download`);
      fetchResources();
      fetchStatistics();
    } catch (error) {
      console.error("Error tracking download:", error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentResource(null);
    setFormData({
      title: "",
      author: "",
      category: "",
      description: "",
      file_name: "",
      file_type: "",
      file_size: "",
      file_path: "",
      access_level: "Public",
      allow_download: true,
      tags: "",
    });
  };

  const filteredResources = (() => {
    let filtered = [...resources];
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterCategory) {
      filtered = filtered.filter(r => r.category === filterCategory);
    }
    if (filterAccessLevel) {
      filtered = filtered.filter(r => r.access_level === filterAccessLevel);
    }
    return filtered;
  })();

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredResources.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);

  const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
      <span className="text-xs sm:text-sm">
        Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> | Total Records: {totalItems}
      </span>
      <div className="flex gap-1 items-center mt-2 sm:mt-0">
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">{currentPage}</span>
        <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const getAccessBadge = (level) => {
    const badges = {
      Public: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Student: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      Faculty: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      Admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return badges[level] || "bg-gray-100 text-gray-700";
  };

  const formatFileSize = (kb) => {
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(2)} MB`;
    }
    return `${parseFloat(kb).toFixed(2)} KB`;
  };

  const categories = ["E-Book", "Research Paper", "Thesis", "Journal", "Magazine", "Manual", "Document", "Video", "Audio", "Image", "Other"];

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            Digital Library
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Digital Resources</span>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Resources</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{statistics.total_resources}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <HardDrive size={12} />
                Total Storage
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{formatFileSize(statistics.total_size_kb || 0)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Eye size={12} />
                Total Views
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{statistics.total_views}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Download size={12} />
                Total Downloads
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{statistics.total_downloads}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-grow max-w-xs">
              <input type="text" placeholder="Search resources..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm transition-all shadow-inner" />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>

            <div className="flex items-center gap-2">
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                <option value="">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <select value={filterAccessLevel} onChange={(e) => setFilterAccessLevel(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                <option value="">All Access</option>
                <option value="Public">Public</option>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Admin">Admin</option>
              </select>

              <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium border border-indigo-700 dark:border-indigo-600 shadow-md shadow-indigo-500/30 whitespace-nowrap">
                <Plus size={14} />
                Add Resource
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700/70">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="px-4 py-2.5">Title</th>
                  <th className="px-4 py-2.5">Author</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">File Type</th>
                  <th className="px-4 py-2.5">Size</th>
                  <th className="px-4 py-2.5">Access</th>
                  <th className="px-4 py-2.5">Views</th>
                  <th className="px-4 py-2.5">Downloads</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {currentItems.length > 0 ? (
                  currentItems.map((resource) => (
                    <tr key={resource.resource_id} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150">
                      <td className="px-4 py-2">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{resource.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{resource.file_name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-slate-700 dark:text-slate-300">{resource.author || "N/A"}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {resource.category}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {resource.file_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {formatFileSize(resource.file_size)}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getAccessBadge(resource.access_level)} flex items-center gap-1 w-fit`}>
                          {resource.access_level === 'Public' ? <Unlock size={10} /> : <Lock size={10} />}
                          {resource.access_level}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Eye size={12} />
                          <span className="font-semibold">{resource.view_count}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Download size={12} />
                          <span className="font-semibold">{resource.download_count}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleView(resource.resource_id)} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="View">
                            <Eye size={14} />
                          </button>
                          {resource.allow_download && (
                            <button onClick={() => handleDownload(resource.resource_id)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Download">
                              <Download size={14} />
                            </button>
                          )}
                          <button onClick={() => handleEdit(resource)} className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(resource.resource_id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="p-4 text-center text-slate-500 dark:text-slate-400 italic">No resources found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} setPage={setCurrentPage} totalItems={filteredResources.length} />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50" onClick={closeModal}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentResource ? "Edit Resource" : "Add Resource"}</h3>
              <button onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Resource title" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Author</label>
                  <input type="text" name="author" value={formData.author} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Author name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                    <option value="">Select category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical" placeholder="Brief description..." />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Upload File {!currentResource && "*"}</label>
                <input type="file" onChange={handleFileChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                {formData.file_name && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    File: {formData.file_name} ({formatFileSize(formData.file_size)})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Access Level *</label>
                  <select name="access_level" value={formData.access_level} onChange={handleInputChange} required className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                    <option value="Public">Public</option>
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="tag1, tag2, tag3" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="allow_download" name="allow_download" checked={formData.allow_download} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                <label htmlFor="allow_download" className="text-sm text-slate-700 dark:text-slate-300 font-medium">Allow Download</label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={closeModal} className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30">{currentResource ? "Update" : "Add"} Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalLibrary;
