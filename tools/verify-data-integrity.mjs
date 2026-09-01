import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dataRoot = join(root, "public", "data", "dashboard");
const errors = [];
const warnings = [];
const groups = {};
const manifest = JSON.parse(readFileSync(join(dataRoot, "manifest.json"), "utf8"));

function coordinatePairs(value, result = []) {
  if (Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") result.push(value);
  else if (Array.isArray(value)) value.forEach((item) => coordinatePairs(item, result));
  return result;
}

for (const group of readdirSync(dataRoot)) {
  const folder = join(dataRoot, group);
  if (!statSync(folder).isDirectory()) continue;
  const summaryPath = join(folder, "summary.json");
  if (!existsSync(summaryPath)) { errors.push(`${group}: missing summary.json`); continue; }
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  const manifestLayers = manifest[group]?.layers || [];
  if (JSON.stringify(manifestLayers) !== JSON.stringify(summary.layers || [])) errors.push(`${group}: dashboard manifest layers do not match summary layers`);
  const result = { layers: {}, verifiedLocalData: summary.verifiedLocalData, source: summary.source };
  for (const layer of summary.layers || []) {
    const layerPath = join(folder, `${layer}.geojson`);
    if (!existsSync(layerPath)) { errors.push(`${group}/${layer}: file missing`); continue; }
    let collection;
    try { collection = JSON.parse(readFileSync(layerPath, "utf8")); } catch (error) { errors.push(`${group}/${layer}: invalid JSON - ${error}`); continue; }
    if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) { errors.push(`${group}/${layer}: not a FeatureCollection`); continue; }
    const pairs = collection.features.flatMap((feature) => feature.geometry ? coordinatePairs(feature.geometry.coordinates) : []);
    const invalid = pairs.filter(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y) || x < -180 || x > 180 || y < -90 || y > 90).length;
    if (invalid) errors.push(`${group}/${layer}: ${invalid} invalid WGS84 coordinate pairs`);
    const expected = summary.layerCounts?.[layer] ?? (layer === "baseline" ? summary.layerCounts?.old : undefined);
    if (expected !== undefined && expected !== collection.features.length) errors.push(`${group}/${layer}: summary count ${expected} != file count ${collection.features.length}`);
    result.layers[layer] = { features: collection.features.length, coordinatePairs: pairs.length, invalidCoordinates: invalid };
  }
  if (summary.verifiedLocalData && !(summary.layers || []).length) warnings.push(`${group}: marked as local data but has no active layers`);
  groups[group] = result;
}

const apps = JSON.parse(readFileSync(join(root, "registry", "apps.json"), "utf8"));
for (const app of apps) {
  if (app.language === "en" && app.direction !== "ltr") errors.push(`${app.slug}: English app must use LTR`);
  if (app.language === "ar" && app.direction !== "rtl") errors.push(`${app.slug}: Arabic app must use RTL`);
}

const report = { generatedAt: new Date().toISOString(), applications: apps.length, groups, errors, warnings, result: errors.length ? "FAILED" : "PASSED" };
writeFileSync(join(root, "registry", "data-integrity-audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ applications: report.applications, dataGroups: Object.keys(groups).length, errors: errors.length, warnings: warnings.length, result: report.result }, null, 2));
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
