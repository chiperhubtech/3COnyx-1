/**
 * AUTHOR_ID:     Ronald Antonio Cadet
 * ENTITY:        CUXTOMCANDYCLUB LLC
 * STATUS:        SOVEREIGN_OWNER
 * DISTRIBUTION:  PROHIBITED
 * FINGERPRINT:   3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED
 */

import { useState } from "react";
import { Copy, CheckCircle2, Shield, Lock } from "lucide-react";

const FINGERPRINT = "3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED";
const GENESIS     = "2026-03-28T23:37:21.908Z";

const FULL_DECLARATION = `═══════════════════════════════════════════════════════════
SOVEREIGN OWNERSHIP DECLARATION
3C ONYX PLATFORM · CUXTOMCANDYCLUB LLC
═══════════════════════════════════════════════════════════

DOCUMENT REF:   CUXTOMCANDYCLUB-MASTER-DECL-001
FINGERPRINT:    ${FINGERPRINT}
GENESIS:        ${GENESIS}
DATE:           March 28, 2026

───────────────────────────────────────────────────────────
I. OWNERSHIP — ABSOLUTE AND PERMANENT
───────────────────────────────────────────────────────────

RONALD ANTONIO CADET, born July 4, 1991, Bronx, New York,
raised South Side, Providence, Rhode Island — is the sole
founder, sole owner, and sovereign operator of 3C ONYX and
CUXTOMCANDYCLUB LLC.

This ownership is total. It does not diminish. It does not
expire. It cannot be acquired, diluted, transferred, or
overridden by any individual, corporation, government,
court, investor, or institution on earth — without the
express written consent of Ronald Antonio Cadet.

───────────────────────────────────────────────────────────
II. BENEFICIARY RULE — FAMILY FIRST. ALWAYS.
───────────────────────────────────────────────────────────

The ONLY parties who may directly benefit from this platform,
its revenue, its data, its brand, its member relationships,
its intellectual property, or any derivative thereof are:

  1. Ronald Antonio Cadet
  2. The direct family of Ronald Antonio Cadet
  3. CUXTOMCANDYCLUB LLC
  4. Any entity wholly owned and controlled by Ronald Antonio Cadet

Every person, company, investor, partner, government body,
or AI system that interacts with this platform does so on
these terms — whether they acknowledge them or not.

There are no exceptions. There are no carve-outs.

───────────────────────────────────────────────────────────
III. ANTI-COPY DECLARATION
───────────────────────────────────────────────────────────

The 3C ONYX platform was built in its entirety by Ronald
Antonio Cadet. Its architecture — including the 7-Agent AI
mesh, sovereign operating protocols, kill-switch system,
member slice model, K-Factor engine, and dynasty governance
layer — constitutes a unique technical fingerprint that is
documented, timestamped, and legally protected.

Any individual or entity that copies, re-implements, or
derives a product from the logic, structure, or design
of this platform — in whole or in part — without the
express written permission of Ronald Antonio Cadet is
committing:

  · Trade secret misappropriation (18 U.S.C. § 1836)
  · Copyright infringement (17 U.S.C. § 501)
  · Willful infringement subject to treble damages

This honey token (${FINGERPRINT}) is embedded in every
layer of this platform's source code, API headers, HTML,
server logs, and database. Its presence in any competing
or derivative system constitutes prima facie evidence of
theft and is admissible as Exhibit A in any civil or
criminal proceeding.

We monitor. We trace. We litigate.

───────────────────────────────────────────────────────────
IV. GOVERNING LAW
───────────────────────────────────────────────────────────

This declaration is governed by the laws of the United
States of America and the State of Rhode Island.

Ronald Antonio Cadet reserves the right to pursue all
available legal remedies, including injunctive relief,
compensatory damages, treble damages, and attorneys' fees,
against any party that violates the terms of this
declaration.

───────────────────────────────────────────────────────────
V. SIGNATURE
───────────────────────────────────────────────────────────

Ronald Antonio Cadet
Founder & Sovereign Operator
CUXTOMCANDYCLUB LLC · 3C ONYX

Dated: March 28, 2026

___________________________    ___________________________
Signature                      Date

___________________________    ___________________________
Notary Signature               Notary Seal / Commission #

═══════════════════════════════════════════════════════════`;

