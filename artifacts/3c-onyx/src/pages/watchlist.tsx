import { useState, useEffect } from "react";
import { Bookmark, Trash2, TrendingDown, Bell, Car, Plus, X, CheckCircle2, Loader2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface WatchlistItem {
  id: number;
  vinMasked: string;
  heading: string;
  make: string;
  model: string;
  year: number;
  listedPrice: number | null;
  targetPrice: number | null;
  createdAt: string;
}

const SEED_ITEMS = [
  { vinMasked: "••••••••••••••7821", heading: "2023 Ferrari Roma Coupe – Rosso Corsa", make: "Ferrari", model: "Roma", year: 2023, listedPrice: 287500, targetPrice: 275000 },
  { vinMasked: "••••••••••••••3345", heading: "2022 Lamborghini Urus Pearl Capsule", make: "Lamborghini", model: "Urus", year: 2022, listedPrice: 241000, targetPrice: 230000 },
  { vinMasked: "••••••••••••••9912", heading: "2023 Rolls-Royce Cullinan Black Badge", make: "Rolls-Royce", model: "Cullinan", year: 2023, listedPrice: 398000, targetPrice: 380000 },
  { vinMasked: "••••••••••••••6654", heading: "2022 McLaren 720S Spider – Papaya Spark", make: "McLaren", model: "720S Spider", year: 2022, listedPrice: 319000, targetPrice: 300000 },
];

const MAKE_COLORS: Record<string, string> = {
  Ferrari: "text-red-400 bg-red-400/10",
  Lamborghini: "text-amber-300 bg-amber-300/10",
  "Rolls-Royce": "text-purple-400 bg-purple-400/10",
  McLaren: "text-orange-400 bg-orange-400/10",
  Bentley: "text-emerald-400 bg-emerald-400/10",
  Porsche: "text-blue-400 bg-blue-400/10",
};

export default function Watchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [editingTarget, setEditingTarget] = useState<number | null>(null);
  const [tempTarget, setTempTarget] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [alertSent, setAlertSent] = useState<number | null>(null);

  const fetchItems = async () => {
    const res = await fetch(`${BASE}/api/watchlist`);
    const data = await res.json();
    setItems(data.watchlist ?? []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE}/api/watchlist`);
        const data = await res.json();
        if ((data.watchlist?.length ?? 0) === 0 && !seeded) {
          setSeeded(true);
          for (const item of SEED_ITEMS) {
            await fetch(`${BASE}/api/watchlist`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item),
            });
          }
          await fetchItems();
        } else {
          setItems(data.watchlist ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const removeItem = async (id: number) => {
    setDeleting(id);
    await fetch(`${BASE}/api/watchlist/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
  };

  const saveTarget = async (id: number) => {
    const target = parseInt(tempTarget.replace(/\D/g, ""), 10);
    if (!isNaN(target)) {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, targetPrice: target } : i));
    }
    setEditingTarget(null);
  };

  const sendAlert = (id: number) => {
    setAlertSent(id);
    setTimeout(() => setAlertSent(null), 2500);
  };

  const belowTarget = items.filter((i) => i.listedPrice && i.targetPrice && i.listedPrice <= i.targetPrice).length;

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Watchlist</h1>
        </div>
        <p className="text-white/35 text-sm ml-[52px]">Track vehicles and set price alert thresholds</p>
      </div>

      {belowTarget > 0 && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <TrendingDown size={16} className="text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">
            <span className="font-semibold">{belowTarget} vehicle{belowTarget > 1 ? "s are" : " is"}</span> at or below your target price — the AI Concierge has been notified.
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] h-48 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24">
          <Bookmark size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No vehicles on your watchlist yet.</p>
          <p className="text-white/20 text-xs mt-1">Click the Bookmark icon on any Marketplace listing to add one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => {
            const belowPrice = item.listedPrice && item.targetPrice && item.listedPrice <= item.targetPrice;
            const diff = item.listedPrice && item.targetPrice ? item.listedPrice - item.targetPrice : null;
            const makeColor = MAKE_COLORS[item.make] ?? "text-white/40 bg-white/5";

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-5 flex flex-col gap-4 transition-all ${
                  belowPrice
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${makeColor}`}>
                        {item.make}
                      </span>
                      {belowPrice && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-400/10">
                          Below Target
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug">{item.heading}</h3>
                    <p className="text-[10px] font-mono text-white/20 mt-0.5">VIN {item.vinMasked}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={deleting === item.id}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-white/20 hover:text-red-400"
                  >
                    {deleting === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-[10px] text-white/30 mb-0.5">Listed Price</p>
                    <p className="text-base font-bold text-white">
                      {item.listedPrice ? `$${item.listedPrice.toLocaleString()}` : "N/A"}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg p-3 cursor-pointer transition-colors ${
                      editingTarget === item.id
                        ? "bg-amber-500/10 border border-amber-500/30"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                    onClick={() => {
                      if (editingTarget !== item.id) {
                        setEditingTarget(item.id);
                        setTempTarget(item.targetPrice ? String(item.targetPrice) : "");
                      }
                    }}
                  >
                    <p className="text-[10px] text-white/30 mb-0.5 flex items-center gap-1">
                      Target Price <Plus size={8} />
                    </p>
                    {editingTarget === item.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 text-sm font-bold">$</span>
                        <input
                          autoFocus
                          type="number"
                          value={tempTarget}
                          onChange={(e) => setTempTarget(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveTarget(item.id); if (e.key === "Escape") setEditingTarget(null); }}
                          onBlur={() => saveTarget(item.id)}
                          className="w-full bg-transparent text-sm font-bold text-amber-300 outline-none"
                          placeholder="0"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <p className={`text-base font-bold ${item.targetPrice ? "text-amber-300" : "text-white/20"}`}>
                        {item.targetPrice ? `$${item.targetPrice.toLocaleString()}` : "Set target"}
                      </p>
                    )}
                  </div>
                </div>

                {diff !== null && (
                  <div className={`flex items-center gap-2 text-xs font-medium ${diff <= 0 ? "text-emerald-400" : "text-white/35"}`}>
                    <TrendingDown size={12} />
                    {diff <= 0
                      ? `$${Math.abs(diff).toLocaleString()} below your target`
                      : `$${diff.toLocaleString()} above your target`}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => sendAlert(item.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                      alertSent === item.id
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {alertSent === item.id ? <CheckCircle2 size={12} /> : <Bell size={12} />}
                    {alertSent === item.id ? "Alert set" : "Alert me"}
                  </button>
                  <a
                    href={`${BASE}/marketplace`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                  >
                    <Car size={12} />
                    View in Market
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
