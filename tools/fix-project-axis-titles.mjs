// Replaces the remaining English "Axis" wording in every per-project app.config.json /
// config/app.json name field with "Road", and purges the last "Axis" tokens from the
// story sector labels. Long report captions are left verbatim.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const replacements = [
  [/Western Upper Egypt Axis/g, "Western Upper Egypt Road"],
  [/Kalabsha Axis/g, "Kalabsha Road"],
  [/Qus Axis/g, "Qus Road"],
  [/El Dabaa Axis/g, "El Dabaa Road"],
  [/Dabaa Axis/g, "El Dabaa Road"],
  [/Dabaa axis/g, "Dabaa road"],
  [/Upper Egypt Western Desert Axis/g, "Upper Egypt Western Desert Road"],
  [/Cairo\s*[-–]\s*Ismailia Axis/g, "Cairo–Ismailia Road"],
  [/Qena Axis/g, "Qena Road"],
  [/Qena\s*[-–]\s*Luxor Axis/g, "Qena–Luxor Road"],
  [/Axis applications/g, "Road applications"],
];

function rewriteLine(line) {
  if (!/Axis|axis/.test(line)) return line;
  let next = line;
  for (const [pattern, value] of replacements) next = next.replace(pattern, value);
  return next;
}

let files = 0;
let lines = 0;
const projectDirs = readdirSync("projects");
const paths = [];
for (const entry of projectDirs) {
  for (const candidate of [`projects/${entry}/src/app.config.json`, `projects/${entry}/config/app.json`]) {
    try { readFileSync(candidate); paths.push(candidate); } catch { /* not present */ }
  }
}

for (const path of paths) {
  const before = readFileSync(path, "utf8");
  let hit = 0;
  const after = before.split("\n").map((line) => {
    // Only name-bearing fields; never the long report captions.
    if (!/^\s*"(title|alternateTitles|category)"\s*:/.test(line) && !/^\s*"[^"]*",?\s*$/.test(line)) return line;
    const next = rewriteLine(line);
    if (next !== line) hit += 1;
    return next;
  }).join("\n");
  if (!hit) continue;
  writeFileSync(path, after, "utf8");
  files += 1;
  lines += hit;
}
console.log(`projects: ${files} file(s), ${lines} line(s)`);

// Story sector labels and the English media category names.
const storyFile = "shared/sector-runtime.ts";
const storyBefore = readFileSync(storyFile, "utf8");
let storyHits = 0;
const storyAfter = storyBefore.split("\n").map((line) => {
  if (!/Axis/.test(line)) return line;
  const next = line.replace(/Abu Simbel Axis/g, "Abu Simbel Road");
  if (next !== line) storyHits += 1;
  return next;
}).join("\n");
if (storyHits) writeFileSync(storyFile, storyAfter, "utf8");
console.log(`sector-runtime: ${storyHits} line(s)`);
