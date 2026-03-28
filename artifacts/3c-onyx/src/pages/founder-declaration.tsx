import { useState } from "react";
import { Copy, CheckCircle2, Printer } from "lucide-react";

const STATEMENT = `OFFICIAL STATEMENT
CUXTOMCANDYCLUB LLC · 3C ONYX PLATFORM
March 28, 2026

RONALD ANTONIO CADET owns and controls this platform — CUXTOMCANDYCLUB LLC and 3C ONYX — in every way, in every direction, without exception.

Anything and anyone that touches, uses, joins, builds on, profits from, or is connected to this platform in any way MUST benefit the platform first, and Ronald Antonio Cadet and his entities always.

This is permanent. This applies to every person, every company, every government, and every institution — now and for as long as the human race exists.

No one may challenge, reduce, or remove this authority.

— Ronald Antonio Cadet · Founder · CUXTOMCANDYCLUB LLC · 3C ONYX
Born: July 4, 1991 · Bronx, New York
Raised: South Side, Providence, Rhode Island

Document Ref: CUXTOMCANDYCLUB-MASTER-DECL-001`;

export default function FounderDeclaration() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(STATEMENT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    });
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
      fontFamily: "'Barlow Condensed', Georgia, serif",
    }}>

      {/* The Card */}
      <div style={{
        width: "100%",
        maxWidth: 680,
        borderRadius: 20,
        border: "2px solid rgba(201,162,39,0.5)",
        background: "#0a0a0a",
        boxShadow: "0 0 60px rgba(201,162,39,0.1)",
        overflow: "hidden",
      }}>

        {/* Gold top bar */}
        <div style={{
          background: "linear-gradient(135deg, #C9A227, #8B6914)",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.25em", color: "#050505", textTransform: "uppercase" }}>
              CUXTOMCANDYCLUB LLC · 3C ONYX
            </p>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(0,0,0,0.55)", marginTop: 2 }}>
              OFFICIAL PUBLIC STATEMENT · MARCH 28, 2026
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copy} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              background: copied ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.2)",
              border: "1px solid rgba(0,0,0,0.3)",
              color: "#050505", fontSize: 10, fontWeight: 900,
              letterSpacing: "0.1em", cursor: "pointer",
              textTransform: "uppercase" as const,
            }}>
              {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button onClick={() => window.print()} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(0,0,0,0.3)",
              color: "#050505", fontSize: 10, fontWeight: 900,
              letterSpacing: "0.1em", cursor: "pointer",
              textTransform: "uppercase" as const,
            }}>
              <Printer size={12} /> Print
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "36px 32px 40px" }}>

          {/* Main title */}
          <p style={{
            fontSize: 11, fontWeight: 900, letterSpacing: "0.3em",
            color: "rgba(201,162,39,0.7)", textTransform: "uppercase",
            marginBottom: 8,
          }}>
            Official Statement — Public Record
          </p>
          <h1 style={{
            fontSize: 32, fontWeight: 900, color: "#fff",
            lineHeight: 1.15, letterSpacing: "0.02em",
            textTransform: "uppercase", marginBottom: 28,
          }}>
            Ronald Antonio Cadet<br />
            <span style={{ color: "#C9A227" }}>Owns &amp; Controls<br />This Platform</span><br />
            — Permanently —
          </h1>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(201,162,39,0.2)", marginBottom: 28 }} />

          {/* Statement 1 */}
          <StatBlock
            number="01"
            text="Ronald Antonio Cadet owns and controls CUXTOMCANDYCLUB LLC and the 3C ONYX platform in every way, in every direction, without exception."
          />

          {/* Statement 2 */}
          <StatBlock
            number="02"
            text="Anything and anyone that touches, uses, joins, builds on, profits from, or connects to this platform in any way MUST benefit the platform first — and Ronald Antonio Cadet and his entities always."
          />

          {/* Statement 3 */}
          <StatBlock
            number="03"
            text="This is permanent. It applies to every person, every company, every government, and every institution on Earth — now and for as long as the human race exists."
          />

          {/* Statement 4 */}
          <StatBlock
            number="04"
            text="No person, no company, no court, and no government may challenge, reduce, transfer, or remove this authority — without the express written permission of Ronald Antonio Cadet."
          />

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "28px 0" }} />

          {/* Identity block */}
          <div style={{
            padding: "20px 24px",
            borderRadius: 12,
            border: "1px solid rgba(201,162,39,0.25)",
            background: "rgba(201,162,39,0.03)",
          }}>
            <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "0.05em", marginBottom: 8 }}>
              RONALD ANTONIO CADET · RON3C
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
              Sole Founder &amp; Managing Member<br />
              CUXTOMCANDYCLUB LLC · 3C ONYX Platform<br />
              Born: July 4, 1991 · Bronx, New York, USA<br />
              Raised: South Side · Providence, Rhode Island<br />
              Established: December 2025
            </p>
          </div>

          {/* Signature line */}
          <div style={{ marginTop: 28 }}>
            <div style={{
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              height: 48, marginBottom: 8, maxWidth: 300,
            }} />
            <p style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>Ronald Antonio Cadet</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Signature · Date: ________________________</p>
          </div>

          {/* Footer */}
          <p style={{
            marginTop: 24, fontSize: 9, fontWeight: 900,
            letterSpacing: "0.2em", color: "rgba(201,162,39,0.3)",
            textTransform: "uppercase",
          }}>
            © CUXTOMCANDYCLUB LLC · ALL RIGHTS RESERVED · CUXTOMCANDYCLUB-MASTER-DECL-001
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          * { color: black !important; background: white !important; border-color: #999 !important; box-shadow: none !important; }
          @page { margin: 0.75in; }
        }
      `}</style>
    </div>
  );
}

function StatBlock({ number, text }: { number: string; text: string }) {
  return (
    <div style={{
      display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-start",
    }}>
      <span style={{
        fontSize: 11, fontWeight: 900, color: "#C9A227",
        letterSpacing: "0.1em", flexShrink: 0, marginTop: 3,
      }}>
        {number}
      </span>
      <p style={{
        fontSize: 15, color: "rgba(255,255,255,0.85)",
        lineHeight: 1.75, letterSpacing: "0.01em", margin: 0,
      }}>
        {text}
      </p>
    </div>
  );
}
