import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/src/theme";
import { COLORS } from "@/constants/colors";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ProductOption {
  id: string;
  label: string;
  type: string;
  choices: { value: string; label: string; priceAdj?: number; hex?: string }[];
}

interface Product {
  id: string;
  name: string;
  brand: string;
  supplierName: string;
  category: string;
  subcategory: string;
  price: number;
  salePrice?: number;
  source: "sema" | "api2cart" | "apexx";
  imageColor: string;
  categoryIcon: string;
  description: string;
  longDescription: string;
  specs: Record<string, string>;
  options: ProductOption[];
  inStock: boolean;
  leadTime: string;
  arEnabled: boolean;
  installTime: string;
  rating: number;
  reviewCount: number;
  fitmentConfirmed: boolean | null;
  warranty: string;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  count: number;
  color: string;
}

interface ProductsData {
  products: Product[];
  total: number;
}

interface CategoriesData {
  categories: Category[];
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const VEHICLES = [
  { id: "",   label: "All Vehicles" },
  { id: "v1", label: "2021 BMW M5" },
  { id: "v2", label: "2019 Mercedes S580" },
  { id: "v3", label: "2023 Porsche 911 GT3" },
];

const SOURCE_COLOR: Record<string, string> = {
  sema:     "#C9A227",
  api2cart: "#3B82F6",
  apexx:    "#8B5CF6",
};

const SOURCE_LABEL: Record<string, string> = {
  sema:     "SEMA",
  api2cart: "API2CART",
  apexx:    "APEXX",
};

function featherIcon(category: string): keyof typeof Feather.glyphMap {
  const map: Record<string, keyof typeof Feather.glyphMap> = {
    exhaust:     "wind",
    wheels:      "circle",
    brakes:      "disc",
    suspension:  "settings",
    intake:      "cloud",
    exterior:    "triangle",
    interior:    "user",
    lighting:    "sun",
    audio:       "volume-2",
    performance: "cpu",
  };
  return map[category] ?? "package";
}

/* ─── Star row ───────────────────────────────────────────────────────────── */

function Stars({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {[1,2,3,4,5].map(i => (
        <Feather key={i} name="star" size={9} color={i <= Math.floor(rating) ? COLORS.gold : "rgba(255,255,255,0.15)"} />
      ))}
    </View>
  );
}

/* ─── Product card (2-column grid) ──────────────────────────────────────── */

function ProductCard({ product, vehicleId, onPress }: { product: Product; vehicleId: string; onPress: () => void }) {
  const { theme } = useTheme();
  const price = product.salePrice ?? product.price;
  const srcColor = SOURCE_COLOR[product.source];

  return (
    <Pressable onPress={onPress} style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {/* Image area */}
      <View style={[styles.productImageArea, { backgroundColor: `${product.imageColor}15` }]}>
        <Feather name={featherIcon(product.category)} size={32} color={product.imageColor} />

        {/* Source badge */}
        <View style={[styles.sourceBadge, { backgroundColor: `${srcColor}15`, borderColor: `${srcColor}30` }]}>
          <Text style={[styles.sourceBadgeText, { color: srcColor }]}>{SOURCE_LABEL[product.source]}</Text>
        </View>

        {/* AR badge */}
        {product.arEnabled && (
          <View style={[styles.arBadge, { backgroundColor: `${COLORS.emerald}15`, borderColor: `${COLORS.emerald}30` }]}>
            <Feather name="eye" size={7} color={COLORS.emerald} />
            <Text style={[styles.arBadgeText, { color: COLORS.emerald }]}>AR</Text>
          </View>
        )}

        {/* Fitment */}
        {vehicleId && product.fitmentConfirmed !== null && (
          <View style={[styles.fitmentBadge, { backgroundColor: product.fitmentConfirmed ? `${COLORS.emerald}20` : "#EF444420" }]}>
            <Feather name={product.fitmentConfirmed ? "check-circle" : "x-circle"} size={8} color={product.fitmentConfirmed ? COLORS.emerald : "#EF4444"} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.productInfo}>
        <Text style={[styles.productBrand, { color: theme.gold }]} numberOfLines={1}>{product.brand.toUpperCase()}</Text>
        <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{product.name}</Text>
        <Stars rating={product.rating} />
        <Text style={[styles.productPrice, { color: theme.text }]}>${price.toLocaleString()}</Text>
        <Text style={[styles.productLead, { color: theme.textFaint }]} numberOfLines={1}>{product.leadTime}</Text>
      </View>
    </Pressable>
  );
}

/* ─── Product detail sheet ──────────────────────────────────────────────── */

function ProductSheet({ product, vehicleId, onClose, onAddToCart }: {
  product: Product;
  vehicleId: string;
  onClose: () => void;
  onAddToCart: () => void;
}) {
  const { theme } = useTheme();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAR, setShowAR] = useState(false);

  const finalPrice = (product.salePrice ?? product.price) + Object.values(selectedOptions).reduce((adj, val) => {
    for (const opt of product.options) {
      const choice = opt.choices.find(c => c.value === val);
      if (choice?.priceAdj) return adj + choice.priceAdj;
    }
    return adj;
  }, 0);

  const handleAdd = async () => {
    setAdding(true);
    await new Promise(r => setTimeout(r, 1000));
    setAdding(false);
    setAdded(true);
    onAddToCart();
    setTimeout(() => setAdded(false), 2500);
  };

  const srcColor = SOURCE_COLOR[product.source];
  const vehicle = VEHICLES.find(v => v.id === vehicleId);

  return (
    <View style={[styles.sheetOverlay, { backgroundColor: "rgba(0,0,0,0.8)" }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={[styles.sheetHeader, { borderBottomColor: theme.cardBorder }]}>
          <View style={[styles.sourceBadgeLg, { backgroundColor: `${srcColor}15`, borderColor: `${srcColor}30` }]}>
            <Text style={[styles.sourceBadgeLgText, { color: srcColor }]}>{SOURCE_LABEL[product.source]} VERIFIED</Text>
          </View>
          <Pressable onPress={onClose} style={styles.sheetClose}>
            <Feather name="x" size={20} color={theme.textMuted} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
          {/* Product hero */}
          <View style={[styles.sheetHero, { backgroundColor: `${product.imageColor}15` }]}>
            <Feather name={featherIcon(product.category)} size={56} color={product.imageColor} />
            {product.arEnabled && (
              <View style={[styles.arReadyBadge, { backgroundColor: `${COLORS.emerald}15`, borderColor: `${COLORS.emerald}30` }]}>
                <Feather name="eye" size={10} color={COLORS.emerald} />
                <Text style={[styles.arReadyText, { color: COLORS.emerald }]}>AR READY</Text>
              </View>
            )}
          </View>

          {/* Brand + name */}
          <View style={styles.sheetBody}>
            <Text style={[styles.sheetBrand, { color: srcColor }]}>{product.brand.toUpperCase()} · {product.supplierName}</Text>
            <Text style={[styles.sheetName, { color: theme.text }]}>{product.name}</Text>
            <Text style={[styles.sheetDesc, { color: theme.textSub }]}>{product.longDescription}</Text>

            {/* Fitment */}
            {vehicleId && product.fitmentConfirmed !== null && (
              <View style={[styles.fitmentRow, {
                backgroundColor: product.fitmentConfirmed ? `${COLORS.emerald}12` : "#EF444412",
                borderColor: product.fitmentConfirmed ? `${COLORS.emerald}30` : "#EF444430",
              }]}>
                <Feather name={product.fitmentConfirmed ? "check-circle" : "x-circle"} size={14} color={product.fitmentConfirmed ? COLORS.emerald : "#EF4444"} />
                <Text style={[styles.fitmentText, { color: product.fitmentConfirmed ? COLORS.emerald : "#EF4444" }]}>
                  {product.fitmentConfirmed ? `✓ Confirmed fitment for ${vehicle?.label ?? "your vehicle"}` : `No fitment data for ${vehicle?.label ?? "this vehicle"}`}
                </Text>
              </View>
            )}

            {/* AR Try-On */}
            {product.arEnabled && (
              <Pressable
                onPress={() => setShowAR(!showAR)}
                style={[styles.arButton, { backgroundColor: showAR ? `${COLORS.emerald}12` : theme.goldMuted, borderColor: showAR ? `${COLORS.emerald}30` : theme.goldBorder }]}
              >
                <Feather name="eye" size={14} color={showAR ? COLORS.emerald : theme.gold} />
                <Text style={[styles.arButtonText, { color: showAR ? COLORS.emerald : theme.gold }]}>
                  {showAR ? "Virtual Try-On Active" : "Virtual Try-On — View on Your Car"}
                </Text>
              </Pressable>
            )}

            {/* AR view */}
            {showAR && (
              <View style={[styles.arView, { backgroundColor: "#0A0A14", borderColor: theme.cardBorder }]}>
                <Text style={[styles.arViewLabel, { color: theme.gold }]}>⬡ VIRTUAL TRY-ON ACTIVE</Text>
                <View style={styles.arCarSilhouette}>
                  {/* Simplified car representation */}
                  <View style={[styles.arCarBody, { backgroundColor: "#1A1A2A", borderColor: theme.goldBorder }]}>
                    <Feather name="navigation" size={24} color={product.imageColor} />
                  </View>
                  <View style={[styles.arProductLabel, { backgroundColor: `${product.imageColor}20`, borderColor: `${product.imageColor}40` }]}>
                    <Feather name={featherIcon(product.category)} size={14} color={product.imageColor} />
                    <Text style={[styles.arProductLabelText, { color: product.imageColor }]}>{product.brand} {product.subcategory}</Text>
                  </View>
                </View>
                {/* Color swatches */}
                {product.options.filter(o => o.type === "color").map(opt => (
                  <View key={opt.id} style={styles.arColors}>
                    {opt.choices.filter(c => c.hex).map(c => (
                      <Pressable
                        key={c.value}
                        onPress={() => setSelectedOptions(prev => ({ ...prev, [opt.id]: c.value }))}
                        style={[styles.arColorSwatch, { backgroundColor: c.hex, borderColor: selectedOptions[opt.id] === c.value ? "#fff" : "transparent" }]}
                      />
                    ))}
                  </View>
                ))}
                <Text style={[styles.arViewSub, { color: theme.textFaint }]}>
                  Viewing {vehicle?.label ?? "your vehicle"} with {product.name}
                </Text>
              </View>
            )}

            {/* Options */}
            {product.options.map(opt => (
              <View key={opt.id} style={styles.optionSection}>
                <Text style={[styles.optionLabel, { color: theme.textMuted }]}>{opt.label.toUpperCase()}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
                  {opt.choices.map(c => {
                    const isSelected = selectedOptions[opt.id] === c.value;
                    return (
                      <Pressable
                        key={c.value}
                        onPress={() => setSelectedOptions(prev => ({ ...prev, [opt.id]: c.value }))}
                        style={[styles.optionChip, {
                          backgroundColor: isSelected ? theme.goldMuted : theme.card,
                          borderColor: isSelected ? theme.gold : theme.cardBorder,
                        }]}
                      >
                        {c.hex && <View style={[styles.optionColorDot, { backgroundColor: c.hex }]} />}
                        <Text style={[styles.optionChipText, { color: isSelected ? theme.gold : theme.textSub }]}>{c.label}</Text>
                        {c.priceAdj && c.priceAdj > 0 && <Text style={[styles.optionPriceAdj, { color: theme.textFaint }]}>+${c.priceAdj}</Text>}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ))}

            {/* Specs */}
            <View style={[styles.specsTable, { borderColor: theme.cardBorder }]}>
              {Object.entries(product.specs).map(([key, val], i) => (
                <View key={key} style={[styles.specRow, { backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTopColor: theme.textFaint }]}>
                  <Text style={[styles.specKey, { color: theme.textFaint }]}>{key}</Text>
                  <Text style={[styles.specVal, { color: theme.textSub }]}>{val}</Text>
                </View>
              ))}
            </View>

            {/* Info pills */}
            <View style={styles.infoPills}>
              {[
                { icon: "truck", label: "Ships", value: product.leadTime, color: "#3B82F6" },
                { icon: "tool", label: "Install", value: product.installTime, color: COLORS.emerald },
                { icon: "shield", label: "Warranty", value: product.warranty, color: "#8B5CF6" },
              ].map(info => (
                <View key={info.label} style={[styles.infoPill, { borderColor: `${info.color}25`, backgroundColor: `${info.color}08` }]}>
                  <Feather name={info.icon as keyof typeof Feather.glyphMap} size={11} color={info.color} />
                  <Text style={[styles.infoPillLabel, { color: info.color }]}>{info.label}</Text>
                  <Text style={[styles.infoPillValue, { color: theme.textSub }]} numberOfLines={2}>{info.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={[styles.sheetCTA, { borderTopColor: theme.cardBorder, backgroundColor: theme.bg }]}>
          <View style={styles.ctaPrice}>
            <Text style={[styles.ctaPriceLabel, { color: theme.textFaint }]}>TOTAL</Text>
            <Text style={[styles.ctaPriceValue, { color: theme.text }]}>${finalPrice.toLocaleString()}</Text>
            <Text style={[styles.ctaFee, { color: theme.textFaint }]}>+ $24.99 dropship</Text>
          </View>
          <Pressable
            onPress={handleAdd}
            disabled={adding || added || !product.inStock}
            style={[styles.ctaBtn, {
              backgroundColor: added ? COLORS.emerald : product.inStock ? COLORS.gold : "#333",
            }]}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Feather name={added ? "check-circle" : "shopping-cart"} size={14} color={added ? "#fff" : "#000"} />
                <Text style={[styles.ctaBtnText, { color: added ? "#fff" : "#000" }]}>
                  {added ? "Added!" : product.inStock ? "Add to Cart" : "Pre-Order"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ─── Main Aftermarket screen ────────────────────────────────────────────── */

export default function AftermarketScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState("v1");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchQ, setSearchQ] = useState("");

  const productPath = useCallback(() => {
    const qs = new URLSearchParams();
    if (selectedCategory !== "all") qs.set("category", selectedCategory);
    if (selectedVehicle) qs.set("vehicleId", selectedVehicle);
    if (searchQ) qs.set("q", searchQ);
    const str = qs.toString();
    return `/aftermarket/products${str ? `?${str}` : ""}`;
  }, [selectedCategory, selectedVehicle, searchQ]);

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ["aftermarket-categories"],
    queryFn: () => apiFetch<CategoriesData>("/aftermarket/categories"),
    staleTime: 300_000,
  });

  const path = productPath();
  const { data: productsData, isLoading: prodLoading } = useQuery({
    queryKey: ["aftermarket-products", path],
    queryFn: () => apiFetch<ProductsData>(path),
    staleTime: 60_000,
  });

  const categories: Category[] = catData?.categories ?? [];
  const products: Product[] = productsData?.products ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>AFTERMARKET</Text>
          <Text style={[styles.headerSub, { color: theme.gold }]}>SEMA · API2CART · APEXX</Text>
        </View>
        <Pressable style={[styles.cartBtn, { backgroundColor: theme.goldMuted, borderColor: theme.goldBorder }]}>
          <Feather name="shopping-cart" size={16} color={theme.gold} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Network badge strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.networkStrip, { borderBottomColor: theme.cardBorder }]} contentContainerStyle={styles.networkStripRow}>
        {[
          { color: "#C9A227", label: "SEMA VERIFIED", dot: true },
          { color: "#3B82F6", label: "API2CART LIVE", dot: true },
          { color: "#8B5CF6", label: "APEXX ACTIVE", dot: true },
          { color: COLORS.emerald, label: "12 SUPPLIERS", dot: false },
          { color: "#F97316", label: "DROPSHIP READY", dot: false },
        ].map(s => (
          <View key={s.label} style={styles.networkBadge}>
            {s.dot && <View style={[styles.networkDot, { backgroundColor: s.color }]} />}
            <Text style={[styles.networkLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Vehicle selector + search */}
      <View style={[styles.filtersRow, { borderBottomColor: theme.cardBorder }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleRow}>
          {VEHICLES.map(v => {
            const isSelected = selectedVehicle === v.id;
            return (
              <Pressable
                key={v.id}
                onPress={() => setSelectedVehicle(v.id)}
                style={[styles.vehicleChip, {
                  backgroundColor: isSelected ? theme.goldMuted : "transparent",
                  borderColor: isSelected ? theme.gold : theme.cardBorder,
                }]}
              >
                <Feather name="truck" size={10} color={isSelected ? theme.gold : theme.textFaint} />
                <Text style={[styles.vehicleChipText, { color: isSelected ? theme.gold : theme.textFaint }]}>{v.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.searchRow, { borderBottomColor: theme.cardBorder }]}>
        <Feather name="search" size={14} color={theme.textFaint} />
        <TextInput
          value={searchQ}
          onChangeText={setSearchQ}
          placeholder="Search Borla, Vossen, Brembo…"
          placeholderTextColor={theme.textFaint}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {searchQ.length > 0 && (
          <Pressable onPress={() => setSearchQ("")}>
            <Feather name="x" size={14} color={theme.textFaint} />
          </Pressable>
        )}
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catRow}>
        <Pressable
          onPress={() => setSelectedCategory("all")}
          style={[styles.catChip, {
            backgroundColor: selectedCategory === "all" ? theme.goldMuted : "transparent",
            borderColor: selectedCategory === "all" ? theme.gold : theme.cardBorder,
          }]}
        >
          <Text style={[styles.catChipText, { color: selectedCategory === "all" ? theme.gold : theme.textFaint }]}>All</Text>
        </Pressable>
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[styles.catChip, {
                backgroundColor: isSelected ? `${cat.color}15` : "transparent",
                borderColor: isSelected ? cat.color : theme.cardBorder,
              }]}
            >
              <Feather name={featherIcon(cat.id)} size={11} color={isSelected ? cat.color : theme.textFaint} />
              <Text style={[styles.catChipText, { color: isSelected ? cat.color : theme.textFaint }]}>{cat.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Product grid */}
      {prodLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={COLORS.gold} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading products…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Fitment note */}
          {selectedVehicle && (
            <View style={[styles.fitmentNote, { backgroundColor: `${COLORS.emerald}10`, borderColor: `${COLORS.emerald}25` }]}>
              <Feather name="check-circle" size={11} color={COLORS.emerald} />
              <Text style={[styles.fitmentNoteText, { color: COLORS.emerald }]}>
                Smart Fitment Active — {products.filter(p => p.fitmentConfirmed).length} products fit your {VEHICLES.find(v => v.id === selectedVehicle)?.label}
              </Text>
            </View>
          )}

          <View style={styles.gridRow}>
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                vehicleId={selectedVehicle}
                onPress={() => setActiveProduct(product)}
              />
            ))}
          </View>

          {products.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="package" size={32} color={theme.textFaint} />
              <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>No products found</Text>
              <Text style={[styles.emptyText, { color: theme.textFaint }]}>Try adjusting your filters or vehicle selection</Text>
            </View>
          )}

          {/* Source callout footer */}
          {products.length > 0 && (
            <View style={styles.sourceFooter}>
              {[
                { color: "#C9A227", title: "SEMA DATA CO-OP", body: "Every SEMA-verified product from exhibitors at the world's premier automotive aftermarket show." },
                { color: "#3B82F6", title: "API2CART", body: "Live inventory from supplier Shopify, WooCommerce & Magento stores via unified commerce API." },
                { color: "#8B5CF6", title: "APEXX NETWORK", body: "Curated elite supplier tiers for quality, lead time, and dropship reliability on every order." },
              ].map(s => (
                <View key={s.title} style={[styles.sourceCard, { backgroundColor: `${s.color}08`, borderColor: `${s.color}20` }]}>
                  <Text style={[styles.sourceCardTitle, { color: s.color }]}>{s.title}</Text>
                  <Text style={[styles.sourceCardBody, { color: theme.textFaint }]}>{s.body}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Product sheet */}
      {activeProduct && (
        <ProductSheet
          product={activeProduct}
          vehicleId={selectedVehicle}
          onClose={() => setActiveProduct(null)}
          onAddToCart={() => { setCartCount(c => c + 1); }}
        />
      )}
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container:   { flex: 1 },
  scroll:      { flex: 1 },

  // Header
  header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  headerBack:  { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 3 },
  headerSub:   { fontSize: 8, fontWeight: "700", letterSpacing: 2, marginTop: 2 },
  cartBtn:     { position: "relative", width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cartBadge:   { position: "absolute", top: -4, right: -4, backgroundColor: "#EF4444", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center" },
  cartBadgeText: { fontSize: 8, fontWeight: "800", color: "#fff" },

  // Network strip
  networkStrip:    { flexShrink: 0, borderBottomWidth: 1 },
  networkStripRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 16 },
  networkBadge:    { flexDirection: "row", alignItems: "center", gap: 5 },
  networkDot:      { width: 5, height: 5, borderRadius: 3 },
  networkLabel:    { fontSize: 8, fontWeight: "800", letterSpacing: 1.5 },

  // Filters
  filtersRow:   { borderBottomWidth: 1 },
  vehicleRow:   { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  vehicleChip:  { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  vehicleChipText: { fontSize: 9, fontWeight: "700" },
  searchRow:    { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchInput:  { flex: 1, fontSize: 13, fontWeight: "500" },
  catScroll:    { flexShrink: 0 },
  catRow:       { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, paddingBottom: 10 },
  catChip:      { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  catChipText:  { fontSize: 10, fontWeight: "700" },

  // Grid
  grid:    { paddingHorizontal: 12, paddingTop: 8 },
  gridRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  // Fitment note
  fitmentNote:     { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  fitmentNoteText: { fontSize: 10, fontWeight: "600", flex: 1 },

  // Product card
  productCard:      { width: "47.5%", borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  productImageArea: { alignItems: "center", justifyContent: "center", height: 100, position: "relative" },
  sourceBadge:      { position: "absolute", top: 6, left: 6, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  sourceBadgeText:  { fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  arBadge:          { position: "absolute", top: 6, right: 6, flexDirection: "row", alignItems: "center", gap: 2, borderWidth: 1, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  arBadgeText:      { fontSize: 7, fontWeight: "800" },
  fitmentBadge:     { position: "absolute", bottom: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  productInfo:      { padding: 10, gap: 4 },
  productBrand:     { fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  productName:      { fontSize: 11, fontWeight: "700", lineHeight: 15 },
  starRow:          { flexDirection: "row", gap: 2, marginTop: 2 },
  productPrice:     { fontSize: 16, fontWeight: "900" },
  productLead:      { fontSize: 8, fontWeight: "500" },

  // Loading
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:   { fontSize: 13, fontWeight: "500" },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyText:  { fontSize: 12, textAlign: "center" },

  // Source footer
  sourceFooter: { marginTop: 24, gap: 10 },
  sourceCard:   { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  sourceCardTitle: { fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  sourceCardBody:  { fontSize: 11, lineHeight: 16 },

  // Product sheet
  sheetOverlay:  { position: "absolute", inset: 0, zIndex: 100, justifyContent: "flex-end" },
  sheet:         { height: "92%", borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  sheetHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  sheetClose:    { padding: 4 },
  sheetScroll:   { paddingBottom: 120 },
  sheetHero:     { alignItems: "center", justifyContent: "center", height: 160, position: "relative" },
  arReadyBadge:  { position: "absolute", bottom: 12, flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  arReadyText:   { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  sheetBody:     { padding: 20, gap: 16 },
  sheetBrand:    { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  sheetName:     { fontSize: 20, fontWeight: "900", lineHeight: 26 },
  sheetDesc:     { fontSize: 12, lineHeight: 19 },
  sourceBadgeLg: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sourceBadgeLgText: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },

  // Fitment row
  fitmentRow:  { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  fitmentText: { fontSize: 12, fontWeight: "600", flex: 1 },

  // AR
  arButton:       { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  arButtonText:   { fontSize: 12, fontWeight: "700" },
  arView:         { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  arViewLabel:    { fontSize: 10, fontWeight: "900", letterSpacing: 2, textAlign: "center" },
  arCarSilhouette: { alignItems: "center", gap: 10 },
  arCarBody:      { width: "100%", height: 80, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  arProductLabel: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  arProductLabelText: { fontSize: 11, fontWeight: "700" },
  arColors:       { flexDirection: "row", gap: 8, justifyContent: "center" },
  arColorSwatch:  { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  arViewSub:      { fontSize: 10, textAlign: "center" },

  // Options
  optionSection: { gap: 8 },
  optionLabel:   { fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  optionRow:     { flexDirection: "row", gap: 8 },
  optionChip:    { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  optionColorDot: { width: 10, height: 10, borderRadius: 5 },
  optionChipText:  { fontSize: 11, fontWeight: "600" },
  optionPriceAdj:  { fontSize: 9 },

  // Specs
  specsTable: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  specRow:    { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  specKey:    { fontSize: 11, fontWeight: "600", flex: 1 },
  specVal:    { fontSize: 11, fontWeight: "700", flex: 1, textAlign: "right" },

  // Info pills
  infoPills: { flexDirection: "row", gap: 8 },
  infoPill:  { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10, gap: 4 },
  infoPillLabel: { fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  infoPillValue: { fontSize: 10, fontWeight: "600" },

  // CTA
  sheetCTA:    { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1 },
  ctaPrice:    { gap: 2 },
  ctaPriceLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 1 },
  ctaPriceValue: { fontSize: 22, fontWeight: "900" },
  ctaFee:      { fontSize: 9 },
  ctaBtn:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 16 },
  ctaBtnText:  { fontSize: 14, fontWeight: "800" },
});
