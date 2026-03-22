import { useState, useEffect, useCallback, useRef } from "react";
import {
  Truck, FileText, Camera, RotateCcw, Shield,
  MapPin, CheckCircle2, Clock, Zap, X, ChevronRight,
  ArrowRight, Package, RefreshCw, Loader2, Eye,
  Building2, Hash, Calendar, Car, Scan, MonitorSmartphone,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Carrier {
  id: string;
  name: string;
  logo: string;
  type: "enclosed" | "open" | "flatbed";
  transitDays: number;
  ratePerMile: number;
  insurance: number;
  rating: number;
  totalCarried: number;
  available: boolean;
}

interface BOL {
  bolId: string;
  bolNumber: string;
  carrierId: string;
  carrierName: string;
  vehicleId: string;
  vehicleName: string;
  vehicleVin: string;
  vehicleVinMasked: string;
  color: string;
  year: number;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  estimatedMiles: number;
  estimatedTransitDays: number;
  pickupDate: string;
  estimatedDelivery: string;
  carrierRate: number;
  insurance: number;
  totalCost: number;
  status: "issued" | "picked_up" | "in_transit" | "delivered";
  runnerName: string | null;
  sha256Hash: string;
  issuedAt: string;
  digitalSignature: string;
  scanAvailable: boolean;
}

interface ScanPosition {
  angle: number;
  label: string;
  capturedAt: string | null;
  imageUrl: string | null;
}

interface VehicleScan {
  scanId: string;
  vehicleName: string;
  runnerName: string;
  positions: ScanPosition[];
  completedPositions: number;
  totalPositions: number;
  isComplete: boolean;
  submittedAt: string | null;
  sha256Hash: string | null;
}

// ─── QR Code SVG ───────────────────────────────────────────────────────────────
function QRCodeSvg({ value, size = 80 }: { value: string; size?: number }) {
  // Simple deterministic QR pattern from hash (visual only)
  const seed = value.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = 11;
  const cellSize = size / cells;
  const grid: boolean[][] = [];
  for (let r = 0; r < cells; r++) {
    grid[r] = [];
    for (let c = 0; c < cells; c++) {
      const i = r * cells + c;
      grid[r][c] = ((seed * (i + 7) * 2654435761) >>> 28) % 3 !== 0;
    }
  }
  // Force corner finder patterns
  const forceOn = (r: number, c: number) => { grid[r][c] = true; };
  [[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2],
   [0,8],[0,9],[0,10],[1,8],[1,10],[2,8],[2,9],[2,10],
   [8,0],[8,1],[8,2],[9,0],[9,2],[10,0],[10,1],[10,2]].forEach(([r,c]) => forceOn(r,c));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="transparent" />
      {grid.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize + 0.5}
              y={r * cellSize + 0.5}
              width={cellSize - 1}
              height={cellSize - 1}
              fill="#C9A227"
              opacity={0.9}
            />
          ) : null
        )
      )}
    </svg>
  );
}

