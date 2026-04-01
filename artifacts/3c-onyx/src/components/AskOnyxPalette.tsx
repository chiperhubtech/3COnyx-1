import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Search, Brain, Truck, Wallet, Shield, ShoppingBag, Gauge,
  BarChart3, Users, Sparkles, Car, CreditCard, FileSearch,
  Landmark, Heart, Wrench, Link2, Radio, Cpu, Lock,
  Activity, Target, BookOpen, Network, Layers, Flag,
  DollarSign, Package, Building2, Glasses, Scale,
  ArrowRight, Zap, MessageSquare, Plus, Fingerprint,
  TrendingUp, Crown, Command as CommandIcon,
} from "lucide-react";

interface PaletteAction {
  id: string;
  label: string;
  description: string;
  icon: any;
  action: () => void;
  keywords?: string;
  accent?: string;
}

export function AskOnyxPalette() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const NAV_ACTIONS: PaletteAction[] = [
    { id: "home", label: "Home Dashboard", description: "Your command center", icon: Activity, action: () => go("/"), keywords: "dashboard home main", accent: "#C9A227" },
    { id: "intel", label: "Intelligence Feed", description: "AI savings · live opportunities", icon: Activity, action: () => go("/intelligence"), keywords: "intelligence feed ai", accent: "#C9A227" },
    { id: "marketplace", label: "Marketplace", description: "Browse & buy vehicles", icon: ShoppingBag, action: () => go("/marketplace"), keywords: "buy car vehicle marketplace shop", accent: "#C9A227" },
    { id: "garage", label: "My Garage", description: "Your vehicles & services", icon: Gauge, action: () => go("/garage"), keywords: "garage my car vehicles", accent: "#4FC3F7" },
    { id: "wallet", label: "Wallet", description: "Payments & transactions", icon: CreditCard, action: () => go("/wallet"), keywords: "wallet money payments pay", accent: "#34D399" },
    { id: "referral", label: "Referral Wallet", description: "Bird-Dog earnings & trust score", icon: Wallet, action: () => go("/referral-wallet"), keywords: "referral bird dog commissions earnings", accent: "#818CF8" },
    { id: "finance", label: "Finance", description: "Lending · Credit · Funding", icon: Landmark, action: () => go("/finance"), keywords: "finance credit loan lending funding", accent: "#4FC3F7" },
    { id: "insurance", label: "Insurance", description: "Quotes & coverage", icon: Shield, action: () => go("/insurance"), keywords: "insurance coverage quotes", accent: "#34D399" },
    { id: "logistics", label: "Logistics", description: "Delivery tracking", icon: Truck, action: () => go("/logistics"), keywords: "logistics delivery shipping transport", accent: "#A78BFA" },
    { id: "watchlist", label: "Watchlist", description: "Saved vehicles & alerts", icon: Heart, action: () => go("/watchlist"), keywords: "watchlist saved favorites alerts", accent: "#F87171" },
    { id: "vehicle-history", label: "Vehicle History", description: "VIN reports & digital passports", icon: FileSearch, action: () => go("/vehicle-history"), keywords: "vin history carfax report vehicle", accent: "#F97316" },
    { id: "notebook", label: "ONYX Notebook", description: "AI knowledge hub · research · analysis", icon: BookOpen, action: () => go("/notebook"), keywords: "notebook research knowledge ai analysis notebooklm", accent: "#8B5CF6" },
  ];

  const AGENT_ACTIONS: PaletteAction[] = [
    { id: "concierge", label: "AI Concierge", description: "Talk to ONYX — ask anything", icon: MessageSquare, action: () => go("/concierge"), keywords: "ai chat concierge ask onyx talk", accent: "#C9A227" },
    { id: "agent-mesh", label: "Agent Mesh", description: "12 AI agents · fully connected", icon: Network, action: () => go("/agent-mesh"), keywords: "agents mesh ai network", accent: "#C9A227" },
    { id: "onyx-brain", label: "ONYX Neural Brain", description: "All 4 AI types live", icon: Brain, action: () => go("/onyx-brain"), keywords: "brain neural ai intelligence", accent: "#C9A227" },
    { id: "wisdom", label: "Wisdom Engine", description: "Strategic AI knowledge base", icon: BookOpen, action: () => go("/wisdom-engine"), keywords: "wisdom strategy knowledge", accent: "#8B5CF6" },
    { id: "platform-intel", label: "Platform Intelligence", description: "Neural engine · AI insights", icon: Brain, action: () => go("/platform-intelligence"), keywords: "platform intelligence insights telemetry", accent: "#7C3AED" },
  ];

  const OPERATOR_ACTIONS: PaletteAction[] = [
    { id: "dealerflow", label: "DealerFlow OS", description: "Unified integration layer", icon: Layers, action: () => go("/dealerflow"), keywords: "dealer dealerflow os integration", accent: "#F59E0B" },
    { id: "crm", label: "CRM Hub", description: "Lead pipeline · Deal management", icon: Link2, action: () => go("/crm-hub"), keywords: "crm leads pipeline deals customers", accent: "#C9A227" },
    { id: "specialist", label: "Specialist Dashboard", description: "Operations & tasks", icon: Wrench, action: () => go("/specialist-dashboard"), keywords: "specialist operator tasks", accent: "#4FC3F7" },
    { id: "worker", label: "My Earnings", description: "Runner · Tech · Clerk earnings", icon: DollarSign, action: () => go("/worker-dashboard"), keywords: "earnings money worker runner", accent: "#10B981" },
    { id: "growth", label: "Growth Ops", description: "K-factor · revenue · referrals", icon: TrendingUp, action: () => go("/growth"), keywords: "growth ops k-factor revenue", accent: "#34D399" },
    { id: "bay", label: "Bay Dashboard", description: "Smart bay · service tracking", icon: Gauge, action: () => go("/bay-dashboard"), keywords: "bay service repair tracking", accent: "#C9A227" },
    { id: "inspection", label: "Inspection", description: "Vehicle inspection tasks", icon: Search, action: () => go("/inspection"), keywords: "inspection vehicle check", accent: "#34D399" },
    { id: "inventory", label: "Inventory", description: "Vehicle stock management", icon: Car, action: () => go("/inventory"), keywords: "inventory stock vehicles", accent: "#C9A227" },
  ];

  const QUICK_ACTIONS: PaletteAction[] = [
    { id: "buy-car", label: "Buy a Car", description: "Start a new purchase flow", icon: Plus, action: () => go("/marketplace"), keywords: "buy car purchase vehicle new", accent: "#C9A227" },
    { id: "sell-car", label: "Sell or Trade", description: "List your vehicle", icon: ArrowRight, action: () => go("/marketplace"), keywords: "sell trade vehicle list", accent: "#34D399" },
    { id: "get-service", label: "Get Service", description: "Schedule repair or maintenance", icon: Wrench, action: () => go("/garage"), keywords: "service repair maintenance schedule", accent: "#4FC3F7" },
    { id: "sos", label: "Emergency SOS", description: "Roadside assistance — instant help", icon: Zap, action: () => go("/garage"), keywords: "sos emergency roadside help tow", accent: "#EF4444" },
    { id: "vin-check", label: "Run VIN Check", description: "Instant vehicle history report", icon: FileSearch, action: () => go("/vehicle-history"), keywords: "vin check history report", accent: "#F97316" },
    { id: "apply-work", label: "Apply to Work", description: "Join as runner, tech, or specialist", icon: Users, action: () => go("/apply"), keywords: "apply work runner tech specialist job", accent: "#818CF8" },
    { id: "refer", label: "Refer a Friend", description: "Earn commissions via Bird-Dog", icon: Heart, action: () => go("/referral-wallet"), keywords: "refer friend share invite earn", accent: "#F87171" },
    { id: "biometric", label: "Biometric Settings", description: "Face ID · Fingerprint login", icon: Fingerprint, action: () => go("/biometric-settings"), keywords: "biometric face id fingerprint security", accent: "#10B981" },
  ];

  const PLATFORM_ACTIONS: PaletteAction[] = [
    { id: "command", label: "Command Center", description: "Founder access · Kill switch", icon: Radio, action: () => go("/command"), keywords: "command center founder kill switch", accent: "#EF4444" },
    { id: "strategic", label: "Strategic Center", description: "$251B dynasty valuation model", icon: Target, action: () => go("/strategic-center"), keywords: "strategic valuation dynasty model", accent: "#C9A227" },
    { id: "analytics", label: "Analytics", description: "Platform metrics & insights", icon: BarChart3, action: () => go("/analytics"), keywords: "analytics metrics data insights", accent: "#818CF8" },
    { id: "security", label: "Security", description: "Fortress layer · PII guard", icon: Lock, action: () => go("/security"), keywords: "security fortress pii nist", accent: "#10B981" },
    { id: "audit", label: "Audit Vault", description: "Forensic audit log", icon: Shield, action: () => go("/audit-vault"), keywords: "audit vault forensic log", accent: "#34D399" },
    { id: "dynasty", label: "Dynasty Foundation", description: "Constitutional layer", icon: Crown, action: () => go("/dynasty-foundation"), keywords: "dynasty foundation constitutional ron", accent: "#C9A227" },
    { id: "guardian", label: "Guardian", description: "AI decision oversight", icon: Shield, action: () => go("/guardian"), keywords: "guardian oversight governor confidence", accent: "#10B981" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="overflow-hidden p-0 shadow-2xl"
        style={{
          maxWidth: 640,
          border: "1px solid rgba(201,162,39,0.2)",
          background: "#0a0a0f",
          borderRadius: 16,
        }}
      >
        <Command
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:font-semibold"
          style={{ background: "transparent" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 16px 0",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, #C9A227 0%, #8B6914 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={14} style={{ color: "#000" }} />
            </div>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 13,
                fontWeight: 800,
                color: "#C9A227",
                letterSpacing: "0.12em",
              }}
            >
              ASK ONYX
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10,
                color: "rgba(255,255,255,0.2)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                padding: "3px 8px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              ESC to close
            </span>
          </div>

          <CommandInput
            placeholder="What do you need? Search anything..."
            style={{
              height: 48,
              fontSize: 15,
              color: "#fff",
              background: "transparent",
              fontFamily: "'Inter', sans-serif",
            }}
          />

          <CommandList
            style={{
              maxHeight: 420,
              overflowY: "auto",
              scrollbarWidth: "thin",
            }}
          >
            <CommandEmpty>
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <Brain
                  size={28}
                  style={{ color: "rgba(201,162,39,0.3)", margin: "0 auto 8px" }}
                />
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                  No results found. Try a different search.
                </p>
                <p style={{ color: "rgba(201,162,39,0.4)", fontSize: 11, marginTop: 4 }}>
                  ONYX acts; member confirms.
                </p>
              </div>
            </CommandEmpty>

            <CommandGroup heading="QUICK ACTIONS">
              {QUICK_ACTIONS.map((item) => (
                <PaletteItem key={item.id} item={item} />
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="NAVIGATE">
              {NAV_ACTIONS.map((item) => (
                <PaletteItem key={item.id} item={item} />
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="AI & AGENTS">
              {AGENT_ACTIONS.map((item) => (
                <PaletteItem key={item.id} item={item} />
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="OPERATIONS">
              {OPERATOR_ACTIONS.map((item) => (
                <PaletteItem key={item.id} item={item} />
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="PLATFORM">
              {PLATFORM_ACTIONS.map((item) => (
                <PaletteItem key={item.id} item={item} />
              ))}
            </CommandGroup>
          </CommandList>

          <div
            style={{
              padding: "8px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#34D399",
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(52,211,153,0.6)",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                }}
              >
                NEURAL MESH ACTIVE
              </span>
            </div>
            <span
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.15)",
                letterSpacing: "0.06em",
              }}
            >
              3C ONYX &middot; SOVEREIGN AUTOMOTIVE OS
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function PaletteItem({ item }: { item: PaletteAction }) {
  const Icon = item.icon;
  return (
    <CommandItem
      value={`${item.label} ${item.description} ${item.keywords || ""}`}
      onSelect={item.action}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        cursor: "pointer",
        margin: "1px 4px",
      }}
      className="data-[selected=true]:!bg-[rgba(201,162,39,0.08)] data-[selected=true]:!border-[rgba(201,162,39,0.15)]"
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: `${item.accent || "#C9A227"}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={13} style={{ color: item.accent || "#C9A227" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            letterSpacing: "0.02em",
            lineHeight: 1.2,
          }}
        >
          {item.label}
        </p>
        <p
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
            lineHeight: 1.2,
            marginTop: 1,
          }}
        >
          {item.description}
        </p>
      </div>
      <ArrowRight
        size={12}
        style={{ color: "rgba(255,255,255,0.12)", flexShrink: 0 }}
      />
    </CommandItem>
  );
}

export function AskOnyxTrigger() {
  return (
    <button
      onClick={() => {
        const e = new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
          bubbles: true,
        });
        document.dispatchEvent(e);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 8,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer",
        transition: "all 0.15s",
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
        fontFamily: "'Inter', sans-serif",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,162,39,0.3)";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,162,39,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
      }}
      aria-label="Search ONYX"
    >
      <Search size={13} style={{ color: "rgba(201,162,39,0.5)" }} />
      <span>Ask ONYX...</span>
      <span
        style={{
          fontSize: 10,
          padding: "2px 6px",
          borderRadius: 4,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.25)",
          fontWeight: 600,
          marginLeft: 4,
        }}
      >
        {navigator.platform?.includes("Mac") ? "⌘K" : "Ctrl+K"}
      </span>
    </button>
  );
}
