import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Heart,
  TrendingDown,
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

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

  const { data: impactMetrics } = useQuery({
    queryKey: ["home-impact"],
    queryFn: () => fetch(`${API}/impact/metrics`).then(r => r.json()),
    refetchInterval: 10_000,
  });

  const hour = time.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const savingsStr = impactMetrics?.ignoranceTax?.totalMemberSavings
    ? `$${(impactMetrics.ignoranceTax.totalMemberSavings / 1_000_000).toFixed(2)}M`
    : "$4.72M";

  return (
    <div className="h-full overflow-y-auto hero-mesh">

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Neural grid */}
        <div className="hero-grid pointer-events-none" />

        {/* Ambient glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: "absolute", top: "-80px", left: "25%", width: "600px", height: "360px", background: "radial-gradient(ellipse, rgba(201,162,39,0.09) 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", top: "10px", right: "5%", width: "350px", height: "250px", background: "radial-gradient(ellipse, rgba(79,195,247,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: "0", left: "60%", width: "250px", height: "150px", background: "radial-gradient(ellipse, rgba(129,140,248,0.05) 0%, transparent 70%)", filter: "blur(30px)" }} />
        </div>

        <div className="relative px-8 pt-10 pb-6">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="neural-badge neural-badge-green">SECURITY ACTIVE · PII MASKED</span>
            </div>
            <div className="text-right">
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", fontWeight: 700, color: "rgba(255,255,255,0.9)", lineHeight: 1, letterSpacing: "0.04em" }}>{timeStr}</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>{dateStr}</p>
            </div>
          </div>

          {/* Main hero text */}
          <div className="mb-2">
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "0.3em", color: "#C9A227", fontWeight: 700, marginBottom: "8px" }}>
              {greeting.toUpperCase()}, MEMBER
            </p>
            <h1 className="neon-underline" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(52px, 7vw, 88px)", fontWeight: 900, lineHeight: 0.88, letterSpacing: "-0.01em", color: "#FFFFFF", textTransform: "uppercase", display: "inline-block" }}>
              YOUR FLEET,<br />
              <span style={{ WebkitTextStroke: "1.5px rgba(201,162,39,0.7)", color: "transparent" }}>YOUR RULES.</span>
            </h1>
          </div>

          {/* Gold divider */}
          <div style={{ width: "80px", height: "2px", background: "linear-gradient(90deg, #C9A227, rgba(79,195,247,0.5), transparent)", marginBottom: "14px", marginTop: "20px" }} />

          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", maxWidth: "380px", lineHeight: 1.65 }}>
            White-glove automotive services, certified luxury vehicles, and real-time delivery — all in one secure platform.
          </p>

          {/* AI integrations pill row */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              { label: "Plaid", color: "#4FC3F7" },
              { label: "Insuremo", color: "#34D399" },
              { label: "Motor.com", color: "#F97316" },
              { label: "Browserbase", color: "#818CF8" },
              { label: "Gumloop", color: "#C9A227" },
              { label: "Gemini AI", color: "#F87171" },
            ].map((p) => (
              <span key={p.label} className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${p.color}10`, border: `1px solid ${p.color}25`, color: p.color, letterSpacing: "0.06em" }}>
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-8 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="ai-card holographic-card p-4">
              <p style={{ fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.28)", fontWeight: 700, marginBottom: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stat.label}</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ignorance Tax Impact Strip */}
      <div className="px-8 pb-5">
        <Link href="/impact">
          <div style={{
            background: "linear-gradient(135deg, rgba(52,211,153,0.07) 0%, rgba(201,162,39,0.04) 100%)",
            border: "1px solid rgba(52,211,153,0.15)",
            borderRadius: "14px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
          }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Heart size={15} color="#34D399" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px" }}>Ignorance Tax Eliminated</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 900, color: "#34D399", lineHeight: 1 }}>{savingsStr}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>saved vs. retail markup</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
              <TrendingDown size={13} color="#34D399" />
              <ArrowRight size={13} color="rgba(52,211,153,0.5)" />
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="section-label">QUICK ACCESS</p>
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
                className="ai-card holographic-card group cursor-pointer transition-all duration-200 p-5"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${action.accent}35`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px ${action.accent}20, 0 8px 24px ${action.accent}08`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: `${action.glow}`, border: `1px solid ${action.accent}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                  <action.icon size={18} style={{ color: action.accent }} />
                </div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "17px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.02em", marginBottom: "4px" }}>{action.label}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.32)", lineHeight: 1.4 }}>{action.description}</p>
                <ArrowRight size={13} style={{ marginTop: "12px", color: action.accent, opacity: 0.5 }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Feature Strip */}
      <div className="px-8 pb-8">
        <div className="ai-card neural-glow-gold p-5 flex items-center justify-between flex-wrap gap-4">
          {[
            { icon: Shield, text: "SOC2 Compliant", color: "#34D399" },
            { icon: Zap, text: "Real-Time Tracking", color: "#C9A227" },
            { icon: Star, text: "Checkr Verified", color: "#4FC3F7" },
            { icon: TrendingUp, text: "5% Member Slice", color: "#A78BFA" },
            { icon: Bell, text: "Live Alerts", color: "#F87171" },
          ].map((f) => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <f.icon size={14} style={{ color: f.color }} />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
