/**
 * 3C Onyx — AppSidebar
 * Luxury cockpit instrument panel aesthetic.
 * Every nav item is a precision instrument.
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingBag, Gauge, Truck, Wallet, Shield, ChevronRight,
  QrCode, CreditCard, Bookmark, ChevronDown, LayoutDashboard,
  ClipboardCheck, BadgeCheck, BarChart3, ShieldCheck, GitBranch,
  UserCheck, Car, Settings, Landmark, ShieldPlus, FileSearch,
  Cpu, Package, Lock, Radio, Users, Sparkles, Heart, Wrench,
  Link2, X, Glasses, Brain, Layers, Activity,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

/* ─── Navigation Data ─────────────────────────────────────────── */
const CUSTOMER_NAV = [
  { label: "Marketplace",     path: "/marketplace",  icon: ShoppingBag, description: "Certified luxury vehicles",      accent: "#C9A227" },
  { label: "My Garage",       path: "/garage",        icon: Gauge,       description: "Fleet & telematics",            accent: "#4FC3F7" },
  { label: "Watchlist",       path: "/watchlist",     icon: Bookmark,    description: "Price alerts & tracking",       accent: "#F87171" },
  { label: "Live Tracking",   path: "/logistics",     icon: Truck,       description: "Your vehicle — live GPS",       accent: "#A78BFA" },
  { label: "Dynasty Wallet",  path: "/wallet",        icon: CreditCard,  description: "Triple-split · KYC · payouts", accent: "#34D399" },
  { label: "Referral Rewards",path: "/referral-wallet",icon: Wallet,     description: "Refer & earn",                 accent: "#818CF8" },
  { label: "Finance Hub",     path: "/finance",       icon: Landmark,    description: "Plaid · net worth",            accent: "#4FC3F7" },
  { label: "Insurance Hub",   path: "/insurance",     icon: ShieldPlus,  description: "Insuremo · coverage",          accent: "#34D399" },
  { label: "Vehicle History", path: "/vehicle-history",icon: FileSearch, description: "Motor.com · VIN report",       accent: "#F97316" },
];

const SPECIALIST_NAV = [
  { label: "My Dashboard",          path: "/specialist-dashboard", icon: LayoutDashboard, description: "Earnings · ratings · tasks",   accent: "#4FC3F7" },
  { label: "Pre-Pickup Inspection", path: "/inspection",           icon: ClipboardCheck,  description: "Condition report · SHA-256",   accent: "#34D399" },
  { label: "Proof of Delivery",     path: "/delivery",             icon: QrCode,          description: "QR handshake · audit trail",   accent: "#C9A227" },
  { label: "Dropship Coordinator",  path: "/dropship",             icon: Package,         description: "BOL · 360° Scan · AR Preview", accent: "#F97316" },
  { label: "Apply as Specialist",   path: "/apply",                icon: BadgeCheck,      description: "Join the 3C Runner fleet",     accent: "#818CF8" },
];

const PLATFORM_NAV = [
  { label: "Spatial AR OS",      path: "/ar-viewer",   icon: Glasses,      description: "Rocksolid · Guardian HUD",          accent: "#C9A227" },
  { label: "3C Impact",          path: "/impact",      icon: Heart,        description: "ESG · Ignorance Tax · Mesh",         accent: "#34D399" },
  { label: "Pro Mesh",           path: "/pro",         icon: Wrench,       description: "Apprentice → Master",               accent: "#A78BFA" },
  { label: "Chain of Custody",   path: "/custody",     icon: Link2,        description: "SHA-256 · Ethereum anchor",          accent: "#818CF8" },
  { label: "Trust Layer",        path: "/trust",       icon: Layers,       description: "How we coordinate",                 accent: "#60A5FA" },
  { label: "Agentic OS",         path: "/agentic-os",  icon: Cpu,          description: "12-Agent Neural Mesh",              accent: "#818CF8" },
  { label: "Guardian V2X",       path: "/guardian",    icon: ShieldPlus,   description: "Predictive · 7-Agent Mesh",         accent: "#10B981" },
  { label: "Command Center",     path: "/command",     icon: Radio,        description: "K-Factor · Kill-Switch",            accent: "#EF4444" },
  { label: "Partner Network",    path: "/partners",    icon: Users,        description: "I-95 Spine · Reputation Mesh",      accent: "#E5E7EB" },
  { label: "Share & Invest",     path: "/share",       icon: QrCode,       description: "F&F Round · QR pitch",             accent: "#C9A227" },
  { label: "Unity Demo",         path: "/unity",       icon: Sparkles,     description: "Investor Demo · Full Corridor",     accent: "#C9A227" },
  { label: "Membership",         path: "/subscribe",   icon: Settings,     description: "$99/mo · All Features",            accent: "#C9A227" },
  { label: "Concierge",          path: "/concierge",   icon: UserCheck,    description: "Client management",                accent: "#4FC3F7" },
  { label: "Inventory",          path: "/inventory",   icon: Car,          description: "Vehicle catalog",                  accent: "#C9A227" },
  { label: "Analytics",          path: "/analytics",   icon: BarChart3,    description: "Revenue & GMV",                    accent: "#818CF8" },
  { label: "Audit Vault",        path: "/audit-vault", icon: ShieldCheck,  description: "SOC2 log",                         accent: "#34D399" },
  { label: "Security Layer",     path: "/security",    icon: Lock,         description: "AES-256 · Transient Access",       accent: "#10B981" },
  { label: "AI Hub",             path: "/ai-hub",      icon: Cpu,          description: "Gumloop · Browserbase",            accent: "#818CF8" },
  { label: "CI / CD",            path: "/ci-cd",       icon: GitBranch,    description: "Pipeline & MCP",                  accent: "#60A5FA" },
];

