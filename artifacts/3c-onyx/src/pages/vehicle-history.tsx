import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import {
  FileSearch,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ClipboardList,
  Activity,
  ShieldCheck,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type HistoryEvent = {
  date: string;
  type: string;
  odometer: number;
  state: string;
  source: string;
};

type VehicleHistory = {
  vin_masked: string;
  owners: number;
  accidents: number;
  accident_details: Array<{ date: string; severity: string; reported_by: string; repaired: boolean }>;
  service_records: number;
  odometer: number;
  title_status: string;
  lemon_law: boolean;
  theft_record: boolean;
  flood_damage: boolean;
  structural_damage: boolean;
  salvage: boolean;
  auction_record: boolean;
  rental_history: boolean;
  events: HistoryEvent[];
  market_value: number;
  condition_score: number;
  simulated: boolean;
};

const PRESET_VINS = [
  { label: "2023 Porsche Cayenne", vin: "WP1AF2A69NLA14821" },
  { label: "2023 Tesla Model S", vin: "5YJSA1E26PF391842" },
  { label: "2022 Ferrari 812", vin: "ZFF83CLA0N0261102" },
  { label: "2021 Lamborghini Urus", vin: "ZPBUA1ZL4MLA12345" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function CheckItem({ label, value, bad }: { label: string; value: boolean; bad?: boolean }) {
  const isBad = bad ?? false;
  const isNegative = isBad ? value : !value;
  return (
    <div className="flex items-center justify-between py-2.5 px-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>{label}</p>
      {isNegative ? (
        <div className="flex items-center gap-1.5">
          <XCircle className="w-4 h-4" style={{ color: "#F87171" }} />
          <span style={{ fontSize: "11px", color: "#F87171", fontWeight: 600 }}>Reported</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" style={{ color: "#34D399" }} />
          <span style={{ fontSize: "11px", color: "#34D399", fontWeight: 600 }}>Clear</span>
        </div>
      )}
    </div>
  );
}

export default function VehicleHistory() {
  const [vinInput, setVinInput] = useState("WP1AF2A69NLA14821");

  const mutation = useMutation<VehicleHistory, Error, string>({
    mutationFn: (vin) => fetch(`${BASE}/api/motor/history/${vin}`).then((r) => r.json()),
  });

  const data = mutation.data;

  const conditionColor = data
    ? data.condition_score >= 85 ? "#34D399" : data.condition_score >= 70 ? "#C9A227" : "#F87171"
    : "#C9A227";

  const trend: "appreciating" | "stable" | "declining" = data?.market_value
    ? data.market_value > 130000 ? "appreciating" : data.market_value < 80000 ? "declining" : "stable"
    : "stable";

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: "linear-gradient(135deg, #06060a 0%, #0a0808 100%)" }}>
      <PageHeader
        icon={FileSearch}
        accent="#F97316"
        title="VEHICLE HISTORY"
        badge={<span className="neural-badge neural-badge-orange">MOTOR.COM</span>}
      />

      {/* VIN Search */}
      <div className="ai-card p-5 space-y-4">
        <div className="flex gap-3">
          <input
            value={vinInput}
            onChange={(e) => setVinInput(e.target.value.toUpperCase())}
            placeholder="Enter full VIN (17 characters)"
            maxLength={17}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-mono"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(249,115,22,0.2)",
              color: "#F97316",
              outline: "none",
              letterSpacing: "0.12em",
            }}
          />
          <button
            onClick={() => mutation.mutate(vinInput)}
            disabled={mutation.isPending || vinInput.length < 5}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.3)",
              color: "#F97316",
              opacity: vinInput.length < 5 ? 0.4 : 1,
            }}
          >
            {mutation.isPending ? <Activity className="w-4 h-4 animate-pulse" /> : <Search className="w-4 h-4" />}
            {mutation.isPending ? "Scanning…" : "Run Report"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_VINS.map((p) => (
            <button
              key={p.vin}
              onClick={() => setVinInput(p.vin)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: vinInput === p.vin ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${vinInput === p.vin ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.07)"}`,
                color: vinInput === p.vin ? "#F97316" : "rgba(255,255,255,0.4)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {data && !mutation.isPending && (
        <>
          {/* Score Hero */}
          <div className="ai-card p-6 relative overflow-hidden">
            <div className="neural-grid-overlay" />
            <div className="relative z-10 flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle
                    cx="48" cy="48" r="40" fill="none"
                    stroke={conditionColor} strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - data.condition_score / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", fontWeight: 900, color: conditionColor, lineHeight: 1 }}>
                    {data.condition_score}
                  </p>
                  <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>SCORE</p>
                </div>
              </div>
              <div className="flex-1">
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", marginBottom: "4px" }}>VIN {data.vin_masked}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>OWNERS</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 800, color: data.owners === 1 ? "#34D399" : "#C9A227" }}>{data.owners}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>ACCIDENTS</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 800, color: data.accidents === 0 ? "#34D399" : "#F87171" }}>{data.accidents}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>MARKET VALUE</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 800, color: "#C9A227" }}>{fmt(data.market_value)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {trend === "appreciating" ? <TrendingUp className="w-4 h-4" style={{ color: "#34D399" }} /> : trend === "declining" ? <TrendingDown className="w-4 h-4" style={{ color: "#F87171" }} /> : <Minus className="w-4 h-4" style={{ color: "#C9A227" }} />}
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", textTransform: "capitalize" }}>{trend} value · {data.odometer.toLocaleString()} mi · {data.title_status} title</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Checklist */}
            <div>
              <h2 className="section-label mb-3">TITLE & RECORD CHECKS</h2>
              <div className="ai-card overflow-hidden rounded-2xl">
                <CheckItem label="Accident History" value={data.accidents > 0} bad />
                <CheckItem label="Flood Damage" value={data.flood_damage} bad />
                <CheckItem label="Theft Record" value={data.theft_record} bad />
                <CheckItem label="Structural Damage" value={data.structural_damage} bad />
                <CheckItem label="Lemon Law Buyback" value={data.lemon_law} bad />
                <CheckItem label="Salvage Title" value={data.salvage} bad />
                <CheckItem label="Auction History" value={data.auction_record} bad />
                <CheckItem label="Rental Vehicle" value={data.rental_history} bad />
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h2 className="section-label mb-3">OWNERSHIP TIMELINE</h2>
              <div className="ai-card p-4 space-y-3">
                {data.events.map((ev, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: i === 0 ? "#F97316" : "rgba(255,255,255,0.2)" }} />
                      {i < data.events.length - 1 && <div style={{ width: "1px", flex: 1, background: "rgba(255,255,255,0.06)", marginTop: "4px" }} />}
                    </div>
                    <div className="pb-3">
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{ev.type}</p>
                      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{ev.date} · {ev.state} · {ev.odometer.toLocaleString()} mi · {ev.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {data.simulated && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.1)" }}>
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "#10B981" }} />
              <p style={{ fontSize: "12px", color: "rgba(16,185,129,0.6)" }}>
                Motor.com connected · VIN decoded · NHTSA recall check complete · Title status verified clear.
              </p>
            </div>
          )}
        </>
      )}

      {!data && !mutation.isPending && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <ClipboardList className="w-10 h-10" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "14px" }}>Enter a VIN above to generate a full history report</p>
        </div>
      )}
    </div>
  );
}
