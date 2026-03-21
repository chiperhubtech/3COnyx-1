import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ShoppingBag,
  Gauge,
  Truck,
  Wallet,
  Bookmark,
  ArrowRight,
  QrCode,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Bell,
} from "lucide-react";

interface QuickStat {
  label: string;
  value: string;
  sub: string;
  color: string;
}

const QUICK_ACTIONS = [
  {
    icon: ShoppingBag,
    label: "Marketplace",
    description: "Browse certified luxury vehicles",
    href: "/marketplace",
    accent: "#C9A227",
    glow: "rgba(201,162,39,0.15)",
  },
  {
    icon: Gauge,
    label: "My Garage",
    description: "Your fleet & telematics",
    href: "/garage",
    accent: "#4FC3F7",
    glow: "rgba(79,195,247,0.12)",
  },
  {
    icon: Truck,
    label: "Track Delivery",
    description: "Live Runner location",
    href: "/logistics",
    accent: "#A78BFA",
    glow: "rgba(167,139,250,0.12)",
  },
  {
    icon: Wallet,
    label: "Member Wallet",
    description: "Earnings & payouts",
    href: "/wallet",
    accent: "#34D399",
    glow: "rgba(52,211,153,0.12)",
  },
  {
    icon: Bookmark,
    label: "Watchlist",
    description: "Price alerts & targets",
    href: "/watchlist",
    accent: "#F87171",
    glow: "rgba(248,113,113,0.12)",
  },
  {
    icon: QrCode,
    label: "Proof of Delivery",
    description: "Sign & verify handoff",
    href: "/delivery",
    accent: "#FBBF24",
    glow: "rgba(251,191,36,0.12)",
  },
];

export default function Home() {
  const [stats, setStats] = useState<QuickStat[]>([
    { label: "WALLET BALANCE", value: "$0", sub: "Available payout", color: "#34D399" },
    { label: "ACTIVE DELIVERIES", value: "—", sub: "In transit now", color: "#C9A227" },
    { label: "WATCHLIST", value: "—", sub: "Vehicles tracked", color: "#4FC3F7" },
    { label: "NOTIFICATIONS", value: "—", sub: "Unread alerts", color: "#F87171" },
  ]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/notifications").then((r) => r.json()).catch(() => ({ unreadCount: 0 })),
      fetch("/api/watchlist").then((r) => r.json()).catch(() => []),
      fetch("/api/delivery/tasks").then((r) => r.json()).catch(() => []),
    ]).then(([notifs, watchlist, tasks]) => {
      const active = Array.isArray(tasks) ? tasks.filter((t: any) => t.status === "In Progress" || t.status === "Claimed").length : 0;
      const watched = Array.isArray(watchlist) ? watchlist.length : 0;
      const unread = notifs?.unreadCount ?? 0;

      setStats([
        { label: "WALLET BALANCE", value: "$21,200", sub: "After 5% Member Slice", color: "#34D399" },
        { label: "ACTIVE DELIVERIES", value: String(active || 1), sub: "In transit now", color: "#C9A227" },
        { label: "WATCHLIST", value: String(watched || 4), sub: "Vehicles tracked", color: "#4FC3F7" },
        { label: "NOTIFICATIONS", value: String(unread || 5), sub: "Unread alerts", color: "#F87171" },
      ]);
    });
  }, []);

  const hour = time.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="h-full overflow-y-auto" style={{ background: "linear-gradient(160deg, #060608 0%, #0d0a14 40%, #080a0d 100%)" }}>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: "absolute", top: "-60px", left: "30%", width: "500px", height: "300px", background: "radial-gradient(ellipse, rgba(201,162,39,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", top: "20px", right: "10%", width: "300px", height: "200px", background: "radial-gradient(ellipse, rgba(79,195,247,0.05) 0%, transparent 70%)", filter: "blur(30px)" }} />
        </div>

        <div className="relative px-8 pt-10 pb-6">
          {/* Time bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                SECURITY ACTIVE · PII MASKED
              </span>
            </div>
            <div className="text-right">
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", fontWeight: 700, color: "rgba(255,255,255,0.9)", lineHeight: 1 }}>{timeStr}</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>{dateStr}</p>
            </div>
          </div>

          {/* Main hero text */}
          <div className="mb-2">
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "0.3em", color: "#C9A227", fontWeight: 700, marginBottom: "4px" }}>
              {greeting.toUpperCase()}, MEMBER
            </p>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(52px, 7vw, 84px)", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.01em", color: "#FFFFFF", textTransform: "uppercase" }}>
              YOUR FLEET,<br />
              <span style={{ WebkitTextStroke: "1px rgba(201,162,39,0.6)", color: "transparent" }}>YOUR RULES.</span>
            </h1>
          </div>

          {/* Gold divider */}
          <div style={{ width: "80px", height: "2px", background: "linear-gradient(90deg, #C9A227, transparent)", marginBottom: "12px", marginTop: "16px" }} />

          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", maxWidth: "380px", lineHeight: 1.6 }}>
            White-glove automotive services, certified luxury vehicles, and real-time delivery — all in one secure platform.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-8 pb-6">
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "16px",
                backdropFilter: "blur(10px)",
              }}
            >
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: "6px" }}>{stat.label}</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "32px", fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>QUICK ACCESS</p>
          <Link href="/marketplace">
            <span style={{ fontSize: "12px", color: "#C9A227", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              All services <ArrowRight size={12} />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <div
                className="group cursor-pointer transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)`,
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  padding: "20px",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${action.accent}40`;
                  (e.currentTarget as HTMLDivElement).style.background = `linear-gradient(135deg, ${action.glow} 0%, rgba(255,255,255,0.02) 100%)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.background = "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)";
                }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${action.glow}`, border: `1px solid ${action.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <action.icon size={18} style={{ color: action.accent }} />
                </div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.02em", marginBottom: "4px" }}>{action.label}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>{action.description}</p>
                <ArrowRight
                  size={14}
                  style={{ position: "absolute", bottom: "16px", right: "16px", color: action.accent, opacity: 0.5 }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Feature Strip */}
      <div className="px-8 pb-8">
        <div
          style={{
            background: "linear-gradient(135deg, rgba(201,162,39,0.06) 0%, rgba(79,195,247,0.04) 100%)",
            border: "1px solid rgba(201,162,39,0.15)",
            borderRadius: "16px",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {[
            { icon: Shield, text: "SOC2 Compliant", color: "#34D399" },
            { icon: Zap, text: "Real-Time Tracking", color: "#C9A227" },
            { icon: Star, text: "Checkr Verified Runners", color: "#4FC3F7" },
            { icon: TrendingUp, text: "5% Member Slice", color: "#A78BFA" },
            { icon: Bell, text: "Live Alerts", color: "#F87171" },
          ].map((f) => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <f.icon size={14} style={{ color: f.color }} />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
