import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingBag,
  Gauge,
  Truck,
  Wallet,
  Shield,
  ChevronRight,
  QrCode,
  CreditCard,
  Bookmark,
  ChevronDown,
  LayoutDashboard,
  ClipboardCheck,
  BadgeCheck,
  BarChart3,
  ShieldCheck,
  GitBranch,
  UserCheck,
  Car,
  Settings,
  Landmark,
  ShieldPlus,
  FileSearch,
  Cpu,
  Package,
  Lock,
  Radio,
  Users,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";

const CUSTOMER_NAV = [
  {
    label: "Marketplace",
    path: "/marketplace",
    icon: ShoppingBag,
    description: "Shop certified vehicles",
    accent: "#C9A227",
  },
  {
    label: "My Garage",
    path: "/garage",
    icon: Gauge,
    description: "Your fleet & telematics",
    accent: "#4FC3F7",
  },
  {
    label: "Watchlist",
    path: "/watchlist",
    icon: Bookmark,
    description: "Price alerts & tracking",
    accent: "#F87171",
  },
  {
    label: "Live Tracking",
    path: "/logistics",
    icon: Truck,
    description: "Runner location",
    accent: "#A78BFA",
  },
  {
    label: "Delivery Sign-Off",
    path: "/delivery",
    icon: QrCode,
    description: "QR handshake",
    accent: "#FBBF24",
  },
  {
    label: "Dropship Coordinator",
    path: "/dropship",
    icon: Package,
    description: "BOL · 360° Scan · AR Preview",
    accent: "#818CF8",
  },
  {
    label: "Dynasty Wallet",
    path: "/wallet",
    icon: CreditCard,
    description: "Triple-split · KYC · payouts",
    accent: "#34D399",
  },
  {
    label: "Referral Rewards",
    path: "/referral-wallet",
    icon: Wallet,
    description: "Refer & earn",
    accent: "#818CF8",
  },
  {
    label: "Finance Hub",
    path: "/finance",
    icon: Landmark,
    description: "Plaid · net worth",
    accent: "#4FC3F7",
  },
  {
    label: "Insurance Hub",
    path: "/insurance",
    icon: ShieldPlus,
    description: "Insuremo · coverage",
    accent: "#34D399",
  },
  {
    label: "Vehicle History",
    path: "/vehicle-history",
    icon: FileSearch,
    description: "Motor.com · VIN report",
    accent: "#F97316",
  },
];

const SPECIALIST_NAV = [
  { label: "My Dashboard", path: "/specialist-dashboard", icon: LayoutDashboard, description: "Performance & earnings" },
  { label: "Inspection", path: "/inspection", icon: ClipboardCheck, description: "Pre-pickup form" },
  { label: "Apply as Specialist", path: "/apply", icon: BadgeCheck, description: "Join the fleet" },
];

const ADMIN_NAV = [
  { label: "Command Center", path: "/command", icon: Radio, description: "K-Factor · Hectocorn · Kill-Switch", accent: "#EF4444" },
  { label: "Guardian", path: "/guardian", icon: ShieldPlus, description: "V2X Predictive · 7-Agent Mesh", accent: "#10B981" },
  { label: "Partner Network", path: "/partners", icon: Users, description: "I-95 Spine · Reputation Mesh", accent: "#E5E7EB" },
  { label: "Membership", path: "/subscribe", icon: Settings, description: "$99/mo · All Features", accent: "#C9A227" },
  { label: "Concierge", path: "/concierge", icon: UserCheck, description: "Client management" },
  { label: "Inventory", path: "/inventory", icon: Car, description: "Vehicle catalog" },
  { label: "Analytics", path: "/analytics", icon: BarChart3, description: "Revenue & GMV" },
  { label: "Audit Vault", path: "/audit-vault", icon: ShieldCheck, description: "SOC2 log" },
  { label: "Security Layer", path: "/security", icon: Lock, description: "AES-256 · Transient Access · AI Audit", accent: "#10B981" },
  { label: "AI Hub", path: "/ai-hub", icon: Cpu, description: "Gumloop · Browserbase", accent: "#818CF8" },
  { label: "CI / CD", path: "/ci-cd", icon: GitBranch, description: "Pipeline & MCP" },
];

