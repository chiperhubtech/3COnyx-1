import { useState, useEffect, useCallback } from "react";
import {
  Car, Gauge, Droplets, Zap, AlertTriangle, CheckCircle2,
  Plus, Loader2, RefreshCw, Trash2, X, Wrench, Clock,
  Wifi, Shield, ChevronDown, Activity,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { maskVin } from "@/lib/piiMask";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  color: string;
  fuelType: "gasoline" | "electric" | "hybrid";
}

interface Telemetry {
  odometer: number;
  fuelPercent: number | null;
  batteryPercent: number | null;
  fuelType: string;
  lastSync: string;
  serviceRequired: boolean;
}

const CONNECT_MAKES = [
  { make: "Porsche", models: ["911 GT3", "Cayenne Turbo S", "Panamera 4S", "Taycan Turbo S"] },
  { make: "BMW", models: ["M5 Competition", "X5 M", "M8 Gran Coupe"] },
  { make: "Mercedes-Benz", models: ["AMG GT 63 S", "S580 4MATIC", "G63 AMG"] },
  { make: "Tesla", models: ["Model S Plaid", "Model X Plaid"] },
  { make: "Bentley", models: ["Continental GT Speed", "Flying Spur", "Bentayga EWB"] },
  { make: "Rolls-Royce", models: ["Ghost Extended", "Phantom", "Cullinan"] },
  { make: "Ferrari", models: ["Roma", "SF90 Stradale", "Purosangue"] },
  { make: "Lamborghini", models: ["Urus Performante", "Huracán EVO"] },
  { make: "Rivian", models: ["R1T", "R1S"] },
];

type ConnectStep = "brand" | "model" | "linking" | "done";

