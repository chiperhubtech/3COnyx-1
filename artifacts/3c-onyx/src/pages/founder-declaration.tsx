/**
 * 3C ONYX — Founder's Public Declaration
 *
 * Publicly accessible. No login required.
 * Print-ready. Copy-ready. Globally legible.
 *
 * Ronald Antonio Cadet · aka Ron3C
 * CUXTOMCANDYCLUB LLC · 3C ONYX
 */

import { useState } from "react";
import { Printer, Copy, CheckCircle2 } from "lucide-react";

const TODAY = "March 28, 2026";

const PLAIN_TEXT = `FOUNDER'S PUBLIC DECLARATION
CUXTOMCANDYCLUB LLC & 3C ONYX PLATFORM

Issued: ${TODAY}
Document ID: CUXTOMCANDYCLUB-FOUNDER-DECL-001

═══════════════════════════════════════════════════════════

TO THE WORLD — EVERY PERSON, EVERY GOVERNMENT,
EVERY COURT, EVERY INSTITUTION:

This declaration is made openly, freely, and on the public record.

═══════════════════════════════════════════════════════════

WHO I AM

My name is Ronald Antonio Cadet.
I am publicly known as Ron3C.

I was born on July 4, 1991 — Independence Day —
in the Bronx, New York, United States of America.

I was raised on the South Side of Providence, Rhode Island,
in New England. That community shaped me. Those streets
built the foundation of everything I stand for.

From those beginnings, I built a vision that reaches
every nation, every market, and every generation.

═══════════════════════════════════════════════════════════

WHAT I BUILT

I am the sole founder and sole owner of:

  CUXTOMCANDYCLUB LLC
  Established: December 2025
  Platform: 3C ONYX

3C ONYX is a luxury automotive intelligence platform —
a Super App that sits between consumers and the entire
automotive industry. It coordinates every deal, every
delivery, and every decision.

I built this from nothing. No investors. No co-founders.
No partners. Every system, every idea, every component
originated with me.

═══════════════════════════════════════════════════════════

MY FAMILY'S LEGACY

This platform is not just a business.
It is a generational institution.

I, Ronald Antonio Cadet, and my family — my descendants,
my bloodline — are the rightful and legal owners of
CUXTOMCANDYCLUB LLC and the 3C ONYX platform now
and in perpetuity.

No person, no company, no government, and no court
may transfer, dilute, or seize this ownership without
my express written consent.

This is our legacy. This is our institution.
It was built by us. It belongs to us. It will continue
through us.

═══════════════════════════════════════════════════════════

MY MISSION

I am a visionary. I am an evolutionary.
I am building the infrastructure that will move
the global automotive economy for generations.

From the South Side of Providence to every nation
on this planet — this platform, this company, this family
is here. We are building. We are permanent.

3C ONYX is not a startup.
It is a dynasty in motion.

═══════════════════════════════════════════════════════════

THIS IS OFFICIAL PUBLIC NOTICE

This declaration is notice to every person and institution
on Earth that Ronald Antonio Cadet and his family own
CUXTOMCANDYCLUB LLC and the 3C ONYX platform,
in full, without condition, effective December 2025.

═══════════════════════════════════════════════════════════

SIGNATURE

Declared freely and voluntarily by:


_____________________________________________
Ronald Antonio Cadet  (Ron3C)
Sole Founder & Managing Member
CUXTOMCANDYCLUB LLC — 3C ONYX Platform
Born: July 4, 1991 · Bronx, New York, USA

Date: ______________________________

State: _____________________________


═══════════════════════════════════════════════════════════

NOTARY ACKNOWLEDGMENT

On this ________ day of ______________________, 20______,
before me personally appeared Ronald Antonio Cadet,
who proved his identity to my satisfaction and declared
the above to be true and correct.


_____________________________________________
Notary Public — Signature

Printed Name: _______________________________
Commission Expires: _________________________
State / Country: ____________________________

[ OFFICIAL NOTARY SEAL ]

═══════════════════════════════════════════════════════════

© CUXTOMCANDYCLUB LLC — ALL RIGHTS RESERVED
Document Ref: CUXTOMCANDYCLUB-FOUNDER-DECL-001
`;

