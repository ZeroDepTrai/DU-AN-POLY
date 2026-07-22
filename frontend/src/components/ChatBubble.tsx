import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Minimize2, User, Check, CheckCheck } from "lucide-react";

interface Message {
  id: string;
  sender: "customer" | "agent";
  content: string;
  timestamp: string;
  read?: boolean;
}

interface ChatBubbleProps {
  wsUrl?: string;
  apiBase?: string;
}

export default function ChatBubble({ wsUrl = "ws://localhost:8000/ws/chat", apiBase = "http://localhost:8000/api" }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  const connectWebSocket = () => {
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setConnected(true);
      if (conversationId) {
        socket.send(JSON.stringify({ type: "join", conversation_id: conversationId }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch {
        console.error("Failed to parse message");
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    socket.onerror = () => {
      setConnected(false);
    };

    setWs(socket);
  };

  const handleMessage = (data: Record<string, unknown>) => {
    switch (data.type) {
      case "conversation_started":
        setConversationId(data.conversation_id as string);
        setHasStarted(true);
        break;
      case "new_message":
        setMessages((prev) => [...prev, {
          id: data.id as string,
          sender: data.sender_type as "customer" | "agent",
          content: data.content as string,
          timestamp: data.timestamp as string,
          read: data.read as boolean,
        }]);
        break;
      case "message_read":
        setMessages((prev) => prev.map((m) => 
          m.id === data.message_id ? { ...m, read: true } : m
        ));
        break;
    }
  };

  const startChat = async () => {
    if (!customerName.trim() || !customerEmail.trim()) return;
    
    try {
      const response = await fetch(`${apiBase}/chat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversation_id);
        setHasStarted(true);
        connectWebSocket();
      }
    } catch {
      console.error("Failed to start chat");
    }
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    const message: Message = {
      id: `temp-${Date.now()}`,
      sender: "customer",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, message]);
    ws.send(JSON.stringify({
      type: "message",
      conversation_id: conversationId,
      content: inputValue.trim(),
    }));
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? "bg-gray-700 rotate-90" : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-110"
        }`}
      >
        {isOpen ? (
          <Minimize2 className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-50 w-96 max-h-[500px] bg-[#12121a] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden transition-all duration-300 ${
          isMinimized ? "h-14" : "h-[500px]"
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-indigo-500 to-purple-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Hỗ trợ CellZone</h3>
                <p className="text-xs text-white/70">
                  {connected ? "Đang kết nối..." : hasStarted ? "Trực tuyến" : "Bắt đầu trò chuyện"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded hover:bg-white/20 transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                className="p-1 rounded hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {!hasStarted ? (
                  /* Start Form */
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Chào bạn!</h4>
                    <p className="text-sm text-gray-400 mb-6">
                      Vui lòng nhập thông tin để bắt đầu trò chuyện với nhân viên hỗ trợ
                    </p>
                    <div className="w-full space-y-3">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Tên của bạn"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Email của bạn"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={startChat}
                        disabled={!customerName.trim() || !customerEmail.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        Bắt đầu trò chuyện
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Messages */
                  <>
                    {messages.map((msg) => {
                      const isAgent = msg.sender === "agent";
                      return (
                        <div key={msg.id} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isAgent
                              ? "bg-white/10 text-white rounded-bl-md"
                              : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md"
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isAgent ? "justify-start" : "justify-end"}`}>
                              <span className={`text-[10px] ${isAgent ? "text-gray-400" : "text-white/60"}`}>
                                {formatTime(msg.timestamp)}
                              </span>
                              {!isAgent && (
                                <span className="text-white/60">
                                  {msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              {hasStarted && (
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputValue.trim()}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
