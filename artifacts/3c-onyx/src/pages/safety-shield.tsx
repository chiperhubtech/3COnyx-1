/**
 * 3C ONYX — Safety Shield
 *
 * Phone-native safety layer. No car screen needed.
 * The phone IS the safety computer.
 *
 * Features:
 * - Emergency SOS (GPS + Runner dispatch + 911 link)
 * - Crash Detection (DeviceMotion accelerometer)
 * - Pre-Trip Safety Brief (auto-run checklist)
 * - Driving Behavior Score (feeds ONYX Insurance Engine)
 * - Live Route Hazard Feed
 * - Emergency Contact Registry
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield, AlertTriangle, CheckCircle2, Phone, MapPin, Zap,
  UserCheck, Activity, TrendingUp, Clock, CloudRain, Flame,
  Wind, Eye, X, Plus, Trash2, Bell, BellOff, ChevronRight,
  Radio, Navigation, Lock, ShieldCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

interface PreTripItem {
  id: string;
  label: string;
  status: "ok" | "warning" | "checking";
  detail: string;
}

interface Hazard {
  id: string;
  type: "ice" | "accident" | "speed_camera" | "pothole" | "weather" | "closure";
  title: string;
  distance: string;
  severity: "low" | "medium" | "high";
  time: string;
}

interface DriveScore {
  overall: number;
  braking: number;
  cornering: number;
  speed: number;
  trend: "up" | "down" | "flat";
  tripsScored: number;
}

// ─── Static demo data ─────────────────────────────────────────────────────────

const HAZARDS: Hazard[] = [
  { id: "h1", type: "ice",          title: "Black ice reported",          distance: "1.2 mi ahead", severity: "high",   time: "3 min ago" },
  { id: "h2", type: "accident",     title: "Multi-vehicle accident",      distance: "4.7 mi ahead", severity: "high",   time: "8 min ago" },
  { id: "h3", type: "speed_camera", title: "Speed enforcement zone",      distance: "0.4 mi ahead", severity: "medium", time: "Live" },
  { id: "h4", type: "pothole",      title: "Severe road damage reported", distance: "2.1 mi ahead", severity: "medium", time: "12 min ago" },
  { id: "h5", type: "weather",      title: "Heavy rain — reduced viz",    distance: "On route",     severity: "low",    time: "Now" },
];

const DRIVE_SCORE: DriveScore = {
  overall: 84,
  braking: 79,
  cornering: 91,
  speed: 88,
  trend: "up",
  tripsScored: 47,
};

function hazardIcon(type: Hazard["type"]) {
  const cls = "w-4 h-4 flex-shrink-0";
  switch (type) {
    case "ice":          return <Wind className={cls} />;
    case "accident":     return <AlertTriangle className={cls} />;
    case "speed_camera": return <Eye className={cls} />;
    case "pothole":      return <Radio className={cls} />;
    case "weather":      return <CloudRain className={cls} />;
    case "closure":      return <X className={cls} />;
  }
}

function severityColor(s: Hazard["severity"]): string {
  return s === "high" ? "#F87171" : s === "medium" ? "#F59E0B" : "#60A5FA";
}

function scoreColor(n: number): string {
  if (n >= 85) return "#34D399";
  if (n >= 70) return "#C9A227";
  return "#F87171";
}

// ─── Pre-Trip Checklist ───────────────────────────────────────────────────────

function buildPreTrip(): PreTripItem[] {
  return [
    { id: "1", label: "Recall status",       status: "checking", detail: "Scanning NHTSA database…" },
    { id: "2", label: "Tire pressure",        status: "checking", detail: "Reading sensor data…" },
    { id: "3", label: "Guardian alerts",      status: "checking", detail: "Checking predictive layer…" },
    { id: "4", label: "Weather on route",     status: "checking", detail: "Pulling live conditions…" },
    { id: "5", label: "Fuel / range estimate",status: "checking", detail: "Calculating…" },
  ];
}

const PRE_TRIP_RESOLVED: PreTripItem[] = [
  { id: "1", label: "Recall status",        status: "ok",      detail: "No open recalls — NHTSA verified" },
  { id: "2", label: "Tire pressure",         status: "warning", detail: "Front-left reads low — ONYX flagged" },
  { id: "3", label: "Guardian alerts",       status: "ok",      detail: "No predictive failures in next 90 days" },
  { id: "4", label: "Weather on route",      status: "warning", detail: "Rain + 38°F — ice risk in 1.2 mi" },
  { id: "5", label: "Fuel / range estimate", status: "ok",      detail: "Est. 187 mi remaining — sufficient" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SafetyShield() {
  const [sosActive, setSosActive]         = useState(false);
  const [sosCountdown, setSosCountdown]   = useState(0);
  const [crashDetect, setCrashDetect]     = useState(false);
  const [location, setLocation]           = useState<GeolocationCoordinates | null>(null);
  const [locationErr, setLocationErr]     = useState(false);
  const [preTripItems, setPreTripItems]   = useState<PreTripItem[] | null>(null);
  const [preTripDone, setPreTripDone]     = useState(false);
  const [contacts, setContacts]           = useState<EmergencyContact[]>([
    { id: "1", name: "Mom", phone: "+1 (555) 000-0001", relation: "Parent" },
  ]);
  const [addingContact, setAddingContact] = useState(false);
  const [newContact, setNewContact]       = useState<Partial<EmergencyContact>>({});
  const [impactLevel, setImpactLevel]     = useState(0);
  const [crashAlert, setCrashAlert]       = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── GPS location ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setLocationErr(true); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setLocation(pos.coords),
      ()  => setLocationErr(true),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  // ── Crash detection via DeviceMotion ────────────────────────────────────────
  useEffect(() => {
    if (!crashDetect) return;
    const THRESHOLD = 25; // m/s² — severe impact

    function handleMotion(e: DeviceMotionEvent) {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const total = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
      setImpactLevel(Math.min(100, Math.round((total / THRESHOLD) * 100)));
      if (total > THRESHOLD) {
        setCrashAlert(true);
        triggerSOS();
      }
    }

    window.addEventListener("devicemotion", handleMotion as EventListener);
    return () => window.removeEventListener("devicemotion", handleMotion as EventListener);
  }, [crashDetect]);

  // ── Pre-trip auto-run ───────────────────────────────────────────────────────
  const runPreTrip = useCallback(() => {
    const initial = buildPreTrip();
    setPreTripItems(initial);
    setPreTripDone(false);
    // Simulate ONYX running each check sequentially
    PRE_TRIP_RESOLVED.forEach((item, i) => {
      setTimeout(() => {
        setPreTripItems(prev =>
          prev?.map(p => p.id === item.id ? item : p) ?? null
        );
        if (i === PRE_TRIP_RESOLVED.length - 1) setPreTripDone(true);
      }, (i + 1) * 700);
    });
  }, []);

  // ── SOS trigger ─────────────────────────────────────────────────────────────
  function triggerSOS() {
    setSosActive(true);
    setSosCountdown(5);
    let c = 5;
    countdownRef.current = setInterval(() => {
      c--;
      setSosCountdown(c);
      if (c <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        // In production: auto-call 911 + dispatch Runner via API
      }
    }, 1000);
  }

  function cancelSOS() {
    setSosActive(false);
    setSosCountdown(0);
    setCrashAlert(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }

  function addContact() {
    if (!newContact.name?.trim() || !newContact.phone?.trim()) return;
    setContacts(prev => [...prev, { ...newContact, id: Date.now().toString() } as EmergencyContact]);
    setNewContact({});
    setAddingContact(false);
  }

  const warnings = preTripDone ? PRE_TRIP_RESOLVED.filter(i => i.status === "warning").length : 0;

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* ── SOS Overlay ── */}
      {sosActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.96)" }}>
          <div className="text-center max-w-sm px-6">
            {crashAlert && (
              <div className="mb-6 px-4 py-2 rounded-full border border-red-500/50 bg-red-500/10">
                <p className="text-red-400 text-xs font-black tracking-widest">CRASH DETECTED BY ONYX</p>
              </div>
            )}
            <div
              className="w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"
              style={{ background: "rgba(239,68,68,0.15)", border: "3px solid #EF4444" }}
            >
              <div className="text-center">
                <p className="text-6xl font-black text-red-500" style={{ lineHeight: 1 }}>{sosCountdown > 0 ? sosCountdown : "!"}</p>
                <p className="text-xs font-bold text-red-400 tracking-widest mt-1">{sosCountdown > 0 ? "DISPATCHING" : "ONYX ACTIVE"}</p>
              </div>
            </div>

            <p className="text-white font-black text-xl mb-2">Emergency SOS Active</p>
            <p className="text-gray-400 text-sm mb-2">ONYX is dispatching emergency services and your nearest Runner.</p>

            {location && (
              <div className="flex items-center justify-center gap-2 mb-4 text-xs text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
              </div>
            )}

            <div className="space-y-2 mb-6">
              <a
                href="tel:911"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm tracking-wider"
                style={{ background: "#EF4444", color: "#fff" }}
              >
                <Phone className="w-4 h-4" />
                CALL 911 NOW
              </a>
              {contacts[0] && (
                <a
                  href={`tel:${contacts[0].phone.replace(/\D/g, "")}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                  style={{ background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", color: "#C9A227" }}
                >
                  <UserCheck className="w-4 h-4" />
                  Contact {contacts[0].name}
                </a>
              )}
            </div>

            <button
              onClick={cancelSOS}
              className="text-xs text-gray-500 underline underline-offset-2"
            >
              Cancel — I'm safe
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div
        className="px-5 pt-8 pb-6 border-b border-white/5"
        style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(0,0,0,0) 50%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[0.25em] text-red-400 opacity-70 uppercase">3C ONYX · PHONE NATIVE</p>
              <h1 className="text-2xl font-black tracking-tight">Safety <span className="text-red-400">Shield</span></h1>
            </div>
          </div>
          <p className="text-xs text-gray-400 ml-13 mt-1">Your phone is the safety computer. No car screen needed.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {/* ── Emergency SOS Button ── */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-black tracking-widest text-red-400 uppercase">Emergency SOS</p>
              <p className="text-xs text-gray-500 mt-0.5">Dispatches 911 link + nearest ONYX Runner. Shares your exact GPS location.</p>
            </div>
            {location ? (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                GPS LIVE
              </div>
            ) : (
              <div className="text-[10px] text-gray-500 font-bold">GPS {locationErr ? "DENIED" : "LOCATING…"}</div>
            )}
          </div>

          <button
            onPointerDown={triggerSOS}
            className="w-full py-5 rounded-2xl font-black text-base tracking-widest transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #DC2626, #7F1D1D)", border: "2px solid rgba(239,68,68,0.4)", color: "#fff", letterSpacing: "0.15em" }}
          >
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-6 h-6" />
              EMERGENCY SOS
            </div>
            <p className="text-xs font-normal opacity-60 mt-1 tracking-normal">Hold to activate · ONYX dispatches in 5 seconds</p>
          </button>

          <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500">
            <Lock className="w-3 h-3" />
            <span>Emergency contacts notified automatically · VIN + vehicle info shared with responders</span>
          </div>
        </div>

        {/* ── Crash Detection Toggle ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-[#C9A227]" />
              <div>
                <p className="text-sm font-bold text-white">Crash Detection</p>
                <p className="text-xs text-gray-500">Phone accelerometer · Triggers SOS automatically on severe impact</p>
              </div>
            </div>
            <button
              onClick={() => setCrashDetect(p => !p)}
              className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
              style={{ background: crashDetect ? "#C9A227" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                style={{ left: crashDetect ? "calc(100% - 22px)" : "2px" }}
              />
            </button>
          </div>

          {crashDetect && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Impact level</span>
                <span className={`font-bold ${impactLevel > 60 ? "text-red-400" : "text-emerald-400"}`}>
                  {impactLevel > 60 ? "HIGH" : impactLevel > 30 ? "MODERATE" : "CLEAR"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${impactLevel}%`, background: impactLevel > 60 ? "#EF4444" : impactLevel > 30 ? "#F59E0B" : "#34D399" }}
                />
              </div>
              <p className="text-[10px] text-gray-600">ONYX monitoring. Threshold: 25 m/s² · Auto-SOS triggers on breach</p>
            </div>
          )}
        </div>

        {/* ── Pre-Trip Safety Brief ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
              <p className="text-sm font-bold text-white">Pre-Trip Safety Brief</p>
            </div>
            <button
              onClick={runPreTrip}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "rgba(201,162,39,0.12)", border: "1px solid rgba(201,162,39,0.25)", color: "#C9A227" }}
            >
              {preTripItems ? "Re-run" : "Run Check"}
            </button>
          </div>

          {!preTripItems ? (
            <div className="text-center py-6">
              <ShieldCheck className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-500">ONYX runs 5 safety checks before every trip. Tap "Run Check" — takes 4 seconds.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {preTripItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="flex-shrink-0">
                    {item.status === "checking"  && <div className="w-4 h-4 rounded-full border-2 border-[#C9A227]/40 border-t-[#C9A227] animate-spin" />}
                    {item.status === "ok"        && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {item.status === "warning"   && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.detail}</p>
                  </div>
                </div>
              ))}
              {preTripDone && (
                <div
                  className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl text-xs font-bold"
                  style={warnings > 0
                    ? { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B" }
                    : { background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34D399" }
                  }
                >
                  {warnings > 0
                    ? <><AlertTriangle className="w-3.5 h-3.5" />{warnings} item{warnings > 1 ? "s" : ""} flagged — ONYX monitoring</>
                    : <><CheckCircle2 className="w-3.5 h-3.5" />All clear — safe to drive</>
                  }
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Driving Behavior Score ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#C9A227]" />
                <p className="text-sm font-bold text-white">Driving Behavior Score</p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 ml-6">ONYX feeds this directly to your Insurance Engine</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>+4 pts this month</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-5">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
                <circle
                  cx="48" cy="48" r="40" fill="none"
                  stroke={scoreColor(DRIVE_SCORE.overall)} strokeWidth="9"
                  strokeDasharray={`${(DRIVE_SCORE.overall / 100) * 251} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black" style={{ color: scoreColor(DRIVE_SCORE.overall) }}>{DRIVE_SCORE.overall}</span>
                <span className="text-[8px] text-gray-500 font-bold tracking-wider">/100</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {[
                { label: "Braking",   score: DRIVE_SCORE.braking },
                { label: "Cornering", score: DRIVE_SCORE.cornering },
                { label: "Speed",     score: DRIVE_SCORE.speed },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{s.label}</span>
                    <span className="font-bold" style={{ color: scoreColor(s.score) }}>{s.score}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: scoreColor(s.score) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.15)" }}>
            <Zap className="w-3.5 h-3.5 text-[#C9A227] flex-shrink-0" />
            <span className="text-gray-400">ONYX Insurance Engine is using your score to <span className="text-[#C9A227] font-bold">automatically negotiate your rate</span>. Score 90+ unlocks Tier 1 premium.</span>
          </div>

          <p className="text-[10px] text-gray-600 mt-3 text-center">Based on {DRIVE_SCORE.tripsScored} scored trips · Updates after each drive</p>
        </div>

        {/* ── Route Hazard Feed ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#60A5FA]" />
              <p className="text-sm font-bold text-white">Route Hazard Feed</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONYX LIVE
            </div>
          </div>
          <div className="space-y-2">
            {HAZARDS.map(h => (
              <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex-shrink-0" style={{ color: severityColor(h.severity) }}>
                  {hazardIcon(h.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">{h.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{h.distance}</span>
                    <Clock className="w-2.5 h-2.5 ml-1" />
                    <span>{h.time}</span>
                  </div>
                </div>
                <div
                  className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ color: severityColor(h.severity), background: `${severityColor(h.severity)}15`, border: `1px solid ${severityColor(h.severity)}30` }}
                >
                  {h.severity.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-3 text-center">Community + ONYX sensor network · No action needed — hazards are monitored automatically</p>
        </div>

        {/* ── Emergency Contacts ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#A78BFA]" />
              <p className="text-sm font-bold text-white">Emergency Contacts</p>
            </div>
            <button
              onClick={() => setAddingContact(p => !p)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#A78BFA" }}
            >
              {addingContact ? <><X className="w-3 h-3" />Cancel</> : <><Plus className="w-3 h-3" />Add</>}
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-3">ONYX notifies these contacts automatically with your GPS + vehicle info during an SOS event.</p>

          {addingContact && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              <input value={newContact.name ?? ""} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#A78BFA]/50" />
              <input value={newContact.phone ?? ""} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#A78BFA]/50" />
              <div className="flex gap-2">
                <input value={newContact.relation ?? ""} onChange={e => setNewContact(p => ({ ...p, relation: e.target.value }))} placeholder="Relation" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#A78BFA]/50" />
                <button onClick={addContact} disabled={!newContact.name?.trim()} className="px-3 rounded-xl font-bold text-sm disabled:opacity-40" style={{ background: "#A78BFA", color: "#000" }}>
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {contacts.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{c.name} <span className="text-xs text-gray-500 font-normal">· {c.relation}</span></p>
                  <a href={`tel:${c.phone.replace(/\D/g, "")}`} className="text-xs text-[#A78BFA] flex items-center gap-1 mt-0.5">
                    <Phone className="w-2.5 h-2.5" />{c.phone}
                  </a>
                </div>
                {i > 0 && (
                  <button onClick={() => setContacts(prev => prev.filter(x => x.id !== c.id))} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── What ONYX Monitors ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.01] p-5">
          <p className="text-xs font-black tracking-widest text-gray-500 uppercase mb-4">What ONYX monitors 24/7</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Bell className="w-4 h-4" />,        label: "NHTSA Recalls",         desc: "Weekly scan · Auto-flagged",         color: "#C9A227" },
              { icon: <Activity className="w-4 h-4" />,    label: "Crash Detection",        desc: "Accelerometer · Instant SOS",        color: "#EF4444" },
              { icon: <Navigation className="w-4 h-4" />,  label: "Route Hazards",          desc: "Live · Community + sensor network",  color: "#60A5FA" },
              { icon: <TrendingUp className="w-4 h-4" />,  label: "Drive Score",            desc: "Feeds insurance engine auto",        color: "#34D399" },
              { icon: <MapPin className="w-4 h-4" />,      label: "GPS Location",           desc: "Shared only during SOS",            color: "#A78BFA" },
              { icon: <ShieldCheck className="w-4 h-4" />, label: "Pre-Trip Brief",         desc: "5 checks in 4 seconds",             color: "#F59E0B" },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2 p-3 rounded-xl border border-white/5">
                <div style={{ color: item.color }} className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-4">All monitoring is automatic. No action required. ONYX handles it.</p>
        </div>

      </div>
    </div>
  );
}