export default function FounderDeclaration() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(PLAIN_TEXT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#040404",
      fontFamily: "'Barlow Condensed', 'Georgia', serif",
      color: "#fff",
    }}>

      {/* ── Top Action Bar ── */}
      <div className="print:hidden" style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(4,4,4,0.97)",
        borderBottom: "1px solid rgba(201,162,39,0.15)",
        backdropFilter: "blur(12px)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#C9A227,#8B6914)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 900, color: "#050505",
          }}>3C</div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: "0.08em" }}>FOUNDER'S PUBLIC DECLARATION</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>CUXTOMCANDYCLUB LLC · RONALD ANTONIO CADET · DECL-001</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: copied
                ? "linear-gradient(135deg,#34D399,#059669)"
                : "linear-gradient(135deg,#C9A227,#8B6914)",
              color: copied ? "#fff" : "#050505",
              fontSize: 11, fontWeight: 900,
              letterSpacing: "0.12em",
              cursor: "pointer",
              textTransform: "uppercase" as const,
              transition: "all 0.3s",
            }}
          >
            {copied
              ? <><CheckCircle2 style={{ width: 14, height: 14 }} /> Copied!</>
              : <><Copy style={{ width: 14, height: 14 }} /> Copy &amp; Paste Anywhere</>
            }
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: 11, fontWeight: 900,
              letterSpacing: "0.12em",
              cursor: "pointer",
              textTransform: "uppercase" as const,
            }}
          >
            <Printer style={{ width: 14, height: 14 }} />
            Print / PDF
          </button>
        </div>
      </div>

      {/* ── Main Document ── */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 32px 80px" }} className="print:px-12 print:py-8">

        {/* Print-only header */}
        <div className="hidden print:block" style={{ textAlign: "center", marginBottom: 32, paddingBottom: 24, borderBottom: "3px solid #000" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", fontWeight: 900, color: "#888", textTransform: "uppercase" }}>
            CUXTOMCANDYCLUB LLC — OFFICIAL PUBLIC DOCUMENT
          </p>
        </div>

        {/* Seal + Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          {/* Seal */}
          <div style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 100, height: 100,
            borderRadius: "50%",
            border: "3px solid rgba(201,162,39,0.6)",
            boxShadow: "0 0 40px rgba(201,162,39,0.15), 0 0 0 8px rgba(201,162,39,0.05)",
            background: "radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)",
            marginBottom: 28,
          }} className="print:border-gray-400 print:shadow-none">
            <span style={{ fontSize: 22, fontWeight: 900, color: "#C9A227", letterSpacing: "0.05em" }} className="print:text-black">3C</span>
            <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: "0.25em", color: "rgba(201,162,39,0.7)", marginTop: 2 }} className="print:text-gray-500">ONYX</span>
          </div>

          {/* Eyebrow */}
          <p style={{
            fontSize: 10, fontWeight: 900, letterSpacing: "0.35em",
            color: "rgba(201,162,39,0.7)", textTransform: "uppercase", marginBottom: 14,
          }} className="print:text-gray-500">
            CUXTOMCANDYCLUB LLC — PUBLIC RECORD
          </p>

          {/* Title */}
          <h1 style={{
            fontSize: 40, fontWeight: 900, letterSpacing: "0.04em",
            lineHeight: 1.1, color: "#fff", textTransform: "uppercase",
            marginBottom: 10,
          }} className="print:text-black">
            Founder's Public<br />Declaration
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 14, fontWeight: 700, letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 24,
          }} className="print:text-gray-500">
            Of Ownership, Identity &amp; Generational Authority
          </p>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ height: 1, width: 60, background: "rgba(201,162,39,0.3)" }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A227", opacity: 0.6 }} />
            <div style={{ height: 1, width: 60, background: "rgba(201,162,39,0.3)" }} />
          </div>

          {/* Meta row */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 32, marginTop: 20, flexWrap: "wrap",
          }}>
            {[
              { label: "Issued", value: TODAY },
              { label: "Document", value: "CUXTOMCANDYCLUB-FOUNDER-DECL-001" },
              { label: "Status", value: "Active · Public Record" },
            ].map(item => (
              <div key={item.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }} className="print:text-gray-400">{item.label}</p>
                <p style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.7)", marginTop: 2 }} className="print:text-black">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Opening Statement ── */}
        <div style={{
          padding: "24px 28px",
          borderRadius: 14,
          border: "1px solid rgba(201,162,39,0.25)",
          background: "rgba(201,162,39,0.03)",
          marginBottom: 40,
          textAlign: "center",
        }} className="print:border-gray-300 print:bg-gray-50">
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }} className="print:text-gray-700">
            TO THE WORLD — EVERY PERSON, EVERY GOVERNMENT,<br />
            EVERY COURT, EVERY INSTITUTION — THIS IS STATED OPENLY,<br />
            FREELY, AND ON THE PERMANENT PUBLIC RECORD.
          </p>
        </div>

        {/* ── Sections ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

          {/* Section 1 — Who I Am */}
          <Section number="I" title="Who I Am" gold>
            <BodyText>
              My name is <Strong>Ronald Antonio Cadet</Strong>. I am publicly known as <Strong>Ron3C</Strong>.
            </BodyText>
            <BodyText>
              I was born on <Strong>July 4, 1991</Strong> — Independence Day — in the <Strong>Bronx, New York</Strong>, United States of America. I was raised on the <Strong>South Side of Providence, Rhode Island</Strong>, in New England. That community shaped every value I carry. Those streets built the foundation of everything I stand for today.
            </BodyText>
            <BodyText>
              From those beginnings — no silver spoon, no shortcuts — I built a vision that now reaches every nation, every market, and every generation on this planet.
            </BodyText>
          </Section>

          {/* Section 2 — What I Built */}
          <Section number="II" title="What I Built">
            <BodyText>
              I am the <Strong>sole founder and sole owner</Strong> of:
            </BodyText>

            <div style={{
              margin: "16px 0",
              padding: "20px 24px",
              borderRadius: 12,
              border: "1px solid rgba(201,162,39,0.2)",
              background: "rgba(0,0,0,0.3)",
            }} className="print:border-gray-200 print:bg-white">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
                {[
                  { label: "Company", value: "CUXTOMCANDYCLUB LLC" },
                  { label: "Platform", value: "3C ONYX" },
                  { label: "Established", value: "December 2025" },
                  { label: "Headquarters", value: "United States of America" },
                  { label: "Ownership", value: "100% — Ronald Antonio Cadet" },
                  { label: "Structure", value: "LLC + C Corp" },
                ].map(row => (
                  <div key={row.label}>
                    <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(201,162,39,0.6)", textTransform: "uppercase", marginBottom: 3 }} className="print:text-gray-400">{row.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 900, color: "#fff" }} className="print:text-black">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <BodyText>
              3C ONYX is a luxury automotive intelligence Super App — a platform that sits between consumers and the entire automotive industry worldwide, coordinating every deal, every delivery, and every decision.
            </BodyText>
            <BodyText>
              I built this from nothing. <Strong>No investors. No co-founders. No partners.</Strong> Every system, every idea, every component of this platform originated entirely with me.
            </BodyText>
          </Section>

          {/* Section 3 — Family Legacy */}
          <Section number="III" title="My Family's Legacy" gold>
            <BodyText>
              This platform is not simply a business. It is a <Strong>generational institution</Strong>.
            </BodyText>
            <BodyText>
              I, Ronald Antonio Cadet, and my family — my descendants, my bloodline — are the rightful and legal owners of CUXTOMCANDYCLUB LLC and the 3C ONYX platform, <Strong>now and in perpetuity</Strong>.
            </BodyText>
            <BodyText>
              No person, no company, no government body, and no court may transfer, dilute, encumber, or seize this ownership without my express written consent. This institution was built by us. It belongs to us. It will continue through us.
            </BodyText>

            <div style={{
              marginTop: 16,
              padding: "18px 22px",
              borderRadius: 10,
              border: "1px solid rgba(201,162,39,0.35)",
              background: "rgba(201,162,39,0.04)",
            }} className="print:border-gray-300 print:bg-gray-50">
              <p style={{ fontSize: 12, fontWeight: 900, fontStyle: "italic", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, textAlign: "center", letterSpacing: "0.02em" }} className="print:text-gray-700">
                "This is our legacy. This is our institution.<br />
                It was built by us. It belongs to us.<br />
                It will continue through us."
              </p>
              <p style={{ textAlign: "center", marginTop: 10, fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(201,162,39,0.6)" }} className="print:text-gray-400">
                — RONALD ANTONIO CADET · RON3C · FOUNDER
              </p>
            </div>
          </Section>

          {/* Section 4 — The Vision */}
          <Section number="IV" title="The Vision">
            <BodyText>
              I am a <Strong>visionary</Strong>. I am an <Strong>evolutionary</Strong>. I am a <Strong>Titan in motion</Strong>.
            </BodyText>
            <BodyText>
              From the South Side of Providence, Rhode Island, to every nation on this planet — this platform, this company, this family is here. We are building the infrastructure that will move the global automotive economy for generations to come.
            </BodyText>
            <BodyText>
              3C ONYX is not a startup. It is a dynasty in motion. Built from the ground up. Owned entirely. Operated on a 100-year horizon.
            </BodyText>
          </Section>

          {/* Section 5 — Official Notice */}
          <Section number="V" title="Official Public Notice" gold>
            <BodyText>
              This declaration serves as <Strong>official public notice</Strong> to every person, every company, every government, and every institution on Earth:
            </BodyText>
            <div style={{
              margin: "16px 0",
              padding: "20px 24px",
              borderRadius: 12,
              border: "1.5px solid rgba(201,162,39,0.4)",
              background: "rgba(201,162,39,0.05)",
            }} className="print:border-gray-400 print:bg-gray-50">
              {[
                "Ronald Antonio Cadet is the sole, rightful, and undisputed founder and owner of CUXTOMCANDYCLUB LLC and the 3C ONYX platform.",
                "This ownership is total, unconditional, and permanent.",
                "His family and descendants hold legitimate succession rights to this institution.",
                "This has been true since December 2025 and will remain true indefinitely.",
                "Any claim to the contrary is false and will be met with full legal force.",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < 4 ? 12 : 0, alignItems: "flex-start" }}>
                  <span style={{ color: "#C9A227", fontWeight: 900, fontSize: 12, flexShrink: 0, marginTop: 1 }} className="print:text-gray-500">
                    {i + 1}.
                  </span>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: 0 }} className="print:text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </Section>

        </div>

        {/* ── Signature Block ── */}
        <div style={{
          marginTop: 48,
          paddingTop: 32,
          borderTop: "1px solid rgba(201,162,39,0.2)",
        }} className="print:border-gray-300">

          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.25em", color: "rgba(201,162,39,0.6)", textTransform: "uppercase", marginBottom: 20 }} className="print:text-gray-400">
            Declaration &amp; Signature
          </p>

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, marginBottom: 28, maxWidth: 580 }} className="print:text-gray-600">
            I, Ronald Antonio Cadet, declare freely and voluntarily that everything stated above is true and correct. I make this declaration openly for the permanent public record.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div>
              <div style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.2)", marginBottom: 8 }} className="print:border-gray-400" />
              <p style={{ fontSize: 11, fontWeight: 900, color: "#fff", marginBottom: 2 }} className="print:text-black">Ronald Antonio Cadet</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }} className="print:text-gray-500">Also known as: Ron3C</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }} className="print:text-gray-500">Sole Managing Member, CUXTOMCANDYCLUB LLC</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }} className="print:text-gray-500">Founder, 3C ONYX Platform</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ height: 36, borderBottom: "1px solid rgba(255,255,255,0.2)", marginBottom: 5 }} className="print:border-gray-400" />
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }} className="print:text-gray-400">Date</p>
              </div>
              <div>
                <div style={{ height: 36, borderBottom: "1px solid rgba(255,255,255,0.2)", marginBottom: 5 }} className="print:border-gray-400" />
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }} className="print:text-gray-400">State / Location</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notary Block ── */}
        <div style={{
          marginTop: 40,
          paddingTop: 28,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }} className="print:border-gray-200">
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 14 }} className="print:text-gray-400">
            Notary Acknowledgment
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.8, marginBottom: 24 }} className="print:text-gray-600">
            On this _____ day of _________________________, 20___, before me, the undersigned Notary Public, personally appeared <strong style={{ color: "rgba(255,255,255,0.7)" }} className="print:text-black">Ronald Antonio Cadet</strong>, who proved his identity to my satisfaction and declared the above to be true and correct.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div>
              <div style={{ height: 48, borderBottom: "1px solid rgba(255,255,255,0.15)", marginBottom: 7 }} className="print:border-gray-400" />
              <p style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.5)" }} className="print:text-black">Notary Public Signature</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }} className="print:text-gray-500">Commission Expires: _______________</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }} className="print:text-gray-500">State / Country: ___________________</p>
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10, minHeight: 80,
            }} className="print:border-gray-300">
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }} className="print:text-gray-400">Notary Seal</p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          marginTop: 48, paddingTop: 20,
          borderTop: "1px solid rgba(201,162,39,0.1)",
          textAlign: "center",
        }} className="print:border-gray-200">
          <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(201,162,39,0.4)", textTransform: "uppercase" }} className="print:text-gray-400">
            © CUXTOMCANDYCLUB LLC · ALL RIGHTS RESERVED · CUXTOMCANDYCLUB-FOUNDER-DECL-001
          </p>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", marginTop: 6 }} className="print:text-gray-400">
            This document is issued for the public record by Ronald Antonio Cadet, Sole Managing Member, CUXTOMCANDYCLUB LLC.
          </p>
        </div>

      </div>

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          * { color: inherit !important; background: transparent !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:text-black { color: black !important; }
          .print\\:text-gray-700 { color: #374151 !important; }
          .print\\:text-gray-600 { color: #4B5563 !important; }
          .print\\:text-gray-500 { color: #6B7280 !important; }
          .print\\:text-gray-400 { color: #9CA3AF !important; }
          .print\\:border-gray-400 { border-color: #9CA3AF !important; }
          .print\\:border-gray-300 { border-color: #D1D5DB !important; }
          .print\\:border-gray-200 { border-color: #E5E7EB !important; }
          .print\\:bg-gray-50 { background: #F9FAFB !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:px-12 { padding-left: 3rem !important; padding-right: 3rem !important; }
          .print\\:py-8 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
          @page { margin: 0.85in; size: letter; }
        }
      `}</style>
    </div>
  );
}

function Section({ number, title, gold, children }: {
  number: string;
  title: string;
  gold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      paddingBottom: 32,
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }} className="print:border-gray-100">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{
          fontSize: 10, fontWeight: 900, letterSpacing: "0.2em",
          color: gold ? "#C9A227" : "rgba(255,255,255,0.3)",
          textTransform: "uppercase",
        }} className="print:text-gray-400">
          SECTION {number}
        </span>
        <div style={{ flex: 1, height: 1, background: gold ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.06)" }} className="print:bg-gray-200" />
        <span style={{
          fontSize: 16, fontWeight: 900, letterSpacing: "0.05em",
          color: gold ? "#C9A227" : "#fff",
          textTransform: "uppercase",
        }} className="print:text-black">
          {title}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 13,
      color: "rgba(255,255,255,0.65)",
      lineHeight: 1.85,
      letterSpacing: "0.01em",
    }} className="print:text-gray-700">
      {children}
    </p>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return (
    <strong style={{ color: "#fff", fontWeight: 900 }} className="print:text-black">
      {children}
    </strong>
  );
}
