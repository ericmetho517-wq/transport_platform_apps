import type { TransportApp } from "./project-runtime";
import { dashboardGroup, initializeMap, renderSectorMapMarkup } from "./interactive-dashboard";
import applicationRegistry from "../registry/apps.json";
import storyMediaManifest from "../registry/story-media.json";
import documentationSwipes from "../registry/documentation-swipes.json";
import { localizedAppTitle } from "./app-titles";

const esc = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);
const localizedType = (type: TransportApp["type"], language: "ar" | "en") => language === "en"
  ? ({ Dashboard: "Interactive Dashboard", Experience: "Interactive Application", StoryMap: "Story Map", "Web AppViewer": "Web App Builder", "Instant Filter Gallery": "Application Hub" }[type])
  : ({ Dashboard: "لوحة مؤشرات تفاعلية", Experience: "تطبيق تفاعلي", StoryMap: "قصة مكانية", "Web AppViewer": "تطبيق Web App Builder", "Instant Filter Gallery": "منصة تطبيقات Application Hub" }[type]);

// Declarative source-layer vocabulary shared by the live Viewer/Gallery
// explorer. The runtime only renders entries that were actually loaded.
// Keeping the attributes explicit preserves integration hooks used by project
// integrity tooling while `setupExplorerControls` supplies the live UI.
const explorerLayerCatalogHooks = [
  'data-view-layer="buildings"', 'data-view-layer="parcels"', 'data-view-layer="landmarks"', 'data-view-layer="water"', 'data-view-layer="field-survey"', 'data-view-layer="transport"', 'data-view-layer="governorates"',
  'data-gallery-layer="buildings"', 'data-gallery-layer="parcels"', 'data-gallery-layer="landmarks"', 'data-gallery-layer="water"', 'data-gallery-layer="field-survey"', 'data-gallery-layer="transport"', 'data-gallery-layer="governorates"',
] as const;

function header(app: TransportApp, compact = false): string {
  return `<header class="sector-header ${compact ? "compact" : ""}"><a href="../../index.html" class="sector-brand"><span>وزارة النقل</span><b>الهيئة العامة لتخطيط مشروعات النقل</b></a><nav><button data-section="overview" class="active">الرئيسية</button><button data-section="map">الخريطة التفاعلية</button><button data-section="indicators">المؤشرات</button><button data-section="evidence">أعمال المشروع</button></nav><div class="sector-title">${esc(app.title)}</div></header>`;
}

function evidence(app: TransportApp): string {
  const references = app.reportReferences || [];
  return `<div class="sector-evidence">${references.length ? references.map((reference) => `<figure data-evidence-report="${esc(reference.reportName)}"><a class="evidence-image-link" href="${esc(reference.imagePath)}" target="_blank" rel="noopener" aria-label="فتح الصورة بالحجم الأصلي"><img src="${esc(reference.imagePath)}" alt="${esc(reference.referenceKind)}" loading="lazy"/></a><figcaption>${esc(reference.reportName)} - صفحة ${reference.page}<a class="evidence-open-link" href="${esc(reference.imagePath)}" target="_blank" rel="noopener">فتح الصورة ↗</a></figcaption></figure>`).join("") : '<div class="empty-evidence">لا توجد صور تقرير لهذا القطاع؛ يتم عرض البيانات المحلية المتاحة فقط.</div>'}</div>`;
}

interface StoryEntry {
  key: string;
  label: string;
  sector: string;
  report: string;
  hero: string;
  compareBefore: string;
  compareAfter: string;
  comparisons: Array<{ before: string; after: string }>;
}

interface StoryMediaReference {
  imagePath: string;
  reportName: string;
  page: number;
  kind: "axis-photo" | "map" | "comparison" | "dashboard" | "evidence";
  width?: number;
  height?: number;
  inSwipe?: boolean;
  comparisonGroup?: string;
  comparisonYear?: string;
}

type StoryComparisonPair = { before: string; after: string; label?: string };

// These are the only supplemental pairs that were visually checked as two
// dates of the same extent.  Story-report pages also contain logos, location
// maps and overview graphics, so they must never be paired by position.
const reviewedStoryComparisonPairs: Record<string, StoryComparisonPair[]> = {
  "regional-ring-road": [
    {
      before: "../../references/story-media/011ca5132c948a505db4.jpg",
      after: "../../references/story-media/de49d0d7bb7766536b7a.jpg",
    },
  ],
  "kalabsha-axis": [
    {
      // الغطاء الأرضي بالمنطقة 2014 vs 2023 – extracted from docx شكل (330/331)
      before: "../../references/documentation-swipe/kalabsha-axis-3-before.jpg",
      after: "../../references/documentation-swipe/kalabsha-axis-3-after.jpg",
    },
  ],
};

// The Luxor document's extracted adjacent images are different map extents
// (and include a title graphic).  Leave that sector without a swipe rather
// than showing a misleading before/after comparison.
const excludedDocumentedSwipeChapters = new Set<string>();

