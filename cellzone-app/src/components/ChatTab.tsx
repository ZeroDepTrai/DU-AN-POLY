import { useState, useRef } from "react";
import { useChatStore } from "../stores/chatStore";
import { useAuthStore } from "../stores/authStore";
import { chatApi } from "../api/client";
import { MessageCircle, Send, User } from "lucide-react";
import type { Conversation } from "../types";
import { useEffect } from "react";

export default function ChatTab() {
  const {
    conversations,
    activeConversation,
    messages,
    isConnected,
    setConversations,
    setActiveConversation,
    setMessages,
    connect,
    reconnect,
    sendMessage,
  } = useChatStore();
  const { user, token } = useAuthStore();
  const [messageInput, setMessageInput] = useState("");
  const [filter, setFilter] = useState<"all" | "waiting" | "active">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await chatApi.listConversations();
        setConversations(data);
      } catch {
        console.error("Failed to load conversations");
      }
    };
    loadConversations();
  }, [setConversations]);

  // Connect to the chat WebSocket exactly once per token; do NOT invoke
  // `connect(token)` on every render — re-running it on unrelated re-renders
  // would tear down and rebuild the socket, which freezes the UI under
  // frequent state updates (e.g. an empty conversation list).
  useEffect(() => {
    if (token && !isConnected) {
      connect(token);
    }
    // `connect` is a stable Zustand action; we only want to re-run when the
    // token changes (logout/login).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // When the agent brings the window back into focus, immediately poke the
  // chat store to reconnect. Railway's WS endpoint also restarts on
  // deploys — both cases made the bubble sit at "Offline" forever, since
  // the only reconnect trigger inside the store is the exponential-backoff
  // timer that waits up to 5s. Visibility-driven reconnect feels instant.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        reconnect();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [reconnect]);

  const loadMessages = async (conv: Conversation) => {
    if (!conv) return;
    try {
      const data = await chatApi.getMessages(conv.id);
      setMessages(data);
      await chatApi.markRead(conv.id);
    } catch {
      console.error("Failed to load messages");
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    loadMessages(conv);
    if (user?.id) {
      try {
        await chatApi.assignConversation(conv.id, user.id);
      } catch {
        console.error("Failed to assign conversation");
      }
    }
  };

  const handleSend = () => {
    if (!messageInput.trim()) return;
    sendMessage(messageInput.trim());
    setMessageInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full flex gap-6 animate-fade-in">
      {/* Conversations List */}
      <div className="w-80 flex flex-col glass-card">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-[#f0f0f5] flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat
            {!isConnected && <span className="text-xs text-amber-400">(Ngoại tuyến)</span>}
          </h2>
          <div className="flex gap-1 mt-3">
            {(["all", "waiting", "active"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === f ? "bg-indigo-500 text-white" : "text-[#8b8b9a] hover:bg-white/5"
                }`}
              >
                {f === "all" ? "Tất cả" : f === "waiting" ? "Chờ" : "Đang chat"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-[#8b8b9a] text-sm">Không có cuộc trò chuyện nào</div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full p-4 border-b border-white/10 text-left hover:bg-white/5 transition-colors ${
                  activeConversation?.id === conv.id ? "bg-indigo-500/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#f0f0f5] text-sm truncate">{conv.customer_name}</span>
                      <span className="text-[10px] text-[#5a5a6a]">{conv.last_message_at ? formatTime(conv.last_message_at) : ""}</span>
                    </div>
                    <p className="text-xs text-[#5a5a6a] truncate">{conv.customer_email}</p>
                    {conv.last_message && (
                      <p className="text-xs text-[#8b8b9a] truncate mt-1">{conv.last_message}</p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    conv.status === "waiting" ? "bg-amber-500/20 text-amber-400" :
                    conv.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {conv.status === "waiting" ? "Chờ" : conv.status === "active" ? "Đang chat" : "Đóng"}
                  </span>
                  {conv.assigned_name && (
                    <span className="text-[10px] text-[#5a5a6a]">-&gt; {conv.assigned_name}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col glass-card">
        {activeConversation ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#f0f0f5]">{activeConversation.customer_name}</p>
                  <p className="text-xs text-[#5a5a6a]">{activeConversation.customer_email}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                activeConversation.status === "waiting" ? "bg-amber-500/20 text-amber-400" :
                activeConversation.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                "bg-gray-500/20 text-gray-400"
              }`}>
                {activeConversation.status === "waiting" ? "Đang chờ" : activeConversation.status === "active" ? "Đang trò chuyện" : "Đã đóng"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isAgent = msg.sender_type === "agent";
                return (
                  <div key={msg.id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isAgent
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md"
                        : "bg-white/10 text-[#f0f0f5] rounded-bl-md"
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <div className={`flex items-center gap-2 mt-1 ${isAgent ? "justify-end" : ""}`}>
                        <span className={`text-[10px] ${isAgent ? "text-white/60" : "text-[#5a5a6a]"}`}>
                          {formatTime(msg.timestamp)}
                        </span>
                        {isAgent && msg.read && (
                          <span className="text-[10px] text-white/60">OK</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {activeConversation.status !== "closed" && (
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 glass-input"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                    className="glass-button px-4 text-[#f0f0f5] disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-[#5a5a6a]" />
            </div>
            <h3 className="text-lg font-medium text-[#f0f0f5] mb-2">Chưa chọn cuộc trò chuyện</h3>
            <p className="text-sm text-[#8b8b9a]">Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu trả lời khách hàng</p>
          </div>
        )}
      </div>
    </div>
  );
}
