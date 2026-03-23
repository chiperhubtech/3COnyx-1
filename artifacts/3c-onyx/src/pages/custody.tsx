import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Link as LinkIcon,
  CheckCircle,
  AlertTriangle,
  Clock,
  Fingerprint,
  Hash,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Car,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

const VEHICLE_OPTIONS = [
  { id: "veh-001", label: "2023 Rolls-Royce Ghost — •••8123" },
  { id: "veh-002", label: "2023 Ferrari Roma — •••7841" },
];

const ENTRY_TYPE_META: Record<string, { label: string; color: string; accent: string }> = {
  inspection:    { label: "Inspection",        color: "#34D399", accent: "rgba(52,211,153,0.12)"  },
  delivery:      { label: "Proof of Delivery", color: "#4FC3F7", accent: "rgba(79,195,247,0.12)"  },
  transfer:      { label: "Ownership Transfer",color: "#A78BFA", accent: "rgba(167,139,250,0.12)" },
  ownership:     { label: "Ownership Record",  color: "#C9A227", accent: "rgba(201,162,39,0.12)"  },
  maintenance:   { label: "Maintenance",       color: "#F97316", accent: "rgba(249,115,22,0.12)"  },
  v2x_alert:     { label: "V2X Alert",         color: "#F87171", accent: "rgba(248,113,113,0.12)" },
  bgc_verified:  { label: "BGC Verified",      color: "#34D399", accent: "rgba(52,211,153,0.12)"  },
  bol_issued:    { label: "BOL Issued",         color: "#818CF8", accent: "rgba(129,140,248,0.12)" },
};

interface CustodyEntry {
  entryId: string;
  vehicleId: string;
  vinMasked: string;
  type: string;
  actor: string;
  actorRole: string;
  data: Record<string, unknown>;
  sha256: string;
  previousHash: string;
  blockIndex: number;
  timestamp: string;
  ethTxHash?: string;
  ethBlock?: number;
  verified: boolean;
}

function HashPill({ hash, short = true }: { hash: string; short?: boolean }) {
  const display = short ? `${hash.slice(0, 8)}…${hash.slice(-8)}` : hash;
  return (
    <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#A78BFA", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "4px", padding: "2px 6px", wordBreak: "break-all" }}>
      {display}
    </span>
  );
}

