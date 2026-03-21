import { Truck, MapPin, Clock, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { maskVin } from "@/lib/piiMask";

const shipments = [
  {
    id: "SHP-0091",
    vehicle: "2024 Rolls-Royce Phantom",
    vin: "SCA664S51CUX52449",
    origin: "Beverly Hills, CA",
    destination: "Manhattan, NY",
    eta: "Mar 24, 2026",
    status: "In Transit",
    progress: 62,
  },
  {
    id: "SHP-0087",
    vehicle: "2024 Bentley Continental GT",
    vin: "SCBCR63WXAC065291",
    origin: "Miami, FL",
    destination: "Chicago, IL",
    eta: "Mar 22, 2026",
    status: "Delivered",
    progress: 100,
  },
  {
    id: "SHP-0094",
    vehicle: "2023 Lamborghini Urus",
    vin: "ZPBUA1ZL0NLA08832",
    origin: "Dallas, TX",
    destination: "Seattle, WA",
    eta: "Mar 28, 2026",
    status: "Pending",
    progress: 0,
  },
];

const statusIcon: Record<string, React.ReactNode> = {
  "In Transit": <Truck className="w-4 h-4 text-amber-400" />,
  Delivered: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  Pending: <Clock className="w-4 h-4 text-white/40" />,
  Issue: <AlertCircle className="w-4 h-4 text-red-400" />,
};

const statusStyle: Record<string, string> = {
  "In Transit": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  Delivered: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  Pending: "text-white/40 bg-white/5 border-white/10",
  Issue: "text-red-400 bg-red-400/10 border-red-400/30",
};

export default function Logistics() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Truck className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Logistics</h1>
        </div>
        <p className="text-white/40 text-sm ml-[52px]">Active shipments with real-time status</p>
      </div>

      <div className="grid gap-4">
        {shipments.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-white">{s.vehicle}</p>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusStyle[s.status]}`}
                  >
                    {statusIcon[s.status]}
                    {s.status}
                  </span>
                </div>
                <p className="text-xs font-mono text-white/30">{s.id} · VIN {maskVin(s.vin)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-white/30 uppercase tracking-wider">ETA</p>
                <p className="text-sm text-white/70">{s.eta}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 text-sm text-white/50">
                <MapPin className="w-3.5 h-3.5 text-white/30" />
                {s.origin}
              </div>
              <div className="flex-1 h-px bg-white/10 relative">
                {s.status === "In Transit" && (
                  <Truck className="absolute -top-2 text-amber-400 w-4 h-4" style={{ left: `${s.progress}%`, transform: "translateX(-50%)" }} />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/50">
                <MapPin className="w-3.5 h-3.5 text-emerald-400/50" />
                {s.destination}
              </div>
            </div>

            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  s.status === "Delivered"
                    ? "bg-emerald-500"
                    : s.status === "In Transit"
                    ? "bg-amber-500"
                    : "bg-white/10"
                }`}
                style={{ width: `${s.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