function NavItem({ label, path, icon: Icon, description, accent }: {
  label: string; path: string; icon: any; description: string; accent?: string;
}) {
  const [location] = useLocation();
  const isActive = location === path || location.startsWith(path + "/");

  return (
    <Link href={path}>
      <div
        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 relative"
        style={{
          background: isActive ? `linear-gradient(135deg, ${accent ? accent + "15" : "rgba(201,162,39,0.1)"} 0%, rgba(255,255,255,0.03) 100%)` : "transparent",
          border: isActive ? `1px solid ${accent ? accent + "30" : "rgba(201,162,39,0.25)"}` : "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
          style={{
            background: isActive ? `${accent ? accent + "20" : "rgba(201,162,39,0.15)"}` : "rgba(255,255,255,0.05)",
          }}
        >
          <Icon
            className="w-3.5 h-3.5"
            style={{ color: isActive ? (accent || "#C9A227") : "rgba(255,255,255,0.45)" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium leading-none mb-0.5"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: isActive ? (accent || "#C9A227") : "rgba(255,255,255,0.75)",
            }}
          >
            {label}
          </p>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", lineHeight: 1 }}>{description}</p>
        </div>
        <ChevronRight
          className="w-3 h-3 shrink-0 transition-all"
          style={{ color: isActive ? (accent || "#C9A227") : "transparent", opacity: isActive ? 0.8 : 0 }}
        />
      </div>
    </Link>
  );
}

export function AppSidebar() {
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #06060a 0%, #08080d 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #C9A227 0%, #8B6914 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(201,162,39,0.25)",
                }}
              >
                <Shield className="w-4 h-4 text-black" />
              </div>
              <div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.1em", lineHeight: 1 }}>
                  3C ONYX
                </p>
                <p style={{ fontSize: "9px", color: "rgba(201,162,39,0.6)", letterSpacing: "0.25em", fontWeight: 600 }}>SECURE PLATFORM</p>
              </div>
            </div>
          </Link>
          <NotificationBell />
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1" style={{ scrollbarWidth: "none" }}>
        {/* Customer section */}
        <p style={{ fontSize: "9px", letterSpacing: "0.25em", color: "rgba(255,255,255,0.2)", fontWeight: 700, padding: "4px 12px 8px", fontFamily: "'Barlow Condensed', sans-serif" }}>
          MY ACCOUNT
        </p>
        {CUSTOMER_NAV.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}

        {/* Specialist section */}
        <div style={{ margin: "16px 0 8px", height: "1px", background: "rgba(255,255,255,0.05)" }} />
        <p style={{ fontSize: "9px", letterSpacing: "0.25em", color: "rgba(255,255,255,0.2)", fontWeight: 700, padding: "4px 12px 8px", fontFamily: "'Barlow Condensed', sans-serif" }}>
          SPECIALIST
        </p>
        {SPECIALIST_NAV.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}

        {/* Platform / Admin (collapsible) */}
        <div style={{ margin: "16px 0 4px", height: "1px", background: "rgba(255,255,255,0.05)" }} />
        <button
          onClick={() => setShowAdmin(!showAdmin)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
          style={{ background: "transparent" }}
        >
          <Settings size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
          <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "rgba(255,255,255,0.2)", fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", flex: 1, textAlign: "left" }}>
            PLATFORM
          </span>
          <ChevronDown
            size={12}
            style={{ color: "rgba(255,255,255,0.2)", transform: showAdmin ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          />
        </button>
        {showAdmin && (
          <div className="space-y-1">
            {ADMIN_NAV.map((item) => (
              <NavItem key={item.path} {...item} />
            ))}
          </div>
        )}
      </nav>

      {/* Security Badge */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div
          style={{
            background: "rgba(52,211,153,0.05)",
            border: "1px solid rgba(52,211,153,0.15)",
            borderRadius: "10px",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite" }} />
          <p style={{ fontSize: "10px", color: "rgba(52,211,153,0.8)", fontWeight: 600, letterSpacing: "0.08em" }}>PII Protection Active</p>
        </div>
      </div>
    </aside>
  );
}
