/**
 * 3C Onyx — Role-First Onboarding
 * ─────────────────────────────────────────────────────────────────────
 * Strategy: Capture the INDIVIDUAL first — not the business.
 * A BDC rep signs up free → loves it → tells their team → team tells
 * the GM → GM pays for the business tier → GM's customers join.
 * This is the bottom-up flywheel that builds to 132M members.
 *
 * Steps:
 *  1. Pick your world  (Consumer vs Industry Professional)
 *  2. Pick your exact role (16 specific roles)
 *  3. Your personalized ONYX AI preview (role-specific prompts)
 *  4. Dynasty Wallet setup
 */

import { useState } from "react";
import {
  Shield, Brain, CreditCard, CheckCircle2, ArrowRight,
  User, Truck, Wrench, Sparkles, ChevronRight,
  BarChart3, FileText, Car, Phone, Settings,
  Package, Eye, Hammer, ClipboardList, Navigation,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ONBOARDING_KEY  = "3c_onboarding_complete";
const BASE            = import.meta.env.BASE_URL.replace(/\/$/, "");
const GOLD            = "#C9A227";
const EMERALD         = "#34D399";
const BLUE            = "#60A5FA";
const PURPLE          = "#A78BFA";
const ORANGE          = "#F97316";
const PINK            = "#F472B6";

// ─── Role definitions ─────────────────────────────────────────────────────────

type RoleCategory = "consumer" | "dealership" | "independent" | "transport";

interface RoleOption {
  id: string;
  category: RoleCategory;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  description: string;
  onyxPrompts: string[];
  platformRole: "Member" | "Specialist" | "Runner" | "Dealer";
}

const ROLES: RoleOption[] = [
  // ── CONSUMER ──────────────────────────────────────────────────────
  {
    id: "vehicle_owner",
    category: "consumer",
    title: "Vehicle Owner / Enthusiast",
    subtitle: "I own or plan to buy a vehicle",
    icon: Car,
    color: GOLD,
    description: "Marketplace · Garage · Racing Hub · ONYX Rewards · Transport · Finance",
    onyxPrompts: ["Find me a BMW M3 under $75K", "What's my car worth today?", "Book a Runner for pickup", "I need insurance quotes"],
    platformRole: "Member",
  },
  {
    id: "fleet_owner",
    category: "consumer",
    title: "Fleet Owner / Manager",
    subtitle: "I manage multiple vehicles",
    icon: Settings,
    color: BLUE,
    description: "Fleet tracking · Multi-vehicle garage · Bulk transport · Maintenance scheduling",
    onyxPrompts: ["Show all vehicles due for service", "Renew registrations for fleet", "Find bulk transport pricing", "Fleet insurance comparison"],
    platformRole: "Member",
  },

  // ── DEALERSHIP PROFESSIONALS ───────────────────────────────────────
  {
    id: "bdc_rep",
    category: "dealership",
    title: "BDC Representative",
    subtitle: "Internet leads · Appointments · Follow-ups",
    icon: Phone,
    color: BLUE,
    description: "Lead management · Response tracking · Appointment setting · CRM sync",
    onyxPrompts: ["Flag leads with no response in 24h", "Which leads are hottest right now?", "Generate follow-up for Marcus Thompson", "My appointment-to-show rate this week"],
    platformRole: "Specialist",
  },
  {
    id: "sales_consultant",
    category: "dealership",
    title: "Sales Consultant",
    subtitle: "Vehicle sales · Customer management",
    icon: BarChart3,
    color: GOLD,
    description: "Live inventory · Deal tracking · Customer history · Lead scoring",
    onyxPrompts: ["Show my open deals", "Which vehicles match customer preferences?", "Pencil a deal at $649/month", "Customer follow-up list for today"],
    platformRole: "Specialist",
  },
  {
    id: "finance_manager",
    category: "dealership",
    title: "Finance Manager (F&I)",
    subtitle: "Deal structuring · Financing · Insurance",
    icon: CreditCard,
    color: EMERALD,
    description: "Lender programs · Deal desking · Insurance products · Back-end gross tracking",
    onyxPrompts: ["Lender options for 660 credit score", "Average back-end gross this month", "Pending deals waiting on approval", "Calculate payment: $42K at 7.9% / 72mo"],
    platformRole: "Specialist",
  },
  {
    id: "service_advisor",
    category: "dealership",
    title: "Service Advisor",
    subtitle: "Service appointments · Customer updates",
    icon: ClipboardList,
    color: PURPLE,
    description: "Repair order management · Parts availability · Customer communication · CSI",
    onyxPrompts: ["ROs open more than 3 days", "Send status update to waiting customers", "Parts availability for 2022 BMW M3", "My CSI score this week"],
    platformRole: "Specialist",
  },
  {
    id: "sales_manager",
    category: "dealership",
    title: "Sales Manager",
    subtitle: "Team performance · Inventory · Deals",
    icon: Eye,
    color: ORANGE,
    description: "Team dashboards · Turn rates · Gross tracking · Manager log · Appraisals",
    onyxPrompts: ["Team gross per unit today", "Vehicles aged 60+ days on lot", "Appraise this trade-in VIN", "Manager log summary this week"],
    platformRole: "Specialist",
  },
  {
    id: "dealer_gm",
    category: "dealership",
    title: "Dealer Principal / GM",
    subtitle: "Full dealership command",
    icon: Shield,
    color: GOLD,
    description: "Full CRM · KPIs · P&L visibility · Staff performance · Multi-rooftop view",
    onyxPrompts: ["This month vs last month P&L", "Top 5 performers on my team", "Which CRM leads converted to sales?", "Inventory days supply by model"],
    platformRole: "Dealer",
  },
  {
    id: "parts_specialist",
    category: "dealership",
    title: "Parts Specialist",
    subtitle: "Parts ordering · Inventory · Sourcing",
    icon: Package,
    color: PINK,
    description: "OEM + aftermarket parts · Inventory control · Supplier pricing · VIN decoding",
    onyxPrompts: ["Check stock on brake pads for Camry", "Best price for OEM bumper 2023 RS7", "Parts on backorder this week", "Reorder level alerts"],
    platformRole: "Specialist",
  },

  // ── INDEPENDENT SPECIALISTS ────────────────────────────────────────
  {
    id: "body_shop_tech",
    category: "independent",
    title: "Body Shop Technician",
    subtitle: "Collision repair · Refinishing · Estimation",
    icon: Hammer,
    color: ORANGE,
    description: "Repair estimates · OEM parts sourcing · Insurance approval tracking · Job progress",
    onyxPrompts: ["Find OEM parts for 2023 Audi RS7 quarter panel", "Insurance approval status for RO #4421", "Estimate front-end damage repair", "Order supplies from local distributor"],
    platformRole: "Specialist",
  },
  {
    id: "master_tech",
    category: "independent",
    title: "Master Technician / Mechanic",
    subtitle: "Diagnostics · Repair · Service",
    icon: Wrench,
    color: BLUE,
    description: "Live diagnostics · Repair history · Parts sourcing · Labor time guides · TSBs",
    onyxPrompts: ["TSBs for 2021 F-150 5.0L", "Labor time: timing chain on 2019 Accord", "Best parts supplier for this ZIP code", "Decode fault codes: P0420, P0430"],
    platformRole: "Specialist",
  },
  {
    id: "shop_foreman",
    category: "independent",
    title: "Shop Foreman / Lead Tech",
    subtitle: "Team scheduling · Quality control · Jobs",
    icon: ClipboardList,
    color: PURPLE,
    description: "Job board · Tech productivity · Quality gates · Workflow management",
    onyxPrompts: ["Jobs waiting for parts right now", "Technician productivity this week", "Flag jobs with no update in 4 hours", "Schedule tomorrow's workflow"],
    platformRole: "Specialist",
  },
  {
    id: "shop_owner",
    category: "independent",
    title: "Shop Owner / Manager",
    subtitle: "Business analytics · Staff · Revenue",
    icon: BarChart3,
    color: EMERALD,
    description: "Revenue tracking · Staff management · Customer retention · Marketing tools",
    onyxPrompts: ["Revenue vs last month", "Top customers by spend this quarter", "Average repair order value trend", "Customers due for maintenance outreach"],
    platformRole: "Specialist",
  },
  {
    id: "mobile_tech",
    category: "independent",
    title: "Mobile Technician",
    subtitle: "Field service · On-site diagnostics",
    icon: Navigation,
    color: PINK,
    description: "Job routing · Field diagnostics · Mobile invoicing · Parts to van",
    onyxPrompts: ["My jobs for today mapped", "Invoice customer for completed service", "Order part delivered to my location", "Nearest parts supplier open now"],
    platformRole: "Specialist",
  },

  // ── TRANSPORT & LOGISTICS ─────────────────────────────────────────
  {
    id: "transport_driver",
    category: "transport",
    title: "Transport Driver (Runner)",
    subtitle: "Vehicle pickups · Deliveries · Routes",
    icon: Truck,
    color: EMERALD,
    description: "Route management · Pickup/delivery jobs · Earnings tracking · Status updates",
    onyxPrompts: ["Available transport jobs near me", "Navigate to next pickup", "Mark delivery complete with photo", "My earnings this week"],
    platformRole: "Runner",
  },
  {
    id: "auto_inspector",
    category: "transport",
    title: "Auto Inspector / Appraiser",
    subtitle: "Condition reports · Valuations",
    icon: FileText,
    color: BLUE,
    description: "Inspection reports · Photo capture · ONYX Certified badge · Auction-ready appraisals",
    onyxPrompts: ["Start condition report for VIN", "Submit photos for ONYX certification", "Market value for 2022 Porsche Cayenne S", "Completed inspections this month"],
    platformRole: "Specialist",
  },
];

// Category metadata
const CATEGORIES = [
  { id: "consumer",    label: "Consumer",                  emoji: "🚗", color: GOLD,    count: ROLES.filter(r => r.category === "consumer").length    },
  { id: "dealership",  label: "Dealership Professional",   emoji: "🏢", color: BLUE,    count: ROLES.filter(r => r.category === "dealership").length  },
  { id: "independent", label: "Independent Specialist",    emoji: "🔧", color: PURPLE,  count: ROLES.filter(r => r.category === "independent").length },
  { id: "transport",   label: "Transport & Inspection",    emoji: "🚛", color: EMERALD, count: ROLES.filter(r => r.category === "transport").length   },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface OnboardingModalProps { onComplete: () => void; }

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep]               = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<RoleCategory | null>(null);
  const [selectedRole, setSelectedRole]         = useState<RoleOption | null>(null);
  const [loading, setLoading]         = useState(false);

  const STEPS = [
    { number: 1, label: "Your World"   },
    { number: 2, label: "Your Role"    },
    { number: 3, label: "ONYX AI"      },
    { number: 4, label: "Wallet"       },
  ];

  const filteredRoles = selectedCategory ? ROLES.filter(r => r.category === selectedCategory) : [];
  const catMeta = CATEGORIES.find(c => c.id === selectedCategory);

  async function finish() {
    setLoading(true);
    localStorage.setItem(ONBOARDING_KEY, "true");
    if (selectedRole) localStorage.setItem("3c_user_role_detail", selectedRole.id);
    try {
      const token = localStorage.getItem("3c_auth_token");
      await fetch(`${BASE}/api/auth/onboarding-complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: selectedRole?.platformRole ?? "Member", roleDetail: selectedRole?.id }),
      });
    } catch { /* non-blocking */ }
    setLoading(false);
    onComplete();
  }

  const canAdvance =
    (step === 1 && selectedCategory !== null) ||
    (step === 2 && selectedRole !== null) ||
    step === 3 || step === 4;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.92)",
      backdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 560,
        borderRadius: 24,
        background: "#08080e",
        border: "1px solid rgba(201,162,39,0.2)",
        boxShadow: "0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(201,162,39,0.06)",
        overflow: "hidden",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Gold bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #C9A227, #60A5FA, #A78BFA, #34D399)", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: "24px 32px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#C9A227,#8B6914)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={16} color="#000" />
              </div>
              <div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "0.06em", margin: 0 }}>3C ONYX</p>
                <p style={{ fontSize: 9, color: "rgba(201,162,39,0.5)", letterSpacing: "0.2em", margin: 0 }}>YOU'RE IN — STEP {step} OF {STEPS.length}</p>
              </div>
            </div>
            {/* Progress dots */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {STEPS.map((s) => (
                <div key={s.number} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: step > s.number ? EMERALD : step === s.number ? GOLD : "rgba(255,255,255,0.06)",
                    border: `1px solid ${step >= s.number ? "transparent" : "rgba(255,255,255,0.1)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {step > s.number
                      ? <CheckCircle2 size={11} color="#000" />
                      : <span style={{ fontSize: 8, fontWeight: 700, color: step === s.number ? "#000" : "rgba(255,255,255,0.3)" }}>{s.number}</span>
                    }
                  </div>
                  {s.number < STEPS.length && <div style={{ width: 14, height: 1, background: step > s.number ? EMERALD : "rgba(255,255,255,0.08)" }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: "24px 32px", overflowY: "auto", flex: 1 }}>

          {/* ── STEP 1: Pick Your World ───────────────────────────────── */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
                Welcome to the club{user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Which world are you in?
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: "0 0 24px" }}>
                You're in because someone vouched for you. Free forever. Your role unlocks the tools built specifically for you.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {CATEGORIES.map(cat => {
                  const selected = selectedCategory === cat.id;
                  return (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id as RoleCategory)} style={{
                      display: "flex", alignItems: "center", gap: 16,
                      padding: "16px 18px", borderRadius: 14,
                      background: selected ? `${cat.color}0D` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selected ? cat.color + "40" : "rgba(255,255,255,0.07)"}`,
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%",
                    }}>
                      <div style={{ fontSize: 26 }}>{cat.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: selected ? "#fff" : "rgba(255,255,255,0.8)", margin: "0 0 2px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>{cat.label}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{cat.count} specific roles available</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {selected && <CheckCircle2 size={16} color={cat.color} />}
                        <ChevronRight size={14} color={selected ? cat.color : "rgba(255,255,255,0.15)"} />
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: `${GOLD}08`, border: `1px solid ${GOLD}15` }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.6 }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>Free forever.</span> No credit card. No subscription. The network is funded by the industry — members never pay.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Pick Your Exact Role ─────────────────────────── */}
          {step === 2 && selectedCategory && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{catMeta?.emoji}</span>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>What's your role?</p>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: "0 0 20px" }}>
                ONYX AI and your dashboard will be tailored to exactly how you work every day.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredRoles.map(role => {
                  const Icon  = role.icon;
                  const selected = selectedRole?.id === role.id;
                  return (
                    <button key={role.id} onClick={() => setSelectedRole(role)} style={{
                      display: "flex", alignItems: "flex-start", gap: 14,
                      padding: "14px 16px", borderRadius: 12,
                      background: selected ? `${role.color}0D` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selected ? role.color + "40" : "rgba(255,255,255,0.07)"}`,
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%",
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${role.color}14`, border: `1px solid ${role.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={15} color={role.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: selected ? "#fff" : "rgba(255,255,255,0.85)", margin: "0 0 2px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em" }}>{role.title}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>{role.subtitle}</p>
                        {selected && <p style={{ fontSize: 10, color: role.color, margin: 0 }}>{role.description}</p>}
                      </div>
                      {selected && <CheckCircle2 size={15} color={role.color} style={{ flexShrink: 0, marginTop: 2 }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 3: ONYX AI Preview ───────────────────────────────── */}
          {step === 3 && selectedRole && (
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
                Meet ONYX — your AI
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: "0 0 20px" }}>
                ONYX knows you're a <span style={{ color: selectedRole.color, fontWeight: 700 }}>{selectedRole.title}</span>. Every prompt, every insight, every recommendation is built around how you actually work.
              </p>
              {/* AI chat bubble */}
              <div style={{ padding: 18, borderRadius: 14, background: `${GOLD}07`, border: `1px solid ${GOLD}20`, marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${GOLD}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Brain size={14} color={GOLD} />
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px 12px 12px 4px", padding: "12px 16px" }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: 0 }}>
                      Hey — I'm ONYX. I know you're a {selectedRole.title.toLowerCase()}. I track your pipeline, your customers, your numbers. Just ask me anything the way you'd ask a colleague. I work in plain language.
                    </p>
                  </div>
                </div>
              </div>
              {/* Role-specific example prompts */}
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", margin: "0 0 10px" }}>THINGS YOU CAN ASK RIGHT NOW</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {selectedRole.onyxPrompts.map((prompt) => (
                  <div key={prompt} style={{ padding: "10px 12px", borderRadius: 10, background: `${selectedRole.color}08`, border: `1px solid ${selectedRole.color}18`, fontSize: 11, color: "rgba(255,255,255,0.5)", fontStyle: "italic", lineHeight: 1.5 }}>
                    "{prompt}"
                  </div>
                ))}
              </div>
              {/* Feature preview for this role */}
              <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", margin: "0 0 8px" }}>YOUR TOOLS UNLOCKED</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>{selectedRole.description}</p>
              </div>
            </div>
          )}

          {/* ── STEP 4: Dynasty Wallet ────────────────────────────────── */}
          {step === 4 && (
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Connect Your Wallet</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: "0 0 20px" }}>
                Dynasty Wallet powers your payouts, escrow protection, and the 5% Member Slice on every transaction. Skip this — set up later from Wallet Settings.
              </p>
              <div style={{ padding: "18px 20px", borderRadius: 14, background: `${EMERALD}07`, border: `1px solid ${EMERALD}18`, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <CreditCard size={14} color={EMERALD} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: EMERALD, letterSpacing: "0.08em" }}>STRIPE CONNECT — BANK GRADE SECURITY</span>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0 }}>
                  3C never stores your card data. Stripe handles all payment processing. Instant ACH payouts available after identity verification.
                </p>
              </div>
              {[
                { icon: Shield,       text: "Escrow protection on every purchase",         color: EMERALD },
                { icon: Sparkles,     text: "5% Member Slice on all platform transactions", color: GOLD   },
                { icon: CheckCircle2, text: "Instant ACH payouts — no waiting periods",     color: BLUE   },
                { icon: BarChart3,    text: "ONYX Points earned on every dollar transacted", color: PURPLE },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <Icon size={12} color={color} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{text}</span>
                </div>
              ))}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 16, textAlign: "center" }}>
                Wallet setup can be completed later from Dynasty Wallet in the sidebar
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ padding: "16px 32px 28px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ padding: "11px 20px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
              Back
            </button>
          ) : <div />}

          <div style={{ display: "flex", gap: 10 }}>
            {/* Skip wallet on step 4 */}
            {step === 4 && (
              <button onClick={() => void finish()} disabled={loading} style={{ padding: "11px 18px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                Skip for now
              </button>
            )}
            {step < 4 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance} style={{
                padding: "11px 28px", borderRadius: 12,
                background: canAdvance ? "linear-gradient(135deg,#C9A227,#8B6914)" : "rgba(255,255,255,0.05)",
                border: "none", color: canAdvance ? "#000" : "rgba(255,255,255,0.2)",
                fontWeight: 800, fontSize: 13, cursor: canAdvance ? "pointer" : "default",
                display: "flex", alignItems: "center", gap: 7, letterSpacing: "0.04em", fontFamily: "inherit",
                transition: "all 0.15s",
              }}>
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button onClick={() => void finish()} disabled={loading} style={{ padding: "11px 28px", borderRadius: 12, background: "linear-gradient(135deg,#34D399,#059669)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}>
                {loading ? "Setting up…" : "Enter the Network"} <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const complete = typeof window !== "undefined" && localStorage.getItem(ONBOARDING_KEY) === "true";
  return { needsOnboarding: !complete };
}