/* ─── NavItem ─────────────────────────────────────────────────── */
function NavItem({ label, path, icon: Icon, description, accent = "#C9A227", onClose }: {
  label: string; path: string; icon: any; description: string; accent?: string; onClose?: () => void;
}) {
  const [location] = useLocation();
  const isActive = location === path || location.startsWith(path + "/");

  return (
    <Link href={path} onClick={onClose}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "7px 10px",
          borderRadius: 10,
          cursor: "pointer",
          transition: "all 0.15s",
          background: isActive
            ? `linear-gradient(135deg, ${accent}12 0%, ${accent}06 100%)`
            : "transparent",
          border: isActive ? `1px solid ${accent}28` : "1px solid transparent",
          borderLeft: isActive ? `2px solid ${accent}` : "2px solid transparent",
          marginBottom: 1,
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLDivElement).style.borderLeftColor = `${accent}50`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
            (e.currentTarget as HTMLDivElement).style.borderLeftColor = "transparent";
          }
        }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: isActive ? `${accent}18` : "rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s",
        }}>
          <Icon size={12} style={{ color: isActive ? accent : "rgba(255,255,255,0.38)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 13, fontWeight: isActive ? 700 : 500,
            letterSpacing: "0.03em",
            color: isActive ? "#fff" : "rgba(255,255,255,0.62)",
            lineHeight: 1, marginBottom: 2,
          }}>{label}</p>
          <p style={{ fontSize: 9, color: isActive ? `${accent}70` : "rgba(255,255,255,0.22)", lineHeight: 1, letterSpacing: "0.02em" }}>{description}</p>
        </div>
        <ChevronRight size={10} style={{ color: isActive ? accent : "transparent", opacity: 0.7, flexShrink: 0 }} />
      </div>
    </Link>
  );
}

/* ─── Section Header ──────────────────────────────────────────── */
function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{
      fontSize: 8, letterSpacing: "0.28em",
      color: "rgba(255,255,255,0.18)",
      fontWeight: 800, padding: "6px 10px 6px",
      fontFamily: "'Barlow Condensed', sans-serif",
    }}>{children}</p>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.045)", margin: "10px 0" }} />;
}

