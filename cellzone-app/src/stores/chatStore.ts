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
  setConversations: (convs: Conversation[]) => void;
  setActiveConversation: (conv: Conversation | null) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateConversation: (conv: Conversation) => void;
  setConnected: (connected: boolean) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  connect: (token: string) => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isConnected: false,
  unreadCount: 0,
  ws: null,

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
    const { ws } = get();
    if (ws) {
      ws.close();
    }

    const wsUrl = `${getWsBase()}/ws/chat?token=${token}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      set({ isConnected: true });
      socket.send(JSON.stringify({ type: "auth", token }));
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
      set({ isConnected: false });
    };

    socket.onerror = () => {
      set({ isConnected: false });
    };

    set({ ws: socket });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
      set({ ws: null, isConnected: false });
    }
  },

  sendMessage: (content) => {
    const { ws, activeConversation } = get();
    if (ws && activeConversation && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "message",
        conversation_id: activeConversation.id,
        content,
      }));
    }
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

    case "new_message":
      get().addMessage(data.message as ChatMessage);
      if (data.conversation_id !== get().activeConversation?.id) {
        get().incrementUnread();
      }
      break;

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
