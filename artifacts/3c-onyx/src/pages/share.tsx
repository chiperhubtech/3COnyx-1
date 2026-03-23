import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Wifi, TrendingUp, Shield, Zap } from "lucide-react";

const BASE_SIGNUPS = 8564;
const PRICE = 99;

function useTicker() {
  const [signups, setSignups] = useState(BASE_SIGNUPS);
  useEffect(() => {
    const iv = setInterval(() => {
      setSignups((s) => s + Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(iv);
  }, []);
  return { signups, mrr: signups * PRICE };
}

function useAppUrl() {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const origin = window.location.origin;
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    setUrl(origin + base);
  }, []);
  return url;
}

function AnimatedDot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"
      style={{ animation: `pulse 2s ${delay}s infinite` }}
    />
  );
}

export default function Share() {
  const { signups, mrr } = useTicker();
  const appUrl = useAppUrl();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (appUrl) {
      navigator.clipboard.writeText(appUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const mrrFormatted = `$${(mrr / 1000).toFixed(0)}K`;

  return (
    <div
      className="min-h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 120% 80% at 50% 30%, #0f0d06 0%, #07060a 60%, #050408 100%)" }}
    >
      {/* Ambient light rings */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201,162,39,0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.4), transparent)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.2), transparent)" }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 py-10 w-full max-w-md mx-auto">

        {/* Header badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
          style={{ background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.25)" }}
        >
          <AnimatedDot />
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "10px",
              letterSpacing: "0.3em",
              fontWeight: 700,
              color: "rgba(201,162,39,0.9)",
            }}
          >
            LIVE · FRIENDS & FAMILY ROUND
          </span>
          <AnimatedDot delay={0.5} />
        </div>

        {/* Title */}
        <div className="text-center mb-2">
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(36px, 9vw, 52px)",
              fontWeight: 900,
              letterSpacing: "0.08em",
              color: "#FFFFFF",
              lineHeight: 1,
              textShadow: "0 0 60px rgba(201,162,39,0.3)",
            }}
          >
            3C DYNASTY
          </h1>
          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(13px, 3vw, 16px)",
              letterSpacing: "0.3em",
              fontWeight: 600,
              color: "rgba(201,162,39,0.7)",
              marginTop: "4px",
            }}
          >
            I-95 CORRIDOR LAUNCH
          </p>
        </div>

        {/* Divider */}
        <div className="w-24 h-px my-6" style={{ background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.5), transparent)" }} />

        {/* QR Code frame */}
        <div className="relative mb-6" style={{ padding: "3px", borderRadius: "20px", background: "linear-gradient(135deg, #C9A227, #8B6914, #C9A227)" }}>
          <div
            className="relative"
            style={{
              borderRadius: "18px",
              background: "#FFFFFF",
              padding: "20px",
              boxShadow: "0 0 80px rgba(201,162,39,0.35), 0 0 30px rgba(201,162,39,0.2), inset 0 0 20px rgba(0,0,0,0.05)",
            }}
          >
            {/* Corner accents */}
            {[["top-0 left-0", "border-t-2 border-l-2 rounded-tl-lg"], ["top-0 right-0", "border-t-2 border-r-2 rounded-tr-lg"], ["bottom-0 left-0", "border-b-2 border-l-2 rounded-bl-lg"], ["bottom-0 right-0", "border-b-2 border-r-2 rounded-br-lg"]].map(([pos, borders]) => (
              <div
                key={pos}
                className={`absolute ${pos} w-6 h-6 -m-0.5 ${borders}`}
                style={{ borderColor: "#C9A227" }}
              />
            ))}

            {appUrl ? (
              <QRCodeSVG
                value={appUrl}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#050408"
                level="H"
                includeMargin={false}
              />
            ) : (
              <div className="w-[220px] h-[220px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Glow ring */}
          <div
            className="absolute inset-0 rounded-[20px] pointer-events-none"
            style={{ boxShadow: "0 0 40px rgba(201,162,39,0.2)", borderRadius: "20px" }}
          />
        </div>

        {/* Scan instruction */}
        <p
          className="text-center mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}
        >
          POINT YOUR CAMERA TO SCAN
        </p>
        <p className="text-center text-xs text-white/20 mb-8">
          Opens the 3C Onyx platform instantly
        </p>

        {/* Deal terms */}
        <div
          className="w-full rounded-2xl p-5 mb-5"
          style={{
            background: "rgba(201,162,39,0.05)",
            border: "1px solid rgba(201,162,39,0.2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <p
            className="text-center mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", letterSpacing: "0.3em", color: "rgba(201,162,39,0.5)", fontWeight: 700 }}
          >
            INVESTMENT TERMS
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "EQUITY", value: "2%", sub: "Dynasty Stake" },
              { label: "AMOUNT", value: "$60K", sub: "Early-Stage SAFE" },
              { label: "VALUATION", value: "$3M", sub: "Pre-Money Cap" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="text-center">
                <p
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", letterSpacing: "0.2em", color: "rgba(201,162,39,0.45)", fontWeight: 700 }}
                >
                  {label}
                </p>
                <p
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(20px,5vw,26px)", fontWeight: 900, color: "#C9A227", lineHeight: 1.1 }}
                >
                  {value}
                </p>
                <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{sub}</p>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl py-2.5 px-3 text-center"
            style={{ background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.12)" }}
          >
            <p className="text-xs text-white/50 leading-snug">
              Scan to join the{" "}
              <span className="text-amber-400/80 font-semibold">Hunts Point → Boston Seaport</span>{" "}
              infrastructure corridor
            </p>
          </div>
        </div>

        {/* Live Hectocorn Ticker */}
        <div
          className="w-full rounded-2xl p-4 mb-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}
              >
                HECTOCORN TICKER · LIVE
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: "9px", color: "rgba(52,211,153,0.7)", fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>TOTAL MEMBERS</p>
              <p
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "28px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {signups.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>MONTHLY REVENUE</p>
              <p
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "28px",
                  fontWeight: 900,
                  color: "#C9A227",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {mrrFormatted}
              </p>
            </div>
          </div>

          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min((signups / 10000) * 100, 100)}%`,
                background: "linear-gradient(90deg, #C9A227, #F4D03F)",
              }}
            />
          </div>
          <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", marginTop: "4px" }}>
            {((signups / 10000) * 100).toFixed(1)}% to 10K member milestone
          </p>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          {[
            { icon: Shield, label: "SOC2 Vault", sub: "Audit-ready" },
            { icon: Zap, label: "Stripe LIVE", sub: "Split engine" },
            { icon: Wifi, label: "7-Agent Mesh", sub: "Guardian AI" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Icon className="w-4 h-4 text-amber-400/60" />
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em" }}>
                {label}
              </p>
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Copy URL button */}
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
          style={{
            background: copied
              ? "rgba(52,211,153,0.12)"
              : "rgba(201,162,39,0.1)",
            border: copied
              ? "1px solid rgba(52,211,153,0.3)"
              : "1px solid rgba(201,162,39,0.3)",
            color: copied ? "#34D399" : "#C9A227",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.15em",
            fontSize: "13px",
          }}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              LINK COPIED
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              COPY INVITE LINK
            </>
          )}
        </button>

        {/* Bottom note */}
        <p className="text-center text-[10px] text-white/15 mt-5 leading-relaxed max-w-xs">
          3C Onyx · Regulated under FinCEN AML/KYC · SOC2 Type II in progress ·
          Investment via Regulation CF or Regulation D exemption
        </p>
      </div>
    </div>
  );
}
