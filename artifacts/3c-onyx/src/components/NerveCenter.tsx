import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Wallet, Car, TrendingUp, Users, ChevronRight,
  Shield, Zap, AlertTriangle, Fuel, Gauge,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function authFetch(url: string): Promise<Response> {
  const token = localStorage.getItem("onyxToken") || localStorage.getItem("3c_auth_token");
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

interface WalletData {
  approved: string;
  pending: string;
  paid: string;
}

interface VehicleData {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  odometer?: number;
  mileage?: number;
  healthScore?: number;
  nextService?: string;
}

interface GamificationData {
  tier: string;
  tierIcon: string;
  points: number;
  nextTier: string;
  nextThreshold: number;
  progress: number;
}

interface NetworkData {
  referrals: number;
  networkSize: number;
}

const TIER_MAP: { name: string; icon: string; threshold: number }[] = [
  { name: "Rookie", icon: "🏁", threshold: 0 },
  { name: "Amateur", icon: "🏎️", threshold: 500 },
  { name: "Semi-Pro", icon: "⚡", threshold: 2000 },
  { name: "Pro", icon: "🔥", threshold: 5000 },
  { name: "GT", icon: "💎", threshold: 15000 },
  { name: "Supercup", icon: "👑", threshold: 35000 },
  { name: "F1", icon: "🏆", threshold: 75000 },
  { name: "APEX", icon: "⭐", threshold: 100000 },
];

function computeTier(points: number): GamificationData {
  let current = TIER_MAP[0];
  let next = TIER_MAP[1] || TIER_MAP[0];

  for (let i = TIER_MAP.length - 1; i >= 0; i--) {
    if (points >= TIER_MAP[i].threshold) {
      current = TIER_MAP[i];
      next = TIER_MAP[i + 1] || TIER_MAP[i];
      break;
    }
  }

  const rangeStart = current.threshold;
  const rangeEnd = next.threshold || current.threshold + 1;
  const progress = rangeEnd > rangeStart
    ? Math.min(100, Math.round(((points - rangeStart) / (rangeEnd - rangeStart)) * 100))
    : 100;

  return {
    tier: current.name,
    tierIcon: current.icon,
    points,
    nextTier: next.name,
    nextThreshold: next.threshold,
    progress,
  };
}

export function NerveCenter() {
  const { user, token } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [network, setNetwork] = useState<NetworkData>({ referrals: 0, networkSize: 0 });
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);

  const isLoggedIn = !!(user || token || localStorage.getItem("3c_auth_token") || localStorage.getItem("onyxToken"));

  useEffect(() => {
    if (!isLoggedIn) return;

    authFetch(`${BASE}/api/commissions/my-earnings?limit=1`)
      .then(r => r.json())
      .then(d => {
        if (d.earnings) setWallet(d.earnings);
      })
      .catch(() => {});

    authFetch(`${BASE}/api/garage/vehicles`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.vehicles)) {
          setVehicles(d.vehicles.slice(0, 3));
          const a: string[] = [];
          d.vehicles.forEach((v: any) => {
            const miles = v.odometer ?? v.mileage ?? 0;
            if (miles > 50000 && miles % 5000 < 500) {
              a.push(`${v.year} ${v.make} ${v.model} — service recommended`);
            }
          });
          setAlerts(a);
        }
      })
      .catch(() => {});

    authFetch(`${BASE}/api/community/profile`)
      .then(r => r.json())
      .then(d => {
        setNetwork({
          referrals: d.connections ?? d.directReferrals ?? 0,
          networkSize: d.connections ?? d.networkSize ?? 0,
        });
      })
      .catch(() => {});

    const pts = user?.points ?? 0;
    setGamification(computeTier(pts));
  }, [isLoggedIn, user]);

  if (!isLoggedIn) return null;

  const totalEarnings = wallet
    ? (parseFloat(wallet.approved) + parseFloat(wallet.pending) + parseFloat(wallet.paid)).toFixed(2)
    : "0.00";

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10, paddingLeft: 2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Gauge size={14} style={{ color: "#C9A227" }} />
          <span style={{
            fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)",
            letterSpacing: 1.5, textTransform: "uppercase",
            fontFamily: "'Barlow Condensed', sans-serif",
          }}>
            NERVE CENTER
          </span>
        </div>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>LIVE</span>
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 8, marginBottom: 8,
      }}>
        <Link href="/wallet">
          <div style={{
            background: "rgba(201,162,39,0.06)",
            border: "1px solid rgba(201,162,39,0.12)",
            borderRadius: 14, padding: "14px 14px 12px",
            cursor: "pointer", transition: "background 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "rgba(201,162,39,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Wallet size={14} style={{ color: "#C9A227" }} />
              </div>
              <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
            <p style={{
              fontSize: 18, fontWeight: 800, color: "#C9A227", margin: 0,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}>
              ${totalEarnings}
            </p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "2px 0 0", letterSpacing: 1, textTransform: "uppercase" }}>
              Total Earnings
            </p>
            {wallet && parseFloat(wallet.pending) > 0 && (
              <p style={{ fontSize: 10, color: "#F59E0B", margin: "4px 0 0" }}>
                ${wallet.pending} pending
              </p>
            )}
          </div>
        </Link>

        <Link href="/gamification">
          <div style={{
            background: "rgba(139,92,246,0.06)",
            border: "1px solid rgba(139,92,246,0.12)",
            borderRadius: 14, padding: "14px 14px 12px",
            cursor: "pointer", transition: "background 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "rgba(139,92,246,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap size={14} style={{ color: "#A78BFA" }} />
              </div>
              <span style={{ fontSize: 16 }}>{gamification?.tierIcon || "🏁"}</span>
            </div>
            <p style={{
              fontSize: 16, fontWeight: 800, color: "#A78BFA", margin: 0,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}>
              {gamification?.tier || "Rookie"}
            </p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "2px 0 0", letterSpacing: 1, textTransform: "uppercase" }}>
              {(gamification?.points ?? 0).toLocaleString()} XP
            </p>
            {gamification && gamification.progress < 100 && (
              <div style={{
                marginTop: 6, height: 3, borderRadius: 2,
                background: "rgba(139,92,246,0.15)",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${gamification.progress}%`, height: "100%",
                  background: "linear-gradient(90deg, #8B5CF6, #A78BFA)",
                  borderRadius: 2, transition: "width 0.6s ease",
                }} />
              </div>
            )}
          </div>
        </Link>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 8, marginBottom: 8,
      }}>
        <Link href="/garage">
          <div style={{
            background: "rgba(96,165,250,0.06)",
            border: "1px solid rgba(96,165,250,0.12)",
            borderRadius: 14, padding: "14px 14px 12px",
            cursor: "pointer",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "rgba(96,165,250,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Car size={14} style={{ color: "#60A5FA" }} />
              </div>
              <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
            {vehicles.length > 0 ? (
              <>
                <p style={{
                  fontSize: 14, fontWeight: 700, color: "#fff", margin: 0,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {vehicles[0].year} {vehicles[0].make}
                </p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                  {vehicles[0].model}
                  {vehicles.length > 1 && ` +${vehicles.length - 1} more`}
                </p>
              </>
            ) : (
              <>
                <p style={{
                  fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.5)", margin: 0,
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}>
                  Add Vehicle
                </p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>
                  Link your car to ONYX
                </p>
              </>
            )}
          </div>
        </Link>

        <Link href="/impact">
          <div style={{
            background: "rgba(52,211,153,0.06)",
            border: "1px solid rgba(52,211,153,0.12)",
            borderRadius: 14, padding: "14px 14px 12px",
            cursor: "pointer",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "rgba(52,211,153,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Users size={14} style={{ color: "#34D399" }} />
              </div>
              <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
            <p style={{
              fontSize: 18, fontWeight: 800, color: "#34D399", margin: 0,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}>
              {network.referrals}
            </p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "2px 0 0", letterSpacing: 1, textTransform: "uppercase" }}>
              People Helped
            </p>
            {network.networkSize > 0 && (
              <p style={{ fontSize: 10, color: "rgba(52,211,153,0.6)", margin: "4px 0 0" }}>
                {network.networkSize} in network
              </p>
            )}
          </div>
        </Link>
      </div>

      {alerts.length > 0 && (
        <div style={{
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 12, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 8,
        }}>
          <AlertTriangle size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#F59E0B", margin: 0 }}>
              {alerts[0]}
            </p>
            <p style={{ fontSize: 10, color: "rgba(245,158,11,0.6)", margin: "2px 0 0" }}>
              Tap to schedule with a 3C Specialist
            </p>
          </div>
          <ChevronRight size={14} style={{ color: "#F59E0B" }} />
        </div>
      )}

      <Link href="/my-qr">
        <div style={{
          background: "linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.03))",
          border: "1px solid rgba(201,162,39,0.12)",
          borderRadius: 12, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #C9A227, #A68B1B)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={16} style={{ color: "#000" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>
              Share & Earn
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "1px 0 0" }}>
              Your QR badge earns you commission on every referral
            </p>
          </div>
          <TrendingUp size={14} style={{ color: "#C9A227" }} />
        </div>
      </Link>
    </div>
  );
}
