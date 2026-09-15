import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const apps = JSON.parse(readFileSync(join(root, "registry", "apps.json"), "utf8"));
const profiles = JSON.parse(readFileSync(join(root, "public", "data", "sector-profiles.json"), "utf8"));
const aliases = {
  dabaa: "dabaa-axis", dahshur: "dahshur-south-link", kalabsha: "kalabsha-axis",
  "qena-luxor": "qena-luxor-road", qus: "qus-axis", "regional-ring": "regional-ring-road",
  "suez-free": "cairo-suez-road", "suez-link": "suez-ring-link", "western-upper-egypt": "western-upper-egypt", ismailia: "ismailia",
};
const expectedCounts = { Dashboard: 30, Experience: 10, StoryMap: 11, "Web AppViewer": 10, "Instant Filter Gallery": 10 };
const errors = [];
const warnings = [];
const counts = {};
const sectors = {};

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
  if (!app.reportReferences?.length) warnings.push(`${app.slug}: no embedded report screenshot; runtime remains data-driven`);
}

for (const [type, expected] of Object.entries(expectedCounts)) {
  if (counts[type] !== expected) errors.push(`${type}: expected ${expected}, found ${counts[type] || 0}`);
}
for (const group of Object.values(aliases)) {
  if (!profiles[group]) errors.push(`${group}: missing authoritative report profile`);
}
for (const sector of Object.keys(aliases)) {
  for (const type of ["Dashboard", "StoryMap", "Web AppViewer", "Instant Filter Gallery"]) {
    if (!apps.some((app) => app.reportReferenceGroup === sector && app.type === type)) errors.push(`${sector}: missing required ${type} application`);
  }
}
for (const sector of Object.keys(aliases)) {
  const dashboards = apps.filter((app) => app.reportReferenceGroup === sector && app.type === "Dashboard");
  if (dashboards.length !== 3) errors.push(`${sector}: expected exactly three executive dashboards, found ${dashboards.length}`);
  for (const pattern of [/العمرانية/, /الزراعية والصناعية/, /أسعار الأراضي/]) if (!dashboards.some((app) => pattern.test(app.title))) errors.push(`${sector}: incomplete executive dashboard suite`);
  const experiences = apps.filter((app) => app.reportReferenceGroup === sector && app.type === "Experience");
  if (experiences.length !== 1) errors.push(`${sector}: expected exactly one axis experience, found ${experiences.length}`);
}

const suezFree = JSON.parse(readFileSync(join(root, "public", "data", "dashboard", "cairo-suez-road", "summary.json"), "utf8"));
const suezLink = JSON.parse(readFileSync(join(root, "public", "data", "dashboard", "suez-ring-link", "summary.json"), "utf8"));
const requiredSuezLayers = ["study", "axis", "urban", "agricultural", "landcover-start", "landcover-end"];
if (!suezFree.verifiedLocalData || requiredSuezLayers.some((layer) => !suezFree.layers.includes(layer))) errors.push("cairo-suez-road: split local spatial layers are incomplete");
if (!suezLink.verifiedLocalData || requiredSuezLayers.some((layer) => !suezLink.layers.includes(layer))) errors.push("suez-ring-link: split local spatial layers are incomplete");
if ((suezFree.layerCounts.urban || 0) + (suezLink.layerCounts.urban || 0) !== 213) errors.push("Suez split: urban features were lost or duplicated");
if ((suezFree.layerCounts.agricultural || 0) + (suezLink.layerCounts.agricultural || 0) !== 18) errors.push("Suez split: agricultural features were lost or duplicated");

const storyMedia = JSON.parse(readFileSync(join(root, "registry", "story-media.json"), "utf8"));
const storyMediaEntries = Object.entries(storyMedia.groups || {}).flatMap(([group, chapters]) => Object.entries(chapters).flatMap(([chapter, items]) => items.map((item) => ({ group, chapter, ...item }))));
for (const app of apps.filter((item) => item.type === "StoryMap")) {
  const group = aliases[app.reportReferenceGroup];
  const hasStoryMedia = Object.values(storyMedia.groups?.[group] || {}).some((items) => items.length);
  if (hasStoryMedia) {
    const warning = `${app.slug}: no embedded report screenshot; runtime remains data-driven`;
    const index = warnings.indexOf(warning);
    if (index >= 0) warnings.splice(index, 1);
  }
}
if (storyMediaEntries.length < 150) errors.push(`story maps: expected a reviewed media set, found only ${storyMediaEntries.length} images`);
for (const item of storyMediaEntries) {
  const image = item.imagePath?.replace(/^\.\.\/\.\.\//, "");
  if (!image || !existsSync(join(root, "public", image))) errors.push(`story maps: missing extracted report image ${item.group}/${item.chapter}/${image || "unknown"}`);
  if (!item.reportName || !Number.isInteger(item.page) || item.page < 0) errors.push(`story maps: invalid source citation for ${item.group}/${item.chapter}`);
}

const report = {
  generatedAt: new Date().toISOString(), applications: apps.length, counts, sectors,
  checks: {
    projectEntrypoints: apps.length,
    sectorSummaries: new Set(apps.map((app) => aliases[app.reportReferenceGroup])).size,
    reportProfiles: Object.keys(profiles).length,
    crossSectorReferences: errors.filter((item) => item.includes("cross-sector")).length,
    storyReportImages: storyMediaEntries.length,
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
if (!sectorRuntime.includes("storyMediaManifest") || !sectorRuntime.includes("story-media-categories")) errors.push("story maps: extracted report gallery is not connected to the runtime");
if (sectorRuntime.includes("story-reference-compare")) errors.push("story maps: static comparison overlay must not replace the real before/after swipe");
if (sectorRuntime.includes('{ key: "beni-suef", label: "بني سويف", sector: "9", report: "(9).pdf" }') || sectorRuntime.includes('{ key: "aswan", label: "أسوان", sector: "2", report: "(9).pdf" }')) errors.push("story maps: the overall Western Upper Egypt summary must not be assigned to Beni Suef or Aswan as a sector report");
report.errors = errors;
report.result = errors.length ? "FAILED" : "PASSED";
writeFileSync(join(root, "registry", "sector-audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
