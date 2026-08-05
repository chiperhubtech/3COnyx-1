import { useEffect, useState } from "react";
import { Link } from "wouter";

const GOLD = "#D4A017";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ShopProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: { nodes: Array<{ id: string; title: string; availableForSale: boolean }> };
}

function formatPrice(amount: string, currency: string): string {
  const n = parseFloat(amount);
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
}

const MERCH_TITLES = ["Tee", "Hoodie", "Cap", "Keytag"];
function categoryOf(p: ShopProduct): "Gear" | "Services" | "Membership" {
  if (p.title.toLowerCase().includes("membership")) return "Membership";
  if (MERCH_TITLES.some((m) => p.title.includes(m))) return "Gear";
  return "Services";
}

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/shop/products`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("unavailable"))))
      .then((d) => setProducts(d.products || []))
      .catch(() => setError("The shop is temporarily unavailable — refresh to try again."))
      .finally(() => setLoading(false));
  }, []);

  const buyNow = async (p: ShopProduct) => {
    const variant = p.variants.nodes.find((v) => v.availableForSale) ?? p.variants.nodes[0];
    if (!variant) return;
    setBuying(p.id);
    try {
      const r = await fetch(`${BASE}/api/shop/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: variant.id, quantity: 1 }),
      });
      const d = await r.json();
      if (!r.ok || !d.checkoutUrl) throw new Error(d.error || "Checkout failed");
      window.location.href = d.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed — try again.");
      setBuying(null);
    }
  };

  const sections: Array<["Membership" | "Services" | "Gear", string]> = [
    ["Membership", "Your key to the network"],
    ["Services", "ONYX working for you"],
    ["Gear", "The member uniform"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff" }}>
      <header style={{ padding: "28px 32px", borderBottom: "1px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, letterSpacing: "0.12em", margin: 0, color: GOLD, textTransform: "uppercase" }}>
            3C Onyx Shop
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
            Official 3C ONYX memberships, services, and gear. Secure Shopify checkout.
          </p>
        </div>
        <Link href="/marketplace" style={{ color: "#aaa", fontSize: 13, textDecoration: "none", border: "1px solid #2a2a2a", padding: "8px 14px", borderRadius: 8 }}>
          Vehicle Marketplace →
        </Link>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px 80px" }}>
        {loading && <p style={{ color: "#888", textAlign: "center", padding: 60 }}>Opening the vault…</p>}
        {error && (
          <div style={{ background: "#2a1212", border: "1px solid #5c2626", color: "#f0a0a0", padding: "12px 18px", borderRadius: 10, marginBottom: 24, fontSize: 14 }}>
            {error}
          </div>
        )}

        {!loading && sections.map(([cat, tagline]) => {
          const items = products.filter((p) => categoryOf(p) === cat);
          if (!items.length) return null;
          return (
            <section key={cat} style={{ marginBottom: 56 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>{cat}</h2>
                <span style={{ color: "#666", fontSize: 13 }}>{tagline}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 18 }}>
                {items.map((p) => {
                  const price = formatPrice(p.priceRange.minVariantPrice.amount, p.priceRange.minVariantPrice.currencyCode);
                  const available = p.variants.nodes.some((v) => v.availableForSale);
                  return (
                    <div key={p.id} style={{ border: "1px solid #1e1e1e", borderRadius: 14, background: "#111", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      <div style={{ height: 150, background: p.featuredImage ? "#000" : `linear-gradient(135deg, #151515 0%, #1c1607 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {p.featuredImage ? (
                          <img src={p.featuredImage.url} alt={p.featuredImage.altText ?? p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, color: `${GOLD}50`, letterSpacing: "0.2em" }}>3C</span>
                        )}
                      </div>
                      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{p.title}</div>
                        <div style={{ color: "#888", fontSize: 12.5, lineHeight: 1.55, flex: 1 }}>
                          {p.description.length > 130 ? p.description.slice(0, 130) + "…" : p.description}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                          <span style={{ color: GOLD, fontWeight: 800, fontSize: 17 }}>{price}</span>
                          <button
                            onClick={() => buyNow(p)}
                            disabled={!available || buying === p.id}
                            style={{
                              background: available ? GOLD : "#333", color: available ? "#000" : "#777",
                              border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 800,
                              fontSize: 13, letterSpacing: "0.04em", cursor: available ? "pointer" : "default",
                              opacity: buying === p.id ? 0.6 : 1,
                            }}
                          >
                            {buying === p.id ? "Opening…" : available ? "Buy Now" : "Sold Out"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {!loading && !error && products.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", padding: 60 }}>The collection is being curated — check back soon.</p>
        )}
      </main>
    </div>
  );
}
