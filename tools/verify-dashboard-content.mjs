import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, "registry", "apps.json"), "utf8"));
const profiles = JSON.parse(fs.readFileSync(path.join(root, "public", "data", "sector-profiles.json"), "utf8"));
const aliases = {
  dabaa: "dabaa-axis",
  dahshur: "dahshur-south-link",
  kalabsha: "kalabsha-axis",
  "qena-luxor": "qena-luxor-road",
  qus: "qus-axis",
  "regional-ring": "regional-ring-road",
  "suez-free": "cairo-suez-road",
  "suez-link": "suez-ring-link",
  "western-upper-egypt": "western-upper-egypt",
};
const failures = [];
const dashboards = registry.filter((app) => app.type === "Dashboard");
const priceDashboards = dashboards.filter((app) => /سعر|أسعار|اسعار|price/i.test(app.title));

for (const app of dashboards) {
  const group = aliases[app.reportReferenceGroup] || app.reportReferenceGroup;
  const summaryPath = path.join(root, "public", "data", "dashboard", group, "summary.json");
  if (!fs.existsSync(summaryPath)) failures.push(`${app.slug}: missing summary for ${group}`);
}

for (const app of priceDashboards) {
  const group = aliases[app.reportReferenceGroup] || app.reportReferenceGroup;
  const summary = JSON.parse(fs.readFileSync(path.join(root, "public", "data", "dashboard", group, "summary.json"), "utf8"));
  const prices = { ...summary.prices, ...(profiles[group]?.prices || {}) };
  const valid = Object.values(prices).filter((pair) => pair && (pair.start > 0 || pair.end > 0));
  if (!valid.length) failures.push(`${app.slug}: no documented price values for ${group}`);
  for (const pair of valid) {
    if (!Number.isFinite(pair.start) || !Number.isFinite(pair.end) || pair.start < 0 || pair.end < pair.start) failures.push(`${app.slug}: invalid price range for ${group}`);
  }
}

const western = profiles["western-upper-egypt"];
if (!western || western.yearEnd !== 2024) failures.push("western-upper-egypt: missing 2024 report profile");
const expectedWesternMetrics = {
  jobOpportunities: 50458,
  agriculturalAreaFeddan: 1512791,
  agriculturalWorkers: 206235,
  industrialWorkers: 75459,
  industrialChangeKm2: 67.4,
};
for (const [metric, expected] of Object.entries(expectedWesternMetrics)) {
  if (western?.metrics?.[metric] !== expected) failures.push(`western-upper-egypt: ${metric} must match the documented video value ${expected}`);
}
if (western?.cropShares?.reduce((sum, value) => sum + value, 0) !== 100) failures.push("western-upper-egypt: crop shares must be complete");
if (western?.ownershipShares?.reduce((sum, value) => sum + value, 0) !== 100) failures.push("western-upper-egypt: ownership shares must be complete");
if (![2014, 2024].every((year) => western?.landUse?.some((item) => item.year === year))) failures.push("western-upper-egypt: overall 2014/2024 land-use comparison is required");
const expectedWesternSectors = ["1", "2", "3", "4", "6", "7", "8", "9", "11", "12"];
const westernSectors = western?.sectors || {};
if (Object.keys(westernSectors).length !== expectedWesternSectors.length || expectedWesternSectors.some((sector) => !westernSectors[sector])) failures.push("western-upper-egypt: all 10 mapped sector profiles are required");
for (const [sector, profile] of Object.entries(western?.sectors || {})) {
  if (!Number.isFinite(profile.metrics?.jobOpportunities)) failures.push(`western-upper-egypt sector ${sector}: missing report job count`);
  if (!profile.statusShares || profile.statusShares.existing + profile.statusShares.underConstruction !== 100) failures.push(`western-upper-egypt sector ${sector}: invalid status shares`);
  if (!profile.changeBars?.length) failures.push(`western-upper-egypt sector ${sector}: missing urban pattern chart`);
  if (![2014, 2024].every((year) => profile.landUse?.some((item) => item.year === year))) failures.push(`western-upper-egypt sector ${sector}: missing 2014/2024 land-use comparison`);
  if (!["urban", "agricultural", "industrial"].every((kind) => profile.prices?.[kind]?.start >= 0 && profile.prices?.[kind]?.end > profile.prices?.[kind]?.start)) failures.push(`western-upper-egypt sector ${sector}: incomplete price indicators`);
}
for (const kind of ["urban", "agricultural", "industrial"]) {
  for (const edge of ["start", "end"]) {
    const sectorTotal = Object.values(westernSectors).reduce((sum, sector) => sum + sector.prices[kind][edge], 0);
    if (sectorTotal !== western.prices[kind][edge]) failures.push(`western-upper-egypt: ${kind} ${edge} sector values do not match report total`);
  }
}
const runtimeSource = fs.readFileSync(path.join(root, "shared", "interactive-dashboard.ts"), "utf8");
if (!runtimeSource.includes('mapMarkup("land-baseline"') || !runtimeSource.includes('mapMarkup("land-current"')) failures.push("urban dashboard: missing interactive baseline/current map pair");
if (!runtimeSource.includes('mapMarkup("price-baseline"') || !runtimeSource.includes('mapMarkup("price-current"')) failures.push("western price dashboard: missing report-matched map pair");
if (!runtimeSource.includes('"dashboard-map-sector"') || !runtimeSource.includes("fitSector")) failures.push("dashboard maps: sector auto-fit interaction is missing");
if (!runtimeSource.includes('"linked-map-view"') || !runtimeSource.includes("map-year-start")) failures.push("temporal maps: synchronized navigation and data-driven year labels are required");

if (dashboards.length !== 50) failures.push(`expected 50 dashboards, found ${dashboards.length}`);
if (failures.length) {
  console.error(`Dashboard content audit failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Dashboard content audit passed: ${dashboards.length} dashboards, ${priceDashboards.length} price dashboards, ${Object.keys(profiles).length} report profiles.`);
