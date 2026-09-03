import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));
const ministryRoot = "C:\\Geoinformatics for Information Systems\\وزارة النقل";
const ogr2ogr = "C:\\Program Files\\QGIS 4.0.3\\bin\\ogr2ogr.exe";
const tempRoot = join(tmpdir(), "transport-landcover-export");
const outputRoot = join(repo, "public", "data", "dashboard");

if (!existsSync(ogr2ogr)) throw new Error(`QGIS ogr2ogr was not found: ${ogr2ogr}`);
rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(tempRoot, { recursive: true });

const sources = {
  "western-upper-egypt": { gdb: "طريق الصعيد الغربي\\New File Geodatabase.gdb", start: "Land_Cover2014", end: "Land_Cover2024" },
  "dahshur-south-link": { gdb: "دهشور\\6c1b3da6-172b-4665-bcaf-ca19d4ec3219.gdb", start: "Land_Cover2014", end: "Land_Cover2023" },
  "regional-ring-road": { gdb: "الاقليمي\\DataBase_Schema.gdb", start: "Land_Cover2014", end: "Land_Cover2023" },
  "kalabsha-axis": { gdb: "كلابشة\\3113ddd5-1016-4cd8-9089-64eddef7e4c1.gdb", start: "Land_Cover2014", end: "Land_Cover2023" },
  "qena-luxor-road": { gdb: "قنا\\Database13022024.gdb", start: "Land_Cover2014" },
  "qus-axis": { gdb: "قوس\\58f4867b-78a3-448f-82de-7a350f833156.gdb", start: "Land_Cover2014", end: "Land_Cover2023" },
  "dabaa-axis": { gdb: "الضبعة\\028a8e17-53a4-4b69-8e27-f31b5e572aa7.gdb", start: "Land_Use2014", end: "Land_Use2023" },
};
const suezSource = { gdb: "السويس\\السويس\\New File Geodatabase.gdb", start: "Land_Cover2014", end: "Land_Cover2024" };
const thematicSources = {
  "western-upper-egypt": {
    gdb: "طريق الصعيد الغربي\\New File Geodatabase.gdb",
    water: ["Water_Changes"],
    "field-survey": ["Abo_Simple", "Asiot", "Aswan", "Bni_Sweif", "Fayoum", "Giza", "Luxor", "Minia", "Qena"],
  },
  "dahshur-south-link": {
    gdb: "دهشور\\6c1b3da6-172b-4665-bcaf-ca19d4ec3219.gdb",
    governorates: ["Governorates"], buildings: ["Building"], landmarks: ["Landmarks"], parcels: ["Parcel"],
  },
  "regional-ring-road": {
    gdb: "الاقليمي\\DataBase_Schema.gdb",
    transport: ["Eklimy_Road", "Robeky_Road", "LRT_Road"], buildings: ["Building"], landmarks: ["Landmarks"], parcels: ["Parcel"], water: ["Water_Containment"],
  },
  "kalabsha-axis": {
    gdb: "كلابشة\\3113ddd5-1016-4cd8-9089-64eddef7e4c1.gdb", governorates: ["Governorates"], water: ["Water_Containment"],
  },
  "qus-axis": {
    gdb: "قوس\\58f4867b-78a3-448f-82de-7a350f833156.gdb", buildings: ["Building"], water: ["Water_Containment"],
  },
  "dabaa-axis": {
    gdb: "الضبعة\\028a8e17-53a4-4b69-8e27-f31b5e572aa7.gdb", "field-survey": ["Field_Points"],
  },
};
const categoryFields = ["استخدام_الأرض", "land_use", "Land_Use", "LAND_USE", "نوع_الاستخدام", "LU_CODE"];
const labelFields = ["وصف_الاستخدام", "land_use", "Land_Use", "نوع_المسطح"];
const sectorFields = ["اسم_القطاع", "sector", "Sector"];
const areaFields = ["مساحة_كم2", "مساحة_كم", "Area_KM2", "Area_KM", "SHAPE_Area", "Shape_Area"];

function first(properties, fields) {
  for (const field of fields) if (properties[field] !== undefined && properties[field] !== null && properties[field] !== "") return properties[field];
  return null;
}

function polygonsOf(geometry, result = []) {
  if (!geometry) return result;
  if (geometry.type === "Polygon") result.push(geometry.coordinates);
  else if (geometry.type === "MultiPolygon") result.push(...geometry.coordinates);
  else if (geometry.type === "GeometryCollection") geometry.geometries?.forEach((item) => polygonsOf(item, result));
  return result;
}

