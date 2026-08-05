import { Link } from "wouter";

const GOLD = "#D4A017";

/**
 * 3C ONYX Shop — Shopify-powered storefront (additive page).
 * The store is connected; products appear here once the catalog is set up.
 */
export default function ShopPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "inherit" }}>
      <header style={{ padding: "28px 32px", borderBottom: "1px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, letterSpacing: "0.12em", margin: 0, color: GOLD, textTransform: "uppercase" }}>
            3C Onyx Shop
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
            Official 3C ONYX gear. Powered by Shopify — secure checkout, worldwide shipping.
          </p>
        </div>
        <Link href="/marketplace" style={{ color: "#aaa", fontSize: 13, textDecoration: "none", border: "1px solid #2a2a2a", padding: "8px 14px", borderRadius: 8 }}>
          Vehicle Marketplace →
        </Link>
      </header>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "72px 24px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px",
          borderRadius: 999, border: `1px solid ${GOLD}40`, background: `${GOLD}10`,
          fontSize: 12, letterSpacing: "0.08em", color: GOLD, textTransform: "uppercase", marginBottom: 28,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3ddc84", display: "inline-block" }} />
          Store connected
        </div>

        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 46, margin: "0 0 14px", letterSpacing: "0.04em" }}>
          The collection is being curated
        </h2>
        <p style={{ color: "#999", fontSize: 15, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
          The 3C ONYX store is live and connected. Products drop here soon —
          every order runs through Shopify's secure checkout with full buyer protection.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, textAlign: "left" }}>
          {[
            ["Secure Checkout", "Shopify-hosted payment — cards, Shop Pay, and more."],
            ["Tracked Fulfillment", "Real inventory, real shipping, order tracking end to end."],
            ["Member Drops", "Exclusive releases for Golden Key members first."],
          ].map(([t, d]) => (
            <div key={t} style={{ border: "1px solid #1e1e1e", borderRadius: 12, padding: "18px 20px", background: "#111" }}>
              <div style={{ color: GOLD, fontWeight: 700, fontSize: 14, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>{t}</div>
              <div style={{ color: "#888", fontSize: 13, lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
