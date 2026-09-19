import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Search,
  Users,
  User,
  X,
  Paperclip,
  ChevronLeft,
  Circle,
  MoreVertical,
  Trash2,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Messaging = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [students, setStudents] = useState([]);

  const [newMessageData, setNewMessageData] = useState({
    recipient_id: "",
    recipient_type: "student",
    subject: "",
    message: "",
  });

  useEffect(() => {
    fetchConversations();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/messages/conversations/${userId}`
      );

      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (conversationId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE}/api/messages/conversation/${conversationId}`
      );

      if (response.data.success) {
        setMessages(response.data.messages);
        // Mark as read
        await axios.put(
          `${API_BASE}/api/messages/read/${conversationId}`
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/faculty/${userId}/students`
      );

      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.post(`${API_BASE}/api/messages`, {
        sender_id: userId,
        recipient_id: selectedConversation.other_user_id,
        conversation_id: selectedConversation.id,
        message: messageText,
      });

      if (response.data.success) {
        setMessageText("");
        fetchMessages(selectedConversation.id);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  const handleNewMessage = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.post(`${API_BASE}/api/messages/new`, {
        sender_id: userId,
        ...newMessageData,
      });

      if (response.data.success) {
        alert("Message sent successfully!");
        setShowNewMessageModal(false);
        setNewMessageData({
          recipient_id: "",
          recipient_type: "student",
          subject: "",
          message: "",
        });
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending new message:", error);
      alert("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE}/api/messages/conversation/${conversationId}`
      );

      if (response.data.success) {
        alert("Conversation deleted!");
        setSelectedConversation(null);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete conversation");
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="w-8 h-8 mr-3 text-indigo-600" />
              Private Messaging
            </h1>
            <p className="text-gray-600 mt-2">
              Communicate privately with students
            </p>
          </div>
          <button
            onClick={() => setShowNewMessageModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition"
          >
            <Send className="w-5 h-5" />
            New Message
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[calc(100vh-250px)] flex">
        {/* Conversations List */}
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${selectedConversation?.id === conv.id ? "bg-indigo-50" : ""
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {conv.other_user_name}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTime(conv.last_message_time)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conv.last_message}
                      </p>
                    </div>
                    {!conv.is_read && (
                      <Circle className="w-3 h-3 fill-indigo-600 text-indigo-600" />
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
              <div className="p-4 border-b flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.other_user_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.user_role || "Student"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleDeleteConversation(selectedConversation.id)
                  }
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageCircle className="w-16 h-16 mb-4" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender_id == localStorage.getItem("userId");
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${isOwn
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-gray-900"
                            }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p
                            className={`text-xs mt-1 ${isOwn ? "text-indigo-200" : "text-gray-500"
                              }`}
                          >
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t bg-white"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-24 h-24 mb-4" />
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">New Message</h2>
              <button
                onClick={() => setShowNewMessageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleNewMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient *
                </label>
                <select
                  value={newMessageData.recipient_id}
                  onChange={(e) =>
                    setNewMessageData({
                      ...newMessageData,
                      recipient_id: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} - {student.student_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={newMessageData.subject}
                  onChange={(e) =>
                    setNewMessageData({
                      ...newMessageData,
                      subject: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Message subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={newMessageData.message}
                  onChange={(e) =>
                    setNewMessageData({
                      ...newMessageData,
                      message: e.target.value,
                    })
                  }
                  required
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Type your message..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewMessageModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;
