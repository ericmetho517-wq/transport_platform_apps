import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));
const ministryRoot = "C:\\Geoinformatics for Information Systems\\وزارة النقل";
const ogrinfo = "C:\\Program Files\\QGIS 4.0.3\\bin\\ogrinfo.exe";
if (!existsSync(ogrinfo)) throw new Error(`QGIS ogrinfo was not found: ${ogrinfo}`);

function findGdbs(folder, result = []) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(folder, entry.name);
    if (/transport[-_]platform/i.test(full)) continue;
    if (entry.name.toLowerCase().endsWith(".gdb")) result.push(full);
    else findGdbs(full, result);
  }
  return result;
}

function run(args) {
  const result = spawnSync(ogrinfo, args, { encoding: "utf8", env: { ...process.env, PROJ_LIB: "C:\\Program Files\\QGIS 4.0.3\\share\\proj" } });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `ogrinfo failed: ${args.join(" ")}`);
  return result.stdout;
}

const summaryRoot = join(repo, "public", "data", "dashboard");
const sourceGroups = new Map();
for (const entry of readdirSync(summaryRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const path = join(summaryRoot, entry.name, "summary.json");
  if (!existsSync(path)) continue;
  const source = JSON.parse(readFileSync(path, "utf8")).source;
  if (source) {
    const key = source.toLowerCase();
    sourceGroups.set(key, [...(sourceGroups.get(key) || []), entry.name]);
  }
}

const databases = [];
for (const gdb of findGdbs(ministryRoot).sort((a, b) => a.localeCompare(b, "ar"))) {
  const listing = run(["-ro", gdb]);
  const names = listing.split(/\r?\n/).filter((line) => line.trim().startsWith("Layer: ")).map((line) => line.trim().slice(7).replace(/\s+\([^)]*\)\s*$/, "").trim()).filter(Boolean);
  const layers = [];
  for (const name of names) {
    const info = run(["-ro", "-so", gdb, name]);
    const count = Number(info.match(/Feature Count:\s*(\d+)/)?.[1] || 0);
    const geometry = info.match(/Geometry:\s*(.+)/)?.[1]?.trim() || "Unknown";
    const extentMatch = info.match(/Extent:\s*\(([-\d.]+),\s*([-\d.]+)\)\s*-\s*\(([-\d.]+),\s*([-\d.]+)\)/);
    layers.push({ name, geometry, featureCount: count, ...(extentMatch ? { extent: extentMatch.slice(1).map(Number) } : {}) });
  }
  databases.push({
    path: relative(ministryRoot, gdb),
    absolutePath: gdb,
    platformGroups: sourceGroups.get(gdb.toLowerCase()) || [],
    layerCount: layers.length,
    featureCount: layers.reduce((sum, layer) => sum + layer.featureCount, 0),
    layers,
  });
  console.log(`${relative(ministryRoot, gdb)}: ${layers.length} layers, ${layers.reduce((sum, layer) => sum + layer.featureCount, 0)} records`);
}

const report = {
  generatedAt: new Date().toISOString(),
  sourceRoot: ministryRoot,
  databaseCount: databases.length,
  layerCount: databases.reduce((sum, database) => sum + database.layerCount, 0),
  featureCount: databases.reduce((sum, database) => sum + database.featureCount, 0),
  mappedDatabaseCount: databases.filter((database) => database.platformGroups.length).length,
  databases,
};
writeFileSync(join(repo, "registry", "geodatabase-inventory.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ databaseCount: report.databaseCount, layerCount: report.layerCount, featureCount: report.featureCount, mappedDatabaseCount: report.mappedDatabaseCount }, null, 2));