function EntryCard({ entry, isLast }: { entry: CustodyEntry; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const meta = ENTRY_TYPE_META[entry.type] ?? { label: entry.type, color: "#888", accent: "rgba(136,136,136,0.08)" };

  return (
    <div style={{ display: "flex", gap: "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: meta.accent, border: `2px solid ${meta.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Hash size={16} style={{ color: meta.color }} />
        </div>
        {!isLast && (
          <div style={{ width: "2px", flex: 1, minHeight: "24px", background: "linear-gradient(to bottom, rgba(167,139,250,0.3), rgba(167,139,250,0.05))", marginTop: "4px" }} />
        )}
      </div>

      <div className="ai-card holographic-card" style={{ flex: 1, padding: "16px", marginBottom: "12px", borderColor: `${meta.color}18` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: meta.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", background: meta.accent, padding: "2px 8px", borderRadius: "4px" }}>{meta.label}</span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>Block #{entry.blockIndex}</span>
              {entry.verified && <CheckCircle size={12} style={{ color: "#34D399" }} />}
            </div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 700, color: "#FFFFFF", marginBottom: "2px" }}>{entry.actor}</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{entry.actorRole} · {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "4px" }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Fingerprint size={12} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>SHA-256:</span>
            <HashPill hash={entry.sha256} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LinkIcon size={12} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Prev:</span>
            <HashPill hash={entry.previousHash} />
          </div>
          {entry.ethTxHash && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ExternalLink size={12} style={{ color: "#A78BFA", flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Ethereum:</span>
              <a href={`https://sepolia.etherscan.io/tx/${entry.ethTxHash}`} target="_blank" rel="noreferrer">
                <HashPill hash={entry.ethTxHash} />
              </a>
            </div>
          )}
        </div>

        {expanded && (
          <div style={{ marginTop: "12px", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Entry Data</p>
            {Object.entries(entry.data).map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>{k}:</span>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", wordBreak: "break-all" }}>{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustodyPage() {
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLE_OPTIONS[0].id);

  const { data: chain, isLoading: chainLoading } = useQuery({
    queryKey: ["custody-chain", selectedVehicle],
    queryFn: async () => {
      const res = await fetch(`${API}/blockchain/chain/${selectedVehicle}`);
      return res.json() as Promise<{ vehicleId: string; totalEntries: number; latestHash: string; entries: CustodyEntry[] }>;
    },
  });

  const { data: verification } = useQuery({
    queryKey: ["custody-verify", selectedVehicle],
    queryFn: async () => {
      const res = await fetch(`${API}/blockchain/verify/${selectedVehicle}`);
      return res.json() as Promise<{ valid: boolean; totalEntries: number; badge: string; verifiedAt: string }>;
    },
    refetchInterval: 30_000,
  });

  const { data: status } = useQuery({
    queryKey: ["blockchain-status"],
    queryFn: async () => {
      const res = await fetch(`${API}/blockchain/status`);
      return res.json() as Promise<{ status: string; network: string; trackedVehicles: number; algorithm: string; anchoringEnabled: boolean }>;
    },
  });

  return (
    <div>
      <PageHeader
        icon={LinkIcon}
        title="Chain of Custody"
        accent="#A78BFA"
        badge={<span className="neural-badge-violet">HASH-CHAIN LIVE</span>}
        subtitle="Tamper-evident SHA-256 hash-linked audit ledger. Every vehicle event is cryptographically chained."
        actions={
          verification?.valid !== undefined ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: verification.valid ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${verification.valid ? "#34D399" : "#F87171"}30`, borderRadius: "8px" }}>
              {verification.valid
                ? <CheckCircle size={14} style={{ color: "#34D399" }} />
                : <AlertTriangle size={14} style={{ color: "#F87171" }} />}
              <span style={{ fontSize: "12px", fontWeight: 700, color: verification.valid ? "#34D399" : "#F87171" }}>
                {verification.badge}
              </span>
            </div>
          ) : null
        }
      />

      <div className="px-8 pb-6 space-y-6">
        {/* Network Status */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Network",    value: status?.network ?? "local-hash-chain", icon: Cpu,         color: "#A78BFA" },
            { label: "Algorithm",  value: status?.algorithm ?? "SHA-256",         icon: Hash,        color: "#4FC3F7" },
            { label: "Vehicles",   value: String(status?.trackedVehicles ?? 2),   icon: Car,         color: "#C9A227" },
            { label: "Integrity",  value: verification?.valid ? "INTACT" : "—",   icon: Shield,      color: "#34D399" },
          ].map(stat => (
            <div key={stat.label} className="ai-card holographic-card p-5">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <stat.icon size={14} style={{ color: stat.color }} />
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</span>
              </div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 700, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Vehicle Selector */}
        <div className="ai-card holographic-card p-5">
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Select Vehicle</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {VEHICLE_OPTIONS.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: `1px solid ${selectedVehicle === v.id ? "#A78BFA50" : "rgba(255,255,255,0.1)"}`,
                  background: selectedVehicle === v.id ? "rgba(167,139,250,0.12)" : "transparent",
                  color: selectedVehicle === v.id ? "#A78BFA" : "rgba(255,255,255,0.5)",
                  fontSize: "13px",
                  fontWeight: selectedVehicle === v.id ? 700 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chain Stats */}
        {chain && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={14} style={{ color: "#A78BFA" }} />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{chain.totalEntries} entries in chain</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Latest:</span>
              {chain.latestHash && <HashPill hash={chain.latestHash} />}
            </div>
          </div>
        )}

        {/* Chain Entries */}
        <div>
          <p className="section-label mb-4">AUDIT CHAIN — OLDEST TO NEWEST</p>
          {chainLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: "90px", borderRadius: "12px" }} />)}
            </div>
          ) : chain?.entries.length ? (
            [...chain.entries].reverse().map((entry, i) => (
              <EntryCard key={entry.entryId} entry={entry} isLast={i === chain.entries.length - 1} />
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)" }}>
              <Hash size={32} style={{ marginBottom: "12px", opacity: 0.3 }} />
              <p>No custody records found for this vehicle</p>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="ai-card neural-glow-violet p-6">
          <p style={{ fontSize: "11px", color: "#A78BFA", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>How Chain-of-Custody Works</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { step: "1", title: "Event Occurs", desc: "Inspection, delivery, transfer, or V2X alert fires" },
              { step: "2", title: "SHA-256 Hashed", desc: "Entry data + previous hash → new immutable fingerprint" },
              { step: "3", title: "Chain Linked", desc: "Any tampering breaks the hash chain — instantly detectable" },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", gap: "10px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "11px", color: "#A78BFA", fontWeight: 700 }}>{s.step}</span>
                </div>
                <div>
                  <p style={{ fontSize: "13px", color: "#FFFFFF", fontWeight: 600, marginBottom: "2px" }}>{s.title}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
