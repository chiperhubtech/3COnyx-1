/**
 * AUTHOR_ID:     Ronald Antonio Cadet
 * ENTITY:        CUXTOMCANDYCLUB LLC
 * STATUS:        SOVEREIGN_OWNER
 * DISTRIBUTION:  PROHIBITED
 *
 * ONYX Shield — Platform Security Intelligence Dashboard
 * ───────────────────────────────────────────────────────
 * Draws from:
 *   CrowdStrike (threat intelligence posture)
 *   Okta (identity security overview)
 *   Cloudflare (network-level protection status)
 *   Palo Alto Networks (security layer visualization)
 *
 * Member never sees this. Founder only.
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, ShieldCheck, ShieldAlert, Lock, Eye,
  AlertTriangle, Ban, Zap, Globe, Server,
  CheckCircle2, Activity, Fingerprint, Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface ShieldStats {
  platformStatus: string;
  owner: string;
  securityLayers: { layer: string; status: string; description: string }[];
  threatIntelligence: {
    totalTracked: number;
    currentlyBanned: number;
    permanentBans: number;
    top5Threats: {
      ip: string;
      failedAuths: number;
      scanAttempts: number;
      rateLimitHits: number;
      banned: boolean;
      reason: string | null;
      lastSeen: string;
    }[];
  };
  timestamp: string;
}

function usePulse() {
  const [tick, setTick] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => !v), 1400);
    return () => clearInterval(t);
  }, []);
  return tick;
}

export default function OnyxShield() {
  const pulse = usePulse();

  const { data, isLoading, refetch } = useQuery<ShieldStats>({
    queryKey: ["shield-stats"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/sovereignty/shield`, { credentials: "include" });
      if (!r.ok) throw new Error("Access denied");
      return r.json();
    },
    refetchInterval: 15_000,
  });

  const { data: declaration } = useQuery({
    queryKey: ["sovereignty-declaration"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/sovereignty`, { credentials: "include" });
      return r.json();
    },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-8 max-w-6xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${pulse ? "bg-green-400" : "bg-green-600"} transition-colors`} />
            <span className="text-xs tracking-[0.3em] text-green-400 uppercase font-mono">
              ALL SYSTEMS SOVEREIGN
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            <span className="text-white">ONYX</span>{" "}
            <span className="text-[#C9A84C]">SHIELD</span>
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Platform Security Intelligence — Founder Command Only
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500 font-mono">
            {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : "—"}
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs text-[#C9A84C] hover:text-yellow-300 mt-1"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ── Key Metrics ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Security Layers",
            value: data?.securityLayers.length ?? 10,
            icon: Layers,
            color: "text-[#C9A84C]",
            sub: "All active",
          },
          {
            label: "IPs Tracked",
            value: data?.threatIntelligence.totalTracked ?? 0,
            icon: Eye,
            color: "text-blue-400",
            sub: "Real time",
          },
          {
            label: "Active Bans",
            value: data?.threatIntelligence.currentlyBanned ?? 0,
            icon: Ban,
            color: "text-red-400",
            sub: "Temporary",
          },
          {
            label: "Permanent Bans",
            value: data?.threatIntelligence.permanentBans ?? 0,
            icon: ShieldAlert,
            color: "text-orange-400",
            sub: "No re-entry",
          },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <Card key={label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-widest">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className={`text-3xl font-black ${color}`}>{value}</div>
              <div className="text-xs text-zinc-600 mt-1">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Security Layers ───────────────────────────────────────── */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-[#C9A84C]" />
            Security Architecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-zinc-500 text-sm">Loading security layers...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data?.securityLayers.map((layer) => (
                <div
                  key={layer.layer}
                  className="flex items-start gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white">{layer.layer}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{layer.description}</div>
                  </div>
                  <Badge className="ml-auto bg-green-900/40 text-green-400 border-green-800 text-xs">
                    {layer.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Threat Intelligence ───────────────────────────────────── */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-widest">
            <Activity className="w-4 h-4 text-red-400" />
            Threat Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.threatIntelligence.top5Threats?.length ? (
            <div className="text-zinc-500 text-sm py-2">No threats detected. Platform is clean.</div>
          ) : (
            <div className="space-y-3">
              {data.threatIntelligence.top5Threats.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 bg-zinc-950 rounded-lg border border-zinc-800"
                >
                  <div className="font-mono text-sm text-zinc-400 w-32">{t.ip}</div>
                  <div className="flex gap-4 flex-1">
                    <div className="text-center">
                      <div className="text-xs text-zinc-600">Auth Fails</div>
                      <div className="text-sm font-bold text-red-400">{t.failedAuths}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-600">Probes</div>
                      <div className="text-sm font-bold text-orange-400">{t.scanAttempts}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-600">Rate Hits</div>
                      <div className="text-sm font-bold text-yellow-400">{t.rateLimitHits}</div>
                    </div>
                  </div>
                  {t.banned && (
                    <Badge className="bg-red-900/40 text-red-400 border-red-800 text-xs">BANNED</Badge>
                  )}
                  <div className="text-xs text-zinc-600 font-mono">
                    {new Date(t.lastSeen).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Sovereignty Fingerprint ───────────────────────────────── */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-widest">
            <Fingerprint className="w-4 h-4 text-[#C9A84C]" />
            Sovereignty Fingerprint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {declaration && [
              { label: "Owner", value: declaration.owner },
              { label: "Entity", value: declaration.entity },
              { label: "Platform", value: declaration.platform },
              { label: "Genesis", value: declaration.genesis },
              { label: "Status", value: declaration.status },
              { label: "Distribution", value: declaration.distribution },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">{label}</span>
                <span className="text-zinc-200 font-mono text-xs text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
          {declaration?.fingerprint && (
            <div className="mt-4 p-3 bg-black rounded-lg border border-[#C9A84C]/20">
              <div className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">Fingerprint Token</div>
              <div className="font-mono text-xs text-[#C9A84C] break-all">{declaration.fingerprint}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Legal Armor ───────────────────────────────────────────── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-widest">
            <Lock className="w-4 h-4 text-[#C9A84C]" />
            Legal Armor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {declaration?.applicableLaw?.map((law: string) => (
              <div
                key={law}
                className="flex items-center gap-3 text-sm text-zinc-400 p-2 bg-zinc-950 rounded border border-zinc-800"
              >
                <Shield className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />
                {law}
              </div>
            ))}
            <div className="mt-4 text-xs text-zinc-600 leading-relaxed">
              {declaration?.legalNotice}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="mt-8 text-center text-xs text-zinc-700 font-mono">
        3C ONYX — CUXTOMCANDYCLUB LLC — SOVEREIGN ACTIVE — UNAUTHORIZED ACCESS PROSECUTED
      </div>
    </div>
  );
}
