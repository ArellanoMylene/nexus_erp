import { useState, useEffect } from "react";
import axios from "axios";
import { MessageCircle, Send, Search, User, Mail } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const StudentCommunication = () => {
  const [activeTab, setActiveTab] = useState("chat");

  // Chat state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatSearchTerm, setChatSearchTerm] = useState("");

  // Email state
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [emailSearchTerm, setEmailSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    to_faculty_id: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (activeTab === "chat") {
      fetchConversations();
    } else {
      fetchFaculty();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversation_id);
    }
  }, [selectedConversation]);

  // Chat functions
  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/messages`);
      const msgs = response.data || [];
      const convMap = {};
      msgs.forEach(m => {
        const key = m.sender_id || m.receiver_id || 'unknown';
        if (!convMap[key]) {
          convMap[key] = {
            conversation_id: key,
            name: m.sender_name || m.receiver_name || 'User',
            last_message: m.content || m.message,
            unread_count: 0,
          };
        }
      });
      setConversations(Object.values(convMap));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/messages`);
      const msgs = response.data || [];
      setMessages(msgs.map(m => ({
        message_id: m.id || m.message_id,
        message: m.content || m.message,
        is_sender: m.is_sender || false,
        sent_at: m.created_at || m.sent_at,
      })));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${API_BASE}/api/messages`, {
        conversation_id: selectedConversation.conversation_id,
        content: newMessage,
      });
      fetchMessages(selectedConversation.conversation_id);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Email functions
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

  const filteredConversations = conversations.filter((conv) =>
    conv.name?.toLowerCase().includes(chatSearchTerm.toLowerCase())
  );

  const filteredFaculty = faculty.filter((f) =>
    f.name?.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
    f.department?.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
    f.subject?.toLowerCase().includes(emailSearchTerm.toLowerCase())
  );

  const tabs = [
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "email", label: "Email Faculty", icon: Mail },
  ];

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageCircle size={24} className="text-indigo-600" />
            Communication
          </h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "chat" ? (
          // Chat Interface
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex" style={{ height: "600px" }}>
            {/* Conversations List */}
            <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700 flex flex-col">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={chatSearchTerm}
                    onChange={(e) => setChatSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle size={48} className="mx-auto text-slate-400 mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.conversation_id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-3 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selectedConversation?.conversation_id === conv.conversation_id ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {conv.name?.[0] || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-white truncate">{conv.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{conv.last_message || "No messages yet"}</p>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">{conv.unread_count}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedConversation.name?.[0] || "U"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{selectedConversation.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedConversation.role || "Faculty"}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.message_id}
                        className={`flex ${msg.is_sender ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.is_sender
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
                          }`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${msg.is_sender ? "text-indigo-200" : "text-slate-500 dark:text-slate-400"}`}>
                            {new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
                      >
                        <Send size={16} />
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle size={64} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Email Faculty Interface
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search faculty..."
                value={emailSearchTerm}
                onChange={(e) => setEmailSearchTerm(e.target.value)}
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
        )}
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

export default StudentCommunication;
