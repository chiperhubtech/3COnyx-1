import { UserCheck, Phone, Mail, Star } from "lucide-react";
import { maskBankAccount, maskVin } from "@/lib/piiMask";

const clients = [
  {
    name: "Alexander Harrington",
    phone: "+1 (310) 555-0182",
    email: "a.harrington@priv.com",
    tier: "Platinum",
    vin: "1HGCM82633A123456",
    bankAccount: "4532123456789012",
  },
  {
    name: "Vivienne Moreau",
    phone: "+1 (212) 555-0247",
    email: "v.moreau@private.io",
    tier: "Gold",
    vin: "2T1BURHE0JC012345",
    bankAccount: "378282246310005",
  },
  {
    name: "Damien Castillo",
    phone: "+1 (415) 555-0391",
    email: "d.castillo@secure.me",
    tier: "Silver",
    vin: "3VWFE21C04M000001",
    bankAccount: "6011111111111117",
  },
];

const tierColors: Record<string, string> = {
  Platinum: "text-cyan-300 bg-cyan-400/10 border-cyan-400/30",
  Gold: "text-amber-300 bg-amber-400/10 border-amber-400/30",
  Silver: "text-slate-300 bg-slate-400/10 border-slate-400/30",
};

export default function Concierge() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Concierge</h1>
        </div>
        <p className="text-white/40 text-sm ml-[52px]">High-net-worth client profiles with PII protection</p>
      </div>

      <div className="grid gap-4">
        {clients.map((client) => (
          <div
            key={client.name}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/20 flex items-center justify-center text-amber-300 font-semibold text-sm">
                  {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-white">{client.name}</p>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${tierColors[client.tier]}`}
                  >
                    <Star className="w-2.5 h-2.5" />
                    {client.tier}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>{client.email}</span>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-3 pt-3 border-t border-white/5 mt-1">
                <div>
                  <p className="text-[11px] text-white/25 uppercase tracking-wider mb-1">VIN</p>
                  <p className="text-sm font-mono text-white/60">{maskVin(client.vin)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-white/25 uppercase tracking-wider mb-1">Bank Account</p>
                  <p className="text-sm font-mono text-white/60">{maskBankAccount(client.bankAccount)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
