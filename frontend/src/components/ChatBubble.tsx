import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

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

// Exponential-backoff bounds for automatic reconnects. The base is
// deliberately short (500ms) because the only failure modes we hit in
// practice are (a) a brief network blip, (b) Railway restarting the
// container after a deploy. Both clear within ~10s; the user never
// has to sit through anything longer than RECONNECT_MAX_MS.
const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS = 5_000;

export default function ChatBubble({ wsUrl, apiBase }: ChatBubbleProps) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [connected, setConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine URLs based on environment
  const isProduction = typeof window !== "undefined" && !window.location.hostname.includes("localhost");
  const finalWsUrl = wsUrl || (isProduction ? "wss://du-an-poly-production.up.railway.app/ws/chat" : "ws://localhost:8000/ws/chat");
  const finalApiBase = apiBase || (isProduction ? "https://du-an-poly-production.up.railway.app/api" : "http://localhost:8000/api");

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  const handleMessage = (data: Record<string, unknown>) => {
    switch (data.type) {
      case "conversation_started":
        setConversationId(data.conversation_id as string);
        setHasStarted(true);
        break;
      case "new_message": {
        // Backend wraps the message in `{ type, message, conversation_id }`.
        // Reading fields from `data.*` instead of `data.message.*` was the
        // bug that made incoming agent replies render as empty bubbles.
        const m = (data.message ?? {}) as Record<string, unknown>;
        const serverId = (m.id as string) ?? `srv-${Date.now()}`;
        const clientId = data.client_id as string | undefined;
        setMessages((prev) => {
          // Sender-side de-dup: when the broadcast round-trips back, replace
          // the optimistic placeholder (same client_id) with the server's
          // authoritative row instead of appending a second copy.
          if (clientId) {
            const idx = prev.findIndex((x) => x.id === clientId);
            if (idx !== -1) {
              const next = prev.slice();
              next[idx] = {
                id: serverId,
                sender: (m.sender_type as "customer" | "agent") ?? prev[idx].sender,
                content: (m.content as string) ?? prev[idx].content,
                timestamp: (m.timestamp as string) ?? prev[idx].timestamp,
                read: (m.read as boolean) ?? prev[idx].read,
              };
              return next;
            }
          }
          // Receiver-side: incoming from the other party. Also drop duplicates
          // by server id (Railway may re-deliver the same message after a
          // reconnect).
          if (prev.some((x) => x.id === serverId)) return prev;
          return [
            ...prev,
            {
              id: serverId,
              sender: (m.sender_type as "customer" | "agent") ?? "agent",
              content: (m.content as string) ?? "",
              timestamp: (m.timestamp as string) ?? new Date().toISOString(),
              read: (m.read as boolean) ?? false,
            },
          ];
        });
        break;
      }
      case "message_read":
        setMessages((prev) => prev.map((m) =>
          m.id === data.message_id ? { ...m, read: true } : m
        ));
        break;
    }
  };

  // ── WebSocket lifecycle ────────────────────────────────────────────────
  //
  // We replace the previous `useState<WebSocket>` approach with refs +
  // callbacks. State belongs to React, but a socket is mutable state that
  // outlives renders — keeping it in a `useRef` lets `connect` close the
  // previous socket cleanly without firing reconnect storms.
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const intentionalCloseRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const scheduleReconnect = useCallback(() => {
    if (intentionalCloseRef.current) return;
    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** reconnectAttemptRef.current,
      RECONNECT_MAX_MS
    );
    reconnectAttemptRef.current = Math.min(reconnectAttemptRef.current + 1, 6);
    clearReconnectTimer();
    reconnectTimerRef.current = window.setTimeout(() => connectWebSocket(), delay);
  }, []);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // Backend would 4401 the socket without a token — don't even try.
      setConnected(false);
      return;
    }
    // If a healthy socket is already up, don't tear it down — that would
    // cause a visible "Đang kết nối..." flicker for no reason.
    const existing = wsRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return;
    }
    // encodeURIComponent is required: JWTs may contain `+`, `/`, `=` which
    // the server otherwise decodes as spaces / path separators and rejects.
    const socket = new WebSocket(`${finalWsUrl}?token=${encodeURIComponent(token)}`);

    socket.onopen = () => {
      setConnected(true);
      reconnectAttemptRef.current = 0;
      if (conversationIdRef.current) {
        socket.send(
          JSON.stringify({ type: "join", conversation_id: conversationIdRef.current })
        );
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
      // Only schedule a reconnect if this is still the active socket — a
      // newer one would have replaced `wsRef.current`.
      if (wsRef.current === socket) {
        wsRef.current = null;
        setConnected(false);
        if (!intentionalCloseRef.current) scheduleReconnect();
      }
    };

    socket.onerror = () => {
      // Chromium fires `error` then `close`; set the flag here so the UI
      // shows Offline immediately rather than waiting for `close`.
      if (wsRef.current === socket) {
        setConnected(false);
      }
    };

    // Close any previous socket that was still holding state.
    if (wsRef.current && wsRef.current !== socket) {
      try { wsRef.current.close(); } catch {}
    }
    wsRef.current = socket;
  // intentional dependency list — we want to capture `finalWsUrl` once and
  // reuse; scheduleReconnect is a stable callback referencing only refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalWsUrl]);

  // When the user signs in/out, stop the reconnect loop and forget the token.
  useEffect(() => {
    if (!isAuthenticated) {
      intentionalCloseRef.current = true;
      clearReconnectTimer();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      setConnected(false);
      setMessages([]);
      setHasStarted(false);
      setConversationId(null);
    } else {
      intentionalCloseRef.current = false;
    }
    return () => clearReconnectTimer();
  }, [isAuthenticated]);

  // Mirror conversation_id into a ref so the onopen callback can attach
  // the latest value without depending on it.
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Visibility-driven reconnect — when the user brings the tab back into
  // focus after a long pause, the WS is almost certainly stale. Fire one
  // immediately instead of waiting on the backoff timer.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !connected && isAuthenticated) {
        connectWebSocket();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [connected, isAuthenticated, connectWebSocket]);

  const startChat = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${finalApiBase}/chat/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: user.name || user.email || "Khách",
          customer_email: user.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.id || data.conversation_id);
        setHasStarted(true);
        connectWebSocket();
      } else {
        console.error("Failed to start chat", response.status, await response.text());
      }
    } catch {
      console.error("Failed to start chat");
    }
  };

  const sendMessage = () => {
    const socket = wsRef.current;
    if (!inputValue.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

    const trimmed = inputValue.trim();
    // Track the optimistic message by a client-generated id so the broadcast
    // round-trip can replace the placeholder with the server's authoritative
    // version. Without this, the customer's bubble would render the message
    // twice: once from `setMessages` below, then again when the server's
    // broadcast loops back through `new_message`.
    const clientId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const message: Message = {
      id: clientId,
      sender: "customer",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, message]);
    try {
      socket.send(JSON.stringify({
        type: "message",
        conversation_id: conversationId,
        content: trimmed,
        client_id: clientId,
      }));
    } catch (e) {
      console.error("Failed to send message:", e);
    }
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

  const handleBubbleClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleLoginRedirect = () => {
    setShowLoginPrompt(false);
    window.location.href = "/login";
  };

  return (
    <>
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-crimson to-rose shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118l7.5-7.5m0 0l7.5-7.5m-7.5 7.5V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v12.368M15.75 6v12.368m0 0h4.5m-4.5-12.368V6a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25v6.618" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-warmwhite">Đăng nhập để tiếp tục</h3>
              <p className="mb-6 text-sm text-softgray">
                Bạn cần đăng nhập để sử dụng tính năng chat hỗ trợ khách hàng.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-warmwhite backdrop-blur-xl transition-all hover:bg-white/[0.08]"
                >
                  Hủy
                </button>
                <button
                  onClick={handleLoginRedirect}
                  className="flex-1 rounded-xl bg-gradient-to-r from-crimson to-rose px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:opacity-90"
                >
                  Đăng nhập
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={handleBubbleClick}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? "rotate-90 bg-[#12121a]" 
            : "bg-gradient-to-br from-crimson via-rose to-sakura hover:scale-110 hover:shadow-glow"
        }`}
      >
        {isOpen ? (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <>
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.97 5.97 0 01-.474-.065 4.84 4.84 0 00-.978-2.233c2.244-.518 4.124-.702 5.62-.636a8.75 8.75 0 006.249 2.752 8.75 8.75 0 002.751 2.752 4.85 4.85 0 00-.974-2.255c.637-.497 1.397-.94 2.25-1.296a4.5 4.5 0 001.248-2.19 8.75 8.75 0 00-1.25-2.247z" />
            </svg>
            <span className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full bg-lightpink shadow-glow" />
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-50 w-96 max-h-[500px] rounded-2xl border border-white/10 bg-[#12121a] shadow-aurora-card flex flex-col overflow-hidden transition-all duration-300 ${
          isMinimized ? "h-14" : "h-[500px]"
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-crimson via-rose to-sakura p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.621.365 1.01 1.065 1.01 1.73 0 1.876-1.876 3.25-4.26 3.25-1.5 0-2.817-.625-3.75-1.75m2.25-5.25c.621.365 1.01 1.065 1.01 1.73 0 1.876-1.876 3.25-4.26 3.25-1.5 0-2.817-.625-3.75-1.75M3.75 14.5l.75.75m0 0l.75-.75m-.75.75V19.5m.75-4.75H7.5m-3.75 4.5h3.75m3.75-4.5h3.75M10.5 14.5l-.75.75m0 0l-.75-.75m.75.75V19.5m.75-4.75H13.5m-3.75 4.5h3.75m3.75-4.5h3.75" />
                </svg>
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
                className="rounded p-1 transition-colors hover:bg-white/20"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                className="rounded p-1 transition-colors hover:bg-white/20"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {!hasStarted ? (
                  /* Start Chat - uses logged in user info */
                  <div className="flex h-full flex-col items-center justify-center text-center px-4">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-crimson via-rose to-sakura shadow-glow-violet">
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.97 5.97 0 01-.474-.065 4.84 4.84 0 00-.978-2.233c2.244-.518 4.124-.702 5.62-.636a8.75 8.75 0 006.249 2.752 8.75 8.75 0 002.751 2.752 4.85 4.85 0 00-.974-2.255c.637-.497 1.397-.94 2.25-1.296a4.5 4.5 0 001.248-2.19 8.75 8.75 0 00-1.25-2.247z" />
                      </svg>
                    </div>
                    <h4 className="mb-2 text-lg font-semibold text-warmwhite">Chào {user?.name || "bạn"}!</h4>
                    <p className="mb-6 text-sm text-softgray">
                      Nhân viên hỗ trợ CellZone sẵn sàng giúp bạn
                    </p>
                    <button
                      onClick={startChat}
                      className="w-full rounded-xl bg-gradient-to-r from-crimson to-rose py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:opacity-90"
                    >
                      Bắt đầu trò chuyện
                    </button>
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
                              : "bg-gradient-to-br from-crimson via-rose to-sakura text-white rounded-br-md shadow-glow"
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isAgent ? "justify-start" : "justify-end"}`}>
                              <span className={`text-[10px] ${isAgent ? "text-gray-400" : "text-white/60"}`}>
                                {formatTime(msg.timestamp)}
                              </span>
                              {!isAgent && (
                                <span className="text-white/60">
                                  {msg.read ? (
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
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
                <div className="border-t border-white/10 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder-gray-500 backdrop-blur-xl focus:border-sakura/40 focus:outline-none"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputValue.trim()}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-crimson to-rose shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
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
