import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const dir = "attached_assets/platform-reference";
const inventory = JSON.parse(fs.readFileSync(`${dir}/api-inventory.json`, "utf8"));
const stack = fs.readFileSync(`${dir}/stack-source-notes.txt`, "utf8");
const integrations = fs.readFileSync(`${dir}/integration-source-notes.txt`, "utf8");
const pdfPath = `${dir}/3C_ONYX_Tech_Stack_and_API_Reference.pdf`;
const txtPath = `${dir}/3C_ONYX_Tech_Stack_and_API_Reference.txt`;
const text = [];
const doc = new PDFDocument({
  size: "A4", margins: { top: 65, bottom: 57, left: 46, right: 46 },
  bufferPages: true, autoFirstPage: false,
  info: { Title: "3C ONYX | Tech Stack & API Reference", Author: "3C ONYX", Subject: "Source-verified platform technology, external integrations and API route inventory", Keywords: "3C ONYX, technology stack, REST, API, integrations, tRPC" },
});
const stream = fs.createWriteStream(pdfPath);
doc.pipe(stream);
doc.registerFont("Body", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
doc.registerFont("Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf");
doc.registerFont("Mono", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf");
const W = 503, colors = { ink: "#17202A", muted: "#526071", gold: "#98752B", rule: "#D9DFE5" };
let page = 0, section = "", headings = [];
function header() {
  page++;
  if (page === 1) return;
  doc.save();
  doc.font("Bold").fontSize(8).fillColor(colors.gold).text("3C ONYX  /  TECH STACK & API REFERENCE", 46, 27, { lineBreak: false });
  doc.moveTo(46, 46).lineTo(549, 46).strokeColor(colors.rule).stroke();
  doc.restore();
  doc.x = 46; doc.y = 65;
}
doc.on("pageAdded", header);
function ensure(h) { if (doc.y + h > doc.page.height - 64) doc.addPage(); }
function clean(s) { return s.replace(/`/g, "").replace(/\*\*/g, ""); }
function body(s, opts = {}) {
  text.push(s);
  doc.font(opts.mono ? "Mono" : "Body").fontSize(opts.size || 9.2).fillColor(opts.muted ? colors.muted : colors.ink);
  const value = clean(s);
  const h = doc.heightOfString(value, { width: W, lineGap: 3 });
  if (h < 680) ensure(h + 7);
  doc.text(value, 46, doc.y, { width: W, lineGap: 3, ...opts });
  doc.moveDown(0.55);
}
function h2(s) {
  ensure(55);
  text.push("\n" + s.toUpperCase());
  doc.font("Bold").fontSize(12).fillColor(colors.gold).text(s, 46, doc.y, { width: W });
  doc.moveDown(0.5);
}
function start(title) {
  doc.addPage();
  section = title;
  headings.push({ title, page });
  doc.outline.addItem(title);
  text.push("\n\n" + "=".repeat(74) + "\n" + title.toUpperCase() + "\n" + "=".repeat(74));
  doc.font("Bold").fontSize(23).fillColor(colors.ink).text(title, 46, 72, { width: W });
  doc.moveDown(0.75);
}
function sourceNotes(notes) {
  for (const p of notes.split(/\n\n/).filter(Boolean)) {
    const lines = p.split("\n");
    if (lines.length > 1 && /^[A-Z][A-Z /&-]+$/.test(lines[0])) {
      h2(lines.shift());
      for (const line of lines) body(line.replace(/^• /, ""), { size: 9 });
    } else if (lines[0]?.startsWith("Path abbreviations")) {
      h2("Evidence path key"); body(p);
    } else if (lines.length > 1 && !lines[0].startsWith("•") && lines.slice(1).some(l => l.startsWith("•"))) {
      h2(lines.shift());
      for (const line of lines) if (line.trim()) body(line.replace(/^• /, ""), { size: 9 });
    } else {
      for (const line of lines) if (line.trim()) body(line.replace(/^• /, ""), { size: 9 });
    }
  }
}

doc.addPage();
doc.rect(0, 0, 595.28, 841.89).fill("#101419");
doc.font("Bold").fontSize(12).fillColor("#D7B76A").text("3C ONYX", 46, 62);
doc.font("Bold").fontSize(33).fillColor("#FFFFFF").text("Tech Stack\n& API Reference", 46, 143, { width: W, lineGap: 8 });
doc.font("Body").fontSize(12).fillColor("#C7D1DC").text("A copy-and-paste technical inventory\nof the platform’s current source code.", 46, 284, { width: W, lineGap: 7 });
doc.moveTo(46, 372).lineTo(549, 372).strokeColor("#98752B").stroke();
doc.font("Bold").fontSize(27).fillColor("#D7B76A").text(`${inventory.endpoints.length} REST routes`, 46, 405);
doc.font("Body").fontSize(12).fillColor("#FFFFFF").text(`${inventory.trpc.length} tRPC procedures  •  ${new Set(inventory.endpoints.map(e => e.file)).size} HTTP route modules`, 46, 452);
doc.font("Body").fontSize(10).fillColor("#C7D1DC").text("Includes architecture, declared library versions, external API evidence, WebSocket details, and a complete mounted REST route index.", 46, 504, { width: 470, lineGap: 5 });
doc.font("Body").fontSize(9).fillColor("#C7D1DC").text("Source snapshot: October 1, 2026\nSelectable, searchable text. No credentials or API keys included.\nImplementation evidence is not a claim of live provider activation.", 46, 690, { width: W, lineGap: 6 });
text.push("3C ONYX — TECH STACK & API REFERENCE\nSource snapshot: October 1, 2026\nSelectable-text PDF; no credentials included.");
doc.addPage(); // reserve contents page
const contentsPage = page - 1;

start("1. Platform at a glance");
body("3C ONYX is a TypeScript-based automotive platform with a React web application, an Expo/React Native mobile app, an Express API service, and shared PostgreSQL data. This reference covers the implementation found in this workspace, not a certification of production readiness.");
h2("Copy-and-paste stack summary");
body("Frontend: React 19.1.0, Vite ^7.3.0, TypeScript ~5.9.2, Tailwind CSS ^4.1.14, Radix UI, Wouter ^3.3.5, TanStack React Query ^5.90.21, React Hook Form ^7.55.0, Framer Motion ^12.23.24, Recharts ^2.15.2, Leaflet ^1.9.4 and i18next ^25.10.5.");
body("Mobile: Expo ~54.0.27, React Native 0.81.5, Expo Router ~6.0.17, React Native Web ^0.21.0, Expo SecureStore, device location, camera and notification capabilities.");
body("Backend: Node.js (Replit configuration: Node 24), Express ^5, tRPC ^11.14.1, Zod 3.25.76, ws ^8.20.0, Pino, Helmet, express-rate-limit and request tracing.");
body("Data: PostgreSQL 16 configuration, pg ^8.20.0, Drizzle ORM ^0.45.1, drizzle-kit ^0.31.9, checked-in SQL migrations, optional Redis through ioredis ^5.11.1 and in-memory fallback.");
body("Authentication: bcrypt password hashing, jose JWTs, token revocation and role middleware; Google/Apple token verification and WebAuthn/passkey code. Web tokens use localStorage; mobile tokens use SecureStore. Protection varies by endpoint.");
body("AI and integrations: OpenAI, Google Gemini, Anthropic and Amazon Bedrock client code; Stripe, Shopify, MarketCheck, NHTSA, maps, messaging and other integration implementations. See Section 3 for implementation versus scaffold distinctions.");
body("Tooling: pnpm workspace, TypeScript project references, Orval OpenAPI code generation, esbuild API bundling, Vite web builds, Vitest, GitHub Actions and AWS CDK infrastructure templates.");
h2("What “all APIs” means in this document");
body(`The REST appendix includes all ${inventory.endpoints.length} literal HTTP method/path registrations reachable from the Express app through its router mounts. Source scanning also checked every TypeScript route file: ${inventory.unmounted.length} unmounted registrations and ${inventory.unresolved.length} unresolved dynamic route paths were found. The 14 tRPC procedures and /ws WebSocket interface are listed separately.`);
body("The external-integration section distinguishes working request/client code from partial adapters, mocks, catalog entries and links. An outbound call in source does not prove a configured account, correct vendor contract, production connectivity or successful transaction.");
body("This is an inventory, not a complete request/response schema or security audit. For payload fields, role checks, response codes and runtime behavior, use the cited source handler. The current OpenAPI document covers only health and selected Gemini operations, not the full API surface.");

start("2. Detailed technology stack");
sourceNotes(stack);

start("3. External APIs and integrations");
body("Legend: O = outbound API/client implementation; P = partial implementation; S = scaffold, mock, registry entry or link only. An integration can include both outbound code and fallback/sample behavior. None of these labels means it has been verified active.");
sourceNotes(integrations);

start("4. API access and interfaces");
h2("Base paths and calling conventions");
body("REST: use the platform origin followed by /api and the exact path shown in Section 5. Paths in this PDF already include /api; do not add it twice. No published hostname is assumed here. Browser applications should retain the artifact base-path prefix when constructing URLs.");
body("Dynamic parameters use Express notation such as :id or :requestId. Replace them with the actual resource identifier. Methods are significant: GET, POST, PUT, PATCH and DELETE are separate operations.");
body("Protected routes commonly accept Authorization: Bearer <token> or the existing token cookie. Roles and middleware vary by handler; the endpoint inventory deliberately does not label uninspected routes “public” or “secure.” Webhook routes may use provider signatures instead of user authentication.");
body("Example read-only request (placeholders, not credentials):");
body('curl "https://<platform-host>/api/services/requests" \\\n  -H "Authorization: Bearer <your-session-token>"', { mono: true, size: 8.6 });
body("Do not automatically run every listed endpoint: the inventory includes destructive operations, payment operations, admin actions, seed/demo endpoints and third-party dispatch requests.");
h2("tRPC /api/trpc");
body("Source: artifacts/api-server/src/lib/trpc.ts. Mounted through the Express tRPC adapter in routes/index.ts. The current procedures use publicProcedure and an empty server context; do not assume the REST auth middleware protects these procedures. Use the tRPC client/encoding, not plain REST bodies.");
for (const p of inventory.trpc) body(`${p.type.toUpperCase()}  /api/trpc/${p.name}  [source line ${p.line}]`, { mono: true, size: 8.8 });
h2("WebSocket /ws");
body("Source: artifacts/api-server/src/lib/wsHub.ts. The server sends a welcome message with clientId and timestamp. Supported inbound message handling: subscribe with room, unsubscribe with room, and ping. Responses include subscribed and pong. Server-side broadcasts are room-based. The attach handler shown in source does not perform a user authentication check; deployment and authorization behavior were not tested for this document.");
body('{"type":"subscribe","room":"<room-name>"}\n{"type":"unsubscribe","room":"<room-name>"}\n{"type":"ping"}', { mono: true, size: 8.8 });
h2("OpenAPI and infrastructure interfaces");
body("lib/api-spec/openapi.yaml declares OpenAPI 3.1.0, API-info version 0.1.0 and server base /api. Documented paths: /healthz; /gemini/conversations; /gemini/conversations/{id}; /gemini/conversations/{id}/messages; /gemini/generate-image. Orval generates shared React Query and Zod packages from this limited contract.");
body("AWS CDK templates also define potential API Gateway/Lambda interfaces. They are deployment templates, not confirmed active endpoints, and are not mixed into the mounted Express inventory. See infra/lib/stacks/api-stack.ts and infra/lib/lambda/agents/ for those separate definitions.");

start("5. Complete mounted REST API inventory");
body(`${inventory.endpoints.length} method/path registrations across ${new Set(inventory.endpoints.map(e => e.file)).size} source modules. Grouped alphabetically by route module. “L” is the handler’s source line at the snapshot date. Each row is an implemented registration, not proof of a successful or production-enabled operation. Use PDF search to find a path, provider or module.`);
const groups = new Map();
for (const endpoint of inventory.endpoints) {
  const key = endpoint.file;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(endpoint);
}
for (const [file, routes] of [...groups.entries()].sort(([a],[b]) => a.localeCompare(b))) {
  ensure(77);
  const label = file.replace("artifacts/api-server/src/routes/", "").replace(/\.ts$/, "");
  h2(`${label}  (${routes.length})`);
  body(`Source: ${file}`, { size: 7.5, muted: true });
  for (const r of routes) {
    const line = `${r.method.padEnd(7)} ${r.path}  [L${r.line}]`;
    text.push(line);
    doc.font("Mono").fontSize(8.2).fillColor(colors.ink);
    const height = doc.heightOfString(line, { width: W, lineGap: 2 });
    ensure(height + 6);
    doc.text(line, 46, doc.y, { width: W, lineGap: 2 });
    doc.y += 4;
  }
  doc.y += 8;
}

start("6. Declared dependency reference");
body("The following is the unique direct-dependency inventory from the root, application, shared-library and scripts manifests, plus the top-level infrastructure manifest. It excludes transitive dependencies. Values are declarations, not a claim about installed resolved versions. ^ and ~ retain their package-manager meanings. catalog: values are resolved from pnpm-workspace.yaml; workspace:* means an internal package.");
const yaml = fs.readFileSync("pnpm-workspace.yaml", "utf8");
const catalog = new Map();
for (const line of yaml.split("\n")) {
  const m = line.match(/^  ['"]?([^'":]+|@[^'"]+)['"]?:\s+(\S+)$/);
  if (m) catalog.set(m[1], m[2]);
}
const packages = [...inventory.packages];
if (fs.existsSync("infra/package.json")) {
  const p = JSON.parse(fs.readFileSync("infra/package.json", "utf8"));
  packages.push({ ...p, file: "infra/package.json" });
}
const deps = new Map();
for (const pkg of packages) for (const scope of ["dependencies", "devDependencies"]) {
  for (let [name, version] of Object.entries(pkg[scope] || {})) {
    if (version === "catalog:") version = catalog.get(name) || "catalog: (see pnpm-workspace.yaml)";
    if (!deps.has(name)) deps.set(name, new Map());
    const versions = deps.get(name);
    if (!versions.has(version)) versions.set(version, new Set());
    versions.get(version).add(pkg.file.replace("/package.json", "").replace("package.json", "root") + (scope === "devDependencies" ? " [dev]" : ""));
  }
}
body(`${deps.size} unique direct package names across ${packages.length} manifests. Packages may appear under multiple declared versions.`);
for (const [name, versions] of [...deps].sort(([a],[b]) => a.localeCompare(b))) {
  ensure(50);
  doc.font("Bold").fontSize(9).fillColor(colors.ink).text(name, 46, doc.y, { width: W });
  text.push("\n" + name);
  for (const [version, users] of versions) body(`${version} — ${[...users].join("; ")}`, { size: 7.6, muted: true });
}

start("7. Scope, source notes and cautions");
body("Method: parsed TypeScript syntax trees to follow the Express app’s imported router mounts and enumerate literal HTTP registrations. The scan supports mount prefixes and literal path arrays, and cross-checks route modules for unmounted registrations. tRPC procedures were extracted from router objects. External integrations and stack details were reviewed separately against source and manifests.");
body("Important distinctions: routes can return static or simulated data even when their names or response flags say “live.” SDK dependencies can be installed but unused. Infrastructure templates can exist without deployed infrastructure. Environment-variable names or presence checks are not evidence of a working vendor account.");
body("This document does not reproduce secret values, session tokens, private keys or database contents. It is a technical inventory and may expose internal endpoint names and source layout; share it with intended technical collaborators rather than treating it as a public security certification.");
body("Not performed for this request: live provider checks, production-database queries, payment transactions, full payload/response-schema extraction, route-by-route permission testing, load testing or compliance verification. API availability, behavior and versions may differ in a published build.");
body("For the complete lockfile-resolved dependency graph, consult pnpm-lock.yaml. For exact endpoint behavior, consult the source module and line reference. A matching plain-text export is supplied for convenient bulk copying.");

// Fill reserved contents page and add page numbers without disturbing text flow.
const total = doc.bufferedPageRange().count;
doc.switchToPage(contentsPage);
doc.font("Bold").fontSize(24).fillColor(colors.ink).text("Contents", 46, 77);
let contentsY = 132;
for (const item of headings) {
  doc.font("Body").fontSize(11).fillColor(colors.ink).text(item.title, 46, contentsY, { width: 440, lineBreak: false });
  doc.font("Bold").text(String(item.page), 512, contentsY, { width: 37, align: "right", lineBreak: false });
  contentsY += 38;
}
doc.font("Body").fontSize(9).fillColor(colors.muted).text("Use the PDF outline/bookmarks or search (Ctrl/Cmd+F) to jump to a section, route or provider. All content is real text, not screenshots. The REST inventory is alphabetical by source module.", 46, 474, { width: W, lineGap: 5 });
doc.font("Bold").fontSize(10).fillColor(colors.gold).text("READ THE STATUS LABELS", 46, 568);
doc.font("Body").fontSize(9).fillColor(colors.muted).text("Outbound client code, partial implementation, and scaffold-only entries are intentionally separated. This avoids presenting planned integrations as live services.", 46, 591, { width: W, lineGap: 5 });
for (let i = 1; i < total; i++) {
  doc.switchToPage(i);
  const previousBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.save();
  doc.font("Body").fontSize(7.5).fillColor(colors.muted).text(`Source snapshot: October 1, 2026   |   ${i + 1} / ${total}`, 46, 811, { width: W, align: "right", lineBreak: false });
  doc.restore();
  doc.page.margins.bottom = previousBottom;
}
doc.end();
fs.writeFileSync(txtPath, text.join("\n\n") + "\n");
await new Promise((resolve, reject) => { stream.on("finish", resolve); stream.on("error", reject); });
console.log(JSON.stringify({ pdfPath, txtPath, pages: total, endpoints: inventory.endpoints.length, dependencies: deps.size, bytes: fs.statSync(pdfPath).size }));