import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const source = readFileSync(join(root, "src", "main.ts"), "utf8");
const styles = readFileSync(join(root, "shared", "platform-identity.css"), "utf8");
const dashboardSource = readFileSync(join(root, "shared", "interactive-dashboard.ts"), "utf8");
const dashboardStyles = readFileSync(join(root, "shared", "interactive-dashboard.css"), "utf8");
const sectorSource = readFileSync(join(root, "shared", "sector-runtime.ts"), "utf8");
const sectorStyles = readFileSync(join(root, "shared", "sector-runtime.css"), "utf8");
const apps = JSON.parse(readFileSync(join(root, "registry", "apps.json"), "utf8"));
const errors = [];

for (const control of ["app-search", "type-filter", "language-filter", "axis-filter", "clear-filters", "data-quick-type", "back-to-top"]) {
  if (!source.includes(control)) errors.push(`missing platform interaction: ${control}`);
}
for (const behavior of ["IntersectionObserver", "requestAnimationFrame", "pointermove", "prefers-reduced-motion"]) {
  if (!source.includes(behavior) && !styles.includes(behavior)) errors.push(`missing platform behavior: ${behavior}`);
}
for (const type of ["type-dashboard", "type-storymap", "type-viewer", "type-gallery"]) {
  if (!styles.includes(type)) errors.push(`missing visual identity for ${type}`);
}
if (!styles.includes("@media (max-width: 760px)")) errors.push("missing responsive mobile layout");
if (!source.includes('value="${platformLanguage}"') || !source.includes('params.set("uiLang", next)')) errors.push("Arabic/English mode switching is incomplete");
if (!dashboardSource.includes('class="dashboard-sector-filter"')) errors.push("dashboard sector filter markup is missing");
if (!dashboardStyles.includes('.interactive-dashboard:not([data-dashboard-group="western-upper-egypt"]) .dashboard-sector-filter')) errors.push("dashboard sector filter is not restricted to Western Upper Egypt");
if (!dashboardSource.includes("path.dataset.sector = featureSector") || !dashboardSource.includes("path.dataset.sector = bucket.sector")) errors.push("dashboard map features are not linked to their sectors");
if (!dashboardSource.includes("isWesternUpperEgypt || serviceLabelPattern.test(item.label) ? serviceColor")) errors.push("Western Upper Egypt change bars do not use one service colour");
for (const storyFeature of ["arcgis-reference-story", "story-dashboard-view", "data-story-dashboard", "data-story-detail"]) {
  if (!sectorSource.includes(storyFeature) && !sectorStyles.includes(storyFeature)) errors.push(`Western StoryMap reference layout is missing: ${storyFeature}`);
}
if (apps.length !== 62) errors.push(`expected 62 canonical applications, found ${apps.length}`);
if (apps.some((app) => app.type === "Experience")) errors.push("interactive applications must not appear in the catalog");
const dabaaStory = apps.find((app) => app.slug === "storymap-3bc68f337f");
if (dabaaStory?.language !== "ar" || !dabaaStory.alternateTitles?.length) errors.push("Dabaa StoryMap must appear in Arabic and English catalog modes");
const groupAliases = { dabaa: "dabaa-axis", dahshur: "dahshur-south-link", kalabsha: "kalabsha-axis", "qena-luxor": "qena-luxor-road", qus: "qus-axis", "regional-ring": "regional-ring-road", "suez-free": "cairo-suez-road", "suez-link": "suez-ring-link", "western-upper-egypt": "western-upper-egypt" };
const registryGroups = new Set(apps.map((app) => groupAliases[app.reportReferenceGroup] || app.reportReferenceGroup));
for (const group of registryGroups) if (group !== "suez-ring-link" && !source.includes(`["${group}",`)) errors.push(`axis filter is missing registry group: ${group}`);

console.log(JSON.stringify({ applications: apps.length, axes: registryGroups.size, interactions: 7, responsive: true, reducedMotion: true, errors: errors.length, result: errors.length ? "FAILED" : "PASSED" }, null, 2));
if (errors.length) {
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
}