// ─── Status pill ───────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  issued:     { label: "ISSUED",      color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/25" },
  picked_up:  { label: "PICKED UP",   color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25" },
  in_transit: { label: "IN TRANSIT",  color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/25" },
  delivered:  { label: "DELIVERED",   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
};

// ─── Digital Bill of Lading ────────────────────────────────────────────────────
function BillOfLadingCard({ bol, onClose }: { bol: BOL; onClose: () => void }) {
  const sc = statusConfig[bol.status] ?? statusConfig.issued;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto">

        {/* BOL Document */}
        <div className="rounded-2xl border border-[#C9A227]/30 bg-[#07070b] overflow-hidden shadow-2xl"
          style={{ boxShadow: "0 0 60px rgba(201,162,39,0.12), 0 24px 80px rgba(0,0,0,0.8)" }}>

          {/* Gold shimmer top */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />

          {/* Header */}
          <div className="p-6 border-b border-white/8 flex items-start justify-between bg-gradient-to-br from-[#C9A227]/5 to-transparent">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-[#C9A227]/15 border border-[#C9A227]/30 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#C9A227]" />
                </div>
                <div>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-medium">3C Onyx Secure Platform</p>
                  <p className="text-xs font-bold text-[#C9A227] tracking-wider">DIGITAL BILL OF LADING</p>
                </div>
              </div>
              <p className="text-[10px] text-white/20 mt-2">
                {bol.carrierName} — Certified Transport Document
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-black text-white tracking-wider">{bol.bolNumber}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${sc.color} ${sc.bg} ${sc.border}`}>
                {sc.label}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Vehicle info */}
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[9px] text-white/25 uppercase tracking-wider mb-2 font-medium">Vehicle Being Transported</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-white">{bol.vehicleName}</p>
                  <p className="text-sm text-white/40">{bol.color} · {bol.year}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-white/25 uppercase mb-0.5">VIN</p>
                  <p className="font-mono text-xs text-white/40">{bol.vehicleVinMasked}</p>
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[9px] text-white/25 uppercase tracking-wider mb-3 font-medium">Transport Route</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-1">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-xs font-semibold text-white">{bol.originCity}</p>
                  <p className="text-[10px] text-white/30">{bol.originState}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full flex items-center gap-1 mb-1">
                    <div className="flex-1 h-px bg-white/10" />
                    <Truck className="w-4 h-4 text-white/25" />
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <p className="text-[10px] text-white/25">{bol.estimatedMiles} mi</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-1">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs font-semibold text-white">{bol.destinationCity}</p>
                  <p className="text-[10px] text-white/30">{bol.destinationState}</p>
                </div>
              </div>
            </div>

            {/* Carrier + Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-2">Carrier</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <p className="text-[9px] font-black text-amber-400">{bol.carrierName.slice(0,2).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{bol.carrierName}</p>
                    <p className="text-[10px] text-white/30">{bol.estimatedTransitDays}d transit</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-2">Insurance</p>
                <p className="text-sm font-bold text-emerald-400">${(bol.insurance / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-white/25">Coverage in transit</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Pickup
                </p>
                <p className="text-xs font-semibold text-white">{fmt(bol.pickupDate)}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Est. Delivery
                </p>
                <p className="text-xs font-semibold text-white">{fmt(bol.estimatedDelivery)}</p>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="rounded-xl border border-[#C9A227]/15 bg-[#C9A227]/[0.03] p-4">
              <p className="text-[9px] text-white/25 uppercase tracking-wider mb-3">Cost Summary</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Transport ({bol.estimatedMiles} mi)</span>
                  <span className="text-white">${bol.carrierRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Handling & Admin</span>
                  <span className="text-white">$195</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-white/8">
                  <span className="text-white/70">Total</span>
                  <span className="text-[#C9A227]">${bol.totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Runner */}
            {bol.runnerName && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/8 bg-white/[0.02]">
                <div className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/40 text-xs font-bold shrink-0">
                  {bol.runnerName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-white">{bol.runnerName}</p>
                  <p className="text-[10px] text-white/30">Assigned Runner · Checkr Verified</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            )}

            {/* Digital signatures */}
            <div className="rounded-xl border border-white/8 bg-white/[0.015] p-4">
              <p className="text-[9px] text-white/25 uppercase tracking-wider mb-3">Digital Signatures</p>
              <div className="grid grid-cols-2 gap-4">
                {["Shipper Authorized", "3C Platform Certified"].map((label) => (
                  <div key={label}>
                    <div className="border-b border-white/10 pb-1 mb-1">
                      <p className="font-['Brush_Script_MT',cursive] text-white/20 text-lg select-none">
                        {label === "Shipper Authorized" ? "A. Harrington" : "3C Onyx™"}
                      </p>
                    </div>
                    <p className="text-[9px] text-white/15">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tamper hash + QR */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.01]">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <p className="text-[9px] text-white/25 uppercase tracking-wider font-medium">SHA-256 Tamper Seal</p>
                </div>
                <p className="font-mono text-[9px] text-emerald-400/60 break-all leading-4">
                  {bol.sha256Hash}
                </p>
                <p className="text-[9px] text-white/15 mt-2 font-mono">{bol.digitalSignature}</p>
                <p className="text-[9px] text-white/15 mt-0.5">
                  Issued: {new Date(bol.issuedAt).toLocaleString()}
                </p>
              </div>
              <div className="shrink-0 p-2 rounded-xl bg-white/[0.03] border border-white/8">
                <QRCodeSvg value={bol.bolNumber + bol.sha256Hash} size={72} />
              </div>
            </div>

            {/* Watermark */}
            <div className="text-center pt-2">
              <p className="text-[9px] text-white/10 uppercase tracking-[0.3em]">3C ONYX SECURE PLATFORM · AUTHENTICATED DOCUMENT · {bol.bolNumber}</p>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/50 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Close Document
        </button>
      </div>
    </div>
  );
}

// ─── 360° Scan Viewer ─────────────────────────────────────────────────────────
function ScanViewer({ scan, onClose }: { scan: VehicleScan; onClose: () => void }) {
  const [activePos, setActivePos] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSpin = () => {
    setSpinning(true);
    let i = 0;
    spinRef.current = setInterval(() => {
      i = (i + 1) % 8;
      setActivePos(i);
    }, 500);
    setTimeout(() => {
      if (spinRef.current) clearInterval(spinRef.current);
      setSpinning(false);
      setActivePos(0);
    }, 4000);
  };

  useEffect(() => () => { if (spinRef.current) clearInterval(spinRef.current); }, []);

  const current = scan.positions[activePos];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#080810] overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="p-4 border-b border-white/8 flex items-center justify-between bg-gradient-to-r from-violet-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">360° Vehicle Scan</p>
              <p className="text-[10px] text-violet-400/60">{scan.vehicleName} · {scan.runnerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startSpin}
              disabled={spinning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs hover:bg-violet-500/20 transition-colors disabled:opacity-40"
            >
              <RotateCcw className={`w-3 h-3 ${spinning ? "animate-spin" : ""}`} />
              Auto-Spin
            </button>
            <button onClick={onClose} className="text-white/20 hover:text-white/50"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex gap-0">
          {/* Main image */}
          <div className="flex-1 relative">
            <div className="aspect-video bg-black/40 relative overflow-hidden">
              {current.imageUrl ? (
                <img
                  src={current.imageUrl}
                  alt={current.label}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-16 h-16 text-white/10" />
                </div>
              )}
              {/* Overlay UI */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Corner brackets */}
                {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2",
                  "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"].map((cls) => (
                  <div key={cls} className={`absolute w-6 h-6 border-violet-400/60 ${cls}`} />
                ))}
              </div>
              {/* Angle label */}
              <div className="absolute bottom-3 left-3">
                <span className="text-[10px] px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-violet-300 font-mono font-medium">
                  {current.label} · {current.angle}°
                </span>
              </div>
              {/* Capture time */}
              {current.capturedAt && (
                <div className="absolute top-3 right-3">
                  <span className="text-[9px] px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-medium">
                    ✓ Captured
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Positions sidebar */}
          <div className="w-48 border-l border-white/8 bg-black/20">
            <div className="p-3 border-b border-white/8">
              <p className="text-[9px] text-white/25 uppercase tracking-wider">Scan Positions</p>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                {scan.completedPositions}/{scan.totalPositions} complete
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {scan.positions.map((pos, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePos(idx)}
                  className={`w-full flex items-center gap-2 p-2.5 text-left transition-colors ${
                    activePos === idx ? "bg-violet-500/10" : "hover:bg-white/[0.03]"
                  }`}
                >
                  {pos.imageUrl && (
                    <div className="w-10 h-7 rounded overflow-hidden shrink-0">
                      <img src={pos.imageUrl} alt={pos.label} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-white/70 truncate">{pos.label}</p>
                    <p className="text-[9px] text-white/25 font-mono">{pos.angle}°</p>
                  </div>
                  {pos.capturedAt
                    ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    : <div className="w-3 h-3 rounded-full border border-white/15 shrink-0" />
                  }
                </button>
              ))}
            </div>

            {/* Hash */}
            {scan.sha256Hash && (
              <div className="p-3 border-t border-white/8">
                <p className="text-[8px] text-white/15 uppercase tracking-wider mb-1">Scan Hash</p>
                <p className="font-mono text-[8px] text-emerald-400/40 break-all">
                  {scan.sha256Hash.slice(0, 24)}…
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="p-3 border-t border-white/8 flex items-center justify-center gap-1.5">
          {scan.positions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActivePos(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                activePos === idx ? "bg-violet-400 w-4" : "bg-white/15 hover:bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AR Preview ───────────────────────────────────────────────────────────────
function ARPreview({ vehicleId, vehicleName, onClose }: {
  vehicleId: string; vehicleName: string; onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [rotationY, setRotationY] = useState(0);
  const [scanPct, setScanPct] = useState(0);
  const [scanning, setScanning] = useState(false);
  const dragRef = useRef<{ startX: number; startRot: number } | null>(null);

  // Camera images for the AR preview car
  const CAR_IMG = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80";

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setCameraError("Camera not available — showing preview mode");
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  const handlePlaceStart = () => {
    setScanning(true);
    setScanPct(0);
    let p = 0;
    const t = setInterval(() => {
      p += 4;
      setScanPct(p);
      if (p >= 100) {
        clearInterval(t);
        setScanning(false);
        setPlaced(true);
      }
    }, 40);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragRef.current = { startX: x, startRot: rotationY };
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragRef.current || !placed) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const delta = (x - dragRef.current.startX) * 0.4;
    setRotationY(dragRef.current.startRot + delta);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Camera / background */}
      <div className="absolute inset-0 bg-[#0a1008]">
        {/* Real camera feed */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          style={{ opacity: cameraActive ? 1 : 0 }}
        />
        {/* Fallback driveway background */}
        {!cameraActive && (
          <div className="absolute inset-0" style={{
            background: "linear-gradient(180deg, #1a2a1a 0%, #2d3d2d 30%, #3d4a2d 50%, #4a5a3d 70%, #2a3a2a 100%)",
          }}>
            {/* Ground grid perspective */}
            <div className="absolute inset-0" style={{
              background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px)",
              transform: "perspective(400px) rotateX(60deg) translateY(20%)",
              transformOrigin: "center bottom",
            }} />
          </div>
        )}
      </div>

      {/* Scan overlay while placing */}
      {scanning && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-4 border-emerald-400/30 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-emerald-400/60 rounded-2xl"
            style={{ boxShadow: "0 0 30px rgba(52,211,153,0.2)" }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Scan className="w-8 h-8 text-emerald-400 animate-pulse mx-auto mb-2" />
                <p className="text-xs text-emerald-400 font-medium">Scanning surface…</p>
              </div>
            </div>
            {/* Scan line */}
            <div className="absolute left-0 right-0 h-0.5 bg-emerald-400/80"
              style={{ top: `${scanPct}%`, boxShadow: "0 0 12px rgba(52,211,153,1)", transition: "top 0.1s" }} />
          </div>

          {/* Progress */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-64">
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-emerald-400 transition-all" style={{ width: `${scanPct}%` }} />
            </div>
            <p className="text-center text-xs text-emerald-400/70 mt-2 font-medium">Detecting ground plane…</p>
          </div>
        </div>
      )}

      {/* AR Car overlay */}
      {placed && (
        <div
          className="absolute bottom-0 left-0 right-0 flex justify-center items-end pb-20 select-none"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={() => { dragRef.current = null; }}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={() => { dragRef.current = null; }}
        >
          {/* Ground shadow */}
          <div className="absolute bottom-16 w-96 h-16 rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)" }} />

          {/* Car image with 3D perspective */}
          <div style={{
            transform: `perspective(800px) rotateY(${rotationY}deg)`,
            transformOrigin: "center bottom",
            filter: "drop-shadow(0 30px 30px rgba(0,0,0,0.8))",
            animation: "float-car 3s ease-in-out infinite",
            cursor: "grab",
          }}>
            <img
              src={CAR_IMG}
              alt={vehicleName}
              className="w-96 object-contain"
              draggable={false}
              style={{ maxHeight: "220px", objectFit: "contain" }}
            />
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 border border-white/10 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-white font-medium">{vehicleName}</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/25">IN YOUR DRIVEWAY</span>
            </div>
            <p className="text-[10px] text-white/30 mt-1.5">Drag to rotate · {Math.abs(rotationY).toFixed(0)}°</p>
          </div>
        </div>
      )}

      {/* Corner brackets when camera active */}
      {cameraActive && !placed && !scanning && (
        <div className="absolute inset-0 pointer-events-none">
          {["top-4 left-4 border-t-2 border-l-2", "top-4 right-4 border-t-2 border-r-2",
            "bottom-24 left-4 border-b-2 border-l-2", "bottom-24 right-4 border-b-2 border-r-2"].map((cls) => (
            <div key={cls} className={`absolute w-8 h-8 border-white/30 ${cls}`} />
          ))}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-white/20 border-dashed flex items-center justify-center mx-auto mb-3 animate-spin" style={{ animationDuration: "8s" }}>
              <div className="w-3 h-3 rounded-full bg-white/30" />
            </div>
            <p className="text-white/50 text-xs">Point at a flat surface</p>
          </div>
        </div>
      )}

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <MonitorSmartphone className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-wider">3C AR Preview</p>
              <p className="text-xs text-white font-semibold">{vehicleName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${cameraActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <p className="text-[10px] text-white/40">{cameraActive ? "LIVE CAMERA" : "PREVIEW MODE"}</p>
          </div>
        </div>
      </div>

      {/* Camera error notice */}
      {cameraError && (
        <div className="absolute top-16 left-4 right-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-400/80">{cameraError}</p>
          </div>
        </div>
      )}

      {/* Bottom action buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        {!placed && !scanning && (
          <button
            onClick={handlePlaceStart}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base transition-colors flex items-center justify-center gap-2.5"
            style={{ boxShadow: "0 0 30px rgba(52,211,153,0.3)" }}
          >
            <Scan className="w-5 h-5" />
            Place Car in Driveway
          </button>
        )}
        {placed && (
          <button
            onClick={() => { setPlaced(false); setRotationY(0); }}
            className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-white/10"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Placement
          </button>
        )}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors backdrop-blur-sm"
      >
        <X className="w-4 h-4" />
      </button>

      <style>{`
        @keyframes float-car {
          0%, 100% { transform: perspective(800px) rotateY(var(--ry, 0deg)) translateY(0px); }
          50% { transform: perspective(800px) rotateY(var(--ry, 0deg)) translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

// ─── Claim Modal ──────────────────────────────────────────────────────────────
const DEMO_VEHICLES = [
  { id: "task-005", name: "2022 Lamborghini Huracán EVO", vin: "ZHWUC4ZF7MLA13902", color: "Arancio Borealis", year: 2022, origin: "Scottsdale, AZ", destination: "Las Vegas, NV", miles: 285 },
  { id: "task-006", name: "2023 Maserati MC20", vin: "ZAM44XSAXP0409812", color: "Bianco Audace", year: 2023, origin: "Dallas, TX", destination: "Houston, TX", miles: 239 },
  { id: "new-001", name: "2024 Ferrari SF90 Stradale", vin: "ZFF95NJA1N0261983", color: "Rosso Corsa", year: 2024, origin: "Beverly Hills, CA", destination: "San Diego, CA", miles: 122 },
];

function ClaimModal({ carriers, onClose, onClaimed }: {
  carriers: Carrier[];
  onClose: () => void;
  onClaimed: (bol: BOL) => void;
}) {
  const [step, setStep] = useState<"vehicle" | "carrier" | "processing" | "done">("vehicle");
  const [selectedVehicle, setSelectedVehicle] = useState(DEMO_VEHICLES[0]);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [result, setResult] = useState<BOL | null>(null);

  const processClaim = async () => {
    setStep("processing");
    const res = await fetch("/api/dropship/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        vehicleVin: selectedVehicle.vin,
        color: selectedVehicle.color,
        year: selectedVehicle.year,
        origin: selectedVehicle.origin,
        destination: selectedVehicle.destination,
        estimatedMiles: selectedVehicle.miles,
        carrierId: selectedCarrier!.id,
        runnerId: "runner-001",
        runnerName: "Marcus Webb",
      }),
    });
    const data = await res.json();
    setResult(data.bol);
    setStep("done");
    setTimeout(() => onClaimed(data.bol), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={step === "vehicle" ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a10] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        <div className="p-5 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Truck className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Claim & Route Vehicle</p>
              <p className="text-[10px] text-amber-400/60">Ship.cars / RunBuggy · Digital BOL</p>
            </div>
          </div>
          {step === "vehicle" && <button onClick={onClose} className="text-white/20 hover:text-white/50"><X className="w-4 h-4" /></button>}
        </div>

        <div className="p-5">
          {step === "vehicle" && (
            <>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Select Vehicle to Claim</p>
              <div className="space-y-2 mb-5">
                {DEMO_VEHICLES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      selectedVehicle.id === v.id ? "border-amber-500/40 bg-amber-500/8" : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{v.name}</p>
                        <p className="text-[10px] text-white/30">{v.color} · {v.origin} → {v.destination}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-white/40">{v.miles} mi</p>
                        {selectedVehicle.id === v.id && <CheckCircle2 className="w-4 h-4 text-amber-400 ml-auto mt-1" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep("carrier")}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                Select Carrier <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === "carrier" && (
            <>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Choose Carrier</p>
              <div className="space-y-2 mb-5">
                {carriers.filter((c) => c.available).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCarrier(c)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedCarrier?.id === c.id ? "border-amber-500/40 bg-amber-500/8" : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <p className="text-xs font-black text-amber-400">{c.logo}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{c.name}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                            c.type === "enclosed" ? "text-violet-400 border-violet-500/25 bg-violet-500/5" : "text-blue-400 border-blue-500/25 bg-blue-500/5"
                          }`}>{c.type.toUpperCase()}</span>
                        </div>
                        <p className="text-[10px] text-white/35 mt-0.5">
                          ★ {c.rating} · {c.transitDays}d transit · ${c.ratePerMile}/mi · ${(c.insurance/1000).toFixed(0)}K insured
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-amber-400">${Math.round(selectedVehicle.miles * c.ratePerMile).toLocaleString()}</p>
                        <p className="text-[10px] text-white/25">est. cost</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                disabled={!selectedCarrier}
                onClick={processClaim}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate Digital BOL
              </button>
            </>
          )}

          {step === "processing" && (
            <div className="py-10 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="w-16 h-16 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                <FileText className="w-5 h-5 text-amber-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-white font-semibold mb-1">Generating BOL…</p>
              <div className="space-y-1 mt-3 text-left max-w-xs mx-auto">
                {["Assigning carrier route…", "Computing SHA-256 tamper seal…", "Generating digital signature…", "Issuing Bill of Lading…"].map((msg, i) => (
                  <div key={msg} className="flex items-center gap-2 text-xs" style={{ opacity: 0.3 + i * 0.15 }}>
                    <Loader2 className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
                    <span className="text-white/40">{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "done" && result && (
            <div className="py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-400/40 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-emerald-400 font-bold text-base mb-1">BOL Generated!</p>
              <p className="font-mono text-white/60 text-sm">{result.bolNumber}</p>
              <p className="text-xs text-white/30 mt-1">via {result.carrierName} · {result.estimatedTransitDays}d transit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DropshipPage() {
  const [tab, setTab] = useState<"shipments" | "claim">("shipments");
  const [shipments, setShipments] = useState<BOL[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [stats, setStats] = useState({ total: 0, inTransit: 0, delivered: 0, totalVolume: 0 });
  const [loading, setLoading] = useState(true);
  const [viewBol, setViewBol] = useState<BOL | null>(null);
  const [viewScan, setViewScan] = useState<VehicleScan | null>(null);
  const [viewAR, setViewAR] = useState<{ vehicleId: string; vehicleName: string } | null>(null);
  const [showClaim, setShowClaim] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [shipmentsRes, carriersRes] = await Promise.all([
        fetch("/api/dropship/shipments"),
        fetch("/api/dropship/carriers"),
      ]);
      if (shipmentsRes.ok) {
        const d = await shipmentsRes.json();
        setShipments(d.shipments ?? []);
        setStats(d.stats ?? {});
      }
      if (carriersRes.ok) {
        const d = await carriersRes.json();
        setCarriers(d.carriers ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openScan = async (vehicleId: string) => {
    const res = await fetch(`/api/dropship/scan/${vehicleId}`);
    if (res.ok) {
      const d = await res.json();
      setViewScan(d.scan);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={Truck}
        accent="#818CF8"
        title="DROPSHIP COORDINATOR"
        subtitle="Ship.cars · RunBuggy · Digital BOL · 360° Scan · AR Preview"
        badge={<span className="neural-badge neural-badge-violet">LOGISTICS BRIDGE</span>}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowClaim(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors">
              <Package className="w-3.5 h-3.5" />
              Claim Vehicle
            </button>
            <button onClick={fetchData} className="ai-btn-ghost">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        }
      />
      <div className="p-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active BOLs", value: stats.total, icon: FileText, color: "text-white" },
            { label: "In Transit", value: stats.inTransit, icon: Truck, color: "text-violet-400" },
            { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Total Volume", value: `$${stats.totalVolume.toLocaleString()}`, icon: Package, color: "text-amber-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Carrier status bar */}
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
          <p className="text-[10px] text-white/30 uppercase tracking-wider shrink-0">Connected Carriers</p>
          {carriers.map((c) => (
            <div key={c.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              c.available ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/8 bg-white/[0.02] opacity-40"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${c.available ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
              <p className={`text-xs font-semibold ${c.available ? "text-white" : "text-white/30"}`}>{c.name}</p>
              <span className="text-[9px] text-white/25">{c.type}</span>
              {c.available && <span className="text-[9px] text-emerald-400">LIVE</span>}
            </div>
          ))}
        </div>

        {/* Shipments list */}
        {loading ? (
          <div className="space-y-2">
            {[1,2].map((i) => <div key={i} className="h-28 rounded-xl bg-white/[0.02] border border-white/8 animate-pulse" />)}
          </div>
        ) : shipments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
            <Truck className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-white/25 text-sm">No active shipments</p>
            <p className="text-white/15 text-xs mt-1">Claim a vehicle to generate your first Bill of Lading</p>
            <button onClick={() => setShowClaim(true)} className="mt-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors">
              Claim First Vehicle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {shipments.map((bol) => {
              const sc = statusConfig[bol.status] ?? statusConfig.issued;
              return (
                <div key={bol.bolId} className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/12 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Carrier badge */}
                      <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <p className="text-[11px] font-black text-amber-400">{bol.carrierName.slice(0,2).toUpperCase()}</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-white truncate">{bol.vehicleName}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${sc.color} ${sc.bg} ${sc.border}`}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/30 mb-2">
                          <span className="font-mono">{bol.bolNumber}</span>
                          <span>·</span>
                          <span>{bol.carrierName}</span>
                          <span>·</span>
                          <span>{bol.runnerName}</span>
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-400/60" />
                            <span className="text-white/50">{bol.originCity}, {bol.originState}</span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-white/20" />
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400/60" />
                            <span className="text-white/50">{bol.destinationCity}, {bol.destinationState}</span>
                          </div>
                          <span className="text-white/20">·</span>
                          <span className="text-white/30">{bol.estimatedMiles} mi</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-amber-400">${bol.totalCost.toLocaleString()}</p>
                        <p className="text-[10px] text-white/25">ETA {fmt(bol.estimatedDelivery)}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                      <button
                        onClick={() => setViewBol(bol)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] text-white/60 text-[11px] transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        View BOL
                      </button>
                      {bol.scanAvailable && (
                        <button
                          onClick={() => openScan(bol.vehicleId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/8 border border-violet-500/15 hover:bg-violet-500/15 text-violet-400 text-[11px] transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          360° Scan
                        </button>
                      )}
                      <button
                        onClick={() => setViewAR({ vehicleId: bol.vehicleId, vehicleName: bol.vehicleName })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/8 border border-emerald-500/15 hover:bg-emerald-500/15 text-emerald-400 text-[11px] transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        AR Preview
                      </button>
                      <div className="flex-1" />
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-400/50" />
                        <p className="text-[9px] font-mono text-white/15">{bol.sha256Hash.slice(0,12)}…</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {viewBol && <BillOfLadingCard bol={viewBol} onClose={() => setViewBol(null)} />}
      {viewScan && <ScanViewer scan={viewScan} onClose={() => setViewScan(null)} />}
      {viewAR && (
        <ARPreview
          vehicleId={viewAR.vehicleId}
          vehicleName={viewAR.vehicleName}
          onClose={() => setViewAR(null)}
        />
      )}
      {showClaim && (
        <ClaimModal
          carriers={carriers}
          onClose={() => setShowClaim(false)}
          onClaimed={(bol) => {
            setShowClaim(false);
            setShipments((prev) => [bol, ...prev]);
            setViewBol(bol);
          }}
        />
      )}
    </div>
  );
}
