import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const apps = JSON.parse(readFileSync(join(root, "registry", "apps.json"), "utf8"));
const aliases = {
  dabaa: "dabaa-axis", dahshur: "dahshur-south-link", kalabsha: "kalabsha-axis",
  "qena-luxor": "qena-luxor-road", qus: "qus-axis", "regional-ring": "regional-ring-road",
  "suez-free": "cairo-suez-road", "suez-link": "suez-ring-link", "western-upper-egypt": "western-upper-egypt", ismailia: "ismailia",
};
const groups = [...new Set(apps.filter((app) => app.type === "StoryMap").map((app) => aliases[app.reportReferenceGroup] || app.reportReferenceGroup))];
const errors = [];
const coverage = [];

function hasCoordinates(value) {
  if (!Array.isArray(value)) return false;
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    return Number.isFinite(value[0]) && Number.isFinite(value[1]) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90;
  }
  return value.some(hasCoordinates);
}

function renderableGeometry(geometry) {
  if (!geometry) return false;
  if (geometry.type === "GeometryCollection") return (geometry.geometries || []).some(renderableGeometry);
  return hasCoordinates(geometry.coordinates);
}

for (const group of groups) {
  const folder = join(root, "public", "data", "dashboard", group);
  const summary = JSON.parse(readFileSync(join(folder, "summary.json"), "utf8"));
  let total = 0;
  const empty = [];
  const emptyGeometries = [];
  for (const layer of summary.layers) {
    const file = join(folder, `${layer}.geojson`);
    if (!existsSync(file)) { errors.push(`${group}/${layer}: missing GeoJSON file`); continue; }
    const collection = JSON.parse(readFileSync(file, "utf8"));
    const features = collection.features || [];
    const expected = summary.layerCounts?.[layer];
    if (Number.isInteger(expected) && expected !== features.length) errors.push(`${group}/${layer}: summary ${expected}, file ${features.length}`);
    const unrenderable = features.filter((feature) => !renderableGeometry(feature.geometry));
    if (unrenderable.length) emptyGeometries.push({ layer, count: unrenderable.length });
    total += features.length;
    if (!features.length) empty.push(layer);
  }
  coverage.push({ group, layers: summary.layers.length, features: total, empty, emptyGeometries });
}
console.log(JSON.stringify({ storyMapGroups: groups.length, coverage, errors }, null, 2));
if (errors.length) process.exitCode = 1;
