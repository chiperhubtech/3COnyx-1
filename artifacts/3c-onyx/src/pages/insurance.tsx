import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { Shield, ShieldCheck, Star, Zap, ChevronRight, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Quote = {
  provider: string;
  plan: string;
  monthly_premium: number;
  annual_premium: number;
  coverage_limit: number;
  deductible: number;
  rating: number;
  features: string[];
  recommended: boolean;
};

type Policy = {
  id: string;
  provider: string;
  plan: string;
  vin_masked: string;
  vehicle: string;
  status: string;
  monthly_premium: number;
  coverage_limit: number;
  expires_at: string;
  next_payment: string;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function Insurance() {
  const [vin, setVin] = useState("WP1AF2A69NLA14821");
  const [make, setMake] = useState("Porsche");
  const [model, setModel] = useState("Cayenne Turbo S E-Hybrid");
  const [year, setYear] = useState("2023");
  const [quoteVin, setQuoteVin] = useState("");

  const { data: policies } = useQuery<{ policies: Policy[]; total_monthly: number; simulated: boolean }>({
    queryKey: ["insuremo-policies"],
    queryFn: () => fetch(`${BASE}/api/insuremo/policies`).then((r) => r.json()),
  });

  const quoteMutation = useMutation({
    mutationFn: ({ v, y, mk, mo }: { v: string; y: string; mk: string; mo: string }) =>
      fetch(`${BASE}/api/insuremo/quote?vin=${v}&year=${y}&make=${mk}&model=${mo}`).then((r) => r.json()),
  });

  const handleGetQuotes = () => {
    setQuoteVin(vin);
    quoteMutation.mutate({ v: vin, y: year, mk: make, mo: model });
  };

  const quotes: Quote[] = quoteMutation.data?.quotes ?? [];

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: "linear-gradient(135deg, #06060a 0%, #080a08 100%)" }}>
      <PageHeader
        icon={Shield}
        accent="#34D399"
        title="INSURANCE HUB"
        badge={<span className="neural-badge neural-badge-green">INSUREMO</span>}
      />

      <LegalDisclaimer type="insurance" />

      {/* Active Policies */}
      <div>
        <h2 className="section-label mb-3">ACTIVE POLICIES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(policies?.policies ?? []).map((pol) => (
            <div key={pol.id} className="ai-card p-5 neural-glow-green group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#34D399", letterSpacing: "0.08em" }}>{pol.provider}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{pol.plan}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
                  <span style={{ fontSize: "9px", color: "#34D399", fontWeight: 700, letterSpacing: "0.15em" }}>{pol.status.toUpperCase()}</span>
                </div>
              </div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "12px" }}>
                {pol.vehicle}
              </p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "2px" }}>VIN {pol.vin_masked}</p>
              <div className="flex items-end justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>MONTHLY PREMIUM</p>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 800, color: "#34D399" }}>{fmt(pol.monthly_premium)}</p>
                </div>
                <div className="text-right">
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>COVERAGE</p>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{fmt(pol.coverage_limit)}</p>
                </div>
              </div>
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", marginTop: "6px" }}>
                Next payment {pol.next_payment} · Expires {pol.expires_at}
              </p>
            </div>
          ))}
        </div>
        {policies?.total_monthly && (
          <div className="mt-2 flex items-center gap-2">
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Total monthly: </p>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 700, color: "#34D399" }}>{fmt(policies.total_monthly)}/mo</p>
          </div>
        )}
      </div>

      {/* Get New Quotes */}
      <div>
        <h2 className="section-label mb-3">GET INSTANT QUOTES</h2>
        <div className="ai-card p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "VIN", value: vin, onChange: setVin, placeholder: "17-char VIN" },
              { label: "Year", value: year, onChange: setYear, placeholder: "2023" },
              { label: "Make", value: make, onChange: setMake, placeholder: "Porsche" },
              { label: "Model", value: model, onChange: setModel, placeholder: "Cayenne" },
            ].map(({ label, value, onChange, placeholder }) => (
              <div key={label}>
                <p className="section-label mb-1.5" style={{ fontSize: "9px" }}>{label}</p>
                <input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.85)",
                    outline: "none",
                    fontFamily: "Inter, sans-serif",
                  }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleGetQuotes}
            disabled={quoteMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: quoteMutation.isPending ? "rgba(52,211,153,0.08)" : "rgba(52,211,153,0.15)",
              border: "1px solid rgba(52,211,153,0.3)",
              color: "#34D399",
            }}
          >
            {quoteMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {quoteMutation.isPending ? "Scanning 12 carriers…" : "Get AI-Ranked Quotes"}
          </button>
        </div>
      </div>

      {/* Quote Results */}
      {quotes.length > 0 && (
        <div>
          <h2 className="section-label mb-3">RANKED QUOTES — {make} {model} ({year})</h2>
          <div className="space-y-3">
            {quotes.map((q, i) => (
              <div key={q.provider} className={`ai-card p-5 transition-all ${q.recommended ? "neural-glow-green" : ""}`} style={{ border: q.recommended ? "1px solid rgba(52,211,153,0.25)" : undefined }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-black" style={{ background: q.recommended ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)", color: q.recommended ? "#34D399" : "rgba(255,255,255,0.3)" }}>
                      #{i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{q.provider}</p>
                        {q.recommended && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                            AI RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{q.plan}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className="w-3 h-3" style={{ color: i < Math.floor(q.rating) ? "#C9A227" : "rgba(255,255,255,0.1)", fill: i < Math.floor(q.rating) ? "#C9A227" : "transparent" }} />
                        ))}
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginLeft: "4px" }}>{q.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", fontWeight: 900, color: q.recommended ? "#34D399" : "#C9A227" }}>
                      {fmt(q.monthly_premium)}<span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/mo</span>
                    </p>
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>{fmt(q.annual_premium)}/yr</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>COVERAGE</p>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{fmt(q.coverage_limit)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>DEDUCTIBLE</p>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: q.deductible === 0 ? "#34D399" : "rgba(255,255,255,0.7)" }}>
                      {q.deductible === 0 ? "$0" : fmt(q.deductible)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-2">
                    {q.features.map((f) => (
                      <span key={f} className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: "9px", color: "rgba(255,255,255,0.45)" }}>
                        <CheckCircle className="w-2.5 h-2.5" style={{ color: "#34D399" }} />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2" style={{ background: q.recommended ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${q.recommended ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.08)"}`, color: q.recommended ? "#34D399" : "rgba(255,255,255,0.5)" }}>
                  <ShieldCheck className="w-4 h-4" /> Bind Coverage via 3C Concierge
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
