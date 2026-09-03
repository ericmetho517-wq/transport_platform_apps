import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const reportName = "Nakl_Dabaa_30Dec2023.pptx";
const makeRef = (image, page, kind, caption) => ({
  imagePath: `../../references/dabaa/${image}`,
  reportName,
  page,
  sourceUrls: [],
  sourceItemIds: [],
  projectGroup: "dabaa",
  referenceKind: kind,
  caption,
  matchType: "project-and-application-type",
});

const referenceSets = {
  "dashboard-c1e29f0123": [
    makeRef("landuse-dashboard.png", 13, "landuse-dashboard", "لوحة مؤشرات تغير استخدامات الأراضي بمحور الضبعة بالقيم والتوزيع الأصليين."),
    makeRef("landuse-change-comparison.png", 10, "landuse-comparison", "مقارنة خرائط وتصنيفات استخدامات الأراضي لعامي 2014 و2023."),
  ],
  "dashboard-594d7c7ff4": [
    makeRef("price-dashboard.png", 14, "price-dashboard", "لوحة مؤشرات تغير أسعار الأراضي بمحور الضبعة بالقيم الأصلية."),
  ],
  "storymap-3bc68f337f": [
    makeRef("project-overview.png", 4, "story-hero", "نطاق ومكونات مشروع محور الضبعة."),
    makeRef("landuse-2014.png", 5, "story-map", "خريطة استخدامات الأراضي لعام 2014."),
    makeRef("landuse-2023.png", 6, "story-map", "خريطة استخدامات الأراضي لعام 2023."),
    makeRef("urban-change-comparison.png", 9, "story-comparison", "مقارنة التغير العمراني بين عامي 2014 و2023."),
    makeRef("landuse-change-comparison.png", 10, "story-comparison", "مقارنة تغير استخدامات الأراضي بين عامي 2014 و2023."),
  ],
  "experience-d72fea4308": [
    makeRef("project-overview.png", 4, "experience-hero", "واجهة المشروع ومكونات الدراسة لمحور الضبعة."),
    makeRef("landuse-change-comparison.png", 10, "experience-map", "المقارنة المكانية لاستخدامات الأراضي."),
    makeRef("landuse-dashboard.png", 13, "experience-dashboard", "لوحة مؤشرات استخدامات الأراضي المرتبطة بالتجربة."),
    makeRef("price-dashboard.png", 14, "experience-dashboard", "لوحة مؤشرات أسعار الأراضي المرتبطة بالتجربة."),
  ],
};

const registryPath = join(root, "registry", "apps.json");
const apps = JSON.parse(await readFile(registryPath, "utf8"));
for (const app of apps) {
  const refs = referenceSets[app.slug];
  if (!refs) continue;
  app.reportReferences = refs;
  app.reportReferenceGroup = "dabaa";
  for (const relative of ["src/app.config.json", "config/app.json"]) {
    const file = join(root, "projects", app.slug, relative);
    const config = JSON.parse(await readFile(file, "utf8"));
    config.reportReferences = refs;
    config.reportReferenceGroup = "dabaa";
    await writeFile(file, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
  await writeFile(join(root, "projects", app.slug, "data", "report-references.json"), `${JSON.stringify(refs, null, 2)}\n`, "utf8");
}
await writeFile(registryPath, `${JSON.stringify(apps, null, 2)}\n`, "utf8");
console.log(`Updated ${Object.keys(referenceSets).length} Dabaa applications with authoritative slide references.`);
