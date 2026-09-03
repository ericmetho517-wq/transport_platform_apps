import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apps = JSON.parse(readFileSync(join(root, "registry", "apps.json"), "utf8"));
const errors = [];
const rows = apps.map((app) => {
  const references = app.reportReferences || [];
  const exactItemReference = references.some((reference) => (reference.sourceItemIds || []).includes(app.id));
  const missingImages = references.filter((reference) => {
    const relative = reference.imagePath?.replace(/^\.\.\/\.\.\//, "");
    return relative && !existsSync(join(root, "public", relative));
  }).map((reference) => reference.imagePath);
  const copies = ["src/app.config.json", "config/app.json"].map((relative) => JSON.parse(readFileSync(join(root, "projects", app.slug, relative), "utf8")));
  const dataReferences = JSON.parse(readFileSync(join(root, "projects", app.slug, "data", "report-references.json"), "utf8"));
  if (copies.some((copy) => JSON.stringify(copy.reportReferences || []) !== JSON.stringify(references))) errors.push(`${app.slug}: project configuration references differ from the registry`);
  if (JSON.stringify(dataReferences) !== JSON.stringify(references)) errors.push(`${app.slug}: data/report-references.json differs from the registry`);
  if (missingImages.length) errors.push(`${app.slug}: ${missingImages.length} reference images are missing`);
  return {
    slug: app.slug,
    title: app.title,
    type: app.type,
    language: app.language,
    sector: app.reportReferenceGroup,
    referenceCount: references.length,
    fidelity: exactItemReference ? "exact-item-reference" : references.length ? "sector-and-application-type-reference" : "source-reference-unavailable",
    reports: [...new Set(references.map((reference) => reference.reportName))],
    pages: [...new Set(references.map((reference) => reference.page))],
    missingImages,
  };
});

const fidelityCounts = rows.reduce((counts, row) => ({ ...counts, [row.fidelity]: (counts[row.fidelity] || 0) + 1 }), {});
const typeCoverage = rows.reduce((coverage, row) => {
  const item = coverage[row.type] || { applications: 0, withReferences: 0 };
  item.applications += 1;
  if (row.referenceCount) item.withReferences += 1;
  coverage[row.type] = item;
  return coverage;
}, {});
const report = {
  generatedAt: new Date().toISOString(),
  applications: rows.length,
  fidelityCounts,
  typeCoverage,
  errors,
  result: errors.length ? "FAILED" : "PASSED",
  applicationsAudit: rows,
};
writeFileSync(join(root, "registry", "reference-fidelity-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ applications: report.applications, fidelityCounts, typeCoverage, errors: errors.length, result: report.result }, null, 2));
if (errors.length) process.exitCode = 1;
