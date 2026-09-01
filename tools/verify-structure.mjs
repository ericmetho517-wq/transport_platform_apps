import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, "registry", "apps.json"), "utf8"));
const required = ["index.html", "PROJECT_DETAILS.md", "config/app.json", "src/App.ts", "src/main.ts", "src/app.config.json", "data/sources.json", "data/report-references.json"];
const missing = [];
for (const app of registry) {
  for (const file of required) {
    const target = path.join(root, "projects", app.slug, file);
    if (!fs.existsSync(target)) missing.push(path.relative(root, target));
  }
}
const counts = registry.reduce((acc, app) => ({...acc, [app.type]: (acc[app.type] || 0) + 1}), {});
const withReportReferences = registry.filter((app) => app.reportReferences?.length).length;
console.log(JSON.stringify({applications: registry.length, counts, withReportReferences, missingFiles: missing.length}, null, 2));
if (registry.length !== 78 || missing.length) {
  console.error(missing.join("\n"));
  process.exit(1);
}
