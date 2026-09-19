import { useState, useEffect } from "react";
import axios from "axios";
import { MessageCircle, Send, Search, User } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const StudentChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversation_id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/messages`);
      const msgs = response.data || [];
      // Group messages by sender to create conversations
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

  const filteredConversations = conversations.filter((conv) =>
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageCircle size={24} className="text-indigo-600" />
            Chat
          </h2>
        </div>

        {/* Chat Interface */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex" style={{ height: "600px" }}>
          {/* Conversations List */}
          <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
      </div>
    </div>
  );
};

export default StudentChat;
