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
  Link2, X, Glasses, Brain, Layers, Activity, Flag, Target, DollarSign,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { OnyxLogo } from "./OnyxLogo";

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
  const { t } = useTranslation();
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
        <span style={{ fontSize: 8, fontWeight: 800, color: "var(--onyx-gold)", letterSpacing: "0.14em" }}>{t("sidebar.neuralMesh")}</span>
      </div>
      <div style={{ display: "flex", gap: 0 }}>
        {[
          { label: t("sidebar.agents"), value: `${agents}/12`,  color: "#C9A227" },
          { label: t("sidebar.status"), value: t("sidebar.statusActive", "ACTIVE"), color: "#34D399" },
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
  const { t } = useTranslation();
  const [showPlatform, setShowPlatform] = useState(false);

  const CUSTOMER_NAV = [
    { label: "Intelligence Feed",         path: "/intelligence",   icon: Activity,    description: "AI savings · live opportunities",  accent: "#C9A227" },
    { label: "Race Hub",                  path: "/race-hub",       icon: Flag,        description: "F1 · NASCAR · NHRA · Live Motorsport", accent: "#EF4444" },
    { label: "Aftermarket Shop",          path: "/aftermarket",    icon: ShoppingBag, description: "Performance · Wheels · Brakes · Audio",  accent: "#8B5CF6" },
    { label: "ONYX Parts",               path: "/alibaba-dropship", icon: Package,   description: "Global sourcing · No minimums · Guaranteed quality", accent: "#C9A227" },
    { label: t("sidebar.marketplace"),    path: "/marketplace",    icon: ShoppingBag, description: t("sidebar.marketplaceDesc"),    accent: "#C9A227" },
    { label: t("sidebar.garage"),         path: "/garage",          icon: Gauge,       description: t("sidebar.garageDesc"),         accent: "#4FC3F7" },
    { label: t("sidebar.watchlist"),      path: "/watchlist",       icon: Bookmark,    description: t("sidebar.watchlistDesc"),      accent: "#F87171" },
    { label: t("sidebar.logistics"),      path: "/logistics",       icon: Truck,       description: t("sidebar.logisticsDesc"),      accent: "#A78BFA" },
    { label: t("sidebar.wallet"),         path: "/wallet",          icon: CreditCard,  description: t("sidebar.walletDesc"),         accent: "#34D399" },
    { label: t("sidebar.referral"),       path: "/referral-wallet", icon: Wallet,      description: t("sidebar.referralDesc"),       accent: "#818CF8" },
    { label: t("sidebar.finance"),        path: "/finance",         icon: Landmark,    description: t("sidebar.financeDesc"),        accent: "#4FC3F7" },
    { label: t("sidebar.insurance"),      path: "/insurance",       icon: ShieldPlus,  description: t("sidebar.insuranceDesc"),      accent: "#34D399" },
    { label: t("sidebar.vehicleHistory"), path: "/vehicle-history", icon: FileSearch,  description: t("sidebar.vehicleHistoryDesc"), accent: "#F97316" },
  ];

  const SPECIALIST_NAV = [
    { label: "CRM Hub",                   path: "/crm-hub",              icon: Link2,           description: "Lead pipeline · Deal management · Customer intelligence", accent: "#C9A227" },
    { label: "Platform Intelligence",     path: "/platform-intelligence", icon: Brain,           description: "ONYX Neural Engine · AI insights · Live telemetry", accent: "#7C3AED" },
    { label: "Strategic Command Center",  path: "/strategic-center",      icon: Target,          description: "132M Members · $30B · Year 1–5 Revenue Model",      accent: "#C9A227" },
    { label: "My Earnings",               path: "/worker-dashboard",     icon: DollarSign,      description: "Runners · Techs · Clerks — earnings, tier, opportunities", accent: "#10B981" },
    { label: t("sidebar.specialistDash"), path: "/specialist-dashboard", icon: LayoutDashboard, description: t("sidebar.specialistDashDesc"), accent: "#4FC3F7" },
    { label: t("sidebar.inspection"),     path: "/inspection",           icon: ClipboardCheck,  description: t("sidebar.inspectionDesc"),     accent: "#34D399" },
    { label: t("sidebar.delivery"),       path: "/delivery",             icon: QrCode,          description: t("sidebar.deliveryDesc"),       accent: "#C9A227" },
    { label: t("sidebar.dropship"),       path: "/dropship",             icon: Package,         description: t("sidebar.dropshipDesc"),       accent: "#F97316" },
    { label: t("sidebar.apply"),          path: "/apply",                icon: BadgeCheck,      description: t("sidebar.applyDesc"),          accent: "#818CF8" },
  ];

  const PLATFORM_NAV = [
    { label: t("sidebar.arViewer"),    path: "/ar-viewer",   icon: Glasses,      description: t("sidebar.arViewerDesc"),    accent: "#C9A227" },
    { label: t("sidebar.impact"),      path: "/impact",      icon: Heart,        description: t("sidebar.impactDesc"),      accent: "#34D399" },
    { label: t("sidebar.pro"),         path: "/pro",         icon: Wrench,       description: t("sidebar.proDesc"),         accent: "#A78BFA" },
    { label: t("sidebar.custody"),     path: "/custody",     icon: Link2,        description: t("sidebar.custodyDesc"),     accent: "#818CF8" },
    { label: t("sidebar.trust"),       path: "/trust",       icon: Layers,       description: t("sidebar.trustDesc"),       accent: "#60A5FA" },
    { label: "ONYX Neural Brain",      path: "/onyx-brain",  icon: Brain,        description: "Narrow × Generative × Agentic × General AI — all 4 types live", accent: "#C9A227" },
    { label: t("sidebar.agenticOs"),   path: "/agentic-os",  icon: Cpu,          description: t("sidebar.agenticOsDesc"),   accent: "#818CF8" },
    { label: t("sidebar.guardian"),    path: "/guardian",    icon: ShieldPlus,   description: t("sidebar.guardianDesc"),    accent: "#10B981" },
    { label: t("sidebar.command"),     path: "/command",     icon: Radio,        description: t("sidebar.commandDesc"),     accent: "#EF4444" },
    { label: t("sidebar.partners"),    path: "/partners",    icon: Users,        description: t("sidebar.partnersDesc"),    accent: "#E5E7EB" },
    { label: t("sidebar.share"),       path: "/share",       icon: QrCode,       description: t("sidebar.shareDesc"),       accent: "#C9A227" },
    { label: t("sidebar.unity"),       path: "/unity",       icon: Sparkles,     description: t("sidebar.unityDesc"),       accent: "#C9A227" },
    { label: t("sidebar.subscribe"),   path: "/subscribe",   icon: Settings,     description: t("sidebar.subscribeDesc"),   accent: "#C9A227" },
    { label: t("sidebar.conciergeNav"),path: "/concierge",   icon: UserCheck,    description: t("sidebar.conciergeNavDesc"),accent: "#4FC3F7" },
    { label: t("sidebar.inventory"),   path: "/inventory",   icon: Car,          description: t("sidebar.inventoryDesc"),   accent: "#C9A227" },
    { label: t("sidebar.analytics"),   path: "/analytics",   icon: BarChart3,    description: t("sidebar.analyticsDesc"),   accent: "#818CF8" },
    { label: t("sidebar.auditVault"),  path: "/audit-vault", icon: ShieldCheck,  description: t("sidebar.auditVaultDesc"),  accent: "#34D399" },
    { label: t("sidebar.security"),    path: "/security",    icon: Lock,         description: t("sidebar.securityDesc"),    accent: "#10B981" },
    { label: t("sidebar.aiHub"),       path: "/ai-hub",      icon: Cpu,          description: t("sidebar.aiHubDesc"),       accent: "#818CF8" },
    { label: t("sidebar.ciCd"),        path: "/ci-cd",       icon: GitBranch,    description: t("sidebar.ciCdDesc"),        accent: "#60A5FA" },
  ];

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
              {/* Peace sign logo mark */}
              <OnyxLogo size={42} variant="gold" />
              <div>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 19, fontWeight: 900, color: "#fff",
                  letterSpacing: "0.1em", lineHeight: 1,
                }}>3C ONYX</p>
                <p style={{ fontSize: 8, color: "rgba(201,162,39,0.5)", letterSpacing: "0.28em", fontWeight: 700, marginTop: 2 }}>{t("sidebar.securePlatform")}</p>
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

        <SectionLabel>{t("sidebar.sectionMyAccount")}</SectionLabel>
        {CUSTOMER_NAV.map((item) => (
          <NavItem key={item.path} {...item} onClose={onClose} />
        ))}

        <Divider />
        <SectionLabel>{t("sidebar.sectionSpecialist")}</SectionLabel>
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
            {t("sidebar.sectionPlatform")}
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
              {t("sidebar.poweredBy")}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <LanguageSelector compact />
            <ThemeToggle size="sm" />
          </div>
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
            <p style={{ fontSize: 8, color: "rgba(52,211,153,0.8)", fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1 }}>{t("sidebar.piiActive")}</p>
            <p style={{ fontSize: 7, color: "var(--onyx-text-dim)", marginTop: 2, letterSpacing: "0.06em" }}>{t("sidebar.piiDesc")}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
