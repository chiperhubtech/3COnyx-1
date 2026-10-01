import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const out = path.join(root, "attached_assets/platform-reference");
fs.mkdirSync(out, { recursive: true });
const cache = new Map();
const methods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "all"]);
const rel = p => path.relative(root, p);
function resolve(from, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(from), spec);
  return [base, base + ".ts", base + ".tsx", path.join(base, "index.ts")].find(p => fs.existsSync(p) && fs.statSync(p).isFile()) || null;
}
function parse(file) {
  if (cache.has(file)) return cache.get(file);
  const text = fs.readFileSync(file, "utf8");
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const info = { file, ast, imports: new Map(), exports: new Map(), routers: new Set(), calls: [] };
  cache.set(file, info);
  function walk(node) {
    if (ts.isImportDeclaration(node) && node.importClause) {
      const target = resolve(file, node.moduleSpecifier.text);
      if (target) {
        if (node.importClause.name) info.imports.set(node.importClause.name.text, { target, exportName: "default" });
        const bindings = node.importClause.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) for (const e of bindings.elements)
          info.imports.set(e.name.text, { target, exportName: (e.propertyName || e.name).text });
      }
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer)) {
      const init = node.initializer.expression.getText(ast);
      if (["Router", "express.Router", "express"].includes(init)) info.routers.add(node.name.text);
      const statement = node.parent?.parent;
      if (statement?.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) info.exports.set(node.name.text, node.name.text);
    }
    if (ts.isExportAssignment(node)) info.exports.set("default", node.expression.getText(ast));
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      if (methods.has(method) || method === "use") info.calls.push({
        owner: node.expression.expression.getText(ast), method, args: node.arguments,
        line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
      });
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
  return info;
}
function literals(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
  if (ts.isArrayLiteralExpression(node)) {
    const items = node.elements.map(literals);
    return items.every(Boolean) ? items.flat() : null;
  }
  return null;
}
const endpoints = [], mounts = [], unresolved = [], visited = new Set(), registrations = new Set();
function join(a, b) { return (a + "/" + b).replace(/\/+/g, "/").replace(/\/$/, "") || "/"; }
function traverse(file, owner, prefix, chain = []) {
  const key = `${file}|${owner}|${prefix}`;
  if (visited.has(key)) return;
  visited.add(key);
  if (chain.includes(file + ":" + owner)) return;
  const info = parse(file);
  const relevant = info.calls.filter(c => c.owner === owner).sort((a,b) => a.line - b.line);
  for (const call of relevant) {
    const paths = literals(call.args[0]);
    if (call.method !== "use") {
      registrations.add(file + ":" + call.line);
      if (!paths) {
        unresolved.push({ file: rel(file), line: call.line, method: call.method, expression: call.args[0]?.getText(info.ast) });
        continue;
      }
      for (const p of paths) endpoints.push({
        method: call.method.toUpperCase(), path: join(prefix, p), file: rel(file), line: call.line,
        middleware: call.args.slice(1).filter(a => ts.isIdentifier(a)).map(a => a.text),
      });
    } else {
      const middlewareArgs = paths ? call.args.slice(1) : call.args;
      for (const arg of middlewareArgs) {
        if (!ts.isIdentifier(arg)) continue;
        const imp = info.imports.get(arg.text);
        let targetFile, targetOwner;
        if (imp) {
          const imported = parse(imp.target);
          targetFile = imp.target;
          targetOwner = imported.exports.get(imp.exportName);
          if (!imported.routers.has(targetOwner)) continue;
        } else if (info.routers.has(arg.text)) {
          targetFile = file; targetOwner = arg.text;
        } else continue;
        for (const p of paths || [""]) {
          const mountedPrefix = join(prefix, p);
          mounts.push({ prefix: mountedPrefix, file: rel(targetFile), owner: targetOwner });
          traverse(targetFile, targetOwner, mountedPrefix, [...chain, file + ":" + owner]);
        }
      }
    }
  }
}
traverse(path.join(root, "artifacts/api-server/src/app.ts"), "app", "");
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
const unmounted = [];
for (const file of files(path.join(root, "artifacts/api-server/src/routes")).filter(f => f.endsWith(".ts"))) {
  const info = parse(file);
  for (const call of info.calls) if (info.routers.has(call.owner) && methods.has(call.method) && !registrations.has(file + ":" + call.line)) {
    unmounted.push({ file: rel(file), line: call.line, method: call.method.toUpperCase(), localPaths: literals(call.args[0]) || [call.args[0]?.getText(info.ast)] });
  }
}
const trpc = [];
const trpcFile = path.join(root, "artifacts/api-server/src/lib/trpc.ts");
const trpcInfo = parse(trpcFile);
const objects = new Map();
function collect(node) {
  if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer) &&
      node.initializer.expression.getText(trpcInfo.ast) === "router" &&
      ts.isObjectLiteralExpression(node.initializer.arguments[0]))
    objects.set(node.name.getText(trpcInfo.ast), node.initializer.arguments[0]);
  ts.forEachChild(node, collect);
}
collect(trpcInfo.ast);
function rpc(name, prefix = "") {
  for (const prop of objects.get(name)?.properties || []) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = prefix + prop.name.getText(trpcInfo.ast).replace(/['"]/g, "");
    if (ts.isIdentifier(prop.initializer) && objects.has(prop.initializer.text)) rpc(prop.initializer.text, key + ".");
    else {
      const match = prop.initializer.getText(trpcInfo.ast).match(/\.(query|mutation|subscription)\s*\(/);
      if (match) trpc.push({ name: key, type: match[1], file: rel(trpcFile), line: trpcInfo.ast.getLineAndCharacterOfPosition(prop.getStart()).line + 1 });
    }
  }
}
rpc("appRouter");
// Use bounded workspace package discovery; never scan dependency sources or env files.
const packagePaths = ["package.json", ...["artifacts", "lib", "scripts"].flatMap(dir => {
  const direct = path.join(dir, "package.json");
  const children = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory() && e.name !== "node_modules")
    .map(e => path.join(dir, e.name, "package.json")).filter(p => fs.existsSync(p));
  return [...(fs.existsSync(direct) ? [direct] : []), ...children];
})];
const packages = packagePaths.map(file => {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  return { file, name: json.name, scripts: json.scripts, dependencies: json.dependencies, devDependencies: json.devDependencies };
});
const duplicates = [...new Set(endpoints.map(e => `${e.method} ${e.path}`))].filter(k => endpoints.filter(e => `${e.method} ${e.path}` === k).length > 1);
const data = { generatedAt: new Date().toISOString(), endpoints: endpoints.sort((a,b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)), mounts, unresolved, unmounted, trpc, duplicates, packages };
fs.writeFileSync(path.join(out, "api-inventory.json"), JSON.stringify(data, null, 2));
console.log(JSON.stringify({ endpoints: endpoints.length, unique: new Set(endpoints.map(e => e.method + " " + e.path)).size, modules: new Set(endpoints.map(e => e.file)).size, trpc: trpc.length, unresolved, unmounted: unmounted.length, duplicates }, null, 2));