/* ─── Live AI Status Widget ───────────────────────────────────── */
function AIStatusBar() {
  const [agents, setAgents] = useState(9);
  useEffect(() => {
    const id = setInterval(() => setAgents(8 + Math.floor(Math.random() * 5)), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      margin: "12px 10px",
      padding: "10px 12px",
      borderRadius: 10,
      background: "linear-gradient(135deg, rgba(201,162,39,0.06) 0%, rgba(96,165,250,0.03) 100%)",
      border: "1px solid rgba(201,162,39,0.15)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--onyx-gold)", animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 8, fontWeight: 800, color: "var(--onyx-gold)", letterSpacing: "0.14em" }}>NEURAL MESH LIVE</span>
      </div>
      <div style={{ display: "flex", gap: 0 }}>
        {[
          { label: "AGENTS", value: `${agents}/12`,  color: "#C9A227" },
          { label: "STATUS", value: "ACTIVE",         color: "#34D399" },
        ].map((item, i) => (
          <div key={item.label} style={{ flex: 1, padding: i === 0 ? "0 12px 0 0" : "0 0 0 12px", borderRight: i === 0 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 2 }}>{item.label}</p>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── AppSidebar ──────────────────────────────────────────────── */
export function AppSidebar({ onClose }: { onClose?: () => void }) {
  const [showPlatform, setShowPlatform] = useState(false);

  return (
    <aside style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      background: "var(--onyx-sidebar-bg)",
      borderRight: "1px solid var(--onyx-border-line)",
    }}>

      {/* ── Logo ──────────────────────────────────────────────── */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" onClick={onClose}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              {/* Logo mark */}
              <div style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: "linear-gradient(135deg, #C9A227 0%, #5B3A00 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 24px rgba(201,162,39,0.28)",
                }}>
                  <Shield size={17} style={{ color: "#000" }} />
                </div>
                {/* Live pulse ring */}
                <div style={{
                  position: "absolute", inset: -3,
                  borderRadius: 14,
                  border: "1px solid rgba(201,162,39,0.25)",
                  animation: "slow-pulse-ring 3s ease-in-out infinite",
                  pointerEvents: "none",
                }} />
              </div>
              <div>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 19, fontWeight: 900, color: "#fff",
                  letterSpacing: "0.1em", lineHeight: 1,
                }}>3C ONYX</p>
                <p style={{ fontSize: 8, color: "rgba(201,162,39,0.5)", letterSpacing: "0.28em", fontWeight: 700, marginTop: 2 }}>SECURE PLATFORM</p>
              </div>
            </div>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <NotificationBell />
            {onClose && (
              <button onClick={onClose} className="md:hidden"
                style={{ padding: 6, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)" }}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Neural Mesh Status ────────────────────────────────── */}
      <AIStatusBar />

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "0 6px 10px", scrollbarWidth: "none" }}>

        <SectionLabel>MY ACCOUNT</SectionLabel>
        {CUSTOMER_NAV.map((item) => (
          <NavItem key={item.path} {...item} onClose={onClose} />
        ))}

        <Divider />
        <SectionLabel>SPECIALIST</SectionLabel>
        {SPECIALIST_NAV.map((item) => (
          <NavItem key={item.path} {...item} onClose={onClose} />
        ))}

        <Divider />
        {/* Collapsible PLATFORM section */}
        <button
          onClick={() => setShowPlatform(!showPlatform)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "6px 10px", borderRadius: 8,
            background: "transparent", border: "none", cursor: "pointer",
          }}
        >
          <Cpu size={9} style={{ color: "rgba(255,255,255,0.18)" }} />
          <span style={{ fontSize: 8, letterSpacing: "0.28em", color: "rgba(255,255,255,0.18)", fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", flex: 1, textAlign: "left" }}>
            PLATFORM
          </span>
          <ChevronDown size={10} style={{ color: "rgba(255,255,255,0.18)", transform: showPlatform ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        {showPlatform && (
          <div>
            {PLATFORM_NAV.map((item) => (
              <NavItem key={item.path} {...item} onClose={onClose} />
            ))}
          </div>
        )}
      </nav>

      {/* ── Footer — Branding + Theme Toggle + Security Badge ─── */}
      <div style={{ padding: "10px 12px 14px", borderTop: "1px solid var(--onyx-border-line)" }}>
        {/* Brand line */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11, fontWeight: 900, letterSpacing: "0.12em",
              color: "var(--onyx-text-secondary)", lineHeight: 1,
            }}>3C ONYX</p>
            <p style={{ fontSize: 7, fontWeight: 700, color: "var(--onyx-gold)", letterSpacing: "0.18em", marginTop: 2 }}>
              POWERED BY CUXTOMCANDYCLUB LLC
            </p>
          </div>
          <ThemeToggle size="sm" />
        </div>
        {/* Security badge */}
        <div style={{
          padding: "8px 11px", borderRadius: 9,
          background: "rgba(52,211,153,0.04)",
          border: "1px solid rgba(52,211,153,0.14)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", flexShrink: 0, animation: "pulse 2s infinite" }} />
          <div>
            <p style={{ fontSize: 8, color: "rgba(52,211,153,0.8)", fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1 }}>PII Protection Active</p>
            <p style={{ fontSize: 7, color: "var(--onyx-text-dim)", marginTop: 2, letterSpacing: "0.06em" }}>AES-256 · SOC2 Compliant</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
