import { create } from "zustand";
import type { Conversation, ChatMessage } from "../types";
import { getWsBase } from "../api/client";

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  isConnected: boolean;
  unreadCount: number;
  ws: WebSocket | null;
  token: string | null;
  setConversations: (convs: Conversation[]) => void;
  setActiveConversation: (conv: Conversation | null) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateConversation: (conv: Conversation) => void;
  setConnected: (connected: boolean) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  connect: (token: string) => void;
  reconnect: () => void;
  disconnect: () => void;
  sendMessage: (content: string, clientId?: string) => boolean;
}

const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS = 5_000;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isConnected: false,
  unreadCount: 0,
  ws: null,
  token: null,

  setConversations: (convs) => set({ conversations: convs }),

  setActiveConversation: (conv) => {
    set({ activeConversation: conv });
    if (conv) {
      get().clearUnread();
    }
  },

  setMessages: (msgs) => set({ messages: msgs }),

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg],
  })),

  updateConversation: (conv) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === conv.id ? conv : c
    ),
  })),

  setConnected: (connected) => set({ isConnected: connected }),

  incrementUnread: () => set((state) => ({
    unreadCount: state.unreadCount + 1,
  })),

  clearUnread: () => {
    const { activeConversation } = get();
    if (activeConversation) {
      set((state) => ({
        unreadCount: Math.max(0, state.unreadCount - (activeConversation.unread_count || 0)),
      }));
    }
  },

  connect: (token) => {
    // Keep the token on the store so the reconnect logic below can re-open
    // the socket after a network blip / Railway redeploy without requiring
    // a manual re-login.
    set({ token });

    // If a healthy socket is already up, don't tear it down — that would
    // cause a visible "Offline -> Online" flicker for no reason.
    const existing = get().ws;
    if (existing && existing.readyState === WebSocket.OPEN) return;
    if (existing && existing.readyState === WebSocket.CONNECTING) return;

    // Tear down any previous socket without scheduling a reconnect for it.
    if (existing) {
      // Detach handlers so its onclose doesn't trigger a stale reconnect.
      existing.onopen = null;
      existing.onmessage = null;
      existing.onclose = null;
      existing.onerror = null;
      try { existing.close(); } catch {}
    }

    const openSocket = () => {
      // encodeURIComponent: JWTs may contain `+`, `/`, `=` which the server
      // would otherwise decode as spaces / path segments and reject with 4401.
      const wsUrl = `${getWsBase()}/ws/chat?token=${encodeURIComponent(token)}`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        set({ isConnected: true });
        try {
          socket.send(JSON.stringify({ type: "auth", token }));
        } catch {}
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data, set, get);
        } catch {
          console.error("Failed to parse WebSocket message");
        }
      };

      socket.onclose = () => {
        // Only react to *this* socket's close. If a newer socket has been
        // installed (by a fresh login / page reload / another reconnect
        // attempt), `get().ws !== socket` and we drop the event.
        const { ws: current, token: currentToken } = get();
        if (current !== socket) return;
        set({ isConnected: false });
        if (!currentToken) return;
        scheduleReconnect(currentToken, 0);
      };

      socket.onerror = () => {
        // Treat errors as a close — Chromium fires `error` then `close`, but
        // we set the flag here so the UI shows Offline immediately.
        set({ isConnected: false });
      };

      set({ ws: socket });
    };

    const scheduleReconnect = (tk: string, attempt: number) => {
      // Exponential backoff capped at RECONNECT_MAX_MS. attempt 0 -> 1s,
      // attempt 1 -> 2s, attempt 2 -> 4s ... doubling up to 30s.
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
      setTimeout(() => {
        // Bail out if a fresh login replaced the token or the user logged out.
        if (get().token !== tk) return;
        openSocket();
      }, delay);
    };

    openSocket();
  },

  // Force-reconnect using the currently-stored token. Called by the
  // visibilitychange handler so that a tab refresh / window focus
  // immediately re-establishes the link instead of waiting on the
  // exponential-backoff timer.
  reconnect: () => {
    const { token, isConnected } = get();
    if (!token || isConnected) return;
    get().connect(token);
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      try { ws.close(); } catch {}
    }
    set({ ws: null, isConnected: false, token: null });
  },

  sendMessage: (content: string, clientId?: string) => {
    const { ws, activeConversation } = get();
    if (!ws || !activeConversation || ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    // Echo the client_id back so the round-trip broadcast can replace the
    // optimistic placeholder we add locally.
    const cid =
      clientId ?? `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    ws.send(JSON.stringify({
      type: "message",
      conversation_id: activeConversation.id,
      content,
      client_id: cid,
    }));
    return true;
  },
}));

function handleWebSocketMessage(
  data: Record<string, unknown>,
  _set: (fn: (state: ChatState) => Partial<ChatState>) => void,
  get: () => ChatState
) {
  switch (data.type) {
    case "conversation_update":
      get().updateConversation(data.conversation as Conversation);
      break;

    case "new_message": {
      // Sender-side de-dup: when the agent's own message round-trips back
      // through the broadcast, replace the optimistic placeholder (matched
      // by client_id) instead of appending a duplicate.
      const serverMsg = data.message as ChatMessage;
      const clientId = data.client_id as string | undefined;
      if (clientId) {
        const state = get();
        const placeholderIdx = state.messages.findIndex((x) => x.id === clientId);
        if (placeholderIdx !== -1) {
          _set((s) => {
            const next = s.messages.slice();
            next[placeholderIdx] = serverMsg;
            return { messages: next };
          });
          break;
        }
      }
      // Receiver-side: drop duplicates by server id (broadcast can re-deliver
      // the same frame after a reconnect).
      if (get().messages.some((m) => m.id === serverMsg.id)) break;
      get().addMessage(serverMsg);
      if (data.conversation_id !== get().activeConversation?.id) {
        get().incrementUnread();
      }
      break;
    }

    case "conversation_list":
      get().setConversations(data.conversations as Conversation[]);
      break;

    case "messages":
      get().setMessages(data.messages as ChatMessage[]);
      break;

    case "typing":
      break;
  }
}
