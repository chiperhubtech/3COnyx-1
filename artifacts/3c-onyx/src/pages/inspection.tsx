import { useState, useEffect } from "react";
import { ClipboardCheck, Car, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Loader2, PenLine } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface GarageVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
}

interface ConditionState {
  front: number;
  rear: number;
  driverSide: number;
  passengerSide: number;
  interior: number;
}

type Step = "vehicle" | "conditions" | "sign" | "complete";

const CONDITION_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Critical damage", color: "text-red-400" },
  2: { label: "Major damage", color: "text-red-300" },
  3: { label: "Visible wear", color: "text-orange-400" },
  4: { label: "Minor marks", color: "text-yellow-400" },
  5: { label: "Good", color: "text-white/60" },
  6: { label: "Very good", color: "text-white/80" },
  7: { label: "Excellent", color: "text-emerald-400" },
  8: { label: "Near perfect", color: "text-emerald-400" },
  9: { label: "Flawless", color: "text-emerald-400" },
  10: { label: "Showroom", color: "text-amber-400" },
};

function ConditionSlider({
  label, panel, value, onChange,
}: { label: string; panel: string; value: number; onChange: (v: number) => void }) {
  const info = CONDITION_LABELS[value];
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-white/35">{panel}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${info.color}`}>{value}/10</p>
          <p className={`text-[10px] ${info.color}`}>{info.label}</p>
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${
            value <= 3 ? "#EF4444" : value <= 5 ? "#F59E0B" : "#10B981"
          } ${(value - 1) * 11.1}%, rgba(255,255,255,0.1) ${(value - 1) * 11.1}%)`,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-white/20">Poor</span>
        <span className="text-[9px] text-white/20">Showroom</span>
      </div>
    </div>
  );
}

type SubmitState = "idle" | "submitting" | "done";

export default function Inspection() {
  const [step, setStep] = useState<Step>("vehicle");
  const [vehicle, setVehicle] = useState("");
  const [customVehicle, setCustomVehicle] = useState("");
  const [inspector, setInspector] = useState("");
  const [odometer, setOdometer] = useState("");
  const [garageVehicles, setGarageVehicles] = useState<GarageVehicle[]>([]);

  useEffect(() => {
    fetch(`${BASE}/api/garage/vehicles`)
      .then((r) => (r.ok ? r.json() : { vehicles: [] }))
      .then((d) => setGarageVehicles(d.vehicles ?? []))
      .catch(() => {});
  }, []);
  const [conditions, setConditions] = useState<ConditionState>({
    front: 8, rear: 8, driverSide: 7, passengerSide: 8, interior: 9,
  });
  const [notes, setNotes] = useState("");
  const [signed, setSigned] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [inspectionRef, setInspectionRef] = useState("");

  const vehicleLabel = vehicle === "__custom__" ? customVehicle : vehicle;
  const avgCondition = Math.round(
    (conditions.front + conditions.rear + conditions.driverSide + conditions.passengerSide + conditions.interior) / 5
  );
  const avgInfo = CONDITION_LABELS[avgCondition];

  const submit = async () => {
    if (!signed) return;
    setSubmitState("submitting");
    try {
      const res = await fetch(`${BASE}/api/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleLabel,
          inspectorName: inspector,
          conditionFront: conditions.front,
          conditionRear: conditions.rear,
          conditionDriverSide: conditions.driverSide,
          conditionPassengerSide: conditions.passengerSide,
          conditionInterior: conditions.interior,
          odometerConfirmed: odometer ? parseInt(odometer) : null,
          notes: notes || null,
          signed: true,
        }),
      });
      const data = await res.json();
      setInspectionRef(`INS-${String(data.id).padStart(4, "0")}`);
      setSubmitState("done");
      setStep("complete");
    } catch {
      setSubmitState("idle");
    }
  };

  const STEPS: Step[] = ["vehicle", "conditions", "sign", "complete"];
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Pre-Pickup Inspection</h1>
        </div>
        <p className="text-white/35 text-sm ml-[52px]">Document vehicle condition before transport begins</p>
      </div>

      {step !== "complete" && (
        <div className="flex items-center gap-2 mb-8">
          {["Vehicle", "Condition", "Sign Off"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < stepIndex ? "bg-emerald-500 text-white" :
                  i === stepIndex ? "bg-amber-500 text-black" :
                  "bg-white/10 text-white/30"
                }`}>
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === stepIndex ? "text-white" : "text-white/30"}`}>{label}</span>
              </div>
              {i < 2 && <ChevronRight size={12} className="text-white/15" />}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-2xl">
        {step === "vehicle" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Car size={15} className="text-amber-400" /> Vehicle Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1.5">Select Vehicle</label>
                  <select
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500/50 focus:outline-none"
                  >
                    <option value="" className="bg-[#1a1a1f]">Choose a vehicle…</option>
                    {garageVehicles.map((v) => {
                      const label = `${v.year} ${v.make} ${v.model}`;
                      return <option key={v.id} value={label} className="bg-[#1a1a1f]">{label}</option>;
                    })}
                    <option value="__custom__" className="bg-[#1a1a1f]">Other (enter manually)</option>
                  </select>
                </div>
                {vehicle === "__custom__" && (
                  <div>
                    <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1.5">Vehicle Description</label>
                    <input
                      type="text"
                      value={customVehicle}
                      onChange={(e) => setCustomVehicle(e.target.value)}
                      placeholder="e.g. 2023 Ferrari Roma Coupe"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1.5">Inspector Name</label>
                  <input
                    type="text"
                    value={inspector}
                    onChange={(e) => setInspector(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1.5">Confirmed Odometer (mi)</label>
                  <input
                    type="number"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="e.g. 61402"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep("conditions")}
              disabled={!vehicleLabel || !inspector}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              Continue to Condition Rating <ChevronRight size={15} />
            </button>
          </div>
        )}

        {step === "conditions" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{vehicleLabel}</p>
                <div className="text-right">
                  <p className={`text-sm font-bold ${avgInfo.color}`}>Avg {avgCondition}/10</p>
                  <p className={`text-[10px] ${avgInfo.color}`}>{avgInfo.label}</p>
                </div>
              </div>
            </div>
            <ConditionSlider label="Front Panel" panel="Bumper, hood, grille" value={conditions.front} onChange={(v) => setConditions((c) => ({ ...c, front: v }))} />
            <ConditionSlider label="Rear Panel" panel="Bumper, trunk, taillights" value={conditions.rear} onChange={(v) => setConditions((c) => ({ ...c, rear: v }))} />
            <ConditionSlider label="Driver Side" panel="Door panels, mirrors, sills" value={conditions.driverSide} onChange={(v) => setConditions((c) => ({ ...c, driverSide: v }))} />
            <ConditionSlider label="Passenger Side" panel="Door panels, mirrors, sills" value={conditions.passengerSide} onChange={(v) => setConditions((c) => ({ ...c, passengerSide: v }))} />
            <ConditionSlider label="Interior" panel="Seats, dash, trim, headliner" value={conditions.interior} onChange={(v) => setConditions((c) => ({ ...c, interior: v }))} />

            <div>
              <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any additional observations, pre-existing damage notes, or client instructions…"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("vehicle")} className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors">
                <ChevronLeft size={14} /> Back
              </button>
              <button onClick={() => setStep("sign")} className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                Review & Sign <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {step === "sign" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <PenLine size={14} className="text-amber-400" /> Inspection Summary
              </h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Vehicle</span>
                  <span className="text-white font-medium">{vehicleLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Inspector</span>
                  <span className="text-white">{inspector}</span>
                </div>
                {odometer && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Odometer</span>
                    <span className="text-white">{parseInt(odometer).toLocaleString()} mi</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Overall Condition</span>
                  <span className={`font-semibold ${avgInfo.color}`}>{avgCondition}/10 — {avgInfo.label}</span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[
                  { l: "Front", v: conditions.front },
                  { l: "Rear", v: conditions.rear },
                  { l: "Driver", v: conditions.driverSide },
                  { l: "Passenger", v: conditions.passengerSide },
                  { l: "Interior", v: conditions.interior },
                ].map(({ l, v }) => (
                  <div key={l} className="text-center rounded-lg bg-white/5 py-2">
                    <p className={`text-sm font-bold ${CONDITION_LABELS[v].color}`}>{v}</p>
                    <p className="text-[9px] text-white/30 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
              {notes && (
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-white/30 mb-1">Notes</p>
                  <p className="text-xs text-white/60">{notes}</p>
                </div>
              )}
            </div>

            <div
              className="rounded-xl border p-4 cursor-pointer transition-colors"
              style={{ borderColor: signed ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.1)", background: signed ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.02)" }}
              onClick={() => setSigned((v) => !v)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${signed ? "bg-amber-500 border-amber-500" : "border-white/20 bg-white/5"}`}>
                  {signed && <CheckCircle2 size={12} className="text-black" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">I certify this inspection is accurate</p>
                  <p className="text-xs text-white/35 mt-0.5 leading-relaxed">
                    I confirm the vehicle condition ratings above are an honest assessment. This report will be attached to the delivery record and SHA-256 hashed in the Audit Vault.
                  </p>
                </div>
              </div>
            </div>

            {!signed && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300">You must certify the inspection before submitting</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep("conditions")} className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors">
                <ChevronLeft size={14} /> Back
              </button>
              <button
                onClick={submit}
                disabled={!signed || submitState === "submitting"}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {submitState === "submitting" && <Loader2 size={14} className="animate-spin" />}
                {submitState === "submitting" ? "Submitting…" : "Submit Inspection"}
              </button>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-white font-semibold text-xl mb-2">Inspection Complete</h2>
            <p className="text-white/40 text-sm mb-1">Pre-pickup report submitted and SHA-256 hashed</p>
            <p className="text-xs font-mono text-white/25 mb-6">Ref: {inspectionRef}</p>
            <div className="rounded-lg bg-white/5 p-4 mb-6 text-left">
              <div className="grid grid-cols-5 gap-2">
                {[
                  { l: "Front", v: conditions.front },
                  { l: "Rear", v: conditions.rear },
                  { l: "Driver", v: conditions.driverSide },
                  { l: "Pass", v: conditions.passengerSide },
                  { l: "Interior", v: conditions.interior },
                ].map(({ l, v }) => (
                  <div key={l} className="text-center">
                    <p className={`text-base font-bold ${CONDITION_LABELS[v].color}`}>{v}/10</p>
                    <p className="text-[9px] text-white/30 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep("vehicle"); setVehicle(""); setInspector(""); setOdometer(""); setNotes(""); setSigned(false); setSubmitState("idle"); }}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors"
              >
                New Inspection
              </button>
              <Link href="/logistics" className="flex-1">
                <button className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors">
                  Go to Logistics
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
