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
const dashboardKinds = {
  urban: { ar: "لوحة مؤشرات الأراضي العمرانية", en: "Urban Land Indicators Dashboard", template: "dashboard-ismailia-urban" },
  agriculture: { ar: "لوحة مؤشرات الأراضي الزراعية والصناعية", en: "Agricultural and Industrial Land Indicators Dashboard", template: "dashboard-ismailia-agriculture" },
  prices: { ar: "لوحة مؤشرات أسعار الأراضي", en: "Land Price Indicators Dashboard", template: "dashboard-ismailia-prices" },
};

const dashboardKind = (app) => {
  const title = app.title.toLowerCase();
  if (/سعر|أسعار|اسعار|price/.test(title)) return "prices";
  if (/زراعي|الزراعية|agricultural/.test(title)) return "agriculture";
  if (/عمراني|العمرانية|urban/.test(title)) return "urban";
  return "";
};
const uniqueReferences = (group, kind) => {
  const groupApps = apps.filter((app) => app.reportReferenceGroup === group);
  const kindApps = groupApps.filter((app) => app.type === "Dashboard" && dashboardKind(app) === kind);
  const source = kindApps.length ? kindApps : groupApps;
  return [...new Map(source.flatMap((app) => app.reportReferences || []).map((reference) => [reference.imagePath, reference])).values()];
};
const writeProjectData = (app, templateSlug) => {
  const target = join(root, "projects", app.slug);
  if (!existsSync(target)) cpSync(join(root, "projects", templateSlug), target, { recursive: true });
  for (const directory of ["config", "data", "src"]) mkdirSync(join(target, directory), { recursive: true });
  const config = `${JSON.stringify(app, null, 2)}\n`;
  writeFileSync(join(target, "config", "app.json"), config, "utf8");
  writeFileSync(join(target, "src", "app.config.json"), config, "utf8");
  writeFileSync(join(target, "data", "report-references.json"), `${JSON.stringify(app.reportReferences || [], null, 2)}\n`, "utf8");
  const indexPath = join(target, "index.html");
  if (existsSync(indexPath)) writeFileSync(indexPath, readFileSync(indexPath, "utf8").replace(/<title>[\s\S]*?<\/title>/, `<title>${app.title}</title>`), "utf8");
  const sourcesPath = join(target, "data", "sources.json");
  if (!existsSync(sourcesPath)) writeFileSync(sourcesPath, `${JSON.stringify({ applicationId: app.id, dataGroup: app.reportReferenceGroup }, null, 2)}\n`, "utf8");
  writeFileSync(join(target, "PROJECT_DETAILS.md"), `# ${app.title}\n\n- Type: \`${app.type}\`\n- Axis: \`${app.reportReferenceGroup}\`\n- English title: ${app.alternateTitles[0]}\n- Data: verified local axis datasets and report indicators\n`, "utf8");
};

const dashboards = [];
for (const [group, axis] of Object.entries(axes)) {
  const groupDashboards = apps.filter((app) => app.type === "Dashboard" && app.reportReferenceGroup === group);
  for (const [kind, spec] of Object.entries(dashboardKinds)) {
    let app = groupDashboards.find((candidate) => candidate.language === "ar" && dashboardKind(candidate) === kind)
      || groupDashboards.find((candidate) => dashboardKind(candidate) === kind);
    if (!app || dashboards.some((candidate) => candidate.slug === app.slug)) {
      const id = createHash("sha256").update(`mot-executive:${group}:${kind}`).digest("hex").slice(0, 32);
      app = { ...JSON.parse(readFileSync(join(root, "projects", spec.template, "src", "app.config.json"), "utf8")), id, slug: `dashboard-${id.slice(0, 10)}` };
    }
    app = {
      ...app,
      title: `${spec.ar} – ${axis.ar}`,
      alternateTitles: [`${spec.en} – ${axis.en}`],
      category: `تطبيقات ${axis.ar}`,
      language: "ar",
      direction: "rtl",
      status: "standardized-executive-dashboard",
      reportReferenceGroup: group,
      reportReferences: uniqueReferences(group, kind),
    };
    writeProjectData(app, spec.template);
    dashboards.push(app);
  }
}

const experiences = [];
for (const [group, axis] of Object.entries(axes)) {
  let app = apps.find((candidate) => candidate.type === "Experience" && candidate.reportReferenceGroup === group && candidate.language === "ar")
    || apps.find((candidate) => candidate.type === "Experience" && candidate.reportReferenceGroup === group);
  if (!app) {
    const id = createHash("sha256").update(`mot-axis-experience:${group}`).digest("hex").slice(0, 32);
    app = { ...JSON.parse(readFileSync(join(root, "projects", "experience-74d4e16588", "src", "app.config.json"), "utf8")), id, slug: `experience-${id.slice(0, 10)}` };
  }
  app = {
    ...app,
    title: axis.ar,
    alternateTitles: [axis.en],
    category: `تطبيقات ${axis.ar}`,
    language: "ar",
    direction: "rtl",
    status: "standardized-axis-experience",
    reportReferenceGroup: group,
    reportReferences: uniqueReferences(group, "urban").slice(0, 3),
  };
  writeProjectData(app, "experience-74d4e16588");
  experiences.push(app);
}

const retained = apps.filter((app) => !["Dashboard", "Experience"].includes(app.type));
const registry = [...dashboards, ...experiences, ...retained];
writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ applications: registry.length, dashboards: dashboards.length, experiences: experiences.length }, null, 2));
