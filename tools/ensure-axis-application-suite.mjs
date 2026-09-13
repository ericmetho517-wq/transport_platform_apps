import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const registryPath = join(root, "registry", "apps.json");
const apps = JSON.parse(readFileSync(registryPath, "utf8"));

const axes = {
  "western-upper-egypt": { ar: "محور الصعيد الغربي", en: "Western Upper Egypt Axis" },
  dahshur: { ar: "وصلة دهشور الجنوبية", en: "Dahshur South Link" },
  "regional-ring": { ar: "القوس الشرقي للطريق الدائري الإقليمي وخط الروبيكي", en: "Eastern Regional Ring Road and Robeki Railway" },
  kalabsha: { ar: "محور كلابشة", en: "Kalabsha Axis" },
  "qena-luxor": { ar: "طريق قنا - الأقصر", en: "Qena - Luxor Road" },
  "suez-link": { ar: "وصلة طريق السويس من الطريق الدائري", en: "Suez Ring Road Link" },
  "suez-free": { ar: "طريق القاهرة - السويس الصحراوي", en: "Cairo - Suez Desert Road" },
  qus: { ar: "محور قوص", en: "Qus Axis" },
  dabaa: { ar: "محور الضبعة", en: "El Dabaa Axis" },
  ismailia: { ar: "محور القاهرة - الإسماعيلية", en: "Cairo - Ismailia Axis" },
};

const requested = [
  { type: "Web AppViewer", prefix: "web-viewer", ar: "تطبيق استعراض منطقة الدراسة", en: "Study Area Web App Builder" },
  { type: "Instant Filter Gallery", prefix: "instant-filter-gallery", ar: "مركز البيانات والتطبيقات", en: "Data and Application Hub" },
];

const templates = {
  "Web AppViewer": join(root, "projects", "web-viewer-ebc7f46747"),
  "Instant Filter Gallery": join(root, "projects", "instant-filter-gallery-0edd4664ca"),
};

const uniqueReferences = (group, type) => {
  const preferredKind = type === "Web AppViewer" ? "webviewer" : "gallery";
  const references = apps
    .filter((app) => app.reportReferenceGroup === group)
    .flatMap((app) => app.reportReferences || []);
  const preferred = references.filter((reference) => reference.referenceKind === preferredKind);
  const fallback = references.filter((reference) => ["gallery", "webviewer", "landuse-dashboard", "story-map", "story"].includes(reference.referenceKind));
  return [...new Map((preferred.length ? preferred : fallback).map((reference) => [reference.imagePath, reference])).values()].slice(0, 2);
};

const writeProject = (app) => {
  const target = join(root, "projects", app.slug);
  if (!existsSync(target)) cpSync(templates[app.type], target, { recursive: true });
  mkdirSync(join(target, "config"), { recursive: true });
  mkdirSync(join(target, "data"), { recursive: true });
  mkdirSync(join(target, "src"), { recursive: true });

  const config = `${JSON.stringify(app, null, 2)}\n`;
  writeFileSync(join(target, "config", "app.json"), config, "utf8");
  writeFileSync(join(target, "src", "app.config.json"), config, "utf8");
  writeFileSync(join(target, "data", "report-references.json"), `${JSON.stringify(app.reportReferences || [], null, 2)}\n`, "utf8");
  writeFileSync(join(target, "data", "sources.json"), `${JSON.stringify({
    applicationId: app.id,
    sourceDataRoot: "C:\\Geoinformatics for Information Systems\\وزارة النقل",
    dataGroup: app.reportReferenceGroup,
    migrationState: "Local axis datasets and verified dashboard summaries are connected through the shared runtime.",
  }, null, 2)}\n`, "utf8");
  writeFileSync(join(target, "PROJECT_DETAILS.md"), `# ${app.title}\n\n- Application ID: \`${app.id}\`\n- Type: \`${app.type}\`\n- Axis: \`${app.reportReferenceGroup}\`\n- Languages: Arabic and English (use \`?lang=ar\` or \`?lang=en\`)\n- Data source: local Ministry of Transport axis data and verified report references\n`, "utf8");
  writeFileSync(join(target, "index.html"), `<!doctype html>\n<html lang="ar" dir="rtl">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <meta name="theme-color" content="#0b3d2e" />\n    <title>${app.title}</title>\n    <link rel="stylesheet" href="../../shared/styles.css" />\n    <link rel="stylesheet" href="../../shared/reference.css" />\n    <link rel="stylesheet" href="../../shared/interactive-dashboard.css" />\n    <link rel="stylesheet" href="../../shared/sector-runtime.css" />\n  </head>\n  <body>\n    <div id="app"></div>\n    <script type="module" src="./src/main.ts"></script>\n  </body>\n</html>\n`, "utf8");
};

const created = [];
for (const [group, axis] of Object.entries(axes)) {
  for (const spec of requested) {
    if (apps.some((app) => app.reportReferenceGroup === group && app.type === spec.type)) continue;
    const id = createHash("sha256").update(`mot-local:${group}:${spec.type}`).digest("hex").slice(0, 32);
    const app = {
      id,
      slug: `${spec.prefix}-${id.slice(0, 10)}`,
      title: `${spec.ar} - ${axis.ar}`,
      alternateTitles: [`${spec.en} - ${axis.en}`],
      category: `تطبيقات ${axis.ar}`,
      type: spec.type,
      language: "ar",
      direction: "rtl",
      sourceUrl: "",
      status: "generated-from-local-axis-data",
      reportReferences: uniqueReferences(group, spec.type),
      reportReferenceGroup: group,
    };
    apps.push(app);
    writeProject(app);
    created.push(app.slug);
  }
}

writeFileSync(registryPath, `${JSON.stringify(apps, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ applications: apps.length, created }, null, 2));
