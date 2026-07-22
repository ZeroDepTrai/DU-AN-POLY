# Customer Support Windows Desktop Application

## Overview

Create a **separate Windows desktop application** using Tauri + React for Customer Support agents.

**Critical: The existing admin dashboard at `/admin` is NOT modified.**

---

## What Stays Unchanged

- `frontend/src/pages/admin/AdminDashboard.tsx` - **NO CHANGES**
- `frontend/src/App.tsx` - **NO CHANGES**
- `frontend/src/pages/` - **NO CHANGES**
- Existing admin features - **NO CHANGES**

---

## What Is Created (New Files Only)

```
support-app/                    (NEW - separate folder)
├── src/                        (React frontend)
│   ├── components/
│   │   ├── Login.tsx          # Agent login
│   │   ├── Sidebar.tsx        # Navigation
│   │   ├── Dashboard.tsx      # Stats overview
│   │   ├── Analytics.tsx      # Charts (view-only)
│   │   ├── ChatList.tsx      # Conversation list
│   │   └── ChatWindow.tsx     # Active chat
│   ├── api/client.ts
│   ├── hooks/
│   ├── stores/
│   └── types/
├── src-tauri/                  (Rust backend)
│   └── src/main.rs
└── package.json

backend/app/
├── routers/
│   ├── analytics.py           (NEW)
│   └── chat.py                (NEW)
└── websocket.py               (MODIFIED - add chat)
```

---

## Features

### 1. Login Screen
- Agent credentials (email/password)
- Session persistence

### 2. Analytics Dashboard (View-Only)
- Revenue charts
- Order stats
- Product performance
- Chat metrics
- Export to CSV

### 3. Live Chat
- Conversation list (waiting/active/closed)
- Real-time messaging (WebSocket)
- Desktop notifications

### 4. System Tray
- Minimize to tray
- Unread badge
- Quick actions menu

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Framework | Tauri 2.x |
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Real-time | WebSocket |

---

## Implementation Steps

1. Create `support-app` folder
2. Initialize Tauri + React project
3. Configure Tailwind CSS
4. Create Login screen
5. Build sidebar navigation
6. Implement Analytics dashboard with charts
7. Create chat system with WebSocket
8. Add backend API endpoints
9. Implement system tray
10. Build Windows executable (.exe)

---

## Build Output

```
support-app/src-tauri/target/release/
└── SupportApp.exe  (~10MB)
```
