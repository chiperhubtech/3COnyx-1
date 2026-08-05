// Seeds the 3C ONYX Shopify catalog: create → price → stock → publish.
// All Admin calls go through shopify-admin-api.mjs (OpenInt proxy).
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const LOCATION_ID = "gid://shopify/Location/84828815430";
const PUBLICATION_ID = "gid://shopify/Publication/186962968646"; // Replit sales channel

const PRODUCTS = [
  { title: "Golden Key Membership — Annual", price: "499.00", qty: 500, physical: false,
    desc: "<p>Your key to the 3C ONYX Global Automotive Liquidity Network. Full member access for 12 months: ONYX AI concierge, member pricing on marketplace vehicles, Guardian health scores, dealer quote audits, and priority access to member drops. Your personal Golden Key referral code included.</p>" },
  { title: "ONYX Concierge Vehicle Sourcing", price: "299.00", qty: 500, physical: false,
    desc: "<p>Tell ONYX exactly what you want — year, make, model, spec, budget. Our network works dealer, wholesale, and factory channels to source it at club pricing. Fee credits toward your purchase when the deal closes.</p>" },
  { title: "Guardian Vehicle Inspection Report", price: "199.00", qty: 500, physical: false,
    desc: "<p>A full Guardian health assessment on any vehicle before you buy: condition signals, market position, wholesale potential, and a negotiation-ready valuation sealed with an ONYX proof hash.</p>" },
  { title: "ONYX Quote Audit Pro", price: "49.00", qty: 500, physical: false,
    desc: "<p>Hand ONYX your dealer quote. Get back a line-by-line audit: junk fees flagged, padding totaled in dollars, a fair target price, and the exact negotiation script to say at the desk.</p>" },
  { title: "3C ONYX Heavyweight Tee", price: "45.00", qty: 100, physical: true,
    desc: "<p>Premium heavyweight cotton tee in ONYX black with the gold 3C mark. Cut for the garage and the showroom.</p>" },
  { title: "3C ONYX Hoodie", price: "85.00", qty: 100, physical: true,
    desc: "<p>Midweight fleece hoodie in ONYX black, gold embroidered 3C mark. Member uniform for early mornings at the auction line.</p>" },
  { title: "3C ONYX Cap", price: "35.00", qty: 100, physical: true,
    desc: "<p>Structured six-panel cap, matte black with the gold 3C mark. One size fits most.</p>" },
  { title: "ONYX Carbon Keytag", price: "25.00", qty: 200, physical: true,
    desc: "<p>Carbon-weave keytag with gold 3C detailing. The quiet signal that you buy smarter than the sticker.</p>" },
];

function gql(payload) {
  const out = execFileSync("node", ["shopify-admin-api.mjs", JSON.stringify(payload)], { encoding: "utf8", cwd: process.cwd() });
  const json = JSON.parse(out);
  if (json.errors) throw new Error("GraphQL errors: " + JSON.stringify(json.errors));
  return json.data;
}

function assertNoUserErrors(step, node) {
  if (node.userErrors && node.userErrors.length) {
    throw new Error(`${step} failed: ${JSON.stringify(node.userErrors)}`);
  }
}

const catalog = [];

for (const p of PRODUCTS) {
  process.stdout.write(`Creating: ${p.title} ... `);

  // Resume-safe: reuse an existing product with the same title if present.
  const existing = gql({
    query: `query Find($q: String!) { products(first: 1, query: $q) { nodes { id title handle } } }`,
    variables: { q: `title:'${p.title.replace(/'/g, "\\'")}'` },
  }).products.nodes[0];

  let productId, handle;
  if (existing && existing.title === p.title) {
    productId = existing.id;
    handle = existing.handle;
  } else {
    const created = gql({
      query: `mutation ProductCreate($product: ProductCreateInput!) { productCreate(product: $product) { product { id title handle } userErrors { field message } } }`,
      variables: { product: { title: p.title, descriptionHtml: p.desc, status: "ACTIVE" } },
    }).productCreate;
    assertNoUserErrors("productCreate", created);
    productId = created.product.id;
    handle = created.product.handle;
  }

  const variants = gql({
    query: `query PV($id: ID!) { product(id: $id) { variants(first: 5) { nodes { id inventoryItem { id } } } } }`,
    variables: { id: productId },
  }).product.variants.nodes;
  const variantId = variants[0].id;
  const inventoryItemId = variants[0].inventoryItem.id;

  const priced = gql({
    query: `mutation PVBU($productId: ID!, $variants: [ProductVariantsBulkInput!]!) { productVariantsBulkUpdate(productId: $productId, variants: $variants) { productVariants { id price } userErrors { field message } } }`,
    variables: { productId, variants: [{ id: variantId, price: p.price }] },
  }).productVariantsBulkUpdate;
  assertNoUserErrors("priceUpdate", priced);

  const tracked = gql({
    query: `mutation IIU($id: ID!, $input: InventoryItemInput!) { inventoryItemUpdate(id: $id, input: $input) { inventoryItem { id tracked } userErrors { field message } } }`,
    variables: { id: inventoryItemId, input: { tracked: true, requiresShipping: p.physical } },
  }).inventoryItemUpdate;
  assertNoUserErrors("inventoryItemUpdate", tracked);

  const activated = gql({
    query: `mutation IA($inventoryItemId: ID!, $locationId: ID!) { inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId) @idempotent(key: "activate-${inventoryItemId.split("/").pop()}") { inventoryLevel { id } userErrors { field message } } }`,
    variables: { inventoryItemId, locationId: LOCATION_ID },
  }).inventoryActivate;
  assertNoUserErrors("inventoryActivate", activated);

  // This API version requires changeFromQuantity — read the current level first.
  const level = gql({
    query: `query Lvl($id: ID!) { inventoryItem(id: $id) { inventoryLevel(locationId: "${LOCATION_ID}") { quantities(names: ["available"]) { name quantity } } } }`,
    variables: { id: inventoryItemId },
  }).inventoryItem.inventoryLevel;
  const current = level?.quantities?.find((q) => q.name === "available")?.quantity ?? 0;

  if (current !== p.qty) {
    const setQty = gql({
      query: `mutation ISQ($input: InventorySetQuantitiesInput!) { inventorySetQuantities(input: $input) @idempotent(key: "setqty-${inventoryItemId.split("/").pop()}-${p.qty}") { inventoryAdjustmentGroup { id } userErrors { field message } } }`,
      variables: { input: { name: "available", reason: "correction", quantities: [{ inventoryItemId, locationId: LOCATION_ID, quantity: p.qty, changeFromQuantity: current }] } },
    }).inventorySetQuantities;
    assertNoUserErrors("inventorySetQuantities", setQty);
  }

  const published = gql({
    query: `mutation Pub($productId: ID!, $publicationId: ID!) { publishablePublish(id: $productId, input: [{ publicationId: $publicationId }]) { publishable { publishedOnPublication(publicationId: $publicationId) } userErrors { field message } } }`,
    variables: { productId, publicationId: PUBLICATION_ID },
  }).publishablePublish;
  assertNoUserErrors("publishablePublish", published);

  catalog.push({ title: p.title, handle, productId, variantId, price: p.price });
  console.log("OK");
}

writeFileSync("scripts/shop-catalog.json", JSON.stringify(catalog, null, 2));
console.log(`\nSeeded ${catalog.length} products. Mapping written to scripts/shop-catalog.json`);