function coordinatePairs(value, result = []) {
  if (Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") result.push(value);
  else if (Array.isArray(value)) value.forEach((item) => coordinatePairs(item, result));
  return result;
}

function featureCenter(feature) {
  const pairs = feature.geometry ? coordinatePairs(feature.geometry.coordinates) : [];
  if (!pairs.length) return [0, 0];
  const xs = pairs.map((pair) => pair[0]), ys = pairs.map((pair) => pair[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}

function aggregate(collection) {
  const grouped = new Map();
  for (const feature of collection.features || []) {
    const polygons = polygonsOf(feature.geometry);
    if (!polygons.length) continue;
    const properties = feature.properties || {};
    const value = first(properties, categoryFields) ?? "unclassified";
    const label = first(properties, labelFields);
    const sector = first(properties, sectorFields);
    const key = `${String(value).trim().toLowerCase()}|${String(label ?? "").trim().toLowerCase()}|${String(sector ?? "")}`;
    if (!grouped.has(key)) grouped.set(key, { value, label, sector, polygons: [], count: 0, area: 0 });
    const target = grouped.get(key);
    target.polygons.push(...polygons);
    target.count += 1;
    const rawArea = Number(first(properties, areaFields));
    if (Number.isFinite(rawArea) && rawArea > 0) target.area += rawArea > 1_000_000 ? rawArea / 1_000_000 : rawArea;
  }
  return {
    type: "FeatureCollection",
    features: Array.from(grouped.values()).map((item) => ({
      type: "Feature",
      properties: {
        landuse_value: item.value,
        landuse_code: typeof item.value === "number" ? item.value : null,
        landuse_label: item.label ?? (typeof item.value === "string" ? item.value : null),
        source_feature_count: item.count,
        area_km2: Number(item.area.toFixed(6)),
        ...(item.sector !== null ? { sector: String(item.sector) } : {}),
      },
      geometry: { type: "MultiPolygon", coordinates: item.polygons },
    })),
  };
}

function geometryParts(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point") return { family: "point", parts: [geometry.coordinates] };
  if (geometry.type === "MultiPoint") return { family: "point", parts: geometry.coordinates };
  if (geometry.type === "LineString") return { family: "line", parts: [geometry.coordinates] };
  if (geometry.type === "MultiLineString") return { family: "line", parts: geometry.coordinates };
  if (geometry.type === "Polygon") return { family: "polygon", parts: [geometry.coordinates] };
  if (geometry.type === "MultiPolygon") return { family: "polygon", parts: geometry.coordinates };
  return null;
}

function prepareThematic(collections) {
  const features = collections.flatMap(({ layer, collection }) => (collection.features || []).filter((feature) => feature.geometry).map((feature) => ({ ...feature, properties: { source_layer: layer, source_feature_count: 1, ...(feature.properties || {}) } })));
  if (features.length <= 1500) return { type: "FeatureCollection", features };
  const groups = new Map();
  for (const feature of features) {
    const parsed = geometryParts(feature.geometry);
    if (!parsed) continue;
    const layer = feature.properties.source_layer;
    const key = `${layer}|${parsed.family}`;
    if (!groups.has(key)) groups.set(key, { layer, family: parsed.family, parts: [], count: 0 });
    const target = groups.get(key);
    target.parts.push(...parsed.parts);
    target.count += 1;
  }
  return {
    type: "FeatureCollection",
    features: Array.from(groups.values()).map((item) => ({
      type: "Feature",
      properties: { source_layer: item.layer, source_feature_count: item.count, display_mode: "all geometries grouped for browser performance" },
      geometry: {
        type: item.family === "point" ? "MultiPoint" : item.family === "line" ? "MultiLineString" : "MultiPolygon",
        coordinates: item.parts,
      },
    })),
  };
}

function exportRaw(gdbRelative, layer, key) {
  const output = join(tempRoot, `${key}-${layer}.geojson`);
  const run = spawnSync(ogr2ogr, ["-f", "GeoJSON", output, join(ministryRoot, gdbRelative), layer, "-t_srs", "EPSG:4326", "-simplify", "8", "-lco", "COORDINATE_PRECISION=6"], {
    encoding: "utf8",
    env: { ...process.env, PROJ_LIB: "C:\\Program Files\\QGIS 4.0.3\\share\\proj" },
  });
  if (run.status !== 0) throw new Error(`${key}/${layer}: ${run.stderr || run.stdout}`);
  return JSON.parse(readFileSync(output, "utf8"));
}

function writeLayer(group, layerName, collection, sourceCount) {
  const folder = join(outputRoot, group);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, `${layerName}.geojson`), JSON.stringify(aggregate(collection)), "utf8");
  const summaryPath = join(folder, "summary.json");
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  if (!summary.layers.includes(layerName)) summary.layers.push(layerName);
  summary.layerCounts ||= {};
  summary.sourceLayerCounts ||= {};
  const aggregated = aggregate(collection);
  summary.layerCounts[layerName] = aggregated.features.length;
  summary.sourceLayerCounts[layerName] = sourceCount;
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  console.log(`${group}/${layerName}: ${sourceCount} source features -> ${aggregated.features.length} categorized map features`);
}

function writePreparedLayer(group, layerName, collection, sourceCount) {
  const folder = join(outputRoot, group);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, `${layerName}.geojson`), JSON.stringify(collection), "utf8");
  const summaryPath = join(folder, "summary.json");
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  if (!summary.layers.includes(layerName)) summary.layers.push(layerName);
  summary.layerCounts ||= {};
  summary.sourceLayerCounts ||= {};
  summary.layerCounts[layerName] = collection.features.length;
  summary.sourceLayerCounts[layerName] = sourceCount;
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  console.log(`${group}/${layerName}: ${sourceCount} source features -> ${collection.features.length} browser features`);
}

