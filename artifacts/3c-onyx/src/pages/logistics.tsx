import { useState, useEffect, useRef, useCallback } from "react";
import {
  Truck, MapPin, Clock, CheckCircle2, AlertCircle, Zap,
  Shield, User, Star, Navigation, ExternalLink, X,
  ChevronRight, Wifi, WifiOff, Package, ArrowRight,
} from "lucide-react";
import { maskVin } from "@/lib/piiMask";

// Dynamic Leaflet import
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

interface Runner {
  id: string;
  name: string;
  avatar: string;
  checkrStatus: "clear" | "pending" | "consider";
  rating: number;
  completedRuns: number;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: "active" | "en_route" | "idle";
  currentTaskId: string | null;
  vehicleType: string;
}

interface Task {
  id: string;
  type: string;
  vehicle: string;
  vin: string;
  origin: string;
  originLat: number;
  originLng: number;
  destination: string;
  destLat: number;
  destLng: number;
  priority: "high" | "normal" | "low";
  status: "open" | "in_progress" | "complete";
  assignedRunnerId: string | null;
  estimatedMiles: number;
  payout: number;
  eta: string;
}

const priorityStyle: Record<string, string> = {
  high: "text-red-400 bg-red-400/10 border-red-400/30",
  normal: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  low: "text-white/40 bg-white/5 border-white/10",
};

const taskTypeIcon: Record<string, React.ElementType> = {
  "Dealer Swap": Truck,
  "Client Delivery": Package,
  "Port Pickup": MapPin,
  "Auction Transport": Zap,
};

