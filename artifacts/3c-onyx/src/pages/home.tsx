import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Car, Wrench, Shield, HeartPulse, HelpCircle,
  MessageCircle, ArrowRight, ChevronRight,
  Send, X, Loader2, CheckCircle2,
  Clock, MapPin, Sparkles,
  Gift, Share2, Users, DollarSign, Copy,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function authFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("onyxToken");
  return fetch(url, {
    ...opts,
    headers: { ...opts.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return null; }
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getFirstName(token: string | null): string {
  if (!token) return "";
  const payload = parseJwt(token);
  if (!payload?.name) return "";
  return payload.name.split(" ")[0];
}

const DEAL_STATUS_LABELS: Record<string, string> = {
  "New": "We're getting started",
  "Intake": "We're reviewing your info",
  "Credit_Pull": "We're checking financing options",
  "Financing": "We're finalizing your financing",
  "F&I_Pending": "We're finalizing your financing",
  "Insurance": "We're setting up your coverage",
  "DMV_Processing": "We're getting your plates ready",
  "Vehicle_Prep": "We're preparing your vehicle",
  "Quality_Check": "Almost there — final checks",
  "Funded": "Your deal is funded",
  "Delivered": "Enjoy your new ride!",
  "In_Progress": "We're working on your deal",
};

const DEAL_STEPS = [
  "Started", "Financing", "Insurance", "Plates", "Prep", "Ready",
];

function getDealProgress(status: string): number {
  const map: Record<string, number> = {
    "New": 10, "Intake": 15, "Credit_Pull": 25, "Financing": 40,
    "F&I_Pending": 45, "Insurance": 55, "DMV_Processing": 65,
    "Vehicle_Prep": 75, "Quality_Check": 85, "Funded": 95, "Delivered": 100,
    "In_Progress": 35,
  };
  return map[status] ?? 20;
}

function ActiveFlowCard({ deal }: { deal: any }) {
  const pct = getDealProgress(deal.status);
  const label = DEAL_STATUS_LABELS[deal.status] || "We're handling this for you";
  const stepIndex = Math.floor((pct / 100) * DEAL_STEPS.length);

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20, padding: "24px 24px 20px",
      marginBottom: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.05))",
          border: "1px solid rgba(201,162,39,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Car size={22} style={{ color: "#C9A227" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>
            {deal.vehicleYear} {deal.vehicleMake} {deal.vehicleModel || ""}
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
            {deal.customerName ? `For ${deal.customerName.split(" ")[0]}` : "Your vehicle"}
          </p>
        </div>
      </div>

      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 16, lineHeight: 1.5 }}>
        {label}
      </p>

      <div style={{ marginBottom: 16 }}>
        <div style={{
          height: 6, borderRadius: 3,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 3,
            width: `${pct}%`,
            background: pct === 100
              ? "linear-gradient(90deg, #34D399, #10B981)"
              : "linear-gradient(90deg, #C9A227, #F59E0B)",
            transition: "width 0.6s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {DEAL_STEPS.map((step, i) => (
            <span key={step} style={{
              fontSize: 10, fontWeight: 600,
              color: i <= stepIndex ? "#C9A227" : "rgba(255,255,255,0.2)",
            }}>{step}</span>
          ))}
        </div>
      </div>

      <Link href="/dealerflow">
        <button style={{
          width: "100%", padding: "16px", borderRadius: 14,
          background: "linear-gradient(135deg, #C9A227, #A68B1B)",
          border: "none", color: "#000", fontWeight: 800, fontSize: 16,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 4px 20px rgba(201,162,39,0.25)",
        }}>
          Continue <ArrowRight size={18} />
        </button>
      </Link>
    </div>
  );
}

