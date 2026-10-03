/**
 * Builds the locally sourced dashboard suites for Metro Line 3 and the
 * Kafr Dawood–Sadat railway link.  The source FileGDBs are authoritative;
 * this utility intentionally derives every displayed spatial metric from
 * their area/length fields rather than copying values from another corridor.
 *
 * Run: node tools/build-transit-dashboard-suite.mjs
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const ogr2ogr = "C:\\Program Files\\QGIS 4.0.3\\bin\\ogr2ogr.exe";
const template = join(root, "projects", "dashboard-c79fcd32aa");
const dashboardRoot = join(root, "public", "data", "dashboard");
const registryPath = join(root, "registry", "apps.json");
const sources = [
  {
    group: "metro-third-line",
    ar: "خط المترو الثالث",
    en: "Metro Line 3",
    source: "C:\\Geoinformatics for Information Systems\\وزارة النقل\\Data\\all_metro_With_Eco.gdb\\all_metro.gdb",
    transportLayer: "Metro_Line",
  },
  {
    group: "kafr-dawood-sadat",
    ar: "خط سكة حديد كفر داود–السادات",
    en: "Kafr Dawood–Sadat Railway Line",
    source: "C:\\Geoinformatics for Information Systems\\وزارة النقل\\Data\\elsadat_final_With_Eco\\elsadat_final\\elsadat.gdb",
    transportLayer: "Transit_KafrDawoodSadat",
  },
];

// The supplied corridor Excel workbooks are the authoritative published
// aggregates.  Geometry remains sourced from the FileGDB, while these totals
// prevent a dashboard from presenting an unweighted feature average as a
// corridor-wide land-price total.
const officialWorkbookTotals = {
  "metro-third-line": {
    prices: {
      agricultural: { start: 312318983.87077397, end: 936956951.61232197 },
      urban: { start: 267821259719.33401, end: 1290415683002.6699 },
      industrial: { start: 86279652.8225802, end: 273218900.604837 },
      services: { start: 108630017300.871, end: 313820049980.294 },
    },
    landUse: { "Agriculture:2016": 1.5082852015, "Agriculture:2026": 1.3117685912, "Urban:2016": 42.1693621346, "Urban:2026": 42.3330493274, "Industrial:2016": 0.2242388887, "Industrial:2026": 0.1437994214, "Services:2016": 11.4570280748, "Services:2026": 12.0700019223 },
  },
  "kafr-dawood-sadat": {
    prices: {
      agricultural: { start: 69385514907.6763, end: 208156544723.02899 },
      urban: { start: 117947517346.513, end: 589737586732.56494 },
      industrial: { start: 15389836633.5158, end: 48734482672.799896 },
      services: { start: 21304383598.038898, end: 106521917990.194 },
    },
    landUse: { "Agriculture:2016": 205.491631036, "Agriculture:2026": 291.4255739749, "Urban:2016": 20.679421366, "Urban:2026": 39.3158391155, "Industrial:2016": 14.6955181857, "Industrial:2026": 25.6497277225, "Services:2016": 3.2024120563, "Services:2026": 7.1014611993 },
  },
};

if (!existsSync(ogr2ogr)) throw new Error(`Missing ogr2ogr: ${ogr2ogr}`);
if (!existsSync(template)) throw new Error(`Missing dashboard template: ${template}`);

const run = (args) => {
  const result = spawnSync(ogr2ogr, args, {
    encoding: "utf8",
    env: { ...process.env, PROJ_LIB: "C:\\Program Files\\QGIS 4.0.3\\share\\proj" },
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `ogr2ogr failed: ${args.join(" ")}`);
};
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
const number = (value) => Number(value) || 0;
const prop = (properties, ...keys) => keys.map((key) => properties[key]).find((value) => value !== undefined && value !== null && value !== "");
const areaKm2 = (feature) => number(prop(feature.properties || {}, "مساحة_كم2", "مساحة_كم", "area_km2")) || number(prop(feature.properties || {}, "SHAPE_Area", "Shape_Area")) / 1e6;
const sumArea = (collection) => collection.features.reduce((total, feature) => total + areaKm2(feature), 0);
const sumLengthKm = (collection) => collection.features.reduce((total, feature) => total + number(prop(feature.properties || {}, "Shape_Length", "SHAPE_Length")) / 1000, 0);

const landUseCategory = (feature) => {
  const properties = feature.properties || {};
  const code = String(prop(properties, "استخدام_الأرض", "landuse_code") ?? "");
  const label = String(prop(properties, "وصف_الاستخدام", "landuse_label") ?? "");
  if (code === "0" || /زراع/.test(label)) return "Agriculture";
  if (code === "1" || /صناع/.test(label)) return "Industrial";
  if (code === "2" || /فضاء|خالي/.test(label)) return "Vacant Lands";
  if (code === "3" || /سكن|عمران|مباني/.test(label)) return "Urban";
  if (code === "5" || /خدم|تعليم|حكوم|دين|سياح/.test(label)) return "Services";
  if (code === "8" || /مائي|مياه/.test(label)) return "Water Bodies";
  return "Other";
};
const enrich = (collection, status = "unchanged") => ({
  ...collection,
  features: collection.features.map((feature) => {
    const properties = feature.properties || {};
    const code = prop(properties, "استخدام_الأرض", "landuse_code");
    const label = prop(properties, "وصف_الاستخدام", "landuse_label");
    return { ...feature, properties: { ...properties, landuse_code: code ?? "", landuse_label: label ?? "", change_status_key: status } };
  }),
});

function exportLayer(source, output, layer, status) {
  const temp = `${output}.raw`;
  run(["-f", "GeoJSON", "-t_srs", "EPSG:4326", temp, source, layer]);
  const collection = enrich(readJson(temp), status);
  rmSync(temp, { force: true });
  writeJson(output, collection);
  return collection;
}

function profileLandUse(collection, year) {
  const totals = new Map();
  for (const feature of collection.features) {
    const category = landUseCategory(feature);
    totals.set(category, (totals.get(category) || 0) + areaKm2(feature));
  }
  return [...totals.entries()].map(([category, area]) => ({ category, year, area: Number(area.toFixed(6)) }));
}

// Both observations are documented on the end-year land-cover features in
// these two FileGDBs. Aggregate only positive source values by land-use code.
const priceField2016 = "سعر_الأرض_2016";
const priceField2026 = "سعر_الأرض_2026";
function profilePrices(collection) {
  const prices = {};
  for (const [key, code] of [["urban", 3], ["agricultural", 0], ["industrial", 1]]) {
    const records = collection.features
      .filter((feature) => Number(feature.properties?.landuse_code ?? feature.properties?.["استخدام_الأرض"]) === code)
      .map((feature) => ({ start: Number(feature.properties?.[priceField2016]), end: Number(feature.properties?.[priceField2026]) }))
      .filter((pair) => Number.isFinite(pair.start) && pair.start > 0 && Number.isFinite(pair.end) && pair.end > 0);
    if (!records.length) continue;
    prices[key] = {
      start: Number((records.reduce((sum, pair) => sum + pair.start, 0) / records.length).toFixed(2)),
      end: Number((records.reduce((sum, pair) => sum + pair.end, 0) / records.length).toFixed(2)),
    };
  }
  return prices;
}

function makeProject(app) {
  const folder = join(root, "projects", app.slug);
  if (!existsSync(folder)) cpSync(template, folder, { recursive: true });
  const config = `${JSON.stringify(app, null, 2)}\n`;
  writeFileSync(join(folder, "config", "app.json"), config, "utf8");
  writeFileSync(join(folder, "src", "app.config.json"), config, "utf8");
  writeFileSync(join(folder, "index.html"), `<!doctype html>\n<html lang="ar" dir="rtl">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <meta name="theme-color" content="#0b3d2e" />\n    <title>${app.title}</title>\n    <link rel="stylesheet" href="../../shared/styles.css" />\n    <link rel="stylesheet" href="../../shared/reference.css" />\n    <link rel="stylesheet" href="../../shared/interactive-dashboard.css" />\n    <link rel="stylesheet" href="../../shared/sector-runtime.css" />\n  </head>\n  <body><div id="app"></div><script type="module" src="./src/main.ts"></script></body>\n</html>\n`, "utf8");
  writeFileSync(join(folder, "PROJECT_DETAILS.md"), `# ${app.title}\n\n- Dataset: ${app.localDataSource}\n- Years: 2016–2026\n- All spatial values are calculated from the supplied local FileGDB.\n`, "utf8");
}

const previousTransitApps = readJson(registryPath).filter((app) => ["metro-third-line", "kafr-dawood-sadat"].includes(app.reportReferenceGroup));
for (const app of previousTransitApps) {
  const folder = resolve(root, "projects", app.slug);
  if (folder.startsWith(resolve(root, "projects"))) rmSync(folder, { recursive: true, force: true });
}
const registry = readJson(registryPath).filter((app) => !["metro-third-line", "kafr-dawood-sadat"].includes(app.reportReferenceGroup));

for (const item of sources) {
  const folder = join(dashboardRoot, item.group);
  rmSync(folder, { recursive: true, force: true });
  mkdirSync(folder, { recursive: true });
  const axis = exportLayer(item.source, join(folder, "axis.geojson"), "Axis_Road_Sector", "unchanged");
  const study = exportLayer(item.source, join(folder, "study.geojson"), "Study_Area_Sector", "unchanged");
  // The baseline layer has no documented change-status attribute.  Do not
  // label every 2016 feature as "unchanged": that would make the status
  // filter and its gauge report a fabricated 100%.  The 2026 comparison
  // layer retains its per-feature source status field.
  const start = exportLayer(item.source, join(folder, "landcover-start.geojson"), "Land_Cover2016", "unknown");
  const end = exportLayer(item.source, join(folder, "landcover-end.geojson"), "Land_Cover2026", "unchanged");
  const urban = exportLayer(item.source, join(folder, "urban.geojson"), "Urban_Changes", "changed");
  const agricultural = exportLayer(item.source, join(folder, "agricultural.geojson"), "Agricultural_Changes", "changed");
  const industrial = exportLayer(item.source, join(folder, "industrial.geojson"), "Industrial_Changes", "changed");
  if (item.group === "metro-third-line") exportLayer(item.source, join(folder, "Metro_Station.geojson"), "Metro_Stations", "unchanged");
  const official = officialWorkbookTotals[item.group];
  const landUse = [...profileLandUse(start, 2016), ...profileLandUse(end, 2026)]
    .map((row) => ({ ...row, area: official.landUse[`${row.category}:${row.year}`] ?? row.area }));
  const prices = official.prices;
  const agriculturalEnd = landUse.filter((row) => row.year === 2026 && row.category === "Agriculture").reduce((sum, row) => sum + row.area, 0);
  const metrics = {
    studyAreaKm2: Number(sumArea(study).toFixed(3)),
    axisLengthKm: Number(sumLengthKm(axis).toFixed(3)),
    urbanChangeKm2: Number(((official.landUse["Urban:2026"] || 0) - (official.landUse["Urban:2016"] || 0)).toFixed(3)),
    agriculturalChangeKm2: Number(((official.landUse["Agriculture:2026"] || 0) - (official.landUse["Agriculture:2016"] || 0)).toFixed(3)),
    industrialChangeKm2: Number(((official.landUse["Industrial:2026"] || 0) - (official.landUse["Industrial:2016"] || 0)).toFixed(3)),
    agriculturalAreaFeddan: Number((agriculturalEnd * 238.095).toFixed(0)),
    urbanFeatures: urban.features.length,
    agriculturalFeatures: agricultural.features.length,
    industrialFeatures: industrial.features.length,
  };
  const layers = ["study", "axis", "urban", "agricultural", "landcover-start", "landcover-end"];
  if (industrial.features.length) layers.splice(4, 0, "industrial");
  if (item.group === "metro-third-line") layers.push("Metro_Station");
  const summary = {
    slug: item.group,
    projectTitle: item.ar,
    source: item.source,
    authoritativeSource: "وزارة النقل/Data",
    verifiedLocalData: true,
    yearStart: 2016,
    yearEnd: 2026,
    metrics,
    prices,
    priceSeries: {
      years: [2016, 2026],
      urban: [prices.urban?.start || 0, prices.urban?.end || 0],
      agricultural: [prices.agricultural?.start || 0, prices.agricultural?.end || 0],
      industrial: [prices.industrial?.start || 0, prices.industrial?.end || 0],
      services: [prices.services?.start || 0, prices.services?.end || 0],
    },
    priceAggregation: "official-workbook-total-by-landuse; individual map popups retain FileGDB attributes",
    priceFields: { start: priceField2016, end: priceField2026 },
    landUse,
    layers,
    layerCounts: { study: study.features.length, axis: axis.features.length, urban: urban.features.length, agricultural: agricultural.features.length, ...(industrial.features.length ? { industrial: industrial.features.length } : {}), "landcover-start": start.features.length, "landcover-end": end.features.length, ...(item.group === "metro-third-line" ? { Metro_Station: 0 } : {}) },
    sourceLayerCounts: { "landcover-start": start.features.length, "landcover-end": end.features.length },
  };
  if (item.group === "metro-third-line") summary.layerCounts.Metro_Station = readJson(join(folder, "Metro_Station.geojson")).features.length;
  writeJson(join(folder, "summary.json"), summary);
  writeJson(join(folder, "manifest.json"), { group: item.group, source: item.source, layers });

  const appKinds = [
    { key: "prices", title: "اللوحة التفاعلية لأسعار الأراضي" },
    { key: "urban", title: "لوحة مؤشرات الأراضي العمرانية" },
    { key: "agriculture", title: industrial.features.length ? "لوحة مؤشرات الأراضي الزراعية والصناعية" : "لوحة مؤشرات الأراضي الزراعية" },
  ];
  for (const kind of appKinds) {
    const id = createHash("sha256").update(`mot-local:${item.group}:${kind.key}`).digest("hex").slice(0, 32);
    const app = {
      id,
      slug: `dashboard-${id.slice(0, 10)}`,
      title: `${kind.title} – ${item.ar}`,
      alternateTitles: [`${kind.key === "urban" ? "Urban Land Indicators" : industrial.features.length ? "Agricultural and Industrial Land Indicators" : "Agricultural Land Indicators"} Dashboard – ${item.en}`],
      category: `تطبيقات ${item.ar}`,
      type: "Dashboard",
      language: "ar",
      direction: "rtl",
      sourceUrl: "",
      status: "generated-from-local-filegdb",
      reportReferences: [],
      reportReferenceGroup: item.group,
      localDataSource: item.source,
    };
    registry.push(app);
    makeProject(app);
  }
}
writeJson(registryPath, registry);
const dashboardManifestPath = join(dashboardRoot, "manifest.json");
const dashboardManifest = readJson(dashboardManifestPath);
for (const item of sources) {
  const summary = readJson(join(dashboardRoot, item.group, "summary.json"));
  dashboardManifest[item.group] = { summary: `data/dashboard/${item.group}/summary.json`, layers: summary.layers };
}
writeJson(dashboardManifestPath, dashboardManifest);
console.log("Built Metro Line 3 and Kafr Dawood–Sadat dashboard suites from local FileGDBs.");