const checkrBadge: Record<Runner["checkrStatus"], { label: string; className: string }> = {
  clear: { label: "BGC Clear", className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  pending: { label: "BGC Pending", className: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  consider: { label: "BGC Review", className: "text-red-400 bg-red-400/10 border-red-400/30" },
};

// ─── Map Component ─────────────────────────────────────────────────────────────
function LiveMap({
  runners,
  tasks,
  selectedTaskId,
  onMarkerClick,
}: {
  runners: Runner[];
  tasks: Task[];
  selectedTaskId: string | null;
  onMarkerClick: (runnerId: string) => void;
}) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, LeafletMarker>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      if (mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [37.5, -96],
        zoom: 4,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark OSM tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19, subdomains: "abcd" }
      ).addTo(map);

      mapRef.current = map;
      setLeafletReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Draw/update runner markers
  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;

      runners.forEach((runner) => {
        const isActive = runner.status !== "idle";
        const isSelected = tasks.find((t) => t.id === selectedTaskId)?.assignedRunnerId === runner.id;

        const color = isSelected ? "#f59e0b" : isActive ? "#34d399" : "#6b7280";
        const size = isSelected ? 36 : 30;

        const svgIcon = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}20" stroke="${color}" stroke-width="2"/>
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 4}" fill="${color}"/>
            ${isActive ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="none" stroke="${color}" stroke-width="1" opacity="0.4">
              <animate attributeName="r" values="${size / 4};${size / 2 - 2}" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite"/>
            </circle>` : ""}
          </svg>`;

        const icon = L.divIcon({
          html: svgIcon,
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        if (markersRef.current[runner.id]) {
          markersRef.current[runner.id].setLatLng([runner.lat, runner.lng]).setIcon(icon);
        } else {
          const marker = L.marker([runner.lat, runner.lng], { icon })
            .addTo(map)
            .on("click", () => onMarkerClick(runner.id));
          markersRef.current[runner.id] = marker;
        }
      });
    })();
  }, [runners, selectedTaskId, tasks, leafletReady, onMarkerClick]);

  // Fly to selected runner
  useEffect(() => {
    if (!mapRef.current || !selectedTaskId) return;
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task?.assignedRunnerId) return;
    const runner = runners.find((r) => r.id === task.assignedRunnerId);
    if (runner) mapRef.current.flyTo([runner.lat, runner.lng], 8, { duration: 1.2 });
  }, [selectedTaskId, tasks, runners]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />
      {!leafletReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0c] rounded-xl">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-white/30">Loading map…</p>
          </div>
        </div>
      )}
      {/* Legend */}
      {leafletReady && (
        <div className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-2 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-white/50">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[10px] text-white/50">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
            <span className="text-[10px] text-white/50">Idle</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Task Detail Panel ─────────────────────────────────────────────────────────
function TaskDetail({
  task,
  runner,
  onClose,
}: {
  task: Task;
  runner: Runner | undefined;
  onClose: () => void;
}) {
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState(false);

  const handleTrack = () => {
    setTracking(true);
    setTimeout(() => { setTracking(false); setTracked(true); }, 1200);
  };

  const TypeIcon = taskTypeIcon[task.type] ?? Truck;
  const maskedVin = "•".repeat(Math.max(0, task.vin.length - 4)) + task.vin.slice(-4);
  const bgCheck = runner ? checkrBadge[runner.checkrStatus] : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-start justify-between shrink-0">
        <div className="flex items-start gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            task.priority === "high" ? "bg-red-500/10 border border-red-500/20" : "bg-amber-500/10 border border-amber-500/20"
          }`}>
            <TypeIcon className={`w-4 h-4 ${task.priority === "high" ? "text-red-400" : "text-amber-400"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{task.type}</p>
            <p className="text-xs text-white/35">{task.id}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Vehicle */}
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">Vehicle</p>
          <p className="text-sm font-medium text-white">{task.vehicle}</p>
          <p className="text-xs font-mono text-white/25 mt-0.5">VIN {maskedVin}</p>
        </div>

        {/* Route */}
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <div className="w-px h-6 bg-white/10" />
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-white/60">{task.origin}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">{task.destination}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <div className="text-[11px] text-white/30 flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              {task.estimatedMiles} mi
            </div>
            <div className="text-[11px] text-white/30 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ETA {task.eta}
            </div>
            <div className="text-[11px] font-medium text-emerald-400">
              ${task.payout.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Runner */}
        {runner ? (
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Assigned Runner</p>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/20 flex items-center justify-center text-amber-300 font-semibold text-xs shrink-0">
                  {runner.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white">{runner.name}</p>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-white/50">{runner.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/35">{runner.completedRuns} completed runs · {runner.vehicleType}</p>
                </div>
              </div>

              {/* Checkr badge */}
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3.5 h-3.5 text-white/20" />
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${bgCheck?.className}`}>
                  {bgCheck?.label}
                </span>
                {runner.checkrStatus === "clear" && (
                  <span className="text-[10px] text-white/25">via Checkr</span>
                )}
              </div>

              {/* Live GPS */}
              <div className="flex items-center gap-2 text-[11px] text-white/35">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {runner.status !== "idle"
                  ? `Live GPS · ${runner.speed} mph · Heading ${Math.round(runner.heading)}°`
                  : "Idle · standing by"}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 p-4 text-center">
            <User className="w-5 h-5 text-white/15 mx-auto mb-1.5" />
            <p className="text-xs text-white/30">No runner assigned</p>
          </div>
        )}

        {/* Track button */}
        {runner && (
          <button
            onClick={handleTrack}
            disabled={tracking}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
              tracked
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : "bg-amber-500 hover:bg-amber-400 text-black"
            }`}
          >
            {tracked ? (
              <><CheckCircle2 className="w-4 h-4" />Live Tracking Active</>
            ) : tracking ? (
              <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Connecting…</>
            ) : (
              <><Navigation className="w-4 h-4" />Track Delivery</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Logistics() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "open" | "in_progress">("all");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    try {
      const [rRes, tRes] = await Promise.all([
        fetch("/api/logistics/runners"),
        fetch("/api/logistics/tasks"),
      ]);
      if (rRes.ok) setRunners((await rRes.json()).runners ?? []);
      if (tRes.ok) setTasks((await tRes.json()).tasks ?? []);
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(() => fetchAll(true), 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchAll]);

  const handleMarkerClick = (runnerId: string) => {
    const task = tasks.find((t) => t.assignedRunnerId === runnerId);
    if (task) setSelectedTaskId(task.id);
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const selectedRunner = selectedTask
    ? runners.find((r) => r.id === selectedTask.assignedRunnerId)
    : undefined;

  const filteredTasks = tasks.filter((t) =>
    activeTab === "all" ? true : t.status === activeTab
  );

  const activeRunners = runners.filter((r) => r.status !== "idle").length;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>Live Tracking</h1>
            <p className="text-xs text-white/35">HyperTrack · Live GPS · Checkr BGC</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Active Runners", value: activeRunners, color: "text-emerald-400" },
              { label: "Open Tasks", value: tasks.filter((t) => t.status === "open").length, color: "text-amber-400" },
              { label: "In Progress", value: tasks.filter((t) => t.status === "in_progress").length, color: "text-white" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-white/30">{s.label}</p>
              </div>
            ))}
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs ${
            connected ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" : "border-red-500/25 bg-red-500/10 text-red-400"
          }`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? "Live" : "Offline"}
          </div>
        </div>
      </div>

      {/* Content: Map + Sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Map */}
        <div className="flex-1 p-3 min-w-0">
          {loading ? (
            <div className="w-full h-full rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-white/30">Loading live map…</p>
              </div>
            </div>
          ) : (
            <LiveMap
              runners={runners}
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </div>

        {/* Right Panel */}
        <div className="w-80 shrink-0 flex flex-col border-l border-white/10 min-h-0">
          {selectedTask ? (
            <TaskDetail task={selectedTask} runner={selectedRunner} onClose={() => setSelectedTaskId(null)} />
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-white/10 shrink-0">
                {(["all", "open", "in_progress"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? "text-amber-400 border-b-2 border-amber-400"
                        : "text-white/35 hover:text-white/60"
                    }`}
                  >
                    {tab === "in_progress" ? "In Progress" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Task list */}
              <div className="flex-1 overflow-y-auto">
                {filteredTasks.map((task) => {
                  const runner = runners.find((r) => r.id === task.assignedRunnerId);
                  const TypeIcon = taskTypeIcon[task.type] ?? Truck;
                  return (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                        selectedTaskId === task.id ? "bg-amber-500/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          task.priority === "high"
                            ? "bg-red-500/10 border border-red-500/20"
                            : "bg-white/5 border border-white/10"
                        }`}>
                          <TypeIcon className={`w-3.5 h-3.5 ${task.priority === "high" ? "text-red-400" : "text-amber-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-xs font-semibold text-white truncate">{task.type}</p>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${priorityStyle[task.priority]} shrink-0`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/40 truncate mb-1">{task.vehicle}</p>
                          <div className="flex items-center gap-1 text-[10px] text-white/25">
                            <span className="truncate">{task.origin}</span>
                            <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{task.destination}</span>
                          </div>
                          {runner && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="w-4 h-4 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 text-[8px] font-bold">
                                {runner.avatar.charAt(0)}
                              </div>
                              <p className="text-[10px] text-white/35">{runner.name}</p>
                              <div className="flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                <p className="text-[10px] text-emerald-400/60">{runner.speed} mph</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-white/15 shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
