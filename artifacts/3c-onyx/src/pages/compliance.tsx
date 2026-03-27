/**
 * 3C Onyx Web — Sovereign Shield Compliance Dashboard
 * IRS/FinCEN 1099-K status, KYC verification matrix, Digital Charter
 * signatures, IP Anchor registry, and Disaster Recovery status.
 * Admin only — /compliance
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, Award, CheckCircle2, Clock, Download,
  FileText, Fingerprint, Hash, Lock, RefreshCw, Shield,
  TrendingUp, User, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function apiFetch<T>(path: string): Promise<T> {
  return fetch(`${BASE}/api${path}`, { credentials: "include" }).then(r => {
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json() as Promise<T>;
  });
}

type TaxEntry = { userId: number; annualNetCents: number; annualNetUsd: string; threshold1099Reached: boolean; requiresW9: boolean };
type IpAnchor = { id: number; title: string; assetType: string; anchoredAt: string; assignee: string; anchorHash: string; contentHash: string };
type BackupStatus = { strategy: string; encryptionAlgo: string; zeroKnowledge: boolean; retentionDays: number; lastBackup: string; nextBackup: string; status: string };

function SectionHeader({ icon: Icon, title, sub }: { icon: React.FC<{ size?: number; className?: string }>; title: string; sub: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 rounded-xl bg-[#C9A227]/10">
          <Icon size={16} className="text-[#C9A227]" />
        </div>
        <h2 className="text-lg font-black tracking-tight text-white">{title}</h2>
      </div>
      <p className="text-xs text-zinc-500 ml-11">{sub}</p>
    </div>
  );
}

export default function ComplianceDashboard() {
  const [activeTab, setActiveTab] = useState<"1099" | "kyc" | "charter" | "ip" | "backup">("1099");

  const { data: taxes, isLoading: taxLoad, refetch: reTax } = useQuery<{ eligible: TaxEntry[]; total: number; taxYear: number }>({
    queryKey: ["compliance-1099"],
    queryFn:  () => apiFetch("/compliance/1099"),
    retry: false,
  });

  const { data: ipData, isLoading: ipLoad } = useQuery<{ anchors: IpAnchor[]; total: number }>({
    queryKey: ["ip-anchors"],
    queryFn:  () => apiFetch("/ip/anchors?limit=100"),
    retry: false,
  });

  const { data: backup, isLoading: backupLoad } = useQuery<BackupStatus>({
    queryKey: ["backup-status"],
    queryFn:  () => apiFetch("/compliance/backup/status"),
    retry: false,
  });

  const TABS = [
    { id: "1099",    label: "1099-K",      icon: TrendingUp },
    { id: "kyc",     label: "KYC Gate",    icon: Fingerprint },
    { id: "charter", label: "Charter",     icon: FileText },
    { id: "ip",      label: "IP Anchors",  icon: Hash },
    { id: "backup",  label: "Recovery",    icon: Lock },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-20">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-5 sticky top-0 bg-[#0A0A0B]/90 backdrop-blur-lg z-10">
        <div className="flex items-center gap-3 mb-1">
          <Shield size={16} className="text-[#C9A227]" />
          <span className="text-xs text-[#C9A227] font-bold tracking-widest uppercase">Sovereign Shield</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">Compliance & Governance</h1>
        <p className="text-xs text-zinc-500 mt-1">IRS/FinCEN · KYC · Digital Charter · IP Anchoring · Disaster Recovery</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-hide">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                activeTab === t.id
                  ? "bg-[#C9A227] text-black border-[#C9A227]"
                  : "bg-white/5 text-zinc-400 hover:text-white border-white/5 hover:border-white/10",
              )}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── 1099-K ── */}
        {activeTab === "1099" && (
          <div className="space-y-6">
            <SectionHeader
              icon={TrendingUp}
              title={`1099-K Reporting — ${taxes?.taxYear ?? new Date().getFullYear()}`}
              sub="IRS requires a 1099-K for any member with $600+ in annual platform slice/dividend payouts."
            />
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">1099-K Eligible</p>
                <p className="text-3xl font-black text-red-400">{taxLoad ? "…" : (taxes?.total ?? 0)}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Threshold</p>
                <p className="text-3xl font-black text-[#C9A227]">$600</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Status</p>
                <p className="text-3xl font-black text-emerald-400">Live</p>
              </div>
            </div>
            {taxLoad ? (
              <div className="rounded-2xl border border-white/5 p-12 text-center"><TrendingUp size={24} className="mx-auto text-zinc-700 animate-pulse" /></div>
            ) : taxes && taxes.eligible.length > 0 ? (
              <div className="rounded-2xl border border-white/5 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">1099-K Eligible Members</p>
                  <button onClick={() => void reTax()} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white">
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/5 bg-white/[0.01]">
                    {["User ID", "Annual Net", "W9 Required", "Action"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-600">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {taxes.eligible.map(e => (
                      <tr key={e.userId} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-mono text-zinc-400">#{e.userId}</td>
                        <td className="px-4 py-3 font-bold text-white">{e.annualNetUsd}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400">W9 REQUIRED</span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-xs text-[#C9A227] hover:underline flex items-center gap-1">
                            <Download size={11} /> Download 1099-K
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                <p className="text-sm text-zinc-500 mt-3">No members have exceeded the $600 threshold yet.</p>
              </div>
            )}
            <div className="rounded-2xl border border-[#C9A227]/20 bg-[#C9A227]/5 p-5 flex gap-4">
              <AlertTriangle size={18} className="text-[#C9A227] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#C9A227] mb-1">Automated 1099-K Logic Active</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Every pay-at-the-bay payout, member slice, and runner dividend is tracked in real-time against the $600 IRS threshold.
                  When a member hits that threshold, the platform automatically flags their record and triggers the W9 collection workflow.
                  Encrypted Tax IDs (AES-256-GCM) are collected and stored in compliance with IRS/FinCEN Publication 1220.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── KYC ── */}
        {activeTab === "kyc" && (
          <div className="space-y-6">
            <SectionHeader icon={Fingerprint} title="ONYX Identity Gate" sub="Required for Dynasty Wallet access above $600/year. ONYX dual-layer identity verification — document + financial." />
            <div className="grid grid-cols-2 gap-6">
              {[
                { title: "ONYX Document Verification", badge: "CONFIGURED", color: "emerald", items: ["Document type: DL / Passport / Government ID", "Live capture + selfie match required", "CCPA / GDPR compliant", "Documents never stored by 3C ONYX", "Real-time identity confirmation"] },
                { title: "ONYX Financial Verification", badge: "AVAILABLE",  color: "blue",    items: ["Bank account ownership verification", "Real-name matching against financial records", "SSN partial match (last 4 only)", "Secure integration with ONYX Finance Hub", "Layered with Document Verification for dual-layer KYC"] },
              ].map(col => (
                <div key={col.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">{col.title}</h3>
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-lg border", col.color === "emerald" ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-blue-400/10 border-blue-400/20 text-blue-400")}>{col.badge}</span>
                  </div>
                  <ul className="space-y-2">
                    {col.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs text-zinc-400">
                        <CheckCircle2 size={12} className={cn("mt-0.5 shrink-0", col.color === "emerald" ? "text-emerald-500" : "text-blue-500")} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">KYC Gate Logic</p>
              {[
                { tier: "Under $600/yr",    gate: "None",                 color: "text-emerald-400" },
                { tier: "$600+ / yr",       gate: "ONYX Identity KYC",         color: "text-yellow-400" },
                { tier: "B2B Underwriting", gate: "ONYX Dual-Layer Verification", color: "text-red-400"    },
                { tier: "Admin Actions",    gate: "Admin PIN + KYC",      color: "text-purple-400" },
              ].map(row => (
                <div key={row.tier} className="flex justify-between items-center py-2.5 border-b border-white/5">
                  <span className="text-sm text-zinc-400">{row.tier}</span>
                  <span className={cn("text-sm font-bold", row.color)}>{row.gate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Charter ── */}
        {activeTab === "charter" && (
          <div className="space-y-6">
            <SectionHeader icon={FileText} title="Smart Membership Agreement — Digital Charter v1.0.0-2026" sub="Every member digitally signs this Charter during onboarding. Signatures are SHA-256 anchored and immutable." />
            <div className="rounded-2xl border border-[#C9A227]/20 bg-[#C9A227]/5 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227] mb-4">Charter Provisions</p>
              {[
                { num: "§1", title: "Member Slice Designation", body: "All platform-generated loyalty credits, referral commissions, runner dividends, and slice payouts distributed through 3C ONYX are legally classified as loyalty dividends under the CUXTOMCANDYCLUB LLC Loyalty Program, not wages, salaries, or employment income. Members are independent participants, not employees or contractors." },
                { num: "§2", title: "Data Sovereignty", body: "CUXTOMCANDYCLUB LLC will never sell, broker, or license your personal data to third parties. You retain ownership of all data you create on the platform. The platform holds a limited, non-exclusive, royalty-free license to process your data solely to provide platform services." },
                { num: "§3", title: "Intellectual Property", body: "All ONYX AI interactions, 7-Agent Mesh outputs, AR anchors, and algorithmic decisions generated within the platform are the exclusive intellectual property of CUXTOMCANDYCLUB LLC, protected by Proof-of-Invention anchoring." },
                { num: "§4", title: "Financial Compliance", body: "Members with annual slice/dividend income exceeding $600 USD consent to platform reporting to the IRS per Form 1099-K requirements and agree to provide a valid W9 upon request. Tax ID submission is encrypted (AES-256-GCM) and stored zero-knowledge." },
                { num: "§5", title: "Dispute Resolution", body: "Disputes are resolved through binding arbitration under the rules of the American Arbitration Association in Florida. Class action lawsuits are expressly waived." },
              ].map(p => (
                <div key={p.num} className="mb-5">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-black text-[#C9A227]">{p.num}</span>
                    <span className="text-sm font-bold text-white">{p.title}</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed pl-6">{p.body}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Signature Verification</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Each charter signature is computed as: <span className="font-mono text-[#C9A227]">SHA-256(CHARTER | userId | version | acceptedAt | CUXTOMCANDYCLUB)</span>. 
                Signatures are stored in the <span className="font-mono text-white">member_charters</span> table with IP address (first two octets only — GDPR compliant), user agent, and acceptance timestamp. The signature hash is non-repudiable and tamper-evident.
              </p>
            </div>
          </div>
        )}

        {/* ── IP Anchors ── */}
        {activeTab === "ip" && (
          <div className="space-y-6">
            <SectionHeader icon={Hash} title="IP Anchor Registry — Proof of Invention" sub="Every AI interaction, AR anchor, and algorithm is timestamped to the chain. CUXTOMCANDYCLUB LLC retains all rights." />
            {ipLoad ? (
              <div className="rounded-2xl border border-white/5 p-12 text-center"><Hash size={24} className="mx-auto text-zinc-700 animate-pulse" /></div>
            ) : ipData && ipData.anchors.length > 0 ? (
              <div className="rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/5 bg-white/[0.02]">
                    {["#", "Type", "Title", "Assignee", "Hash", "Anchored"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-600">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {ipData.anchors.map(a => (
                      <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-zinc-600 text-xs">{a.id}</td>
                        <td className="px-4 py-3"><span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-lg border border-purple-400/20">{a.assetType}</span></td>
                        <td className="px-4 py-3 text-sm font-semibold text-white max-w-[200px] truncate">{a.title}</td>
                        <td className="px-4 py-3 text-xs text-[#C9A227]">{a.assignee}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500">{a.anchorHash.slice(0, 16)}…</td>
                        <td className="px-4 py-3 text-xs text-zinc-600">{new Date(a.anchoredAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
                <Hash size={24} className="mx-auto text-zinc-700" />
                <p className="text-sm text-zinc-600 mt-3">No IP anchors yet. Use <span className="font-mono text-zinc-400">POST /api/ip/anchor</span> to record your first invention.</p>
              </div>
            )}
            <div className="rounded-2xl border border-purple-400/20 bg-purple-400/5 p-5 flex gap-4">
              <Award size={18} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-purple-400 mb-1">IP Chain Integrity</p>
                <p className="text-xs text-zinc-500 leading-relaxed">Every anchor is chained to its predecessor using <span className="font-mono text-purple-300">SHA-256(contentHash | timestamp | previousHash | CUXTOMCANDYCLUB)</span>. This creates an unbroken chain-of-invention from GENESIS — legally admissible as prior art in US federal court and USPTO proceedings.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Backup/Recovery ── */}
        {activeTab === "backup" && (
          <div className="space-y-6">
            <SectionHeader icon={Lock} title="Disaster Recovery & Zero-Knowledge Encryption" sub="AES-256-GCM encrypted backups. Sensitive PII (Tax IDs, ITINs) invisible even in a breach." />
            {backupLoad ? (
              <div className="rounded-2xl border border-white/5 p-12 text-center"><Lock size={24} className="mx-auto text-zinc-700 animate-pulse" /></div>
            ) : backup ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Encryption",   value: backup.encryptionAlgo, color: "text-emerald-400" },
                    { label: "Zero-Knowledge",value: backup.zeroKnowledge ? "YES" : "NO", color: "text-emerald-400" },
                    { label: "Retention",    value: `${backup.retentionDays} days`, color: "text-[#C9A227]" },
                    { label: "Status",       value: backup.status, color: backup.status === "HEALTHY" ? "text-emerald-400" : "text-yellow-400" },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.025] p-5">
                      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{s.label}</p>
                      <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Backup Schedule</p>
                  <div className="flex justify-between"><span className="text-sm text-zinc-400">Strategy</span><span className="text-sm text-white">{backup.strategy}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-zinc-400">Last Run</span><span className="text-sm text-white">{backup.lastBackup}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-zinc-400">Next Run</span><span className="text-sm text-white">{backup.nextBackup}</span></div>
                </div>
              </>
            ) : null}
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5 flex gap-4">
              <Lock size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-400 mb-1">Zero-Knowledge Architecture</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Tax IDs, ITINs, and SSNs are encrypted before writing to PostgreSQL using AES-256-GCM with a unique 96-bit nonce per record. 
                  The encryption key lives only in <span className="font-mono text-white">ENCRYPTION_KEY</span> env secret — never in the database. 
                  Even a full DB dump exposes only ciphertext. Decryption requires the key + IV + auth tag — impossible to brute-force at 256-bit.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Sensitive Fields — Encrypted at Rest</p>
              {["user_tax_info.tax_id_encrypted (AES-256-GCM)", "kyc_verifications.stripe_verif_session_id", "users.stripe_customer_id (Stripe-tokenized)", "member_charters.ip_address (first 2 octets only — GDPR)"].map(f => (
                <div key={f} className="flex items-center gap-3 py-2 border-b border-white/5">
                  <Lock size={12} className="text-emerald-500" />
                  <span className="font-mono text-xs text-zinc-400">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
