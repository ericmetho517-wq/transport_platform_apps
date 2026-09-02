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
  const declaredLayers = summary.layers || [];
  const geoJsonFiles = readdirSync(folder).filter((name) => name.endsWith(".geojson"));
  const undeclaredLayerFiles = geoJsonFiles.filter((name) => !declaredLayers.includes(name.replace(/\.geojson$/, "")));
  const result = { layers: {}, verifiedLocalData: summary.verifiedLocalData, source: summary.source, undeclaredLayerFiles, totals: { features: 0, coordinatePairs: 0, renderableFeatures: 0 } };
  for (const layer of summary.layers || []) {
    const layerPath = join(folder, `${layer}.geojson`);
    if (!existsSync(layerPath)) { errors.push(`${group}/${layer}: file missing`); continue; }
    let collection;
    try { collection = JSON.parse(readFileSync(layerPath, "utf8")); } catch (error) { errors.push(`${group}/${layer}: invalid JSON - ${error}`); continue; }
    if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) { errors.push(`${group}/${layer}: not a FeatureCollection`); continue; }
    const pairs = collection.features.flatMap((feature) => feature.geometry ? coordinatePairs(feature.geometry.coordinates) : []);
    const invalid = pairs.filter(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y) || x < -180 || x > 180 || y < -90 || y > 90).length;
    const renderableFeatures = collection.features.filter((feature) => feature.geometry && coordinatePairs(feature.geometry.coordinates).length).length;
    const emptyGeometry = collection.features.length - renderableFeatures;
    if (invalid) errors.push(`${group}/${layer}: ${invalid} invalid WGS84 coordinate pairs`);
    const expected = summary.layerCounts?.[layer] ?? (layer === "baseline" ? summary.layerCounts?.old : undefined);
    if (expected !== undefined && expected !== collection.features.length) errors.push(`${group}/${layer}: summary count ${expected} != file count ${collection.features.length}`);
    if (emptyGeometry) warnings.push(`${group}/${layer}: ${emptyGeometry} source records have empty geometry and are excluded from rendering`);
    result.layers[layer] = { features: collection.features.length, renderableFeatures, coordinatePairs: pairs.length, invalidCoordinates: invalid };
    result.totals.features += collection.features.length;
    result.totals.renderableFeatures += renderableFeatures;
    result.totals.coordinatePairs += pairs.length;
  }
  for (const name of undeclaredLayerFiles) {
    const collection = JSON.parse(readFileSync(join(folder, name), "utf8"));
    const featureCount = Array.isArray(collection.features) ? collection.features.length : 0;
    if (featureCount) warnings.push(`${group}/${name}: ${featureCount} features are inactive because they are not declared for this sector`);
  }
  if (summary.verifiedLocalData && !(summary.layers || []).length) warnings.push(`${group}: marked as local data but has no active layers`);
  groups[group] = result;
}

const apps = JSON.parse(readFileSync(join(root, "registry", "apps.json"), "utf8"));
const groupAliases = { dahshur: "dahshur-south-link", "regional-ring": "regional-ring-road", kalabsha: "kalabsha-axis", "qena-luxor": "qena-luxor-road", "suez-link": "suez-ring-link", "suez-free": "cairo-suez-road", qus: "qus-axis", dabaa: "dabaa-axis", "western-upper-egypt": "western-upper-egypt" };
const applicationCoverage = {};
for (const app of apps) {
  if (app.language === "en" && app.direction !== "ltr") errors.push(`${app.slug}: English app must use LTR`);
  if (app.language === "ar" && app.direction !== "rtl") errors.push(`${app.slug}: Arabic app must use RTL`);
  const dataGroup = groupAliases[app.reportReferenceGroup];
  if (!dataGroup || !groups[dataGroup]) errors.push(`${app.slug}: no audited map group`);
  else {
    applicationCoverage[dataGroup] ||= { applications: 0, activeFeatures: groups[dataGroup].totals.features, activeLayers: Object.keys(groups[dataGroup].layers).length, verifiedLocalData: groups[dataGroup].verifiedLocalData };
    applicationCoverage[dataGroup].applications += 1;
  }
}

const totals = Object.values(groups).reduce((sum, group) => ({ features: sum.features + group.totals.features, renderableFeatures: sum.renderableFeatures + group.totals.renderableFeatures, coordinatePairs: sum.coordinatePairs + group.totals.coordinatePairs }), { features: 0, renderableFeatures: 0, coordinatePairs: 0 });
const report = { generatedAt: new Date().toISOString(), applications: apps.length, totals, applicationCoverage, groups, errors, warnings, result: errors.length ? "FAILED" : "PASSED" };
writeFileSync(join(root, "registry", "data-integrity-audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ applications: report.applications, dataGroups: Object.keys(groups).length, errors: errors.length, warnings: warnings.length, result: report.result }, null, 2));
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
