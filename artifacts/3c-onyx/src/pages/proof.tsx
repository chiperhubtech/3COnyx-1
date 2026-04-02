import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Search,
  CheckCircle,
  Hash,
  ExternalLink,
  Clock,
  Car,
  Wrench,
  FileCheck,
  Truck,
  UserCheck,
  AlertTriangle,
  Cpu,
  Lock,
  Zap,
  Award,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface TrustScore {
  score: number;
  grade: string;
  label: string;
  color: string;
}

interface ProofEvent {
  timestamp: string;
  type: string;
  actor: string;
  description: string;
  verified: boolean;
  sha256?: string;
  ethTxHash?: string | null;
  blockIndex?: number;
  source: string;
}

interface VehicleProof {
  vin: string;
  vehicleLabel: string | null;
  platform: string;
  architect: string;
  documentType: string;
  issuedAt: string;
  singularity: string;
  trustScore: TrustScore;
  verification: {
    chainIntegrity: string;
    totalEntries: number;
    verifiedEvents: number;
    totalLifecycleEvents: number;
    hashAlgorithm: string;
    signatureAlgorithm: string;
    ethereumAnchoring: boolean;
    network: string;
  };
  commerce: {
    warranties: number;
    deals: number;
    referrals: number;
    totalFunded: string;
    commissionsPaid: string;
  };
  cascadeEngine: {
    status: string;
    totalCascadeSteps: number;
    philosophy: string;
  };
  timeline: ProofEvent[];
  proofStatement: {
    claim: string;
    method: string;
    differentiator: string;
  };
  simulated: boolean;
}

const EVENT_ICONS: Record<string, typeof Shield> = {
  ownership: UserCheck,
  inspection: FileCheck,
  maintenance: Wrench,
  transfer: Car,
  delivery: Truck,
  v2x_alert: AlertTriangle,
  bgc_verified: CheckCircle,
  bol_issued: FileCheck,
  sdv_registration: Cpu,
  ota_update: Zap,
  warranty: Shield,
  warranty_verified: CheckCircle,
  deal_created: FileCheck,
  deal_sealed: Lock,
  deal_funded: Zap,
  commission_settled: Award,
  referral_active: UserCheck,
};

const EVENT_COLORS: Record<string, string> = {
  ownership: "#C9A227",
  inspection: "#34D399",
  maintenance: "#F97316",
  transfer: "#A78BFA",
  delivery: "#4FC3F7",
  v2x_alert: "#F87171",
  bgc_verified: "#34D399",
  bol_issued: "#818CF8",
  sdv_registration: "#3B82F6",
  ota_update: "#06B6D4",
  warranty: "#8B5CF6",
  warranty_verified: "#34D399",
  deal_created: "#F59E0B",
  deal_sealed: "#A78BFA",
  deal_funded: "#10B981",
  commission_settled: "#C9A227",
  referral_active: "#60A5FA",
};