function ServiceButton({ icon: Icon, label, description, href, accent }: {
  icon: any; label: string; description: string; href: string; accent: string;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <Link href={href}>
      <button
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        style={{
          width: "100%",
          padding: "24px 20px",
          borderRadius: 20,
          background: pressed ? `${accent}12` : "rgba(255,255,255,0.03)",
          border: `1px solid ${pressed ? accent + "30" : "rgba(255,255,255,0.07)"}`,
          cursor: "pointer",
          transition: "all 0.15s",
          display: "flex", alignItems: "center", gap: 16,
          textAlign: "left",
          color: "#fff",
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: `${accent}10`,
          border: `1px solid ${accent}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={24} style={{ color: accent }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 17, fontWeight: 700, margin: "0 0 3px", lineHeight: 1.2 }}>{label}</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.4 }}>{description}</p>
        </div>
        <ChevronRight size={18} style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
      </button>
    </Link>
  );
}

function AskOnyxModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMessage("");
      setSending(false);
      setSent(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const [sendError, setSendError] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setSendError(false);
    try {
      const res = await authFetch(`${BASE}/api/omni-node/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Ask ONYX — Member Request",
          description: message.trim(),
          department: "Sales",
          initiatorTier: "Customer",
          initiatorName: "ONYX Member",
        }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setSendError(true);
      }
    } catch {
      setSendError(true);
    }
    setSending(false);
  };

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
        }}
      />
      <div style={{
        position: "relative", width: "100%", maxWidth: 480,
        background: "#111114",
        borderRadius: "24px 24px 0 0",
        border: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "none",
        padding: "24px 24px 32px",
        animation: "slideUp 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.05))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={18} style={{ color: "#C9A227" }} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Ask ONYX</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>Your personal assistant</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 10, padding: 8, cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <CheckCircle2 size={48} style={{ color: "#34D399", marginBottom: 16 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Got it!</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, maxWidth: 300, margin: "0 auto 20px" }}>
              We'll take care of this for you. You'll hear from us shortly.
            </p>
            <button onClick={onClose} style={{
              padding: "14px 40px", borderRadius: 12,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer",
            }}>
              Done
            </button>
          </div>
        ) : sendError ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <X size={48} style={{ color: "#EF4444", marginBottom: 16 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Something went wrong</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, maxWidth: 300, margin: "0 auto 20px" }}>
              We couldn't send your request. Please try again.
            </p>
            <button onClick={() => setSendError(false)} style={{
              padding: "14px 40px", borderRadius: 12,
              background: "linear-gradient(135deg, #C9A227, #A68B1B)",
              border: "none",
              color: "#000", fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 16, padding: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>
                Tell me what you need — buying a car, roadside help, insurance, service — anything automotive. I'll handle it.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {["I want to buy a car", "I need roadside help", "Get me an insurance quote", "Schedule a service"].map((q) => (
                <button
                  key={q}
                  onClick={() => setMessage(q)}
                  style={{
                    padding: "8px 14px", borderRadius: 20,
                    background: "rgba(201,162,39,0.06)",
                    border: "1px solid rgba(201,162,39,0.15)",
                    color: "#C9A227", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your request..."
                style={{
                  flex: 1, padding: "16px 18px", borderRadius: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 16, outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: message.trim() ? "linear-gradient(135deg, #C9A227, #A68B1B)" : "rgba(255,255,255,0.06)",
                  border: "none", cursor: message.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                {sending ? <Loader2 size={20} className="animate-spin" style={{ color: "#000" }} /> : <Send size={20} style={{ color: message.trim() ? "#000" : "rgba(255,255,255,0.2)" }} />}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function RecentActivity() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 20, padding: "20px 24px",
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Recent</p>
      {[
        { icon: Clock, text: "Insurance quote saved", time: "2h ago", color: "#34D399" },
        { icon: MapPin, text: "Roadside assist completed", time: "Yesterday", color: "#60A5FA" },
        { icon: CheckCircle2, text: "Service appointment confirmed", time: "3 days ago", color: "#C9A227" },
      ].map((item, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 0",
          borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `${item.color}08`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <item.icon size={16} style={{ color: item.color }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0 }}>{item.text}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReferralEarningsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: () => authFetch(`${BASE}/api/referrals/my-stats`).then((r) => r.ok ? r.json() : null),
    refetchInterval: 30_000,
  });

  const [linkData, setLinkData] = useState<{ referralLink?: string; shareText?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    try {
      const res = await authFetch(`${BASE}/api/referrals/generate-link`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setLinkData(d);
      }
    } catch {}
  };

  const handleShare = async () => {
    if (!linkData) {
      await generateLink();
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: "Join me on ONYX", text: linkData.shareText, url: linkData.referralLink });
      } catch {}
    } else if (linkData.referralLink) {
      navigator.clipboard.writeText(linkData.referralLink).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || !data) return null;

  return (
    <div style={{
      marginBottom: 24,
      background: "linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.02))",
      border: "1px solid rgba(201,162,39,0.15)",
      borderRadius: 16, padding: "20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(201,162,39,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Gift size={18} style={{ color: "#C9A227" }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Your Referral Earnings</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>Earn rewards for every friend you refer</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: "#C9A227", margin: 0 }}>{data.referralsCount}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>Referrals</p>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: "#34D399", margin: 0 }}>${data.totalEarnings.toFixed(2)}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>Earned</p>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: "#F59E0B", margin: 0 }}>{data.points}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>Points</p>
        </div>
      </div>

      <button
        onClick={handleShare}
        style={{
          width: "100%", padding: "14px", borderRadius: 12,
          background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.25)",
          color: "#C9A227", fontWeight: 700, fontSize: 14,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {copied ? <><CheckCircle2 size={16} /> Copied!</> : <><Share2 size={16} /> Share your invite link</>}
      </button>
    </div>
  );
}

function ViralLoopPrompt() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || dismissed) return null;

  const handleShare = async () => {
    try {
      const res = await authFetch(`${BASE}/api/referrals/generate-link`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        if (navigator.share) {
          await navigator.share({ title: "Join me on ONYX", text: d.shareText, url: d.referralLink });
        } else {
          navigator.clipboard.writeText(d.referralLink).catch(() => {});
        }
      }
    } catch {}
    setDismissed(true);
  };

  return (
    <div style={{
      marginBottom: 24,
      background: "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(52,211,153,0.03))",
      border: "1px solid rgba(52,211,153,0.2)",
      borderRadius: 16, padding: "24px 20px",
      textAlign: "center",
      animation: "fadeIn 0.5s ease",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: "rgba(52,211,153,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        <Users size={24} style={{ color: "#34D399" }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
        Help someone like you
      </h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", lineHeight: 1.5 }}>
        Know someone who could use ONYX? Share your link and earn rewards on every referral.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleShare}
          style={{
            flex: 1, padding: "14px", borderRadius: 12,
            background: "#34D399", border: "none",
            color: "#000", fontWeight: 700, fontSize: 14,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Share2 size={16} /> Share Now
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: "14px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 14,
            cursor: "pointer",
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { token } = useAuth();
  const [showAskOnyx, setShowAskOnyx] = useState(false);
  const firstName = getFirstName(token);
  const greeting = getGreeting();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      sessionStorage.setItem("onyx_ref", ref);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { data: myDeals } = useQuery({
    queryKey: ["my-deals-home"],
    queryFn: () => authFetch(`${BASE}/api/deals/dashboard/my-deals`).then((r) => r.json()),
    refetchInterval: 15_000,
    enabled: !!token,
  });

  const activeDeal = myDeals?.recentDeals?.find(
    (d: any) => !["Delivered", "Cancelled", "Unwound"].includes(d.status)
  );

  return (
    <div style={{
      background: "#050508", minHeight: "100vh",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        width: "100%", maxWidth: 520,
        margin: "0 auto",
        padding: "48px 24px 120px",
        flex: 1,
      }}>

        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.4)",
            marginBottom: 6,
          }}>
            {greeting}{firstName ? `, ${firstName}` : ""}
          </p>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 32, fontWeight: 800, color: "#fff",
            margin: 0, lineHeight: 1.2,
          }}>
            What do you need<br />help with?
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          <ServiceButton
            icon={Car}
            label="Buy a car"
            description="Tell us what you want — we'll find the perfect match"
            href="/flow/buy"
            accent="#C9A227"
          />
          <ServiceButton
            icon={Wrench}
            label="Fix my car"
            description="Repairs, roadside help, or maintenance"
            href="/flow/fix"
            accent="#60A5FA"
          />
          <ServiceButton
            icon={Shield}
            label="Insurance"
            description="Get quotes or manage your policy"
            href="/flow/insurance"
            accent="#34D399"
          />
          <ServiceButton
            icon={HeartPulse}
            label="Service"
            description="Schedule an appointment"
            href="/flow/service"
            accent="#A78BFA"
          />
          <ServiceButton
            icon={HelpCircle}
            label="Something else"
            description="Anything automotive — we'll handle it"
            href="/flow/other"
            accent="#F59E0B"
          />
        </div>

        {activeDeal && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.35)", marginBottom: 12, paddingLeft: 4 }}>Your active deal</p>
            <ActiveFlowCard deal={activeDeal} />
          </div>
        )}

        {token && <ReferralEarningsCard />}

        {token && myDeals?.recentDeals?.some((d: any) => d.status === "Delivered" || d.status === "Funded") && (
          <ViralLoopPrompt />
        )}

        <RecentActivity />
      </div>

      <button
        onClick={() => setShowAskOnyx(true)}
        style={{
          position: "fixed",
          bottom: 24, right: 24,
          width: 64, height: 64, borderRadius: 20,
          background: "linear-gradient(135deg, #C9A227, #A68B1B)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(201,162,39,0.4), 0 2px 8px rgba(0,0,0,0.3)",
          zIndex: 1000,
          transition: "transform 0.15s",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <MessageCircle size={26} style={{ color: "#000" }} />
      </button>

      <AskOnyxModal open={showAskOnyx} onClose={() => setShowAskOnyx(false)} />

      <div style={{
        padding: "20px 24px 32px", textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        {!token && (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>
            Already a member?{" "}
            <a href="/login" style={{ color: "#C9A227", textDecoration: "none", fontWeight: 600 }}>Sign in</a>
          </p>
        )}
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", margin: 0, lineHeight: 1.6 }}>
          3C ONYX · CUXTOMCANDYCLUB LLC<br />
          Architect: Ronald Antonio Cadet
        </p>
      </div>
    </div>
  );
}
