import { useState, useEffect } from "react";
import axios from "axios";
import { Mail, Send, User, Search } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const StudentEmailFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    to_faculty_id: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/faculty`);
      const facultyData = response.data || [];
      setFaculty(facultyData.map(f => ({
        faculty_id: f.id || f.faculty_id || f.user_id,
        name: f.name || `${f.first_name || ''} ${f.last_name || ''}`.trim(),
        department: f.department || 'N/A',
        subject: f.subject || 'N/A',
        email: f.email,
      })));
    } catch (error) {
      console.error("Error fetching faculty:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/messages`, {
        receiver_id: formData.to_faculty_id,
        subject: formData.subject,
        content: formData.message,
      });
      setShowCompose(false);
      setFormData({ to_faculty_id: "", subject: "", message: "" });
      alert("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const handleComposeClick = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    setFormData({
      ...formData,
      to_faculty_id: facultyMember.faculty_id,
    });
    setShowCompose(true);
  };

  const filteredFaculty = faculty.filter((f) =>
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail size={24} className="text-indigo-600" />
            Email Faculty
          </h2>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search faculty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white text-sm"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>

        {/* Faculty List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFaculty.length === 0 ? (
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
              <User size={48} className="mx-auto text-slate-400 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No faculty members found</p>
            </div>
          ) : (
            filteredFaculty.map((f) => (
              <div
                key={f.faculty_id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {f.name?.split(" ").map(n => n[0]).join("") || "F"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{f.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{f.department}</p>
                  </div>
                </div>

                <div className="space-y-1 text-sm mb-3">
                  {f.subject && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Subject:</span>
                      <span className="text-slate-900 dark:text-white font-medium">{f.subject}</span>
                    </div>
                  )}
                  {f.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-300 text-xs truncate">{f.email}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleComposeClick(f)}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
                >
                  <Send size={14} />
                  Send Email
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      {showCompose && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50"
          onClick={() => setShowCompose(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail size={20} className="text-indigo-600" />
                Compose Email
              </h3>
              <button
                onClick={() => setShowCompose(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
                <input
                  type="text"
                  readOnly
                  value={selectedFaculty?.name || ""}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Message *</label>
                <textarea
                  required
                  rows={8}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm"
                  placeholder="Type your message here..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
                >
                  <Send size={14} />
                  Send Email
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentEmailFaculty;