function TrustScoreGauge({ score }: { score: TrustScore }) {
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score.score / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <div style={{ position: "relative", width: "140px", height: "140px" }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          <circle
            cx="70" cy="70" r="54"
            fill="none"
            stroke={score.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
            style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${score.color}60)` }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "32px", fontWeight: 700, color: score.color, fontFamily: "Barlow Condensed, sans-serif" }}>{score.score}</span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>{score.grade}</span>
        </div>
      </div>
      <div style={{
        padding: "6px 16px",
        borderRadius: "20px",
        background: `${score.color}15`,
        border: `1px solid ${score.color}40`,
        color: score.color,
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "1.5px",
        textTransform: "uppercase" as const,
      }}>
        {score.label}
      </div>
    </div>
  );
}

function HashDisplay({ hash, label }: { hash: string; label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {label && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", minWidth: "40px" }}>{label}</span>}
      <code style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: "10px",
        color: "#A78BFA",
        background: "rgba(167,139,250,0.06)",
        border: "1px solid rgba(167,139,250,0.15)",
        borderRadius: "4px",
        padding: "2px 6px",
        wordBreak: "break-all" as const,
      }}>
        {hash.slice(0, 12)}…{hash.slice(-12)}
      </code>
    </div>
  );
}

export default function ProofPage() {
  const [vinInput, setVinInput] = useState("");
  const [searchVin, setSearchVin] = useState("");

  const { data: proof, isLoading, error } = useQuery<VehicleProof>({
    queryKey: ["vehicle-proof", searchVin],
    queryFn: async () => {
      const r = await fetch(`${API}/vehicle/${searchVin}/proof`);
      if (!r.ok) throw new Error("Failed to fetch proof");
      return r.json();
    },
    enabled: searchVin.length === 17,
  });

  const handleSearch = () => {
    const clean = vinInput.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
    if (clean.length === 17) setSearchVin(clean);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#FFFFFF", padding: "24px" }}>
      <PageHeader
        icon={Shield}
        title="ONYX PROOF ENGINE"
        subtitle="Verifiable Vehicle Identity — Digital Birth Certificate"
      />

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{
          display: "flex", gap: "8px", marginBottom: "32px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(201,162,39,0.2)",
          borderRadius: "12px",
          padding: "6px",
        }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
            <input
              type="text"
              value={vinInput}
              onChange={(e) => setVinInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter VIN to verify (17 characters)"
              maxLength={17}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#FFFFFF",
                fontSize: "15px",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                padding: "12px 12px 12px 36px",
                outline: "none",
                letterSpacing: "2px",
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={vinInput.length !== 17}
            style={{
              padding: "12px 24px",
              background: vinInput.length === 17 ? "linear-gradient(135deg, #C9A227, #D4AF37)" : "rgba(255,255,255,0.05)",
              color: vinInput.length === 17 ? "#0A0A0A" : "rgba(255,255,255,0.3)",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: vinInput.length === 17 ? "pointer" : "not-allowed",
              letterSpacing: "1px",
              transition: "all 0.2s",
            }}
          >
            VERIFY
          </button>
        </div>

        {!searchVin && !proof && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Shield size={64} style={{ color: "rgba(201,162,39,0.3)", marginBottom: "16px" }} />
            <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "24px", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>
              VEHICLE VERIFICATION
            </h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", maxWidth: "400px", margin: "0 auto", lineHeight: 1.6 }}>
              Enter any VIN to view its cryptographically verified lifecycle.
              Every event is SHA-256 hashed, HMAC signed, and tamper-evident.
            </p>
            <p style={{ color: "#C9A227", fontSize: "13px", fontStyle: "italic", marginTop: "16px" }}>
              "CarFax tells you. ONYX proves it."
            </p>
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{
              width: "48px", height: "48px", margin: "0 auto 16px",
              border: "3px solid rgba(201,162,39,0.2)", borderTopColor: "#C9A227",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }} />
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Verifying chain integrity…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "40px", background: "rgba(239,68,68,0.08)", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle size={32} style={{ color: "#EF4444", marginBottom: "8px" }} />
            <p style={{ color: "#EF4444" }}>Failed to verify VIN. Please check the format and try again.</p>
          </div>
        )}

        {proof && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            <div style={{
              background: "linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.02))",
              border: "1px solid rgba(201,162,39,0.25)",
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
            }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <Award size={20} style={{ color: "#C9A227" }} />
                <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "14px", letterSpacing: "3px", color: "#C9A227", fontWeight: 600 }}>
                  DIGITAL BIRTH CERTIFICATE
                </span>
              </div>

              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "22px", fontWeight: 700, letterSpacing: "4px", color: "#FFFFFF", marginBottom: "24px" }}>
                {proof.vin}
              </div>

              <TrustScoreGauge score={proof.trustScore} />

              {proof.vehicleLabel && (
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
                  {proof.vehicleLabel}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginTop: "24px" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>{proof.verification.verifiedEvents}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>VERIFIED</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{proof.verification.totalLifecycleEvents}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>TOTAL EVENTS</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <Lock size={14} style={{ color: proof.verification.chainIntegrity === "INTACT" ? "#34D399" : "#EF4444" }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: proof.verification.chainIntegrity === "INTACT" ? "#34D399" : "#EF4444" }}>
                      {proof.verification.chainIntegrity}
                    </span>
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>CHAIN STATUS</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: proof.verification.ethereumAnchoring ? "#4FC3F7" : "rgba(255,255,255,0.5)" }}>
                    {proof.verification.ethereumAnchoring ? "ANCHORED" : "LOCAL"}
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>NETWORK</div>
                </div>
              </div>

              {(proof.commerce.warranties > 0 || proof.commerce.deals > 0 || proof.commerce.referrals > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "16px" }}>
                  <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#8B5CF6" }}>{proof.commerce.warranties}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>WARRANTIES</div>
                  </div>
                  <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#10B981" }}>{proof.commerce.deals}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>DEALS</div>
                  </div>
                  <div style={{ background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#C9A227" }}>{proof.commerce.referrals}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>REFERRALS</div>
                  </div>
                </div>
              )}

              <div style={{
                marginTop: "16px",
                padding: "10px 16px",
                background: "rgba(201,162,39,0.06)",
                border: "1px solid rgba(201,162,39,0.15)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}>
                <Cpu size={12} style={{ color: "#C9A227" }} />
                <span style={{ fontSize: "10px", color: "#C9A227", letterSpacing: "1.5px", fontWeight: 600 }}>
                  CASCADE ENGINE: {proof.cascadeEngine.status}
                </span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                  — {proof.cascadeEngine.totalCascadeSteps} automation steps
                </span>
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "24px",
            }}>
              <h3 style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "14px",
                letterSpacing: "2px",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <Clock size={14} />
                VERIFIED LIFECYCLE TIMELINE
              </h3>

              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute",
                  left: "19px",
                  top: "24px",
                  bottom: "24px",
                  width: "2px",
                  background: "linear-gradient(to bottom, rgba(201,162,39,0.4), rgba(201,162,39,0.05))",
                }} />

                {proof.timeline.map((event, i) => {
                  const Icon = EVENT_ICONS[event.type] ?? Shield;
                  const color = EVENT_COLORS[event.type] ?? "#C9A227";
                  const date = new Date(event.timestamp);

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "16px",
                        marginBottom: i < proof.timeline.length - 1 ? "24px" : "0",
                        position: "relative",
                      }}
                    >
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: `${color}15`,
                        border: `2px solid ${color}40`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        zIndex: 1,
                      }}>
                        <Icon size={16} style={{ color }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            letterSpacing: "1px",
                            color,
                            textTransform: "uppercase" as const,
                          }}>
                            {event.type.replace(/_/g, " ")}
                          </span>
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                            {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>

                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: "0 0 6px 0", lineHeight: 1.4 }}>
                          {event.description}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                            Actor: {event.actor}
                          </span>
                          {event.sha256 && <HashDisplay hash={event.sha256} />}
                          {event.verified && (
                            <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "#34D399" }}>
                              <CheckCircle size={10} /> Verified
                            </span>
                          )}
                          {event.ethTxHash && (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${event.ethTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "#4FC3F7", textDecoration: "none" }}
                            >
                              <ExternalLink size={10} /> Etherscan
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "24px",
            }}>
              <h3 style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "14px",
                letterSpacing: "2px",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <Hash size={14} />
                CRYPTOGRAPHIC PROOF
              </h3>

              <div style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
                padding: "16px",
                fontSize: "12px",
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.6)",
              }}>
                <p style={{ margin: "0 0 8px" }}><strong style={{ color: "#C9A227" }}>Claim:</strong> {proof.proofStatement.claim}</p>
                <p style={{ margin: "0 0 8px" }}><strong style={{ color: "#C9A227" }}>Method:</strong> {proof.proofStatement.method}</p>
                <p style={{ margin: "0 0 12px" }}>
                  <strong style={{ color: "#C9A227" }}>Algorithm:</strong> {proof.verification.hashAlgorithm} + {proof.verification.signatureAlgorithm}
                </p>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "1px" }}>HOW TO VERIFY INDEPENDENTLY</span>
                  <span style={{ fontSize: "11px" }}>1. Request the full chain: <code style={{ color: "#A78BFA" }}>GET {proof.vin ? `/api/blockchain/chain/${proof.vin}` : "/api/blockchain/chain/:vin"}</code></span>
                  <span style={{ fontSize: "11px" }}>2. Recompute each SHA-256 hash from the entry data + previous hash</span>
                  <span style={{ fontSize: "11px" }}>3. If any hash doesn't match, the chain has been tampered with</span>
                  <span style={{ fontSize: "11px" }}>4. Ethereum-anchored entries can be verified on Sepolia Etherscan</span>
                </div>
              </div>
            </div>

            <div style={{
              textAlign: "center",
              padding: "20px",
              borderTop: "1px solid rgba(201,162,39,0.1)",
            }}>
              <p style={{ fontSize: "13px", color: "#C9A227", fontStyle: "italic", margin: "0 0 4px" }}>
                "{proof.proofStatement.differentiator}"
              </p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", margin: 0 }}>
                {proof.architect} · Issued {new Date(proof.issuedAt).toLocaleString()}
                {proof.simulated && " · DEMO MODE"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
