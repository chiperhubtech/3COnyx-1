import { Car, Shield } from "lucide-react";
import { maskVin } from "@/lib/piiMask";

const vehicles = [
  {
    year: 2024,
    make: "Rolls-Royce",
    model: "Phantom",
    color: "Midnight Black",
    price: 589000,
    vin: "SCA664S51CUX52449",
    status: "Available",
  },
  {
    year: 2024,
    make: "Bentley",
    model: "Continental GT",
    color: "Beluga",
    price: 274900,
    vin: "SCBCR63WXAC065291",
    status: "Reserved",
  },
  {
    year: 2023,
    make: "Lamborghini",
    model: "Urus Performante",
    color: "Grigio Titans",
    price: 269995,
    vin: "ZPBUA1ZL0NLA08832",
    status: "Available",
  },
  {
    year: 2024,
    make: "Ferrari",
    model: "SF90 Stradale",
    color: "Rosso Corsa",
    price: 619000,
    vin: "ZFF95NLA0N0273301",
    status: "Sold",
  },
];

const statusStyle: Record<string, string> = {
  Available: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  Reserved: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  Sold: "text-white/30 bg-white/5 border-white/10",
};

export default function Inventory() {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Car className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Inventory</h1>
        </div>
        <p className="text-white/40 text-sm ml-[52px]">Vehicle catalog — VINs are security-masked</p>
      </div>

      <div className="grid gap-4">
        {vehicles.map((v) => (
          <div
            key={v.vin}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors flex items-center gap-6"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center shrink-0">
              <Car className="w-6 h-6 text-white/30" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <p className="font-semibold text-white">
                  {v.year} {v.make} {v.model}
                </p>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusStyle[v.status]}`}
                >
                  {v.status}
                </span>
              </div>
              <p className="text-sm text-white/40 mb-2">{v.color}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-white/25" />
                  <span className="text-xs font-mono text-white/40">{maskVin(v.vin)}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-lg font-semibold text-white">
                ${v.price.toLocaleString()}
              </p>
              <p className="text-xs text-white/30">MSRP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
