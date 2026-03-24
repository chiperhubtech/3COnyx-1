import { useState } from "react";
import { UserCheck, Phone, Mail, Star, MessageSquare, Calendar, X, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { maskBankAccount, maskVin } from "@/lib/piiMask";
import { useTranslation } from "react-i18next";

const clients = [
  {
    id: 1,
    name: "Alexander Harrington",
    phone: "+1 (310) 555-0182",
    email: "a.harrington@priv.com",
    tier: "Platinum",
    vin: "1HGCM82633A123456",
    bankAccount: "4532123456789012",
    lastActivity: "Today, 9:14 AM",
    vehicle: "2023 Rolls-Royce Ghost Extended",
    status: "Active Deal",
    initials: "AH",
  },
  {
    id: 2,
    name: "Vivienne Moreau",
    phone: "+1 (212) 555-0247",
    email: "v.moreau@private.io",
    tier: "Gold",
    vin: "2T1BURHE0JC012345",
    bankAccount: "378282246310005",
    lastActivity: "Yesterday, 4:30 PM",
    vehicle: "2024 Bentley Bentayga EWB",
    status: "Reserved",
    initials: "VM",
  },
  {
    id: 3,
    name: "Damien Castillo",
    phone: "+1 (415) 555-0391",
    email: "d.castillo@secure.me",
    tier: "Silver",
    vin: "3VWFE21C04M000001",
    bankAccount: "6011111111111117",
    lastActivity: "Mar 19, 2:00 PM",
    vehicle: "2023 Lamborghini Urus",
    status: "Inquiry",
    initials: "DC",
  },
  {
    id: 4,
    name: "Natasha Worthington",
    phone: "+1 (646) 555-0821",
    email: "n.worthington@nwgroup.com",
    tier: "Platinum",
    vin: "WP0CA2A96JS800391",
    bankAccount: "5500005555555559",
    lastActivity: "Today, 11:02 AM",
    vehicle: "2024 Ferrari Purosangue",
    status: "Active Deal",
    initials: "NW",
  },
  {
    id: 5,
    name: "Marcus Bellamy",
    phone: "+1 (305) 555-0448",
    email: "m.bellamy@bellamy.io",
    tier: "Gold",
    vin: "SCBCR63WXAC071829",
    bankAccount: "3530111333300000",
    lastActivity: "Mar 20, 8:45 AM",
    vehicle: "2022 McLaren Artura",
    status: "Closed Won",
    initials: "MB",
  },
];

const tierStyle: Record<string, string> = {
  Platinum: "text-cyan-300 bg-cyan-400/10 border-cyan-400/30",
  Gold: "text-amber-300 bg-amber-400/10 border-amber-400/30",
  Silver: "text-slate-300 bg-slate-400/10 border-slate-400/30",
};

const statusStyle: Record<string, string> = {
  "Active Deal": "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  Reserved: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  Inquiry: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Closed Won": "text-white/30 bg-white/5 border-white/10",
};

type ActionModal = { type: "message" | "schedule"; client: typeof clients[0] } | null;

function ActionModal({ modal, onClose }: { modal: ActionModal; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [text, setText] = useState("");
  const [date, setDate] = useState("");

  if (!modal) return null;

  const handleSend = () => {
    if (!text.trim() && modal.type === "message") return;
    if (!date && modal.type === "schedule") return;
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f13] shadow-2xl overflow-hidden">
        {sent ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold mb-1">
              {modal.type === "message" ? "Message Sent" : "Meeting Scheduled"}
            </h3>
            <p className="text-white/40 text-sm mb-5">
              {modal.type === "message"
                ? `Your message to ${modal.client.name.split(" ")[0]} has been delivered.`
                : `A calendar invite has been sent to ${modal.client.name.split(" ")[0]}.`}
            </p>
            <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {modal.type === "message" ? (
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                ) : (
                  <Calendar className="w-4 h-4 text-amber-400" />
                )}
                <p className="text-white font-medium text-sm">
                  {modal.type === "message" ? "Send Message" : "Schedule Meeting"} — {modal.client.name.split(" ")[0]}
                </p>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              {modal.type === "message" ? (
                <textarea
                  rows={4}
                  placeholder={`Hi ${modal.client.name.split(" ")[0]}, I wanted to reach out about…`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none resize-none mb-4"
                />
              ) : (
                <div className="mb-4">
                  <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              )}
              <button
                onClick={handleSend}
                disabled={modal.type === "message" ? !text.trim() : !date}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold text-sm transition-colors"
              >
                {modal.type === "message" ? "Send Message" : "Schedule"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Concierge() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<number | null>(1);
  const [modal, setModal] = useState<ActionModal>(null);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">{t("concierge.title")}</h1>
        </div>
        <p className="text-white/40 text-sm ml-[52px]">{t("concierge.subtitle")}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t("concierge.agents"), value: "2", color: "text-emerald-400" },
          { label: t("concierge.history"), value: "$812K", color: "text-amber-400" },
          { label: t("guardian.monitoring"), value: "< 2h", color: "text-white" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {clients.map((client) => {
          const isOpen = expanded === client.id;
          return (
            <div
              key={client.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isOpen ? "border-amber-500/20 bg-white/[0.04]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              {/* Header row — always visible */}
              <button
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : client.id)}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/20 flex items-center justify-center text-amber-300 font-semibold text-xs shrink-0">
                  {client.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white text-sm">{client.name}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${tierStyle[client.tier]}`}>
                      <Star className="w-2 h-2" />
                      {client.tier}
                    </span>
                    <span className={`inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${statusStyle[client.status]}`}>
                      {client.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/30 mt-0.5 truncate">{client.vehicle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-white/25">
                    <Clock className="w-3 h-3" />
                    {client.lastActivity}
                  </div>
                  <ChevronRight className={`w-4 h-4 text-white/20 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-white/25" />
                      {client.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-white/25" />
                      {client.email}
                    </div>
                    <div>
                      <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">VIN</p>
                      <p className="text-xs font-mono text-white/50">{maskVin(client.vin)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Bank Account</p>
                      <p className="text-xs font-mono text-white/50">{maskBankAccount(client.bankAccount)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModal({ type: "message", client })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Message
                    </button>
                    <button
                      onClick={() => setModal({ type: "schedule", client })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Schedule
                    </button>
                    <a
                      href={`tel:${client.phone}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-xs font-medium transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ActionModal modal={modal} onClose={() => setModal(null)} />
    </div>
  );
}
