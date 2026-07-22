import { useAuthStore } from "../stores/authStore";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Image,
  Ticket,
  CircleDot,
  Star,
  MessageSquare,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { useChatStore } from "../stores/chatStore";

type Tab = "dashboard" | "products" | "orders" | "blog" | "media" | "coupons" | "spin" | "ratings" | "chat" | "users" | "settings";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const tabs: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean; supportOnly?: boolean }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: "products",
    label: "Sản phẩm",
    icon: <Package className="w-5 h-5" />,
  },
  {
    id: "orders",
    label: "Đơn hàng",
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  {
    id: "blog",
    label: "Blog",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: "media",
    label: "Hình ảnh / Video",
    icon: <Image className="w-5 h-5" />,
  },
  {
    id: "coupons",
    label: "Coupon",
    icon: <Ticket className="w-5 h-5" />,
  },
  {
    id: "spin",
    label: "Vòng quay",
    icon: <CircleDot className="w-5 h-5" />,
  },
  {
    id: "ratings",
    label: "Đánh giá",
    icon: <Star className="w-5 h-5" />,
  },
  {
    id: "chat",
    label: "Chat",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    id: "users",
    label: "Người dùng",
    icon: <Users className="w-5 h-5" />,
    adminOnly: true,
  },
  {
    id: "settings",
    label: "Cài đặt",
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function Sidebar({ activeTab, onTabChange, collapsed = false }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useChatStore();

  const visibleTabs = tabs.filter((tab) => {
    if (tab.adminOnly && user?.role !== "admin") return false;
    return true;
  });

  return (
    <aside
      className={`flex flex-col h-full glass border-r border-white/10 ${
        collapsed ? "w-16" : "w-60"
      } transition-all duration-300`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-white/10">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[#f0f0f5] text-sm">CellZone</span>
            <span className="text-[10px] text-[#8b8b9a] uppercase tracking-wider">
              {user?.role === "admin" ? "Admin" : "Hỗ trợ"}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "text-[#8b8b9a] hover:bg-white/5 hover:text-[#f0f0f5]"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <span className="relative">
              {tab.icon}
              {tab.id === "chat" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            {!collapsed && <span>{tab.label}</span>}
          </button>
        ))}
      </nav>

      {/* User info & Logout */}
      <div className="p-3 border-t border-white/10">
        {!collapsed && user && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-white/5">
            <p className="text-sm text-[#f0f0f5] truncate">{user.email}</p>
            <p className="text-xs text-[#5a5a6a] capitalize">
              {user.role === "admin" ? "Quản trị viên" : "Nhân viên hỗ trợ"}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