// ─── Connect Flow Modal ────────────────────────────────────────────────────────
function ConnectModal({ onClose, onConnected }: { onClose: () => void; onConnected: (v: Vehicle) => void }) {
  const [step, setStep] = useState<ConnectStep>("brand");
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  const models = CONNECT_MAKES.find((m) => m.make === selectedMake)?.models ?? [];

  const handleLink = async () => {
    setStep("linking");
    await new Promise((r) => setTimeout(r, 2200));

    const res = await fetch("/api/garage/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ make: selectedMake, model: selectedModel, year: 2023 }),
    });
    const data = await res.json();
    if (data.vehicle) {
      setStep("done");
      setTimeout(() => { onConnected(data.vehicle); onClose(); }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={step !== "linking" ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--onyx-surface)] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-white flex items-center justify-center">
              <Wifi className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Smartcar Connect</p>
              <p className="text-white/30 text-[10px]">Secure vehicle pairing</p>
            </div>
          </div>
          {step !== "linking" && (
            <button onClick={onClose} className="text-white/30 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5">
          {step === "brand" && (
            <>
              <p className="text-xs text-white/40 mb-3">Select your vehicle brand</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {CONNECT_MAKES.map(({ make }) => (
                  <button
                    key={make}
                    onClick={() => { setSelectedMake(make); setStep("model"); }}
                    className="text-left px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-amber-500/30 text-white/70 hover:text-white text-sm font-medium transition-all"
                  >
                    {make}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "model" && (
            <>
              <button onClick={() => setStep("brand")} className="text-xs text-amber-400/70 hover:text-amber-400 mb-3 flex items-center gap-1 transition-colors">
                ← Back to brands
              </button>
              <p className="text-xs text-white/40 mb-3">Select your {selectedMake} model</p>
              <div className="space-y-2 mb-5">
                {models.map((model) => (
                  <button
                    key={model}
                    onClick={() => setSelectedModel(model)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      selectedModel === model
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/70"
                    }`}
                  >
                    {selectedMake} {model}
                  </button>
                ))}
              </div>
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-xs text-emerald-400 font-medium">Read-only access</p>
                </div>
                <p className="text-[11px] text-white/30">Odometer, fuel level, and battery — 3C Onyx never controls your vehicle.</p>
              </div>
              <button
                onClick={handleLink}
                disabled={!selectedModel}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold text-sm transition-colors"
              >
                Link Vehicle
              </button>
            </>
          )}

          {step === "linking" && (
            <div className="py-6 text-center">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <div className="w-14 h-14 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                <Wifi className="w-5 h-5 text-amber-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-white font-medium text-sm mb-1">Establishing secure link…</p>
              <p className="text-white/35 text-xs">Connecting to {selectedMake} {selectedModel}</p>
              <div className="mt-4 space-y-1.5">
                {["Authenticating identity", "Requesting permissions", "Fetching vehicle data"].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-xs text-white/30">
                    <div className="w-3.5 h-3.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 flex items-center justify-center">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" style={{ opacity: i < 2 ? 1 : 0.4 }} />
                    </div>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-white font-semibold text-sm">Vehicle Linked!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Specialist Request Modal ──────────────────────────────────────────────────
function SpecialistModal({
  vehicle,
  telemetry,
  onClose,
}: {
  vehicle: Vehicle;
  telemetry: Telemetry;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [concern, setConcern] = useState(`Service required — odometer at ${telemetry.odometer.toLocaleString()} mi`);
  const [state, setState] = useState<"form" | "submitting" | "done">("form");
  const [refId, setRefId] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) return;
    setState("submitting");
    const res = await fetch("/api/garage/specialist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId: vehicle.id, name, phone, concern }),
    });
    const data = await res.json();
    setRefId(data.refId ?? "");
    setState("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={state !== "submitting" ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--onyx-surface)] shadow-2xl overflow-hidden">
        {state === "done" ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">Specialist Assigned</h3>
            <p className="text-white/40 text-sm mb-1">Your 3C Specialist will contact you within <span className="text-white/60 font-medium">2 hours</span>.</p>
            <p className="text-xs font-mono text-white/25 mb-6">{refId}</p>
            <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors">Done</button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <p className="text-white font-semibold text-sm">Request a 3C Specialist</p>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              {/* Vehicle badge */}
              <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                  <p className="text-xs text-red-400/80">{telemetry.odometer.toLocaleString()} mi — service overdue</p>
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Your Name</label>
                  <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Phone</label>
                  <input type="tel" placeholder="+1 (000) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Concern</label>
                  <textarea rows={2} value={concern} onChange={(e) => setConcern(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none resize-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleSubmit} disabled={!name.trim() || !phone.trim() || state === "submitting"}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                  {state === "submitting" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {state === "submitting" ? "Submitting…" : "Request Specialist"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Gauge Ring ────────────────────────────────────────────────────────────────
function GaugeRing({
  value,
  label,
  icon: Icon,
  color,
  unit = "%",
}: {
  value: number | null;
  label: string;
  icon: React.ElementType;
  color: string;
  unit?: string;
}) {
  if (value === null) return null;
  const pct = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 28;
  const offset = circumference * (1 - pct / 100);

  const barColor =
    pct > 50 ? color :
    pct > 20 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
          <circle cx="32" cy="32" r="28" fill="none" stroke={barColor} strokeWidth="5"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 mb-0.5" style={{ color: barColor }} />
          <p className="text-sm font-bold text-white leading-none">{value}{unit}</p>
        </div>
      </div>
      <p className="text-[11px] text-white/35 font-medium">{label}</p>
    </div>
  );
}

// ─── Vehicle Card ──────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, onUnlink }: { vehicle: Vehicle; onUnlink: (id: string) => void }) {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [specialistModal, setSpecialistModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchTelemetry = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetch(`/api/garage/vehicles/${vehicle.id}/telemetry`);
      if (res.ok) setTelemetry(await res.json());
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [vehicle.id]);

  useEffect(() => { fetchTelemetry(); }, [fetchTelemetry]);

  const serviceRequired = telemetry?.serviceRequired ?? false;

  return (
    <>
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        serviceRequired ? "border-red-500/30 bg-red-500/[0.03]" : "border-white/10 bg-white/[0.03]"
      }`}>
        {/* Vehicle header */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: vehicle.color ? `${vehicle.color}40` : "rgba(255,255,255,0.05)", border: `1px solid ${vehicle.color ? `${vehicle.color}60` : "rgba(255,255,255,0.1)"}` }}>
                <Car className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="font-semibold text-white">{vehicle.year} {vehicle.make}</p>
                <p className="text-sm text-white/45">{vehicle.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">Live</span>
              </div>
              <div className="relative">
                <button onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-white/10 bg-[#141418] shadow-xl overflow-hidden">
                    <button onClick={() => { fetchTelemetry(true); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
                    </button>
                    <button onClick={() => { onUnlink(vehicle.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Unlink Vehicle
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* VIN */}
          <p className="text-[10px] font-mono text-white/15 tracking-widest mb-4">VIN {maskVin(vehicle.vin)}</p>

          {/* Telemetry gauges */}
          {loading ? (
            <div className="flex items-center justify-center gap-6 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                  <div className="w-20 h-20 rounded-full bg-white/5" />
                  <div className="h-2 w-12 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : telemetry ? (
            <div className="flex items-center justify-around py-2">
              {/* Odometer — always shown */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-20 h-20 rounded-full border-2 border-white/10 bg-white/[0.03] flex flex-col items-center justify-center">
                  <Gauge className="w-4 h-4 text-white/40 mb-0.5" />
                  <p className="text-xs font-bold text-white leading-none">
                    {telemetry.odometer >= 1000
                      ? `${(telemetry.odometer / 1000).toFixed(1)}k`
                      : telemetry.odometer}
                  </p>
                </div>
                <p className="text-[11px] text-white/35 font-medium">Odometer</p>
              </div>

              <GaugeRing value={telemetry.fuelPercent} label="Fuel" icon={Droplets} color="#f59e0b" />
              <GaugeRing value={telemetry.batteryPercent} label="Battery" icon={Zap} color="#34d399" />
            </div>
          ) : null}

          {/* Last sync */}
          {telemetry && (
            <div className="flex items-center gap-1.5 mt-3">
              {refreshing ? (
                <Loader2 className="w-3 h-3 text-white/25 animate-spin" />
              ) : (
                <Clock className="w-3 h-3 text-white/20" />
              )}
              <p className="text-[10px] text-white/20">
                {refreshing ? "Syncing…" : `Last synced ${new Date(telemetry.lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>
          )}
        </div>

        {/* Service alert banner */}
        {serviceRequired && telemetry && (
          <div className="border-t border-red-500/20 bg-red-500/[0.06] px-5 py-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-300">Service Required</p>
                <p className="text-xs text-red-400/60 mt-0.5">
                  Odometer reads <span className="text-red-300 font-mono">{telemetry.odometer.toLocaleString()} mi</span> — exceeds 50,000 mi service threshold.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSpecialistModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-colors"
            >
              <Wrench className="w-4 h-4" />
              Request a 3C Specialist
            </button>
          </div>
        )}
      </div>

      {specialistModal && telemetry && (
        <SpecialistModal
          vehicle={vehicle}
          telemetry={telemetry}
          onClose={() => setSpecialistModal(false)}
        />
      )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Garage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectModal, setConnectModal] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/garage/vehicles");
      const data = await res.json();
      setVehicles(data.vehicles ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleUnlink = async (id: string) => {
    await fetch(`/api/garage/vehicles/${id}`, { method: "DELETE" });
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const handleConnected = (vehicle: Vehicle) => {
    setVehicles((prev) => [...prev, vehicle]);
  };

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={Car}
        accent="#C9A227"
        title="MY GARAGE"
        subtitle="Live telematics via Smartcar Connect"
        badge={<span className="neural-badge"><span className="ai-live-dot mr-1" />SMARTCAR</span>}
        actions={
          <button
            onClick={() => setConnectModal(true)}
            className="ai-btn-primary"
          >
            <Plus className="w-4 h-4" />
            Connect Vehicle
          </button>
        }
      />
      <div className="p-6">

      {/* Vehicle grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-white/5" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-white/5 rounded" />
                  <div className="h-3 w-20 bg-white/5 rounded" />
                </div>
              </div>
              <div className="flex justify-around">
                {[1, 2, 3].map((j) => <div key={j} className="w-20 h-20 rounded-full bg-white/5" />)}
              </div>
            </div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-white/15" />
          </div>
          <p className="text-white/40 text-sm mb-1">No vehicles linked</p>
          <p className="text-white/20 text-xs mb-5">Connect a vehicle to start monitoring live telemetry</p>
          <button onClick={() => setConnectModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors mx-auto">
            <Plus className="w-4 h-4" />
            Connect Your First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} onUnlink={handleUnlink} />
          ))}
        </div>
      )}

      {connectModal && (
        <ConnectModal onClose={() => setConnectModal(false)} onConnected={handleConnected} />
      )}
      </div>
    </div>
  );
}
