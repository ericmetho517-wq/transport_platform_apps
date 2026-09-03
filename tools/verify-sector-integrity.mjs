import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const apps = JSON.parse(readFileSync(join(root, "registry", "apps.json"), "utf8"));
const profiles = JSON.parse(readFileSync(join(root, "public", "data", "sector-profiles.json"), "utf8"));
const aliases = {
  dabaa: "dabaa-axis", dahshur: "dahshur-south-link", kalabsha: "kalabsha-axis",
  "qena-luxor": "qena-luxor-road", qus: "qus-axis", "regional-ring": "regional-ring-road",
  "suez-free": "cairo-suez-road", "suez-link": "suez-ring-link", "western-upper-egypt": "western-upper-egypt",
};
const expectedCounts = { Dashboard: 50, Experience: 10, StoryMap: 9, "Web AppViewer": 5, "Instant Filter Gallery": 4 };
const errors = [];
const warnings = [];
const counts = {};
const sectors = {};
const specializedDashboards = new Set(["dashboard-4b68db62a1", "dashboard-48c0447e11", "dashboard-890d333abf", "dashboard-489e365131", "dashboard-37e01603d0", "dashboard-ba98b53679", "dashboard-35c11a505b", "dashboard-83f3738705", "dashboard-676c18c4b7", "dashboard-4138cfe326", "dashboard-f0a5bc623c"]);

for (const app of apps) {
  counts[app.type] = (counts[app.type] || 0) + 1;
  const sector = app.reportReferenceGroup;
  const dataGroup = aliases[sector];
  sectors[sector] = (sectors[sector] || 0) + 1;
  if (!dataGroup) errors.push(`${app.slug}: unknown sector group ${sector}`);
  if (!existsSync(join(root, "projects", app.slug, "index.html"))) errors.push(`${app.slug}: missing project entrypoint`);
  if (!existsSync(join(root, "public", "data", "dashboard", dataGroup || "", "summary.json"))) errors.push(`${app.slug}: missing sector summary ${dataGroup}`);
  for (const ref of app.reportReferences || []) {
    if (ref.projectGroup !== sector) errors.push(`${app.slug}: cross-sector reference ${ref.projectGroup} != ${sector}`);
    const image = ref.imagePath?.replace(/^\.\.\/\.\.\//, "");
    if (image && !existsSync(join(root, "public", image))) errors.push(`${app.slug}: missing report reference ${image}`);
  }
  if (specializedDashboards.has(app.slug) && (app.reportReferences || []).some((ref) => ref.referenceKind === "landuse-dashboard")) errors.push(`${app.slug}: specialized dashboard must not use a generic land-use screenshot as its design reference`);
  if (!app.reportReferences?.length) warnings.push(`${app.slug}: no embedded report screenshot; runtime remains data-driven`);
}

for (const [type, expected] of Object.entries(expectedCounts)) {
  if (counts[type] !== expected) errors.push(`${type}: expected ${expected}, found ${counts[type] || 0}`);
}
for (const group of Object.values(aliases)) {
  if (!profiles[group]) errors.push(`${group}: missing authoritative report profile`);
}

const suezFree = JSON.parse(readFileSync(join(root, "public", "data", "dashboard", "cairo-suez-road", "summary.json"), "utf8"));
const suezLink = JSON.parse(readFileSync(join(root, "public", "data", "dashboard", "suez-ring-link", "summary.json"), "utf8"));
const requiredSuezLayers = ["study", "axis", "urban", "agricultural", "landcover-start", "landcover-end"];
if (!suezFree.verifiedLocalData || requiredSuezLayers.some((layer) => !suezFree.layers.includes(layer))) errors.push("cairo-suez-road: split local spatial layers are incomplete");
if (!suezLink.verifiedLocalData || requiredSuezLayers.some((layer) => !suezLink.layers.includes(layer))) errors.push("suez-ring-link: split local spatial layers are incomplete");
if ((suezFree.layerCounts.urban || 0) + (suezLink.layerCounts.urban || 0) !== 213) errors.push("Suez split: urban features were lost or duplicated");
if ((suezFree.layerCounts.agricultural || 0) + (suezLink.layerCounts.agricultural || 0) !== 18) errors.push("Suez split: agricultural features were lost or duplicated");

const report = {
  generatedAt: new Date().toISOString(), applications: apps.length, counts, sectors,
  checks: {
    projectEntrypoints: apps.length,
    sectorSummaries: new Set(apps.map((app) => aliases[app.reportReferenceGroup])).size,
    reportProfiles: Object.keys(profiles).length,
    crossSectorReferences: errors.filter((item) => item.includes("cross-sector")).length,
  },
  errors, warnings,
  result: errors.length ? "FAILED" : "PASSED",
};
const sectorRuntime = readFileSync(join(root, "shared", "sector-runtime.ts"), "utf8");
for (const layer of ["buildings", "parcels", "landmarks", "water", "field-survey", "transport", "governorates"]) {
  if (!sectorRuntime.includes(`data-view-layer="${layer}"`)) errors.push(`web viewer: full-feature layer ${layer} is not exposed`);
  if (!sectorRuntime.includes(`data-gallery-layer="${layer}"`)) errors.push(`filter gallery: full-feature layer ${layer} is not exposed`);
}
if (!sectorRuntime.includes("application-gallery-card")) errors.push("filter gallery: report-matched application cards are missing");
if (!sectorRuntime.includes("data-story-card")) errors.push("story maps: sector collection navigation is missing");
if (sectorRuntime.includes('{ key: "beni-suef", label: "بني سويف", sector: "9", report: "(9).pdf" }') || sectorRuntime.includes('{ key: "aswan", label: "أسوان", sector: "2", report: "(9).pdf" }')) errors.push("story maps: the overall Western Upper Egypt summary must not be assigned to Beni Suef or Aswan as a sector report");
report.errors = errors;
report.result = errors.length ? "FAILED" : "PASSED";
writeFileSync(join(root, "registry", "sector-audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
