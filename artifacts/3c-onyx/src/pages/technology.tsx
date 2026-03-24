/**
 * 3C Onyx — Technology & Architecture
 * Real stack depth, security layers, and system design — visible to any investor or CTO.
 */
import { Shield, Zap, Database, Lock, Brain, Globe, Server, Code2, CheckCircle2, TrendingUp } from "lucide-react";

const API_ROUTES = 48;
const WEB_PAGES = 45;
const DB_TABLES = 16;
const AI_MODELS = 3;

const STACK_LAYERS = [
  {
    tier: "PRESENTATION",
    color: "#34D399",
    components: [
      { name: "React 18 + Vite 7", note: "Sub-200ms HMR, code-split by route" },
      { name: "Expo / React Native", note: "iOS & Android from single codebase" },
      { name: "TypeScript (strict)", note: "100% typed across web, mobile, and API" },
      { name: "TailwindCSS + inline styles", note: "Dark-mode-first, zero FOUC" },
    ],
  },
  {
    tier: "API LAYER",
    color: "#C9A227",
    components: [
      { name: "Express 5 (beta)", note: "Native async/await, no callback hell" },
      { name: "48 REST endpoints", note: "Garage, blockchain, AI, growth, founding, wallet…" },
      { name: "WebSocket hub (/ws)", note: "Real-time delivery tracking & live alerts" },
      { name: "tRPC", note: "End-to-end type-safe RPC for internal calls" },
    ],
  },
  {
    tier: "SECURITY",
    color: "#F97316",
    components: [
      { name: "Helmet.js headers", note: "HSTS, XSS protection, CSP, referrer policy" },
      { name: "express-rate-limit", note: "Auth: 10 req/15 min · General: 200 req/15 min" },
      { name: "JWT (HS256, 7-day)", note: "jose library · server-side verification" },
      { name: "AES-256-GCM cipher", note: "PII masking on VINs, actor IDs, personal data" },
      { name: "Request timeout (15s)", note: "Protects against slow-loris and runaway queries" },
      { name: "CORS allowlist", note: "Origin-locked per environment" },
    ],
  },
  {
    tier: "BLOCKCHAIN",
    color: "#8B5CF6",
    components: [
      { name: "SHA-256 hash chain", note: "Each block hashes previous + all event fields" },
      { name: "HMAC-SHA-256 signing", note: "Every entry signed — tamper immediately detectable" },
      { name: "PostgreSQL persistence", note: "Chain survives restarts — loaded on boot" },
      { name: "Ethereum Sepolia anchoring", note: "Optional on-chain hash anchoring when ETH key set" },
      { name: "Public proof verifier", note: "GET /api/blockchain/proof/:hash — no auth required" },
    ],
  },
  {
    tier: "AI INTELLIGENCE",
    color: "#06B6D4",
    components: [
      { name: "Multi-model AI router", note: "Gemini 2.5 → GPT-4o → Claude 3.5 (waterfall fallback)" },
      { name: "ONYX AI Concierge", note: "Streaming SSE, intent routing, structured JSON output" },
      { name: "Consumer / Pro dual modes", note: "Persona-aware context injection per user segment" },
      { name: "Proactive Intelligence Engine", note: "Async analysis pipeline — alerts before you ask" },
      { name: "Enhance API (/api/enhance)", note: "On-demand AI explanation layer for recommendations" },
    ],
  },
  {
    tier: "DATA",
    color: "#EC4899",
    components: [
      { name: "PostgreSQL (Replit managed)", note: "16 tables, Drizzle ORM, full type inference" },
      { name: "Drizzle ORM", note: "Zero-overhead, SQL-first, full migration support" },
      { name: "NHTSA vPIC integration", note: "US gov VIN decode — real data, no API key" },
      { name: "Stripe Connect", note: "PCI Level 1 · webhooks · founding member payments" },
      { name: "Plaid (banking)", note: "Bank-grade financial data connectivity" },
    ],
  },
  {
    tier: "GROWTH ENGINE",
    color: "#F59E0B",
    components: [
      { name: "K-factor tracking", note: "Referral chain analytics — targets K > 1.0 (viral)" },
      { name: "analytics_events table", note: "Every funnel touch: page view → join → refer" },
      { name: "Founding member system", note: "$99 Stripe Checkout + referral code generation" },
      { name: "Viral profile pages (/m/:code)", note: "Personalized FOMO pages with reward tier display" },
      { name: "Ops dashboard (/growth)", note: "Live K-factor, runway calculator, 100M roadmap" },
    ],
  },
];

const SECURITY_CERTIFICATIONS = [
  { label: "PCI DSS Level 1", detail: "Via Stripe Connect — card data never touches our servers", icon: Shield },
  { label: "TLS 1.3 Everywhere", detail: "All traffic encrypted in transit, no downgrade allowed", icon: Lock },
  { label: "AES-256 at Rest", detail: "PII fields encrypted before DB write", icon: Database },
  { label: "Zero Mock Data to Users", detail: "No 'demo/simulated' language visible in any user flow", icon: CheckCircle2 },
];

const PERFORMANCE_TARGETS = [
  { metric: "API P95 Latency", value: "<120ms", sub: "Express 5 + connection pool" },
  { metric: "Cold Start", value: "<2s", sub: "ESBuild + node --enable-source-maps" },
  { metric: "AI Streaming TTFT", value: "<800ms", sub: "Gemini 2.5 Flash first token" },
  { metric: "WebSocket Reconnect", value: "<500ms", sub: "Auto-reconnect with exponential backoff" },
];

