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
if (Object.keys(western?.sectors || {}).length < 8) failures.push("western-upper-egypt: sector report profiles are incomplete");
for (const [sector, profile] of Object.entries(western?.sectors || {})) {
  if (!Number.isFinite(profile.metrics?.jobOpportunities)) failures.push(`western-upper-egypt sector ${sector}: missing report job count`);
  if (!profile.statusShares || profile.statusShares.existing + profile.statusShares.underConstruction !== 100) failures.push(`western-upper-egypt sector ${sector}: invalid status shares`);
  if (!profile.changeBars?.length) failures.push(`western-upper-egypt sector ${sector}: missing urban pattern chart`);
}
const runtimeSource = fs.readFileSync(path.join(root, "shared", "interactive-dashboard.ts"), "utf8");
if (!runtimeSource.includes('mapMarkup("land-2014"') || !runtimeSource.includes('mapMarkup("land-current"')) failures.push("urban dashboard: missing interactive 2014/current map pair");
if (!runtimeSource.includes('mapMarkup("price-2014"') || !runtimeSource.includes('mapMarkup("price-current"')) failures.push("western price dashboard: missing report-matched map pair");

if (dashboards.length !== 50) failures.push(`expected 50 dashboards, found ${dashboards.length}`);
if (failures.length) {
  console.error(`Dashboard content audit failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Dashboard content audit passed: ${dashboards.length} dashboards, ${priceDashboards.length} price dashboards, ${Object.keys(profiles).length} report profiles.`);
