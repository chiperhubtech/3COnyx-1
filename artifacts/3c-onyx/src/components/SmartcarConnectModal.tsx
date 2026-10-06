import { useState } from "react";
import { Loader2, Shield, X } from "lucide-react";
import { garageApi } from "@/lib/garage-api";

export function SmartcarConnectModal({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function connect() {
    setBusy(true); setError("");
    try {
      const data = await garageApi<{ connectUrl: string }>("/connect", { method: "POST" });
      const url = new URL(data.connectUrl);
      if (url.origin !== "https://connect.smartcar.com") throw new Error("Invalid Smartcar connection URL.");
      window.location.assign(url.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
      setBusy(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="smartcar-title">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--onyx-surface)] p-5 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 id="smartcar-title" className="text-white font-semibold">Connect with Smartcar</h2>
          <button aria-label="Close" disabled={busy} onClick={onClose} className="text-white/60"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-white/70 mb-4">Choose your vehicle brand and sign in to its connected-services account on Smartcar. Your vehicle password is never shared with 3C ONYX.</p>
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 mb-4">
          <p className="flex gap-2 items-center text-emerald-400 text-sm"><Shield className="w-4 h-4" /> Read-only permissions</p>
          <p className="text-xs text-white/60 mt-2">Vehicle information, odometer, fuel and battery. Availability depends on your vehicle and the permissions you approve. You can disconnect at any time.</p>
        </div>
        {error && <p role="alert" className="text-sm text-red-300 mb-3">{error}</p>}
        <button disabled={busy} onClick={connect} className="w-full flex justify-center items-center gap-2 py-2.5 rounded-lg bg-amber-500 text-black font-semibold disabled:opacity-50">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? "Opening Smartcar…" : "Continue to Smartcar"}
        </button>
      </div>
    </div>
  );
}
