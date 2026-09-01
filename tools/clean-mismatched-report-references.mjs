import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const unsupported = new Set([
  "dashboard-4b68db62a1", "dashboard-48c0447e11", "dashboard-890d333abf", "dashboard-489e365131", "dashboard-37e01603d0", "dashboard-ba98b53679",
  "dashboard-35c11a505b", "dashboard-83f3738705", "dashboard-676c18c4b7", "dashboard-4138cfe326", "dashboard-f0a5bc623c",
]);
const registryPath = join(root, "registry", "apps.json");
const apps = JSON.parse(readFileSync(registryPath, "utf8"));
for (const app of apps) {
  if (!unsupported.has(app.slug)) continue;
  app.reportReferences = [];
  app.reportReferenceStatus = "No purpose-matched civil/development-impact screenshot was found in the supplied reports";
  for (const relative of [join("config", "app.json"), join("src", "app.config.json")]) {
    const path = join(root, "projects", app.slug, relative);
    if (!existsSync(path)) continue;
    const config = JSON.parse(readFileSync(path, "utf8"));
    config.reportReferences = [];
    config.reportReferenceStatus = app.reportReferenceStatus;
    writeFileSync(path, JSON.stringify(config, null, 2) + "\n", "utf8");
  }
  writeFileSync(join(root, "projects", app.slug, "data", "report-references.json"), "[]\n", "utf8");
}
writeFileSync(registryPath, JSON.stringify(apps, null, 2) + "\n", "utf8");
console.log(`Removed mismatched land-use screenshots from ${unsupported.size} civil/development-impact applications.`);
