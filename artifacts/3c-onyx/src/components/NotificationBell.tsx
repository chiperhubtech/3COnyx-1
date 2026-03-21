import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Truck, BadgeCheck, CreditCard, Zap, AlertTriangle, Settings, ChevronRight } from "lucide-react";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const TYPE_ICON: Record<string, React.FC<{ size?: number; className?: string }>> = {
  DELIVERY: Truck,
  BGC: BadgeCheck,
  PAYOUT: CreditCard,
  RUNNER: Truck,
  ALERT: AlertTriangle,
  SYSTEM: Settings,
};

const TYPE_COLOR: Record<string, string> = {
  DELIVERY: "text-blue-400 bg-blue-400/10",
  BGC: "text-emerald-400 bg-emerald-400/10",
  PAYOUT: "text-amber-400 bg-amber-400/10",
  RUNNER: "text-violet-400 bg-violet-400/10",
  ALERT: "text-red-400 bg-red-400/10",
  SYSTEM: "text-white/40 bg-white/5",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [seeded, setSeeded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${BASE}/api/notifications`);
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      const res = await fetch(`${BASE}/api/notifications`);
      const data = await res.json();
      if ((data.notifications?.length ?? 0) === 0 && !seeded) {
        setSeeded(true);
        await fetch(`${BASE}/api/notifications/seed`, { method: "POST" });
        await fetchNotifications();
      } else {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    };
    init();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markRead = async (id: number) => {
    await fetch(`${BASE}/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch(`${BASE}/api/notifications/read-all`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <Bell size={16} className="text-white/60" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 flex flex-col rounded-xl border border-white/10 shadow-2xl overflow-hidden"
          style={{ width: 360, maxHeight: 520, background: "#111113" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-amber-400" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                >
                  <CheckCheck size={12} />
                  All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-white/5 transition-colors">
                <X size={13} className="text-white/30" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={24} className="text-white/10 mx-auto mb-2" />
                <p className="text-white/25 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Settings;
                const colorClass = TYPE_COLOR[n.type] ?? "text-white/40 bg-white/5";
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`flex gap-3 px-4 py-3 border-b border-white/5 transition-colors cursor-pointer ${
                      n.read ? "opacity-50" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className={`flex items-center justify-center rounded-lg shrink-0 mt-0.5 ${colorClass}`} style={{ width: 32, height: 32 }}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white leading-tight">{n.title}</p>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-white/20 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