export default function TechnologyPage() {
  return (
    <div style={{ background: "#050508", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#fff" }}>

      {/* Header */}
      <div style={{
        padding: "64px 64px 40px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(180deg, rgba(52,211,153,0.04) 0%, transparent 100%)",
        maxWidth: 1200, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: "#34D399", letterSpacing: "0.2em" }}>ARCHITECTURE — TECHNICAL BRIEF</span>
        </div>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(40px, 5vw, 72px)", fontWeight: 900,
          textTransform: "uppercase", lineHeight: 0.95,
          letterSpacing: "-0.01em", margin: "0 0 20px",
        }}>
          BUILT LIKE<br />
          <span style={{ background: "linear-gradient(90deg, #34D399, #059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            INFRASTRUCTURE.
          </span>
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 560 }}>
          Every layer of 3C Onyx is production-grade from day one. This is the technical brief for investors, partners, and CTOs who want to look under the hood.
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 40, marginTop: 40, flexWrap: "wrap" }}>
          {[
            { icon: Server,   value: `${API_ROUTES}`,  label: "API endpoints" },
            { icon: Code2,    value: `${WEB_PAGES}`,   label: "Web + mobile screens" },
            { icon: Database, value: `${DB_TABLES}`,   label: "PostgreSQL tables" },
            { icon: Brain,    value: `${AI_MODELS}`,   label: "AI models in router" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <s.icon size={16} style={{ color: "#34D399" }} />
              </div>
              <div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: "#34D399", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.08em" }}>{s.label.toUpperCase()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 64px 80px" }}>

        {/* Stack layers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 60 }}>
          {STACK_LAYERS.map((layer) => (
            <div key={layer.tier} style={{
              borderRadius: 16,
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${layer.color}18`,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "14px 24px",
                background: `${layer.color}08`,
                borderBottom: `1px solid ${layer.color}18`,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: layer.color }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: layer.color, letterSpacing: "0.18em" }}>{layer.tier}</span>
              </div>
              <div style={{
                padding: "16px 24px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
              }}>
                {layer.components.map((c) => (
                  <div key={c.name} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <CheckCircle2 size={12} style={{ color: layer.color, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{c.name}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{c.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Two column: security + performance */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 60 }}>
          {/* Security */}
          <div style={{ borderRadius: 16, background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.12)", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(249,115,22,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={13} style={{ color: "#F97316" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#F97316", letterSpacing: "0.16em" }}>SECURITY POSTURE</span>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {SECURITY_CERTIFICATIONS.map((s) => (
                <div key={s.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <s.icon size={12} style={{ color: "#F97316", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{s.label}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div style={{ borderRadius: 16, background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.12)", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(6,182,212,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={13} style={{ color: "#06B6D4" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#06B6D4", letterSpacing: "0.16em" }}>PERFORMANCE TARGETS</span>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {PERFORMANCE_TARGETS.map((p) => (
                <div key={p.metric} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{p.metric}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{p.sub}</p>
                  </div>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: "#06B6D4", flexShrink: 0 }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Blockchain proof section */}
        <div style={{ borderRadius: 16, background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.18)", overflow: "hidden", marginBottom: 60 }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(139,92,246,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={13} style={{ color: "#8B5CF6" }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#8B5CF6", letterSpacing: "0.16em" }}>CHAIN-OF-CUSTODY — PUBLIC VERIFIABILITY</span>
          </div>
          <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Anyone can verify any record.</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
                Every vehicle event — inspection, delivery, ownership transfer, recall — is written to a SHA-256 hash-linked chain. Each block includes the previous block's hash, making any tampering immediately detectable. Entries are signed with HMAC-SHA-256 and persisted to PostgreSQL — they survive server restarts.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { step: "1", text: "Event written → SHA-256 hash computed from all fields" },
                { step: "2", text: "HMAC-SHA-256 signature applied — bound to event hash" },
                { step: "3", text: "Entry persisted to PostgreSQL blockchain_records table" },
                { step: "4", text: "Optional: hash anchored to Ethereum Sepolia testnet" },
                { step: "5", text: "Public: GET /api/blockchain/proof/:hash — no auth needed" },
              ].map((s) => (
                <div key={s.step} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)",
                    fontSize: 9, fontWeight: 800, color: "#8B5CF6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{s.step}</span>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginTop: 2 }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(139,92,246,0.1)", background: "rgba(139,92,246,0.04)" }}>
            <code style={{ fontSize: 11, color: "#8B5CF6", fontFamily: "'Courier New', monospace" }}>
              GET /api/blockchain/proof/&#123;sha256-hash&#125; → verified: true | certificate | howToVerify
            </code>
          </div>
        </div>

        {/* TAM statement */}
        <div style={{
          padding: "32px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: 24, alignItems: "flex-start",
        }}>
          <TrendingUp size={20} style={{ color: "#C9A227", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              This stack is designed to carry $4.5 trillion.
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 700 }}>
              The global automotive economy processes $4.5 trillion annually across buying, selling, insuring, financing, repairing, and inspecting vehicles. Every one of those transactions currently flows through fragmented, untrusted intermediaries. 3C Onyx is the trust layer. The architecture above is designed to be the coordination layer — not the competitor — for the entire ecosystem.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="padding: 64px 64px"] { padding: 32px 20px 40px !important; }
          div[style*="padding: 48px 64px"] { padding: 24px 20px 60px !important; }
        }
      `}</style>
    </div>
  );
}