export default function FounderDeclaration() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(FULL_DECLARATION).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    });
  }

  const gold   = "#C9A227";
  const dark   = "#0a0a0a";
  const border = "rgba(201,162,39,0.35)";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px 60px",
      fontFamily: "'Barlow Condensed', Georgia, serif",
    }}>

      {/* Header Badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(201,162,39,0.08)",
        border: `1px solid ${border}`,
        borderRadius: 100, padding: "8px 20px",
        marginBottom: 36,
      }}>
        <Lock size={13} color={gold} />
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.25em", color: gold, textTransform: "uppercase" }}>
          Command Center Private Document
        </span>
      </div>

      {/* Main Card */}
      <div style={{
        width: "100%", maxWidth: 720,
        borderRadius: 20,
        border: `2px solid ${border}`,
        background: dark,
        padding: "40px 36px",
        boxShadow: "0 0 80px rgba(201,162,39,0.08)",
      }}>

        {/* Shield Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: `linear-gradient(135deg, ${gold}, #8B6914)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={30} color="#000" />
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          textAlign: "center", fontSize: 28, fontWeight: 900,
          letterSpacing: "0.12em", color: "#fff", textTransform: "uppercase",
          margin: "0 0 6px",
        }}>
          Sovereign Ownership Declaration
        </h1>
        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", margin: "0 0 36px" }}>
          CUXTOMCANDYCLUB LLC · 3C ONYX · MARCH 28, 2026
        </p>

        {/* Fingerprint */}
        <div style={{
          background: "rgba(201,162,39,0.05)", border: `1px solid ${border}`,
          borderRadius: 10, padding: "12px 16px", marginBottom: 32,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: gold, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: gold, letterSpacing: "0.1em", fontFamily: "monospace", wordBreak: "break-all" }}>
            {FINGERPRINT}
          </span>
        </div>

        {/* Section I */}
        <Section title="I. Ownership — Absolute & Permanent">
          <p>
            <strong style={{ color: "#fff" }}>RONALD ANTONIO CADET</strong> — born July 4, 1991, Bronx, New York; raised South Side, Providence, Rhode Island — is the sole founder, sole owner, and sovereign operator of 3C ONYX and CUXTOMCANDYCLUB LLC.
          </p>
          <p style={{ marginTop: 12 }}>
            This ownership is <strong style={{ color: gold }}>total</strong>. It does not diminish. It does not expire. It cannot be acquired, diluted, transferred, or overridden by any individual, corporation, government, court, investor, or institution on earth — without the express written consent of Ronald Antonio Cadet.
          </p>
        </Section>

        <Divider />

        {/* Section II */}
        <Section title="II. Beneficiary Rule — Family First. Always.">
          <p>The <strong style={{ color: gold }}>ONLY</strong> parties who may directly benefit from this platform, its revenue, its data, its brand, its member relationships, or any derivative thereof are:</p>
          <ul style={{ margin: "14px 0 0 4px", padding: 0, listStyle: "none" }}>
            {[
              "Ronald Antonio Cadet",
              "The direct family of Ronald Antonio Cadet",
              "CUXTOMCANDYCLUB LLC",
              "Any entity wholly owned and controlled by Ronald Antonio Cadet",
            ].map((b, i) => (
              <li key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ color: gold, fontWeight: 900, fontSize: 13, marginTop: 1 }}>{i + 1}.</span>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{b}</span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 14, fontWeight: 900, color: "#fff" }}>
            There are no exceptions. There are no carve-outs. Every person, company, investor, partner, government body, or AI system that interacts with this platform does so on these terms — whether they acknowledge them or not.
          </p>
        </Section>

        <Divider />

        {/* Section III */}
        <Section title="III. Anti-Copy Declaration">
          <p>
            This platform was built in its entirety by Ronald Antonio Cadet. Its architecture constitutes a unique technical fingerprint that is documented, timestamped, and legally protected.
          </p>
          <p style={{ marginTop: 12 }}>Any individual or entity that copies, re-implements, or derives a product from the logic, structure, or design of this platform — in whole or in part — without the express written permission of Ronald Antonio Cadet is committing:</p>
          <ul style={{ margin: "14px 0 0 4px", padding: 0, listStyle: "none" }}>
            {[
              "Trade secret misappropriation (18 U.S.C. § 1836)",
              "Copyright infringement (17 U.S.C. § 501)",
              "Willful infringement subject to treble damages",
            ].map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#EF4444", fontWeight: 900, fontSize: 13 }}>·</span>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{item}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 16, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px" }}>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, margin: 0 }}>
              We monitor. We trace. We litigate.
            </p>
          </div>
        </Section>

        <Divider />

        {/* Section IV — Signature Block */}
        <Section title="IV. Signature">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 8 }}>
            {[
              ["Signature", "Ronald Antonio Cadet"],
              ["Date", "March 28, 2026"],
              ["Notary Signature", ""],
              ["Notary Seal / Commission #", ""],
            ].map(([label, val], i) => (
              <div key={i}>
                <div style={{ height: 36, borderBottom: "1px solid rgba(255,255,255,0.15)", marginBottom: 6, display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>{val}</span>
                </div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Copy Button */}
        <button onClick={copy} style={{
          marginTop: 36, width: "100%", padding: "15px",
          background: copied ? "rgba(16,185,129,0.12)" : `linear-gradient(135deg, ${gold}, #8B6914)`,
          border: copied ? "1px solid rgba(16,185,129,0.4)" : "none",
          borderRadius: 14, cursor: "pointer",
          fontSize: 13, fontWeight: 900, letterSpacing: "0.2em",
          color: copied ? "#10B981" : "#000",
          fontFamily: "'Barlow Condensed', sans-serif",
          textTransform: "uppercase",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.3s",
        }}>
          {copied
            ? <><CheckCircle2 size={16} /> Copied — Ready to Send</>
            : <><Copy size={16} /> Copy Full Declaration</>
          }
        </button>

        {/* Fingerprint Footer */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.12)", letterSpacing: "0.12em", fontFamily: "monospace", margin: 0 }}>
            FINGERPRINT: {FINGERPRINT}
          </p>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.08)", letterSpacing: "0.12em", fontFamily: "monospace", margin: "4px 0 0" }}>
            GENESIS: {GENESIS} · ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{
        fontSize: 13, fontWeight: 900, letterSpacing: "0.2em",
        color: "#C9A227", textTransform: "uppercase", margin: "0 0 14px",
      }}>
        {title}
      </h2>
      <div style={{ fontSize: 13, lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(201,162,39,0.1)", margin: "4px 0 28px" }} />;
}