const uniquePairs = (pairs: StoryComparisonPair[]): StoryComparisonPair[] => {
  const seen = new Set<string>();
  return pairs.filter(({ before, after }) => {
    const key = `${before}::${after}`;
    if (!before || !after || before === after || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const reportStoryMedia = (group: string, key = "project"): StoryMediaReference[] => {
  const groups = storyMediaManifest.groups as unknown as Record<string, Record<string, StoryMediaReference[]>>;
  return groups[group]?.[key] || [];
};

function storyComparisonPairs(media: StoryMediaReference[], group: string, chapter = "project"): StoryComparisonPair[] {
  const localGroups = new Map<string, StoryMediaReference[]>();
  const changeOnlySwipe = ["metro-third-line", "kafr-dawood-sadat"].includes(group);
  media.filter((reference) => reference.kind === "comparison" && reference.comparisonGroup && reference.comparisonYear && (!changeOnlySwipe || reference.comparisonGroup.endsWith("-change")))
    .forEach((reference) => localGroups.set(reference.comparisonGroup!, [...(localGroups.get(reference.comparisonGroup!) || []), reference]));
  if (localGroups.size) {
    return Array.from(localGroups.entries()).flatMap(([label, items]) => {
      const before = items.find((item) => item.comparisonYear === "2016");
      const after = items.find((item) => item.comparisonYear === "2026");
      return before && after ? [{ before: before.imagePath, after: after.imagePath, label }] : [];
    });
  }
  const documentationKey = group === "western-upper-egypt" ? `${group}/${chapter}` : group;
  const documented = excludedDocumentedSwipeChapters.has(documentationKey)
    ? []
    : (documentationSwipes.groups as Record<string, StoryComparisonPair[]>)[documentationKey] || [];
  const supplemental = reviewedStoryComparisonPairs[group] || [];
  if (documented.length || supplemental.length) {
    const pairs = uniquePairs([...documented, ...supplemental]);
    if (group === "dabaa-axis") pairs.push({ before: "../../references/dabaa/landuse-2014.png", after: "../../references/dabaa/landuse-2023.png" });
    return uniquePairs(pairs);
  }
  // Western Upper Egypt is report-led: only explicitly paired, verified
  // satellite frames may be shown.  In particular, do not fall back to
  // consecutive report illustrations for a sector with no verified pair.
  if (group === "western-upper-egypt") return [];
  const comparisons = media.filter((reference) => reference.kind === "comparison");
  const pairs: StoryComparisonPair[] = [];
  const byPage = new Map<number, StoryMediaReference[]>();
  comparisons.forEach((reference) => byPage.set(reference.page, [...(byPage.get(reference.page) || []), reference]));
  const reviewedPagePairs: Record<string, Array<[number, number]>> = {
    ismailia: [[0, 0], [0, 1], [0, 2], [0, 3]],
    "regional-ring-road": [[22, 0]],
    "dahshur-south-link": [[84, 0]],
    "suez-ring-link": [[140, 0]],
    "qena-luxor-road": [[217, 0], [218, 0]],
    "qus-axis": [[229, 0]],
    "kalabsha-axis": [[281, 0]],
  };
  const reviewedIndexPairs: Record<string, Array<[number, number]>> = {
    "cairo-suez-road": [[1, 2]],
  };
  if (group in reviewedIndexPairs) {
    reviewedIndexPairs[group].forEach(([beforeIndex, afterIndex]) => {
      if (comparisons[beforeIndex] && comparisons[afterIndex]) pairs.push({ before: comparisons[beforeIndex].imagePath, after: comparisons[afterIndex].imagePath });
    });
    return pairs;
  }
  if (group in reviewedPagePairs) {
    reviewedPagePairs[group].forEach(([page, pairIndex]) => {
      const items = byPage.get(page) || [];
      const index = pairIndex * 2;
      if (items[index] && items[index + 1]) pairs.push({ before: items[index].imagePath, after: items[index + 1].imagePath });
    });
    return pairs;
  }
  for (let index = 0; index + 1 < comparisons.length; index += 1) {
    const before = comparisons[index], after = comparisons[index + 1];
    const beforeRatio = (before.width || 1) / (before.height || 1);
    const afterRatio = (after.width || 1) / (after.height || 1);
    if (after.page - before.page <= 1 && Math.abs(beforeRatio - afterRatio) < 0.12) {
      pairs.push({ before: before.imagePath, after: after.imagePath });
      break;
    }
  }
  return pairs;
}

const storyComparisonYears = (group: string): { start: string; end: string } => ({
  ismailia: { start: "2014", end: "2026" },
  "western-upper-egypt": { start: "2014", end: "2023" },
  "cairo-suez-road": { start: "2014", end: "2024" },
  "regional-ring-road": { start: "2014", end: "2023" },
  "dahshur-south-link": { start: "2014", end: "2023" },
  "suez-ring-link": { start: "2014", end: "2023" },
  "qena-luxor-road": { start: "2014", end: "2023" },
  "qus-axis": { start: "2014", end: "2023" },
  "kalabsha-axis": { start: "2014", end: "2023" },
  "dabaa-axis": { start: "2014", end: "2023" },
  "metro-third-line": { start: "2016", end: "2026" },
  "kafr-dawood-sadat": { start: "2016", end: "2026" },
}[group] || { start: "2014", end: "2023" });

const westernStoryReports: Array<Pick<StoryEntry, "key" | "label" | "sector" | "report">> = [
  { key: "abu-simbel", label: "أبو سمبل", sector: "7", report: ".pdf" },
  { key: "luxor", label: "الأقصر", sector: "12", report: "(1).pdf" },
  { key: "qena", label: "قنا", sector: "11", report: "(3).pdf" },
  { key: "sohag", label: "سوهاج", sector: "8", report: "(2).pdf" },
  { key: "assiut", label: "أسيوط", sector: "1", report: "(4).pdf" },
  { key: "minya", label: "المنيا", sector: "4", report: "(5).pdf" },
  { key: "beni-suef", label: "بني سويف", sector: "9", report: "" },
  { key: "fayoum", label: "الفيوم", sector: "6", report: "(6).pdf" },
  { key: "giza", label: "الجيزة", sector: "3", report: "(7).pdf" },
  { key: "aswan", label: "أسوان", sector: "2", report: "" },
  { key: "corridor-overview", label: "نظرة شاملة على الطريق", sector: "all", report: "(9).pdf" },
];
const westernStoryLabels: Record<string, string> = { "abu-simbel": "Abu Simbel", luxor: "Luxor", qena: "Qena", sohag: "Sohag", assiut: "Assiut", minya: "Minya", "beni-suef": "Beni Suef", fayoum: "Fayoum", giza: "Giza", aswan: "Aswan", "corridor-overview": "Road Overview" };
const storyEntryLabel = (entry: StoryEntry, language: "ar" | "en") => language === "en" ? (westernStoryLabels[entry.key] || entry.label) : entry.label;

function storyEntries(app: TransportApp): StoryEntry[] {
  const ownReferences = (app.reportReferences || []).filter((reference) => String(reference.referenceKind || "").startsWith("story"));
  const fallbackReferences = (applicationRegistry as TransportApp[])
    .filter((candidate) => dashboardGroup(candidate) === dashboardGroup(app))
    .sort((a, b) => (b.reportReferences?.length || 0) - (a.reportReferences?.length || 0))[0]?.reportReferences || [];
  const references = ownReferences.length ? ownReferences : fallbackReferences;
  if (dashboardGroup(app) !== "western-upper-egypt") {
    const extracted = reportStoryMedia(dashboardGroup(app));
    const localMedia: StoryMediaReference[] = references.map((reference) => ({
      imagePath: reference.imagePath, reportName: reference.reportName, page: reference.page,
      kind: String(reference.referenceKind || "").includes("hero") ? "axis-photo" : String(reference.referenceKind || "").includes("map") ? "map" : String(reference.referenceKind || "").includes("comparison") ? "comparison" : "evidence",
      comparisonGroup: (reference as typeof reference & { comparisonGroup?: string }).comparisonGroup,
      comparisonYear: (reference as typeof reference & { comparisonYear?: string }).comparisonYear,
    }));
    const media = localMedia.length ? localMedia : extracted;
    const hero = media.find((reference) => reference.kind === "axis-photo") || media.find((reference) => reference.kind === "comparison");
    const comparisonPairs = storyComparisonPairs(media, dashboardGroup(app));
    const fallbackHero = references.find((reference) => String(reference.referenceKind || "") === "story-hero") || references[0];
    const compareBefore = comparisonPairs[0]?.before || "";
    const fullTitle = app.language === "en" ? (app.alternateTitles?.[0] || app.title) : app.title;
    const conciseTitle = fullTitle.replace(/^(القصة المكانية التفاعلية|Spatial StoryMap)\s*[–—-]\s*/i, "");
    return [{ key: "project", label: conciseTitle, sector: "all", report: fallbackHero?.reportName || hero?.reportName || "", hero: hero?.imagePath || fallbackHero?.imagePath || "", compareBefore, compareAfter: comparisonPairs[0]?.after || "", comparisons: comparisonPairs }];
  }
  // "corridor overview" is not a geographic sector. Showing it as a tab
  // created a blank swipe alongside real sector tabs, so retain sectors only.
  return westernStoryReports.filter((item) => item.key !== "corridor-overview").map((item) => {
    const extracted = reportStoryMedia("western-upper-egypt", item.key);
    const matching = item.report ? references.filter((reference) => reference.reportName === item.report) : [];
    const hero = extracted.find((reference) => reference.kind === "axis-photo") || extracted.find((reference) => reference.kind === "map");
    const comparisonPairs = storyComparisonPairs(extracted, "western-upper-egypt", item.key);
    const compareBefore = comparisonPairs[0]?.before || "";
    return { ...item, hero: hero?.imagePath || matching[0]?.imagePath || comparisonPairs[0]?.after || "", compareBefore, compareAfter: comparisonPairs[0]?.after || "", comparisons: comparisonPairs };
  });
}

function storyDetailedComparisons(app: TransportApp, entries: StoryEntry[], activeKey: string, endYear: string): string {
  if (["metro-third-line", "kafr-dawood-sadat"].includes(dashboardGroup(app))) return "";
  const sets = entries.map((entry) => {
    // The first pair is already the main timeline swipe.  Only render
    // additional pairs below it so no documented example repeats.
    const additionalPairs = entry.comparisons.slice(1);
    if (!additionalPairs.length) return "";
    const label = storyEntryLabel(entry, app.language);
    const cards = additionalPairs.map((pair, index) => `<article class="story-detailed-compare-card"><h3>${app.language === "en" ? `Change example ${index + 2}` : `مثال تغير ${index + 2}`} · ${esc(label)}</h3><div class="story-compare story-report-swipe" style="--compare-before:url('${esc(pair.before)}');--compare-after:url('${esc(pair.after)}')"><div class="compare-before"><span>2014</span></div><div class="compare-after"><div class="compare-after-image"></div><span>${endYear}</span></div><i aria-hidden="true">↔</i><input type="range" min="0" max="100" value="50" aria-label="${app.language === "en" ? "Move the divider to compare the change" : "حرّك الفاصل لمقارنة التغير"}"/></div></article>`).join("");
    return `<div class="story-detailed-compare-set${entry.key === activeKey ? " active" : ""}" data-story-comparison-set="${entry.key}">${cards}</div>`;
  }).join("");
  if (!sets) return "";
  return `<div class="story-detailed-comparisons"><div class="story-detailed-comparisons-heading"><h2>${app.language === "en" ? "Detailed change examples" : "أمثلة تفصيلية للتغير"}</h2><p>${app.language === "en" ? "Satellite imagery with the documented change boundaries." : "صور أقمار صناعية موضح عليها حدود التغير الموثقة."}</p></div>${sets}</div>`;
}

function relatedDashboard(app: TransportApp): string {
  const links: Record<string, Record<"ar" | "en", string>> = {
    "western-upper-egypt": { ar: "dashboard-4236f7c912", en: "dashboard-afdd8591d3" },
    "regional-ring-road": { ar: "dashboard-b99ee8d8fc", en: "" },
    "kalabsha-axis": { ar: "dashboard-989c5ff2f9", en: "dashboard-64753ea652" },
    "qena-luxor-road": { ar: "dashboard-0c7d78be88", en: "dashboard-ea34620f1e" },
    "qus-axis": { ar: "dashboard-5a3aaa3b3a", en: "dashboard-5a3aaa3b3a" },
    "cairo-suez-road": { ar: "dashboard-8a75afd782", en: "dashboard-8f14badaa6" },
    "suez-ring-link": { ar: "dashboard-85be400b84", en: "dashboard-e4d0b8938f" },
    "dabaa-axis": { ar: "dashboard-c1e29f0123", en: "dashboard-c1e29f0123" },
    "ismailia": { ar: "dashboard-ismailia-urban", en: "dashboard-ismailia-urban" },
    "dahshur-south-link": { ar: "dashboard-1cb1e42f43", en: "dashboard-7639a80123" },
  };
  return links[dashboardGroup(app)]?.[app.language] || "";
}

function storyHeader(app: TransportApp, entries: StoryEntry[]): string {
  const dashboard = relatedDashboard(app);
  const isWestern = dashboardGroup(app) === "western-upper-egypt";
  if (!isWestern) {
    return `<header class="story-app-header"><div class="story-identity"><a href="../../index.html" aria-label="العودة إلى المنصة"><b>وزارة النقل</b><span>الهيئة العامة لتخطيط مشروعات النقل</span></a><strong>${esc(app.title)}</strong></div><nav class="story-chapter-tabs"><a class="active" href="#story-intro">مقدمة</a><a href="#story-map">الخريطة التفاعلية</a><a href="#story-development">المقارنة الزمنية</a><a href="#story-details">صور ومراحل الطريق</a>${dashboard ? `<a class="story-dashboard-link" href="../${dashboard}/index.html?lang=${app.language}">لوحة المؤشرات</a>` : ""}</nav></header>`;
  }
  const firstKey = entries.find((entry) => entry.hero)?.key || entries[0]?.key;
  const sectorTabs = entries.map((entry) => { const label = storyEntryLabel(entry, app.language); return `<button class="${entry.key === firstKey ? "active" : ""}" data-story-key="${entry.key}" data-story-sector="${entry.sector}" data-story-title="${esc(label)}" data-story-report="${esc(entry.report)}" data-story-hero="${esc(entry.hero)}" data-story-compare-before="${esc(entry.compareBefore)}" data-story-compare-after="${esc(entry.compareAfter)}">${esc(label)}</button>`; }).join("");
  return `<header class="story-app-header"><div class="story-identity"><a href="../../index.html" aria-label="العودة إلى المنصة"><i aria-hidden="true">▦</i><span>تطور الأراضي المحيطة بطريق الصعيد الصحراوي</span></a></div><nav class="story-sector-tabs" aria-label="قطاعات طريق الصعيد الغربي">${sectorTabs}</nav><nav class="story-chapter-tabs"><strong id="story-chrome-title">تطور الأراضي المحيطة بالطريق</strong><a class="active" href="#story-intro">مقدمة</a><a href="#story-map">الخريطة التفاعلية</a><a href="#story-development">المقارنة الزمنية</a><a href="#story-details">صور ومراحل الطريق</a></nav></header>`;
}

function storyGalleryMarkup(app: TransportApp, label: string, rawMedia: StoryMediaReference[], hero: string, comparisons: StoryComparisonPair[]): string {
  const swipeImages = new Set(comparisons.flatMap((pair) => [pair.before, pair.after]));
  const seenImages = new Set<string>();
  const comparisonOverviewAsMap = ["metro-third-line", "kafr-dawood-sadat"].includes(dashboardGroup(app));
  const media = rawMedia.map((reference) => comparisonOverviewAsMap && reference.kind === "comparison" && ["satellite", "land-cover"].includes(reference.comparisonGroup || "")
    ? { ...reference, kind: "map" as const }
    : reference).filter((reference) => {
    if (!reference.imagePath || reference.inSwipe || swipeImages.has(reference.imagePath) || reference.imagePath === hero || seenImages.has(reference.imagePath)) return false;
    seenImages.add(reference.imagePath);
    return true;
  });
  if (!media.length) return `<div class="story-place-no-media">${app.language === "en" ? "No separate report images are available for this section." : "لا توجد صور تقرير منفصلة لهذا الجزء."}</div>`;
  const mediaOrder: StoryMediaReference["kind"][] = ["axis-photo", "map", "comparison", "dashboard", "evidence"];
  const categoryLabels = app.language === "en"
    ? { "axis-photo": "Road photos", map: "Maps", comparison: "Comparison plates", dashboard: "Indicator dashboards", evidence: "Project evidence" }
    : { "axis-photo": "صور الطريق", map: "الخرائط", comparison: "لوحات المقارنة", dashboard: "لوحات المؤشرات", evidence: "مرفقات المشروع" };
  return `<div class="story-media-categories">${mediaOrder.map((kind) => {
    const items = media.filter((reference) => reference.kind === kind);
    if (!items.length) return "";
    // Keep StoryMap media clean: report/page provenance stays in the data
    // catalog, while the narrative presents the image itself without a label.
    return `<section class="story-media-category" data-media-kind="${kind}"><h4>${categoryLabels[kind]}</h4><div class="story-media-grid ${items.length === 1 ? "single" : ""}">${items.map((reference) => `<figure class="story-scroll-frame"><a class="evidence-image-link" href="${esc(reference.imagePath)}" aria-label="${app.language === "en" ? "Open full-size report image" : "فتح صورة التقرير بالحجم الأصلي"}"><img src="${esc(reference.imagePath)}" alt="${esc(label)} · ${esc(categoryLabels[kind])}" loading="lazy"/></a></figure>`).join("")}</div></section>`;
  }).join("")}</div>`;
}

function storyMediaChapters(app: TransportApp, entries: StoryEntry[]): string {
  const ownReferences = (app.reportReferences || []).filter((reference) => reference.imagePath);
  const fallbackReferences = (applicationRegistry as TransportApp[])
    .filter((candidate) => dashboardGroup(candidate) === dashboardGroup(app))
    .sort((a, b) => (b.reportReferences?.length || 0) - (a.reportReferences?.length || 0))[0]?.reportReferences || [];
  const references = Array.from(new Map((ownReferences.length ? ownReferences : fallbackReferences).filter((reference) => reference.imagePath).map((reference) => [reference.imagePath, reference])).values());
  const isWestern = dashboardGroup(app) === "western-upper-egypt";
  const chapters = entries.map((entry, index) => {
    const label = storyEntryLabel(entry, app.language);
    const extracted = reportStoryMedia(dashboardGroup(app), isWestern ? entry.key : "project");
    const documentedFallback = documentationSwipes.groups?.[`western-upper-egypt/${entry.key}`] || [];
    const fallbackMedia = isWestern && entry.report
      ? references.filter((reference) => reference.reportName === entry.report)
      : isWestern && documentedFallback.length
        ? documentedFallback.flatMap((pair) => [
          { imagePath: pair.before, reportName: pair.sourceDocument, page: 0, kind: "comparison" as const },
          { imagePath: pair.after, reportName: pair.sourceDocument, page: 0, kind: "comparison" as const },
        ])
        : isWestern ? [] : references;
    const rawMedia: StoryMediaReference[] = extracted.length ? extracted : fallbackMedia.map((reference) => {
      // Extracted story media uses `kind`; catalog report references use
      // `referenceKind`. Normalize both safely because either field may be
      // absent on a documentation-only swipe fallback.
      const referenceKind = String((reference as StoryMediaReference & { referenceKind?: string }).referenceKind || reference.kind || "").toLowerCase();
      return { ...reference, kind: referenceKind.includes("dashboard") ? "dashboard" : referenceKind.includes("comparison") ? "comparison" : referenceKind.includes("map") || referenceKind === "webviewer" ? "map" : "evidence" };
    });
    const gallery = storyGalleryMarkup(app, label, rawMedia, entry.hero, entry.comparisons);
    return `<article class="story-place${index === 0 ? " active" : ""}" id="story-place-${entry.key}" data-story-detail="${entry.key}"><div class="story-place-banner"><span>${String(index + 1).padStart(2, "0")}</span><div><h2>${esc(label)}</h2></div></div><div class="story-place-body"><div class="story-place-copy"><h3>${app.language === "en" ? "Maps and images" : "الصور والخرائط"}</h3></div>${gallery}</div></article>`;
  }).join("");
  // A sector page must never append the corridor-wide report: it contains
  // maps of other sectors and remains visible regardless of the selected tab.
  return `<section id="story-details" class="story-details"><div class="section-heading"><span>03</span><h2>${app.language === "en" ? "Project media" : "صور المشروع"}</h2></div>${chapters}</section>`;
}

function experienceMarkup(app: TransportApp): string {
  const preview = app.reportReferences?.find((reference) => String(reference.referenceKind || "").includes("hero"))?.imagePath || app.reportReferences?.[0]?.imagePath || "";
  return `<main class="sector-app experience-runtime" dir="${app.direction}" data-sector-group="${dashboardGroup(app)}">${header(app)}
    <section class="sector-section active" data-panel="overview"><div class="experience-hero"><div><span>منصة التطبيقات المكانية المتكاملة</span><h1>${esc(app.title)}</h1><p>استعراض بيانات القطاع، الخرائط الرقمية، المؤشرات الاقتصادية، الدراسة الميدانية ومرفقات المشروع من واجهة واحدة.</p><button data-open-section="map">استعراض خريطة القطاع</button></div>${preview ? `<figure class="experience-reference-preview"><img src="${esc(preview)}" alt="مرجع واجهة المشروع"/><figcaption>${esc(app.reportReferences?.[0]?.reportName || "")}</figcaption></figure>` : '<div class="hero-orbit"><i></i><i></i><i></i><strong>GIS</strong></div>'}</div><div class="experience-tiles"><button data-open-section="map"><b>01</b><span>منطقة الدراسة والطبقات</span></button><button data-open-section="indicators"><b>02</b><span>مؤشرات الأسعار واستخدامات الأراضي</span></button><button data-open-section="evidence"><b>03</b><span>الدراسة الميدانية ومرفقات المشروع</span></button></div></section>
    <section class="sector-section" data-panel="map"><div class="section-heading"><h2>الخريطة التفاعلية للقطاع</h2><p>طبقات قاعدة البيانات المحلية الخاصة بهذا القطاع فقط.</p></div>${renderSectorMapMarkup()}</section>
    <section class="sector-section" data-panel="indicators"><div class="section-heading"><h2>مؤشرات القطاع</h2><p>القيم المراجعة من التقرير وطبقات قاعدة البيانات.</p></div><div class="sector-kpis" id="sector-kpis"></div><div class="sector-bars" id="sector-bars"></div></section>
    <section class="sector-section" data-panel="evidence"><div class="section-heading"><h2>أعمال ومرفقات المشروع</h2><p>المراجع المرتبطة بالقطاع من تقارير وزارة النقل.</p></div>${evidence(app)}</section>
  </main>`;
}

function storyComparisonPicker(app: TransportApp, entry?: StoryEntry): string {
  const pairs = entry?.comparisons || [];
  if (pairs.length < 2) return "";
  const labels: Record<string, { ar: string; en: string }> = {
    satellite: { ar: "صور القمر الصناعي", en: "Satellite imagery" },
    "land-cover": { ar: "الغطاء الأرضي", en: "Land cover" },
    "urban-change": { ar: "التغير العمراني", en: "Urban change" },
    "services-change": { ar: "تغير الخدمات", en: "Services change" },
    "agricultural-change": { ar: "التغير الزراعي", en: "Agricultural change" },
    "industrial-change": { ar: "التغير الصناعي", en: "Industrial change" },
  };
  return `<label class="story-comparison-picker"><span>${app.language === "en" ? "Documented comparison" : "المقارنة الموثقة"}</span><select data-story-comparison-picker aria-label="${app.language === "en" ? "Choose a comparison" : "اختر المقارنة"}">${pairs.map((pair, index) => { const localized = labels[pair.label || ""]; const label = localized ? localized[app.language] : (app.language === "en" ? `Change example ${index + 1}` : `مثال تغير ${index + 1}`); return `<option value="${index}" data-before="${esc(pair.before)}" data-after="${esc(pair.after)}">${esc(label)}</option>`; }).join("")}</select></label>`;
}

const storyComparisonTypeLabel = (label: string | undefined, language: "ar" | "en", index: number): string => {
  const labels: Record<string, { ar: string; en: string }> = {
    "urban-change": { ar: "التغير العمراني", en: "Urban change" },
    "services-change": { ar: "تغير الخدمات", en: "Services change" },
    "agricultural-change": { ar: "التغير الزراعي", en: "Agricultural change" },
    "industrial-change": { ar: "التغير الصناعي", en: "Industrial change" },
  };
  return labels[label || ""]?.[language] || (language === "en" ? `Change comparison ${index + 1}` : `مقارنة التغير ${index + 1}`);
};

function storyStackedComparisons(app: TransportApp, entry: StoryEntry | undefined, startYear: string, endYear: string): string {
  const pairs = entry?.comparisons || [];
  if (!pairs.length) return `<div class="story-compare-missing">${app.language === "en" ? "No verified comparison is available." : "لا توجد مقارنة موثقة."}</div>`;
  const instruction = app.language === "en" ? "Move the divider to compare the two documented images" : "حرّك الفاصل لمقارنة الصورتين الموثقتين";
  return `<div class="story-stacked-comparisons">${pairs.map((pair, index) => {
    const title = storyComparisonTypeLabel(pair.label, app.language, index);
    return `<article class="story-stacked-comparison"><header><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${esc(title)}</h3><p>${instruction}</p></div></header><div class="story-compare story-report-swipe" data-compare-before="${esc(pair.before)}" data-compare-after="${esc(pair.after)}" style="--compare-before:url('${esc(pair.before)}');--compare-after:url('${esc(pair.after)}')"><div class="compare-before"><span>${startYear}</span></div><div class="compare-after"><div class="compare-after-image"></div><span>${endYear}</span></div><i aria-hidden="true">↔</i><input type="range" min="0" max="100" value="50" aria-label="${esc(`${instruction}: ${title}`)}"/></div></article>`;
  }).join("")}</div>`;
}

function storyMarkup(app: TransportApp): string {
  const entries = storyEntries(app);
  const firstAvailable = entries.find((entry) => entry.hero) || entries[0];
  const isWestern = dashboardGroup(app) === "western-upper-egypt";
  const comparisonYears = storyComparisonYears(dashboardGroup(app));
  const comparisonStartYear = comparisonYears.start;
  const comparisonEndYear = comparisonYears.end;
  const initialTitle = firstAvailable ? storyEntryLabel(firstAvailable, app.language) : app.title;
  const initialKey = firstAvailable?.key || entries[0]?.key || "project";
  const dashboard = relatedDashboard(app);
  const initialCompareBefore = firstAvailable?.compareBefore || "";
  const initialCompareAfter = firstAvailable?.compareAfter || "";
  const hasInitialComparison = Boolean(initialCompareBefore && initialCompareAfter);
  const usesStackedComparisons = ["metro-third-line", "kafr-dawood-sadat"].includes(dashboardGroup(app));
  const comparisonMarkup = usesStackedComparisons
    ? storyStackedComparisons(app, firstAvailable, comparisonStartYear, comparisonEndYear)
    : `${storyComparisonPicker(app, firstAvailable)}<div class="story-compare story-report-swipe" id="story-compare" data-compare-before="${esc(initialCompareBefore)}" data-compare-after="${esc(initialCompareAfter)}" ${hasInitialComparison ? "" : "hidden"} style="--compare-before:url('${esc(initialCompareBefore)}');--compare-after:url('${esc(initialCompareAfter)}')"><div class="compare-before"><span>${comparisonStartYear}</span></div><div class="compare-after"><div class="compare-after-image"></div><span>${comparisonEndYear}</span></div><i aria-hidden="true">↔</i><input type="range" min="0" max="100" value="50" aria-label="${app.language === "en" ? "Move the divider to compare land use" : "حرّك الفاصل لمقارنة استخدامات الأراضي"}"/></div><div class="story-compare-missing" id="story-compare-missing" ${hasInitialComparison ? "hidden" : ""}>${app.language === "en" ? "No verified comparison is available." : "لا توجد مقارنة موثقة."}</div>${storyDetailedComparisons(app, entries, initialKey, comparisonEndYear)}`;
  return `<main class="sector-app story-runtime${isWestern ? " arcgis-reference-story" : ""}" dir="${app.direction}" data-sector-group="${dashboardGroup(app)}">${storyHeader(app, entries)}
    ${isWestern && dashboard ? `<section class="story-dashboard-view" hidden><iframe title="لوحة المؤشرات" loading="lazy" data-dashboard-frame></iframe></section>` : ""}<div class="story-content">
    <section id="story-intro" class="story-sector-hero" ${firstAvailable?.hero ? `style="--story-image:url('${esc(firstAvailable.hero)}')"` : ""}><div><span>قصة مكانية تفاعلية</span><h1 id="story-active-title">${esc(initialTitle)}</h1><p id="story-active-subtitle">${app.language === "en" ? "Land-use development" : "تطور استخدامات الأراضي"}</p><button data-story-scroll aria-label="ابدأ التصفح">↓</button></div></section>
    <section id="story-map" class="story-chapter"><div><b>01</b><h2>منطقة الدراسة</h2><p>خريطة قمر صناعي تفاعلية تعرض حدود منطقة الدراسة للقطاع المحدد. استخدم أزرار التكبير واسحب الخريطة، وانقر على المنطقة لعرض بياناتها الوصفية.</p><div class="story-data-note" id="story-data-note">يتم عرض البيانات المحلية المراجعة للقطاع.</div><div class="story-kpis" id="story-kpis"><article><span>مساحة الدراسة</span><strong>—</strong><small>كم²</small></article><article><span>طول الطريق</span><strong>—</strong><small>كم</small></article><article><span>التغير العمراني</span><strong>—</strong><small>كم²</small></article><article><span>المعالم المكانية</span><strong>—</strong><small>عنصر</small></article></div></div>${renderSectorMapMarkup()}</section>
    <section id="story-development" class="story-compare-section"><div class="section-heading"><span>02</span><h2>تطور استخدامات الأراضي من ${comparisonStartYear} حتى ${comparisonEndYear}</h2><p>${app.language === "en" ? "Move the divider to compare the documented satellite images." : "حرّك الفاصل لمقارنة صور الأقمار الصناعية الموثقة وحدود التغير."}</p></div>${comparisonMarkup}</section>
    ${storyMediaChapters(app, entries)}
    </div>
  </main>`;
}

function viewerMarkup(app: TransportApp): string {
  const english = app.language === "en";
  const alternateLanguage = english ? "ar" : "en";
  const alternateLanguageLabel = english ? "العربية" : "English";
  const copy = english ? {
    eyebrow: "Verified local spatial data", title: "Study area explorer", search: "Search & filter", placeholder: "Search available layers", layers: "Layer actions", layersNote: "Only layers loaded for this corridor are shown.", base: "Basemap", satellite: "Satellite imagery", help: "Drag to explore, use the wheel to zoom, and select a feature for its key attributes.", noResults: "No available layer matches your search.", study: "Study area", road: "Road corridor", status: "Local data verified", measurement: "Measurement",
  } : {
    eyebrow: "بيانات مكانية محلية مراجعة", title: "مستعرض منطقة الدراسة", search: "البحث والتصفية", placeholder: "ابحث باسم الطبقة المتاحة", layers: "إجراءات الطبقات", layersNote: "تظهر فقط الطبقات التي تم تحميلها لهذا المحور.", base: "خريطة الأساس", satellite: "قمر صناعي", help: "اسحب لاستكشاف الخريطة، واستخدم عجلة الماوس للتكبير، ثم اختر أي معلم لعرض أهم بياناته.", noResults: "لا توجد طبقة متاحة تطابق البحث.", study: "منطقة الدراسة", road: "محور الطريق", status: "بيانات محلية مراجعة", measurement: "القياس",
  };
  return `<main class="sector-app viewer-runtime" dir="${app.direction}" data-sector-group="${dashboardGroup(app)}">
    <header class="viewer-topbar"><a href="../../index.html" class="viewer-identity"><b>${english ? "Ministry of Transport" : "وزارة النقل"}</b><span>${english ? "Transport Projects Planning" : "الهيئة العامة لتخطيط مشروعات النقل"}</span></a><div class="viewer-project"><span>${copy.eyebrow}</span><h1>${esc(app.title)}</h1></div><a class="viewer-language-toggle" href="?lang=${alternateLanguage}" hreflang="${alternateLanguage}" aria-label="${english ? "Switch to Arabic" : "Switch to English"}"><span aria-hidden="true">◎</span>${alternateLanguageLabel}</a><button type="button" class="viewer-mobile-layers" aria-expanded="false"><span>☰</span>${english ? "Layers" : "الطبقات"}</button></header>
    <div class="viewer-runtime-layout"><section class="viewer-map-workspace"><div class="viewer-map-toolbar"><span class="viewer-data-state"><i></i>${copy.status}</span><div class="viewer-map-meta"><span data-viewer-study>${copy.study}: —</span><span data-viewer-road>${copy.road}: —</span></div></div>${renderSectorMapMarkup()}</section>
      <aside class="viewer-inspector" aria-label="${copy.layers}"><div class="viewer-inspector-head"><span>${copy.eyebrow}</span><h2>${copy.title}</h2><p>${copy.layersNote}</p></div><section class="viewer-panel-group viewer-search-group"><h3>${copy.search}</h3><label class="viewer-search"><span class="sr-only">${copy.search}</span><input id="viewer-search" type="search" autocomplete="off" placeholder="${copy.placeholder}"/></label><div class="viewer-filter-slot"></div></section><section class="viewer-panel-group viewer-layer-group"><div class="viewer-group-heading"><h3>${copy.layers}</h3><output class="viewer-layer-feedback" aria-live="polite"></output></div><div class="viewer-layer-actions"><button type="button" data-viewer-show-all>${english ? "Show all layers" : "إظهار كل الطبقات"}</button><button type="button" data-viewer-hide-all>${english ? "Hide layers" : "إخفاء الطبقات"}</button></div><label class="viewer-opacity"><span>${english ? "Selected layer opacity" : "شفافية الطبقة المحددة"}</span><input type="range" min="20" max="100" value="100" disabled aria-describedby="viewer-opacity-note"/><small id="viewer-opacity-note">${english ? "Select a layer to adjust its opacity." : "اختر طبقة أولاً لضبط الشفافية."}</small></label><details class="viewer-legend"><summary>${english ? "Legend & help" : "الدليل والمساعدة"}</summary><div class="viewer-legend-items"></div></details><div class="viewer-basemap"><span>${copy.base}: <b>${copy.satellite}</b></span></div><div id="viewer-layer-list" class="viewer-layer-list" aria-live="polite"></div><p class="viewer-empty-layers" hidden>${copy.noResults}</p></section><section class="viewer-panel-group viewer-measure-group"><h3>${copy.measurement}</h3><div class="viewer-measure-slot"></div></section><div class="viewer-help"><i>⌁</i><p>${copy.help}</p></div></aside></div></main>`;
}

function galleryMarkup(app: TransportApp): string {
  // The registry stores most corridor applications once (Arabic metadata),
  // while the gallery can be opened in either language.  Language therefore
  // affects presentation only; it must never remove the same corridor's apps.
  const related = (applicationRegistry as TransportApp[]).filter((candidate) => candidate.slug !== app.slug && dashboardGroup(candidate) === dashboardGroup(app));
  const english = app.language === "en";
  const typeMark: Record<TransportApp["type"], string> = { Dashboard: "▦", Experience: "◌", StoryMap: "◫", "Web AppViewer": "⌖", "Instant Filter Gallery": "⊞" };
  const groups = [
    { key: "dashboards", types: ["Dashboard"] as TransportApp["type"][], ar: "لوحات المؤشرات التفاعلية", en: "Interactive dashboards", noteAr: "متابعة المؤشرات والنتائج في واجهة تنفيذية.", noteEn: "Executive views for indicators and results.", accent: "cobalt" },
    { key: "geographic", types: ["Web AppViewer", "Experience"] as TransportApp["type"][], ar: "التطبيقات الجغرافية", en: "Geographic applications", noteAr: "استكشف منطقة الدراسة والبيانات المكانية المرتبطة بها.", noteEn: "Explore the study area and its spatial information.", accent: "teal" },
    { key: "stories", types: ["StoryMap", "Instant Filter Gallery"] as TransportApp["type"][], ar: "القصص والتطبيقات المساندة", en: "Story maps & supporting applications", noteAr: "سياق مكاني ومواد مساندة للمشروع.", noteEn: "Spatial context and supporting project material.", accent: "gold" },
  ];
  const statusText = (status: string) => {
    if (english) return status === "awaiting-source-data" ? "Source data pending" : status === "generated-from-local-axis-data" || status === "generated-from-local-filegdb" ? "Local data" : "Verified application";
    return status === "awaiting-source-data" ? "بانتظار بيانات المصدر" : status === "generated-from-local-axis-data" || status === "generated-from-local-filegdb" ? "بيانات محلية" : "تطبيق مراجع";
  };
  const card = (candidate: TransportApp, index: number, accent: string) => `<a class="application-gallery-card application-gallery-card--${accent}" href="../${esc(candidate.slug)}/index.html?lang=${app.language}" dir="${app.direction}" style="--application-index:${index}"><span class="application-card-band" aria-hidden="true"></span><div class="application-card-head"><div class="application-gallery-mark" aria-hidden="true">${typeMark[candidate.type]}</div><div class="application-card-meta"><span class="application-gallery-type">${esc(localizedType(candidate.type, app.language))}</span><span class="application-gallery-status">${esc(statusText(candidate.status || ""))}</span></div></div><div class="application-gallery-card-copy"><b>${esc(localizedAppTitle(candidate, app.language))}</b><small><span>${english ? "Open application" : "فتح التطبيق"}</span><i aria-hidden="true">${english ? "→" : "←"}</i></small></div></a>`;
  const library = groups.map((group) => {
    const applications = related.filter((candidate) => group.types.includes(candidate.type));
    if (!applications.length) return "";
    // Dossiers are deliberately substantial: every multi-record group uses
    // a balanced two-column reading grid, while a lone record stays at the
    // logical inline start instead of stretching into an empty panel.
    const gridSize = applications.length === 1 ? " application-gallery-grid--single" : " application-gallery-grid--dossiers";
    return `<section class="application-library-group application-library-group--${group.accent}" aria-labelledby="application-group-${group.key}"><header class="application-group-heading"><div><span>${english ? "APPLICATION LIBRARY" : "مكتبة التطبيقات"}</span><h2 id="application-group-${group.key}">${english ? group.en : group.ar}</h2></div><p>${english ? group.noteEn : group.noteAr}</p></header><div class="application-gallery-grid${gridSize}">${applications.map((candidate, index) => card(candidate, index, group.accent)).join("")}</div></section>`;
  }).join("");
  const empty = `<section class="application-library-group application-library-empty"><header class="application-group-heading"><div><span>${english ? "APPLICATION LIBRARY" : "مكتبة التطبيقات"}</span><h2>${english ? "Applications" : "التطبيقات"}</h2></div></header><div class="application-gallery-empty">${english ? "No related applications are available for this corridor yet." : "لا توجد تطبيقات مرتبطة متاحة لهذا المحور حاليًا."}</div></section>`;
  return `<main class="sector-app gallery-runtime" dir="${app.direction}" data-sector-group="${dashboardGroup(app)}"><header class="sector-header compact gallery-portal-header"><a href="../../index.html" class="sector-brand" aria-label="${english ? "Back to the applications platform" : "العودة إلى منصة التطبيقات"}"><span>${english ? "MINISTRY OF TRANSPORT" : "وزارة النقل"}</span><b>${english ? "Transport Projects Planning" : "الهيئة العامة لتخطيط مشروعات النقل"}</b></a><button id="language-toggle" type="button" aria-label="${english ? "Switch language" : "تغيير اللغة"}">${english ? "العربية" : "English"}</button></header><section class="gallery-intro"><span>${english ? "DIGITAL MAPS · VERIFIED LOCAL DATA" : "خرائط التطبيقات الرقمية · بيانات محلية مراجعة"}</span><h1>${esc(app.title)}</h1><p>${english ? "A curated library of the corridor's available digital applications." : "مكتبة متكاملة للتطبيقات الرقمية المتاحة لهذا المحور."}</p></section><section class="application-gallery application-library">${library || empty}</section></main>`;
}

export function renderSectorApplication(app: TransportApp): string {
  if (app.type === "Experience") return experienceMarkup(app);
  if (app.type === "StoryMap") return storyMarkup(app);
  if (app.type === "Instant Filter Gallery") return galleryMarkup(app);
  return viewerMarkup(app);
}

function format(value: number): string {
  return new Intl.NumberFormat(document.documentElement.lang === "en" ? "en-US" : "ar-EG", { maximumFractionDigits: 1 }).format(value || 0);
}

function selectOnly(layer: string): void {
  document.querySelectorAll<HTMLButtonElement>("[data-map-layer]").forEach((button) => {
    const active = button.dataset.mapLayer === layer;
    button.classList.toggle("active", active);
    document.querySelector<SVGGElement>(`[data-layer-group="${button.dataset.mapLayer}"]`)?.classList.toggle("layer-hidden", !active);
  });
}

function setupExplorerControls(root: HTMLElement, app: TransportApp, summary: any): void {
  if (!root.matches(".viewer-runtime, .gallery-runtime")) return;
  const map = root.querySelector<HTMLElement>(".gis-map");
  if (!map) return;
  // Layer and network quantities are not useful selection controls.
  root.querySelector<HTMLElement>("[data-viewer-layer-total]")?.remove();
  const sources = Array.from(map.querySelectorAll<HTMLButtonElement>(".map-layer-toggles [data-map-layer]"));
  const english = app.language === "en";
  const sourceData = sources.map((source) => {
    const label = Array.from(source.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent || "").join(" ").trim() || source.dataset.mapLayer || "";
    const swatch = source.querySelector<HTMLElement>("i");
    const layer = source.dataset.mapLayer || "";
    return { source, layer, label, color: swatch ? getComputedStyle(swatch).backgroundColor : "#168de2" };
  });
  let selectedLayer = "";
  const feedback = root.querySelector<HTMLOutputElement>(".viewer-layer-feedback");
  const opacity = root.querySelector<HTMLInputElement>(".viewer-opacity input");
  const opacityNote = root.querySelector<HTMLElement>("#viewer-opacity-note");
  const setFeedback = (message: string) => { if (feedback) { feedback.value = message; feedback.textContent = message; } };
  const setOpacityState = () => {
    if (!opacity) return;
    opacity.disabled = !selectedLayer;
    const selected = sourceData.find((item) => item.layer === selectedLayer);
    if (opacityNote) opacityNote.textContent = selected
      ? (english ? `Opacity: ${opacity.value}%` : `الشفافية: ${opacity.value}٪`)
      : (english ? "Select a layer to adjust its opacity." : "اختر طبقة أولاً لضبط الشفافية.");
  };
  const setVisibleLayer = (layer: string | "all") => {
    selectedLayer = layer === "all" ? "" : layer;
    sourceData.forEach(({ source, layer: itemLayer }) => {
      const active = layer === "all" || itemLayer === layer;
      source.classList.toggle("active", active);
      map.querySelectorAll<SVGGElement>(`[data-layer-group="${itemLayer}"]`).forEach((group) => {
        group.classList.toggle("layer-hidden", !active);
        group.style.opacity = active && itemLayer === selectedLayer ? String(Number(opacity?.value || 100) / 100) : "";
      });
    });
    root.querySelectorAll<HTMLElement>("[data-explorer-layer]").forEach((item) => item.classList.toggle("active", layer !== "all" && item.dataset.explorerLayer === layer));
    setOpacityState();
    if (layer === "all") setFeedback(english ? "All available layers are visible." : "كل الطبقات المتاحة ظاهرة.");
    else setFeedback(english ? "Selected layer isolated." : "تم عزل الطبقة المحددة.");
  };
  const createLayerControl = (item: typeof sourceData[number], compact = false) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = compact ? "gallery-layer-card" : "viewer-layer-item";
    button.dataset.explorerLayer = item.layer;
    button.innerHTML = `${compact ? "" : "<span class=\"viewer-layer-toggle\" aria-hidden=\"true\"></span>"}<i style="--layer-color:${item.color}"></i><b>${esc(item.label)}</b>${compact ? "" : "<small></small>"}`;
    button.addEventListener("click", () => setVisibleLayer(item.layer));
    return button;
  };

  const explorer = root.querySelector<HTMLElement>("#viewer-layer-list, #filter-cards");
  if (explorer) {
    const compact = root.classList.contains("gallery-runtime");
    if (!compact && sourceData.length) {
      const changeFilter = map.querySelector<HTMLElement>(".map-change-filter");
      if (changeFilter) {
        changeFilter.classList.add("viewer-change-filter");
        root.querySelector(".viewer-filter-slot")?.append(changeFilter);
      }
    }
    // Transport-network reference layers can be numerous. Keep the project
    // layers immediately useful, and place the broader network in a closed
    // group so it never becomes a long, distracting side column.
    const isNetworkLayer = (layer: string) => /^(Transit_|Road_|Metro_|LRT_|lRT_)/.test(layer);
    const projectLayers = sourceData.filter((item) => !isNetworkLayer(item.layer));
    const networkLayers = sourceData.filter((item) => isNetworkLayer(item.layer));
    explorer.replaceChildren(...projectLayers.map((item) => createLayerControl(item, compact)));
    if (networkLayers.length) {
      const group = document.createElement("details");
      group.className = "explorer-network-group";
      const summary = document.createElement("summary");
      summary.textContent = english
        ? `Transport network (${networkLayers.length})`
        : `شبكات النقل (${networkLayers.length})`;
      // A gallery is a compact selector, not a records report; omit the
      // network-group total there as well.
      if (compact) summary.textContent = english ? "Transport network" : "شبكات النقل";
      const layers = document.createElement("div");
      layers.className = "explorer-network-layers";
      layers.append(...networkLayers.map((item) => createLayerControl(item, compact)));
      group.append(summary, layers);
      summary.textContent = summary.textContent.replace(/\s*\([^)]*\)\s*$/, "");
      explorer.append(group);
    }
    if (!compact) {
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "viewer-filter-reset viewer-layer-reset";
      reset.textContent = english ? "Clear filters" : "مسح الفلاتر";
      reset.addEventListener("click", () => {
        const search = root.querySelector<HTMLInputElement>("#viewer-search");
        if (search) { search.value = ""; search.dispatchEvent(new Event("input")); }
        const changeSelect = map.querySelector<HTMLSelectElement>(".map-change-select");
        if (changeSelect) { changeSelect.value = "all"; changeSelect.dispatchEvent(new Event("change")); }
        setVisibleLayer("all");
      });
      explorer.after(reset);
    }
    const total = root.querySelector<HTMLElement>("[data-viewer-layer-total]");
    if (total) total.textContent = `${sourceData.length} ${english ? "layers" : "طبقات"}`;
  }
  const empty = root.querySelector<HTMLElement>(".viewer-empty-layers, .gallery-empty-layers");
  if (empty) empty.hidden = sourceData.length > 0;
  root.querySelector<HTMLInputElement>("#viewer-search")?.addEventListener("input", (event) => {
    const query = (event.currentTarget as HTMLInputElement).value.trim().toLocaleLowerCase();
    let shown = 0;
    root.querySelectorAll<HTMLElement>("[data-explorer-layer]").forEach((button) => {
      const matches = !query || (button.textContent || "").toLocaleLowerCase().includes(query);
      button.hidden = !matches;
      if (matches) shown += 1;
    });
    root.querySelectorAll<HTMLDetailsElement>(".explorer-network-group").forEach((group) => {
      if (query) group.open = Array.from(group.querySelectorAll<HTMLElement>("[data-explorer-layer]")).some((button) => !button.hidden);
    });
    if (empty) empty.hidden = shown > 0;
  });
  root.querySelector<HTMLButtonElement>("[data-viewer-show-all]")?.addEventListener("click", () => setVisibleLayer("all"));
  root.querySelector<HTMLButtonElement>("[data-viewer-hide-all]")?.addEventListener("click", () => {
    selectedLayer = "";
    sourceData.forEach(({ source, layer }) => {
      source.classList.remove("active");
      map.querySelectorAll<SVGGElement>(`[data-layer-group="${layer}"]`).forEach((group) => { group.classList.add("layer-hidden"); group.style.opacity = ""; });
    });
    root.querySelectorAll<HTMLElement>("[data-explorer-layer]").forEach((item) => item.classList.remove("active"));
    setOpacityState();
    setFeedback(english ? "All layers are hidden." : "تم إخفاء كل الطبقات.");
  });
  opacity?.addEventListener("input", () => {
    if (!selectedLayer) return;
    map.querySelectorAll<SVGGElement>(`[data-layer-group="${selectedLayer}"]`).forEach((group) => { group.style.opacity = String(Number(opacity.value) / 100); });
    setOpacityState();
  });
  const legend = root.querySelector<HTMLElement>(".viewer-legend-items");
  if (legend) {
    legend.innerHTML = `${sourceData.map((item) => `<span><i style="--layer-color:${item.color}"></i>${esc(item.label)}</span>`).join("")}<small>${english ? "Selecting a layer isolates it on the map." : "اختيار طبقة يعزلها على الخريطة."}</small>`;
  }
  root.querySelector<HTMLButtonElement>(".viewer-mobile-layers")?.addEventListener("click", (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const open = !root.classList.contains("viewer-inspector-open");
    root.classList.toggle("viewer-inspector-open", open);
    button.setAttribute("aria-expanded", String(open));
  });
  const study = root.querySelector<HTMLElement>("[data-viewer-study]");
  const road = root.querySelector<HTMLElement>("[data-viewer-road]");
  if (study) study.textContent = `${english ? "Study area" : "منطقة الدراسة"}: ${format(Number(summary.metrics?.studyAreaKm2 || 0))} ${english ? "km²" : "كم²"}`;
  if (road) road.textContent = `${english ? "Road corridor" : "محور الطريق"}: ${format(Number(summary.metrics?.axisLengthKm || 0))} ${english ? "km" : "كم"}`;
}

function setupViewerMeasurementTools(root: HTMLElement, app: TransportApp): void {
  if (!root.matches(".viewer-runtime")) return;
  const map = root.querySelector<HTMLElement>(".gis-map");
  const svg = map?.querySelector<SVGSVGElement>("svg.interactive-map");
  const inspector = root.querySelector<HTMLElement>(".viewer-inspector");
  if (!map || !svg || !inspector) return;
  const english = app.language === "en";
  const copy = english ? { title: "Map tools", distance: "Distance", area: "Area", clear: "Clear", idle: "Choose a tool, then click the map.", distanceHint: "Click two points.", areaHint: "Click polygon vertices; click the first point to finish.", distanceResult: "Distance", areaResult: "Area", units: "map units" } : { title: "أدوات الخريطة", distance: "مسافة", area: "مساحة", clear: "مسح", idle: "اختر أداة ثم انقر على الخريطة.", distanceHint: "انقر نقطتين.", areaHint: "انقر رؤوس المضلع، ثم انقر النقطة الأولى للإنهاء.", distanceResult: "المسافة", areaResult: "المساحة", units: "وحدات الخريطة" };
  const tools = document.createElement("section");
  tools.className = "viewer-map-tools";
  tools.innerHTML = `<div class="viewer-tool-actions"><button type="button" data-measure-mode="distance">↔ ${copy.distance}</button><button type="button" data-measure-mode="area">△ ${copy.area}</button><button type="button" class="viewer-measure-clear">${copy.clear}</button></div><output class="viewer-measure-result" aria-live="polite">${copy.idle}</output>`;
  inspector.querySelector(".viewer-measure-slot")?.append(tools);
  const overlay = document.createElementNS("http://www.w3.org/2000/svg", "g");
  overlay.setAttribute("class", "viewer-measure-overlay");
  svg.append(overlay);
  const result = tools.querySelector<HTMLOutputElement>(".viewer-measure-result")!;
  let mode: "distance" | "area" | "" = "";
  let points: Array<{ x: number; y: number }> = [];
  const render = () => {
    overlay.replaceChildren();
    if (!points.length) return;
    const ns = "http://www.w3.org/2000/svg";
    const polyline = document.createElementNS(ns, "polyline");
    polyline.setAttribute("points", points.map((point) => `${point.x},${point.y}`).join(" "));
    polyline.setAttribute("fill", mode === "area" && points.length > 2 ? "#0bb7d133" : "none");
    polyline.setAttribute("stroke", "#08b9d6"); polyline.setAttribute("stroke-width", "3");
    overlay.append(polyline);
    points.forEach((point, index) => { const dot = document.createElementNS(ns, "circle"); dot.setAttribute("cx", String(point.x)); dot.setAttribute("cy", String(point.y)); dot.setAttribute("r", index === 0 ? "6" : "4"); overlay.append(dot); });
  };
  const clear = () => { points = []; overlay.replaceChildren(); result.value = copy.idle; result.textContent = copy.idle; };
  const finishArea = () => {
    if (points.length < 3) return;
    const area = Math.abs(points.reduce((sum, point, index) => { const next = points[(index + 1) % points.length]; return sum + point.x * next.y - next.x * point.y; }, 0) / 2);
    result.value = `${copy.areaResult}: ${format(area)} ${copy.units}²`; result.textContent = result.value;
    mode = ""; render();
  };
  tools.querySelectorAll<HTMLButtonElement>("[data-measure-mode]").forEach((button) => button.addEventListener("click", () => {
    mode = button.dataset.measureMode as "distance" | "area"; points = []; render();
    tools.querySelectorAll("[data-measure-mode]").forEach((item) => item.classList.toggle("active", item === button));
    const hint = mode === "distance" ? copy.distanceHint : copy.areaHint; result.value = hint; result.textContent = hint;
  }));
  tools.querySelector<HTMLButtonElement>(".viewer-measure-clear")?.addEventListener("click", () => { mode = ""; tools.querySelectorAll("[data-measure-mode]").forEach((item) => item.classList.remove("active")); clear(); });
  svg.addEventListener("click", (event) => {
    if (!mode) return;
    event.preventDefault(); event.stopPropagation();
    const screenPoint = svg.createSVGPoint();
    screenPoint.x = event.clientX; screenPoint.y = event.clientY;
    const transformed = screenPoint.matrixTransform(svg.getScreenCTM()?.inverse());
    const point = { x: transformed.x, y: transformed.y };
    if (mode === "area" && points.length >= 3 && Math.hypot(point.x - points[0].x, point.y - points[0].y) < 16) { finishArea(); return; }
    points.push(point); render();
    if (mode === "distance" && points.length === 2) { const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y); result.value = `${copy.distanceResult}: ${format(distance)} ${copy.units}`; result.textContent = result.value; mode = ""; tools.querySelectorAll("[data-measure-mode]").forEach((item) => item.classList.remove("active")); }
  });
}

export async function initSectorApplication(app: TransportApp): Promise<void> {
  const root = document.querySelector<HTMLElement>(".sector-app");
  if (!root) return;
  const galleryKicker = root.querySelector<HTMLElement>(".gallery-intro > span");
  if (galleryKicker) galleryKicker.textContent = app.language === "en" ? "Data & Application Hub" : "مركز البيانات والتطبيقات";
  // Gallery navigation is qualitative: related-app and feature totals are
  // deliberately not exposed as visual or accessibility text.
  root.querySelector(".gallery-application-count")?.remove();
  // Keep report images inside the current StoryMap page with an accessible lightbox.
  const evidenceModal = document.createElement("div");
  evidenceModal.className = "evidence-modal";
  evidenceModal.hidden = true;
  evidenceModal.innerHTML = `<div class="evidence-modal-backdrop" data-evidence-close></div><div class="evidence-modal-dialog" role="dialog" aria-modal="true" aria-label="Image preview"><button class="evidence-modal-close" type="button" data-evidence-close aria-label="Close">×</button><img class="evidence-modal-image" alt=""/><p class="evidence-modal-caption"></p></div>`;
  document.body.appendChild(evidenceModal);
  const closeEvidence = () => { evidenceModal.hidden = true; document.body.classList.remove("evidence-modal-open"); };
  const openEvidence = (link: HTMLAnchorElement) => {
    const image = evidenceModal.querySelector<HTMLImageElement>(".evidence-modal-image");
    if (!image) return;
    image.src = link.getAttribute("href") || "";
    image.alt = link.closest("figure")?.querySelector("img")?.alt || "";
    const caption = evidenceModal.querySelector<HTMLElement>(".evidence-modal-caption");
    if (caption) caption.textContent = link.closest("figure")?.querySelector("figcaption")?.textContent || "";
    evidenceModal.hidden = false;
    document.body.classList.add("evidence-modal-open");
  };
  evidenceModal.querySelectorAll<HTMLElement>("[data-evidence-close]").forEach((element) => element.addEventListener("click", closeEvidence));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !evidenceModal.hidden) closeEvidence(); });
  document.querySelectorAll<HTMLAnchorElement>(".evidence-image-link, .evidence-open-link").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); openEvidence(link); }));
  const storyFrames = document.querySelectorAll<HTMLElement>(".story-scroll-frame");
  if (storyFrames.length) {
    const frameObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
    }, { rootMargin: "-12% 0px -12%", threshold: 0.35 });
    storyFrames.forEach((frame) => frameObserver.observe(frame));
  }
  // Swipe interactions are initialized before loading the optional GIS
  // summary so the documented image comparison remains fully usable even
  // when map data is unavailable or slow to arrive.
  document.querySelectorAll<HTMLElement>(".story-compare").forEach((compare) => {
    const range = compare.querySelector<HTMLInputElement>("input[type='range']");
    const overlay = compare.querySelector<HTMLElement>(".compare-after");
    const handle = compare.querySelector<HTMLElement>(":scope > i");
    const afterImage = compare.querySelector<HTMLElement>(".compare-after-image");
    if (!range || !overlay || !handle || !afterImage) return;
    const update = () => {
      overlay.style.width = `${range.value}%`;
      handle.style.left = `${range.value}%`;
      afterImage.style.width = `${compare.clientWidth}px`;
      compare.style.setProperty("--compare-position", `${range.value}%`);
    };
    range.addEventListener("input", update);
    new ResizeObserver(update).observe(compare);
    update();
  });
  const initialCompareBox = document.querySelector<HTMLElement>("#story-compare");
  if (initialCompareBox?.dataset.compareAfter) {
    const zoomButton = document.createElement("button");
    zoomButton.type = "button";
    zoomButton.className = "compare-zoom-button";
    zoomButton.textContent = app.language === "en" ? "Enlarge image" : "تكبير الصورة";
    zoomButton.addEventListener("click", () => { const link = document.createElement("a"); link.href = initialCompareBox.dataset.compareAfter || ""; openEvidence(link); });
    initialCompareBox.parentElement?.insertBefore(zoomButton, initialCompareBox);
  }
  // Comparison plates are narrative content and must stay usable even when
  // the optional GIS summary request fails. Metro Line 3 and Kafr Dawood–
  // Sadat expose every verified 2016/2026 pair through this single Swipe.
  document.querySelector<HTMLSelectElement>("[data-story-comparison-picker]")?.addEventListener("change", (event) => {
    const option = (event.currentTarget as HTMLSelectElement).selectedOptions[0];
    const compareBox = document.querySelector<HTMLElement>("#story-compare");
    const compareMissing = document.querySelector<HTMLElement>("#story-compare-missing");
    if (!option || !compareBox) return;
    const before = option.dataset.before || "";
    const after = option.dataset.after || "";
    compareBox.style.setProperty("--compare-before", `url('${before}')`);
    compareBox.style.setProperty("--compare-after", `url('${after}')`);
    compareBox.dataset.compareBefore = before;
    compareBox.dataset.compareAfter = after;
    const hasComparison = Boolean(before && after);
    compareBox.toggleAttribute("hidden", !hasComparison);
    compareMissing?.toggleAttribute("hidden", hasComparison);
    if (compareMissing) compareMissing.textContent = hasComparison ? "" : (app.language === "en" ? "No verified comparison is available." : "لا توجد مقارنة موثقة.");
    const range = compareBox.querySelector<HTMLInputElement>("input[type='range']");
    if (range) {
      range.value = "50";
      range.dispatchEvent(new Event("input"));
    }
  });
  // The application hub is a launch surface. It intentionally has no map,
  // layer controls, or data fetch dependency after its library is rendered.
  if (root.matches(".gallery-runtime")) return;
  const group = root.dataset.sectorGroup || dashboardGroup(app);
  const response = await fetch(`../../data/dashboard/${group}/summary.json`);
  if (!response.ok) {
    const status = root.querySelector<HTMLElement>(".map-status-text");
    if (status) status.textContent = app.language === "en" ? "Local map data is not available for this corridor." : "بيانات الخريطة المحلية غير متاحة لهذا المحور.";
    root.classList.add("runtime-data-error");
    return;
  }
  const summary = await response.json();
  const profilesResponse = await fetch("../../data/sector-profiles.json");
  if (profilesResponse.ok) {
    const profiles = await profilesResponse.json();
    const profile = profiles[group];
    if (profile) {
      summary.profile = profile;
      summary.metrics = { ...summary.metrics, ...profile.metrics };
      summary.landUse = profile.landUse || summary.landUse;
    }
  }
  const storyMapRoots = Array.from(document.querySelectorAll<HTMLElement>(".gis-map"));
  await Promise.all(storyMapRoots.map((map) => initializeMap(group, summary, map)));
  document.querySelectorAll<HTMLButtonElement>("[data-view-layer], [data-gallery-layer]").forEach((button) => {
    const layer = button.dataset.viewLayer || button.dataset.galleryLayer || "";
    const available = summary.layers?.includes(layer) && Number(summary.sourceLayerCounts?.[layer] ?? summary.layerCounts?.[layer] ?? 0) > 0;
    button.hidden = !available;
  });
  setupExplorerControls(root, app, summary);
  setupViewerMeasurementTools(root, app);

  const activateStory = (button: HTMLButtonElement) => {
    document.querySelectorAll<HTMLButtonElement>("[data-story-key]").forEach((item) => item.classList.toggle("active", item === button));
    const title = button.dataset.storyTitle || app.title;
    const hero = button.dataset.storyHero || "";
    const compareBefore = button.dataset.storyCompareBefore || "";
    const compareAfter = button.dataset.storyCompareAfter || compareBefore;
    const sector = button.dataset.storySector || "all";
    const key = button.dataset.storyKey || "all";
    const heroSection = document.querySelector<HTMLElement>(".story-sector-hero");
    const activeTitle = document.querySelector<HTMLElement>("#story-active-title");
    const activeSubtitle = document.querySelector<HTMLElement>("#story-active-subtitle");
    const chromeTitle = document.querySelector<HTMLElement>("#story-chrome-title");
    const compareBox = document.querySelector<HTMLElement>("#story-compare");
    const compareMissing = document.querySelector<HTMLElement>("#story-compare-missing");
    const dataNote = document.querySelector<HTMLElement>("#story-data-note");
    if (activeTitle) activeTitle.textContent = title;
    if (activeSubtitle) activeSubtitle.textContent = app.language === "en" ? `Land development along the Western Desert Road (${title})` : `تطور الأراضي المحيطة بطريق الصعيد الصحراوي الغربي (${title})`;
    if (chromeTitle) chromeTitle.textContent = app.language === "en" ? `Land development · ${title}` : `تطور الأراضي · ${title}`;
    if (heroSection && hero) heroSection.style.setProperty("--story-image", `url('${hero}')`);
    if (compareBox) {
      compareBox.style.setProperty("--compare-before", `url('${compareBefore}')`);
      compareBox.style.setProperty("--compare-after", `url('${compareAfter}')`);
    }
    document.querySelectorAll<HTMLElement>("[data-story-detail]").forEach((chapter) => chapter.classList.toggle("active", chapter.dataset.storyDetail === key));
    document.querySelectorAll<HTMLElement>("[data-story-comparison-set]").forEach((set) => set.classList.toggle("active", set.dataset.storyComparisonSet === key));
    document.querySelector<HTMLElement>(".story-detailed-comparisons")?.toggleAttribute("hidden", !document.querySelector(`[data-story-comparison-set="${key}"]`));
    document.querySelector<HTMLButtonElement>("[data-story-dashboard]")?.classList.remove("active");
    root.classList.remove("story-dashboard-open");
    document.querySelector<HTMLElement>(".story-dashboard-view")?.setAttribute("hidden", "true");
    document.querySelector<HTMLElement>(".story-content")?.removeAttribute("hidden");
    compareBox?.toggleAttribute("hidden", !compareBefore);
    compareMissing?.toggleAttribute("hidden", Boolean(compareBefore));
    if (compareMissing && !compareBefore) compareMissing.textContent = app.language === "en" ? "No verified comparison is available." : "لا توجد مقارنة موثقة.";
    if (dataNote) dataNote.textContent = app.language === "en" ? (sector === "all" ? "All project sectors are displayed from the local database." : `Only verified local data for ${title} is displayed.`) : (sector === "all" ? "يتم عرض جميع قطاعات المشروع من قاعدة البيانات المحلية." : `يتم عرض بيانات ${title} فقط من قاعدة البيانات المحلية.`);
    document.querySelectorAll<HTMLInputElement>(".story-compare input[type='range']").forEach((range) => { range.value = "50"; range.dispatchEvent(new Event("input")); });
    document.querySelectorAll<HTMLSelectElement>(".map-sector-select").forEach((sectorSelect) => {
      if (Array.from(sectorSelect.options).some((option) => option.value === sector)) {
        sectorSelect.value = sector;
        sectorSelect.dispatchEvent(new Event("change"));
      }
    });
    // After filtering, focus every StoryMap view on the selected sector's
    // actual geometry instead of leaving the corridor-wide default extent.
    document.querySelectorAll<HTMLElement>(".story-runtime .gis-map").forEach((map) => {
      map.dispatchEvent(new CustomEvent("focus-story-sector", { detail: sector }));
    });
    const url = new URL(window.location.href);
    if (key === "all" || key === "project") url.searchParams.delete("sector");
    else url.searchParams.set("sector", key);
    window.history.replaceState({}, "", url);
  };
  document.querySelectorAll<HTMLButtonElement>("[data-story-key]").forEach((button) => button.addEventListener("click", () => {
    activateStory(button);
    document.querySelector<HTMLElement>("#story-intro")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-story-card]").forEach((card) => card.addEventListener("click", () => {
    const button = document.querySelector<HTMLButtonElement>(`[data-story-key="${card.dataset.storyCard}"]`);
    if (button) { activateStory(button); document.querySelector<HTMLElement>(`[data-story-detail="${card.dataset.storyCard}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }));
  const requestedStory = new URLSearchParams(window.location.search).get("sector");
  const requestedButton = requestedStory ? document.querySelector<HTMLButtonElement>(`[data-story-key="${requestedStory}"]`) : null;
  const initialStoryButton = requestedButton || document.querySelector<HTMLButtonElement>("[data-story-key].active");
  if (initialStoryButton) activateStory(initialStoryButton);
  document.querySelector<HTMLButtonElement>("[data-story-dashboard]")?.addEventListener("click", (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    document.querySelectorAll<HTMLButtonElement>("[data-story-key]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const dashboardView = document.querySelector<HTMLElement>(".story-dashboard-view");
    const frame = dashboardView?.querySelector<HTMLIFrameElement>("[data-dashboard-frame]");
    if (frame && !frame.src) frame.src = button.dataset.dashboardSrc || "";
    dashboardView?.removeAttribute("hidden");
    document.querySelector<HTMLElement>(".story-content")?.setAttribute("hidden", "true");
    root.classList.add("story-dashboard-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.querySelectorAll<HTMLAnchorElement>(".story-chapter-tabs a[href^='#']").forEach((link) => link.addEventListener("click", () => {
    document.querySelectorAll(".story-chapter-tabs a[href^='#']").forEach((item) => item.classList.toggle("active", item === link));
  }));

  document.querySelectorAll<HTMLButtonElement>("[data-section], [data-open-section]").forEach((button) => button.addEventListener("click", () => {
    const panel = button.dataset.section || button.dataset.openSection || "overview";
    document.querySelectorAll("[data-panel]").forEach((item) => item.classList.toggle("active", (item as HTMLElement).dataset.panel === panel));
    document.querySelectorAll("[data-section]").forEach((item) => item.classList.toggle("active", (item as HTMLElement).dataset.section === panel));
  }));
  const metrics = [
    ["مساحة منطقة الدراسة", summary.metrics.studyAreaKm2, "كم²"],
    ["طول الطريق", summary.metrics.axisLengthKm, "كم"],
    ["مساحة التغير العمراني", summary.metrics.urbanChangeKm2, "كم²"],
    ["العناصر العمرانية", summary.metrics.urbanFeatures, "عنصر"],
    ["العناصر الزراعية", summary.metrics.agriculturalFeatures, "عنصر"],
  ];
  const kpis = document.querySelector<HTMLElement>("#sector-kpis");
  if (kpis) kpis.innerHTML = metrics.map(([label, value, unit]) => `<article><span>${label}</span><strong>${format(Number(value))}</strong><small>${unit}</small></article>`).join("");
  const bars = document.querySelector<HTMLElement>("#sector-bars");
  if (bars) {
    const max = Math.max(summary.metrics.urbanFeatures || 0, summary.metrics.agriculturalFeatures || 0, summary.metrics.industrialFeatures || 0, 1);
    bars.innerHTML = [["عمراني", summary.metrics.urbanFeatures], ["زراعي", summary.metrics.agriculturalFeatures], ["صناعي", summary.metrics.industrialFeatures]].map(([label, value]) => `<div><span>${label}</span><i style="--bar-width:${Number(value || 0) / max * 100}%"></i><b>${format(Number(value))}</b></div>`).join("");
  }
  const storyKpis = document.querySelector<HTMLElement>("#story-kpis");
  if (storyKpis) {
    const values = [summary.metrics.studyAreaKm2, summary.metrics.axisLengthKm, summary.metrics.urbanChangeKm2, (summary.metrics.urbanFeatures || 0) + (summary.metrics.agriculturalFeatures || 0) + (summary.metrics.industrialFeatures || 0)];
    storyKpis.querySelectorAll("article").forEach((card, index) => { const strong = card.querySelector("strong"); if (strong) strong.textContent = format(Number(values[index] || 0)); });
  }
  document.querySelector<HTMLButtonElement>("[data-story-scroll]")?.addEventListener("click", () => document.querySelector(".story-chapter")?.scrollIntoView({ behavior: "smooth" }));
}