for (const [group, source] of Object.entries(sources)) {
  for (const [period, layer] of [["start", source.start], ["end", source.end]]) {
    if (!layer) continue;
    const raw = exportRaw(source.gdb, layer, group);
    writeLayer(group, `landcover-${period}`, raw, raw.features.length);
  }
}

const suezGroups = ["cairo-suez-road", "suez-ring-link"];
const studyCenters = Object.fromEntries(suezGroups.map((group) => {
  const study = JSON.parse(readFileSync(join(outputRoot, group, "study.geojson"), "utf8"));
  return [group, featureCenter(study.features[0])];
}));
for (const [period, layer] of [["start", suezSource.start], ["end", suezSource.end]]) {
  const raw = exportRaw(suezSource.gdb, layer, "suez");
  const split = Object.fromEntries(suezGroups.map((group) => [group, { type: "FeatureCollection", features: [] }]));
  for (const feature of raw.features) {
    const [x, y] = featureCenter(feature);
    const nearest = suezGroups.toSorted((a, b) => {
      const da = (x - studyCenters[a][0]) ** 2 + (y - studyCenters[a][1]) ** 2;
      const db = (x - studyCenters[b][0]) ** 2 + (y - studyCenters[b][1]) ** 2;
      return da - db;
    })[0];
    split[nearest].features.push(feature);
  }
  for (const group of suezGroups) writeLayer(group, `landcover-${period}`, split[group], split[group].features.length);
}

for (const [group, source] of Object.entries(thematicSources)) {
  for (const [targetLayer, sourceLayers] of Object.entries(source)) {
    if (targetLayer === "gdb") continue;
    const collections = sourceLayers.map((layer) => ({ layer, collection: exportRaw(source.gdb, layer, `${group}-${targetLayer}`) }));
    const sourceCount = collections.reduce((sum, item) => sum + item.collection.features.length, 0);
    writePreparedLayer(group, targetLayer, prepareThematic(collections), sourceCount);
  }
}

const suezSurvey = exportRaw(suezSource.gdb, "survey", "suez-survey");
const surveySplit = Object.fromEntries(suezGroups.map((group) => [group, { type: "FeatureCollection", features: [] }]));
for (const feature of suezSurvey.features) {
  const [x, y] = featureCenter(feature);
  const nearest = suezGroups.toSorted((a, b) => {
    const da = (x - studyCenters[a][0]) ** 2 + (y - studyCenters[a][1]) ** 2;
    const db = (x - studyCenters[b][0]) ** 2 + (y - studyCenters[b][1]) ** 2;
    return da - db;
  })[0];
  surveySplit[nearest].features.push(feature);
}
for (const group of suezGroups) writePreparedLayer(group, "field-survey", prepareThematic([{ layer: "survey", collection: surveySplit[group] }]), surveySplit[group].features.length);

const manifestPath = join(outputRoot, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
for (const group of Object.keys(manifest)) {
  const summary = JSON.parse(readFileSync(join(outputRoot, group, "summary.json"), "utf8"));
  manifest[group].layers = summary.layers;
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
rmSync(tempRoot, { recursive: true, force: true });
console.log(`Land-cover exports completed from ${basename(ministryRoot)} source geodatabases.`);
