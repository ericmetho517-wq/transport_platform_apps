import type { TransportApp } from "./project-runtime";
import { dashboardGroup, initializeMap, renderSectorMapMarkup } from "./interactive-dashboard";
import applicationRegistry from "../registry/apps.json";
import storyMediaManifest from "../registry/story-media.json";
import { localizedAppTitle } from "./app-titles";

const esc = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);
const localizedType = (type: TransportApp["type"], language: "ar" | "en") => language === "en"
  ? ({ Dashboard: "Interactive Dashboard", Experience: "Interactive Application", StoryMap: "Story Map", "Web AppViewer": "Web App Builder", "Instant Filter Gallery": "Application Hub" }[type])
  : ({ Dashboard: "لوحة مؤشرات تفاعلية", Experience: "تطبيق تفاعلي", StoryMap: "قصة مكانية", "Web AppViewer": "تطبيق Web App Builder", "Instant Filter Gallery": "منصة تطبيقات Application Hub" }[type]);

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
}

interface StoryMediaReference {
  imagePath: string;
  reportName: string;
  page: number;
  kind: "axis-photo" | "map" | "comparison" | "dashboard" | "evidence";
  width?: number;
  height?: number;
}

const reportStoryMedia = (group: string, key = "project"): StoryMediaReference[] => {
  const groups = storyMediaManifest.groups as unknown as Record<string, Record<string, StoryMediaReference[]>>;
  return groups[group]?.[key] || [];
};

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
  { key: "corridor-overview", label: "نظرة شاملة على المحور", sector: "all", report: "(9).pdf" },
];
const westernStoryLabels: Record<string, string> = { "abu-simbel": "Abu Simbel", luxor: "Luxor", qena: "Qena", sohag: "Sohag", assiut: "Assiut", minya: "Minya", "beni-suef": "Beni Suef", fayoum: "Fayoum", giza: "Giza", aswan: "Aswan", "corridor-overview": "Axis Overview" };
const storyEntryLabel = (entry: StoryEntry, language: "ar" | "en") => language === "en" ? (westernStoryLabels[entry.key] || entry.label) : entry.label;

function storyEntries(app: TransportApp): StoryEntry[] {
  const ownReferences = (app.reportReferences || []).filter((reference) => reference.referenceKind.startsWith("story"));
  const fallbackReferences = (applicationRegistry as TransportApp[])
    .filter((candidate) => dashboardGroup(candidate) === dashboardGroup(app))
    .sort((a, b) => (b.reportReferences?.length || 0) - (a.reportReferences?.length || 0))[0]?.reportReferences || [];
  const references = ownReferences.length ? ownReferences : fallbackReferences;
  if (dashboardGroup(app) !== "western-upper-egypt") {
    const extracted = reportStoryMedia(dashboardGroup(app));
    const hero = extracted.find((reference) => reference.kind === "axis-photo") || extracted.find((reference) => reference.kind === "map");
    const comparisons = extracted.filter((reference) => reference.kind === "comparison");
    const fallbackHero = references.find((reference) => reference.referenceKind === "story-hero") || references[0];
    const fallbackComparison = references.find((reference) => reference.referenceKind === "story-comparison") || references[1];
    const compareBefore = comparisons[0]?.imagePath || fallbackComparison?.imagePath || "";
    const fullTitle = app.language === "en" ? (app.alternateTitles?.[0] || app.title) : app.title;
    const conciseTitle = fullTitle.replace(/^(القصة المكانية التفاعلية|Spatial StoryMap)\s*[–—-]\s*/i, "");
    return [{ key: "project", label: conciseTitle, sector: "all", report: fallbackHero?.reportName || hero?.reportName || "", hero: hero?.imagePath || fallbackHero?.imagePath || "", compareBefore, compareAfter: comparisons[1]?.imagePath || compareBefore }];
  }
  return westernStoryReports.map((item) => {
    const extracted = reportStoryMedia("western-upper-egypt", item.key);
    const matching = item.report ? references.filter((reference) => reference.reportName === item.report) : [];
    const hero = extracted.find((reference) => reference.kind === "axis-photo") || extracted.find((reference) => reference.kind === "map");
    const comparisons = extracted.filter((reference) => reference.kind === "comparison");
    const compareBefore = comparisons[0]?.imagePath || matching[1]?.imagePath || "";
    return { ...item, hero: hero?.imagePath || matching[0]?.imagePath || "", compareBefore, compareAfter: comparisons[1]?.imagePath || compareBefore };
  });
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
    return `<header class="story-app-header"><div class="story-identity"><a href="../../index.html" aria-label="العودة إلى المنصة"><b>وزارة النقل</b><span>الهيئة العامة لتخطيط مشروعات النقل</span></a><strong>${esc(app.title)}</strong></div><nav class="story-chapter-tabs"><a class="active" href="#story-intro">مقدمة</a><a href="#story-map">الخريطة التفاعلية</a><a href="#story-development">المقارنة الزمنية</a><a href="#story-details">صور ومراحل المحور</a>${dashboard ? `<a class="story-dashboard-link" href="../${dashboard}/index.html?lang=${app.language}">لوحة المؤشرات</a>` : ""}</nav></header>`;
  }
  const firstKey = entries.find((entry) => entry.hero)?.key || entries[0]?.key;
  const sectorTabs = entries.map((entry) => { const label = storyEntryLabel(entry, app.language); return `<button class="${entry.key === firstKey ? "active" : ""}" data-story-key="${entry.key}" data-story-sector="${entry.sector}" data-story-title="${esc(label)}" data-story-report="${esc(entry.report)}" data-story-hero="${esc(entry.hero)}" data-story-compare-before="${esc(entry.compareBefore)}" data-story-compare-after="${esc(entry.compareAfter)}">${esc(label)}</button>`; }).join("");
  return `<header class="story-app-header"><div class="story-identity"><a href="../../index.html" aria-label="العودة إلى المنصة"><i aria-hidden="true">▦</i><span>تطور الأراضي المحيطة بطريق الصعيد الصحراوي</span></a></div><nav class="story-sector-tabs" aria-label="قطاعات محور الصعيد الغربي">${sectorTabs}${dashboard ? `<button class="story-dashboard-collection-link" data-story-dashboard data-dashboard-src="../${dashboard}/index.html?lang=${app.language}">لوحة المؤشرات</button>` : ""}</nav><nav class="story-chapter-tabs"><strong id="story-chrome-title">تطور الأراضي المحيطة بالمحور</strong><a class="active" href="#story-intro">مقدمة</a><a href="#story-map">الخريطة التفاعلية</a><a href="#story-development">المقارنة الزمنية</a><a href="#story-details">صور ومراحل المحور</a></nav></header>`;
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
    const fallbackMedia = isWestern && entry.report ? references.filter((reference) => reference.reportName === entry.report) : isWestern ? [] : references;
    const media: StoryMediaReference[] = extracted.length ? extracted : fallbackMedia.map((reference) => ({ ...reference, kind: reference.referenceKind.includes("dashboard") ? "dashboard" : reference.referenceKind.includes("comparison") ? "comparison" : reference.referenceKind.includes("map") || reference.referenceKind === "webviewer" ? "map" : "evidence" }));
    const mediaOrder: StoryMediaReference["kind"][] = ["axis-photo", "map", "comparison", "dashboard", "evidence"];
    const categoryLabels = app.language === "en"
      ? { "axis-photo": "Axis photos", map: "Maps", comparison: "Comparisons", dashboard: "Indicator dashboards", evidence: "Project evidence" }
      : { "axis-photo": "صور المحور", map: "الخرائط", comparison: "المقارنات", dashboard: "لوحات المؤشرات", evidence: "مرفقات المشروع" };
    const gallery = media.length
      ? `<div class="story-media-categories">${mediaOrder.map((kind) => {
        const items = media.filter((reference) => reference.kind === kind);
        if (!items.length) return "";
        return `<section class="story-media-category" data-media-kind="${kind}"><h4>${categoryLabels[kind]} <span>${items.length}</span></h4><div class="story-media-grid ${items.length === 1 ? "single" : ""}">${items.map((reference) => `<figure><a class="evidence-image-link" href="${esc(reference.imagePath)}" aria-label="فتح الصورة بالحجم الأصلي"><img src="${esc(reference.imagePath)}" alt="" loading="lazy"/></a></figure>`).join("")}</div></section>`;
      }).join("")}</div>`
      : `<div class="story-place-no-media">لا توجد صورة تقرير منفصلة لهذا الجزء؛ تعرض الخريطة التفاعلية بياناته المكانية المراجعة.</div>`;
    return `<article class="story-place${index === 0 ? " active" : ""}" id="story-place-${entry.key}" data-story-detail="${entry.key}"><div class="story-place-banner"><span>${String(index + 1).padStart(2, "0")}</span><div><h2>${esc(label)}</h2></div></div><div class="story-place-body"><div class="story-place-copy"><h3>${app.language === "en" ? "Maps and images" : "الصور والخرائط"}</h3></div>${gallery}</div></article>`;
  }).join("");
  return `<section id="story-details" class="story-details"><div class="section-heading"><span>03</span><h2>${app.language === "en" ? "Project media" : "صور المشروع"}</h2></div>${chapters}</section>`;
}

function experienceMarkup(app: TransportApp): string {
  const preview = app.reportReferences?.find((reference) => reference.referenceKind.includes("hero"))?.imagePath || app.reportReferences?.[0]?.imagePath || "";
  return `<main class="sector-app experience-runtime" dir="${app.direction}" data-sector-group="${dashboardGroup(app)}">${header(app)}
    <section class="sector-section active" data-panel="overview"><div class="experience-hero"><div><span>منصة التطبيقات المكانية المتكاملة</span><h1>${esc(app.title)}</h1><p>استعراض بيانات القطاع، الخرائط الرقمية، المؤشرات الاقتصادية، الدراسة الميدانية ومرفقات المشروع من واجهة واحدة.</p><button data-open-section="map">استعراض خريطة القطاع</button></div>${preview ? `<figure class="experience-reference-preview"><img src="${esc(preview)}" alt="مرجع واجهة المشروع"/><figcaption>${esc(app.reportReferences?.[0]?.reportName || "")}</figcaption></figure>` : '<div class="hero-orbit"><i></i><i></i><i></i><strong>GIS</strong></div>'}</div><div class="experience-tiles"><button data-open-section="map"><b>01</b><span>منطقة الدراسة والطبقات</span></button><button data-open-section="indicators"><b>02</b><span>مؤشرات الأسعار واستخدامات الأراضي</span></button><button data-open-section="evidence"><b>03</b><span>الدراسة الميدانية ومرفقات المشروع</span></button></div></section>
    <section class="sector-section" data-panel="map"><div class="section-heading"><h2>الخريطة التفاعلية للقطاع</h2><p>طبقات قاعدة البيانات المحلية الخاصة بهذا القطاع فقط.</p></div>${renderSectorMapMarkup()}</section>
    <section class="sector-section" data-panel="indicators"><div class="section-heading"><h2>مؤشرات القطاع</h2><p>القيم المراجعة من التقرير وطبقات قاعدة البيانات.</p></div><div class="sector-kpis" id="sector-kpis"></div><div class="sector-bars" id="sector-bars"></div></section>
    <section class="sector-section" data-panel="evidence"><div class="section-heading"><h2>أعمال ومرفقات المشروع</h2><p>المراجع المرتبطة بالقطاع من تقارير وزارة النقل.</p></div>${evidence(app)}</section>
  </main>`;
}

function storyMarkup(app: TransportApp): string {
  const entries = storyEntries(app);
  const firstAvailable = entries.find((entry) => entry.hero) || entries[0];
  const isWestern = dashboardGroup(app) === "western-upper-egypt";
  const initialCompareBefore = firstAvailable?.compareBefore || "";
  const initialCompareAfter = firstAvailable?.compareAfter || "";
  const initialTitle = firstAvailable ? storyEntryLabel(firstAvailable, app.language) : app.title;
  const dashboard = relatedDashboard(app);
  return `<main class="sector-app story-runtime${isWestern ? " arcgis-reference-story" : ""}" dir="${app.direction}" data-sector-group="${dashboardGroup(app)}">${storyHeader(app, entries)}
    ${isWestern && dashboard ? `<section class="story-dashboard-view" hidden><iframe title="لوحة المؤشرات" loading="lazy" data-dashboard-frame></iframe></section>` : ""}<div class="story-content">
    <section id="story-intro" class="story-sector-hero" ${firstAvailable?.hero ? `style="--story-image:url('${esc(firstAvailable.hero)}')"` : ""}><div><span>قصة مكانية تفاعلية</span><h1 id="story-active-title">${esc(initialTitle)}</h1><p id="story-active-subtitle">${app.language === "en" ? "Land-use development" : "تطور استخدامات الأراضي"}</p><button data-story-scroll aria-label="ابدأ التصفح">↓</button></div></section>
    <section id="story-map" class="story-chapter"><div><b>01</b><h2>منطقة الدراسة ومسار المحور</h2><p>خريطة قمر صناعي تفاعلية تعرض حدود الدراسة ومسار الطريق ومناطق التغير العمراني والزراعي للقطاع المحدد فقط. استخدم أزرار التكبير واسحب الخريطة، وانقر على أي عنصر لعرض بياناته الوصفية.</p><div class="story-data-note" id="story-data-note">يتم عرض البيانات المحلية المراجعة للقطاع.</div><div class="story-kpis" id="story-kpis"><article><span>مساحة الدراسة</span><strong>—</strong><small>كم²</small></article><article><span>طول المحور</span><strong>—</strong><small>كم</small></article><article><span>التغير العمراني</span><strong>—</strong><small>كم²</small></article><article><span>المعالم المكانية</span><strong>—</strong><small>عنصر</small></article></div></div>${renderSectorMapMarkup()}</section>
    <section id="story-development" class="story-compare-section"><div class="section-heading"><span>02</span><h2>تطور استخدامات الأراضي من 2014 حتى ${isWestern ? "2024" : "2023"}</h2><p>${app.language === "en" ? "Move the divider to compare." : "حرّك الفاصل للمقارنة."}</p></div><div class="story-compare" id="story-compare" ${initialCompareBefore ? `data-compare-before="${esc(initialCompareBefore)}" data-compare-after="${esc(initialCompareAfter)}" style="--compare-before:url('${esc(initialCompareBefore)}');--compare-after:url('${esc(initialCompareAfter)}')"` : "hidden"}><div class="compare-before"><span>2014</span></div><div class="compare-after" id="compare-overlay"><div class="compare-after-image"></div><span>${isWestern ? "2024" : "2023"}</span></div><i id="compare-handle">↔</i><input id="compare-range" type="range" min="0" max="100" value="50" aria-label="نسبة المقارنة الزمنية لاستخدامات الأراضي"/></div><div class="story-compare-missing" id="story-compare-missing" ${initialCompareBefore ? "hidden" : ""}>${app.language === "en" ? "No verified comparison is available." : "لا توجد مقارنة موثقة."}</div></section>
    ${storyMediaChapters(app, entries)}
    </div>
  </main>`;
}

function viewerMarkup(app: TransportApp): string {
  return `<main class="sector-app viewer-runtime" dir="${app.direction}" data-sector-group="${dashboardGroup(app)}">${header(app, true)}<div class="viewer-runtime-layout"><aside><h1>${esc(app.title)}</h1><label>بحث في الطبقات<input id="viewer-search" placeholder="اكتب اسم الطبقة"/></label><h2>قائمة الطبقات</h2><div id="viewer-layer-list"><button data-view-layer="study">حدود منطقة الدراسة</button><button data-view-layer="axis">مسار المحور</button><button data-view-layer="urban">التغير العمراني</button><button data-view-layer="agricultural">التغير الزراعي</button><button data-view-layer="industrial">التغير الصناعي</button><button data-view-layer="civil">الدراسة المدنية</button><button data-view-layer="landcover-start">استخدامات الأراضي - سنة البداية</button><button data-view-layer="landcover-end">استخدامات الأراضي - سنة النهاية</button><button data-view-layer="buildings">المباني</button><button data-view-layer="parcels">قطع الأراضي</button><button data-view-layer="landmarks">المعالم والخدمات</button><button data-view-layer="water">المسطحات المائية</button><button data-view-layer="field-survey">الرفع الميداني</button><button data-view-layer="transport">شبكة النقل</button><button data-view-layer="governorates">حدود المحافظات</button><button data-view-layer="baseline">استخدامات الأراضي المرجعية</button></div><h2>خريطة الأساس</h2><div class="basemap-switch"><button class="active" data-basemap="satellite">قمر صناعي</button></div><div class="viewer-help">يمكنك التكبير والسحب والنقر على أي معلم لعرض بياناته.</div></aside><section>${renderSectorMapMarkup()}</section></div></main>`;
}

function galleryMarkup(app: TransportApp): string {
  const related = (applicationRegistry as TransportApp[]).filter((candidate) => candidate.language === "ar" && candidate.slug !== app.slug && dashboardGroup(candidate) === dashboardGroup(app));
  const cards = related.map((candidate) => {
    const thumbnail = candidate.reportReferences?.[0]?.imagePath || "";
    return `<a class="application-gallery-card" href="../${esc(candidate.slug)}/index.html?lang=${app.language}" dir="${app.direction}">${thumbnail ? `<img src="${esc(thumbnail)}" alt="" loading="lazy"/>` : '<div class="application-gallery-placeholder">MOT</div>'}<div><b>${esc(localizedAppTitle(candidate, app.language))}</b><span>${esc(localizedType(candidate.type, app.language))}</span><small>${app.language === "en" ? "View application details ↗" : "عرض تفاصيل التطبيق ↗"}</small></div></a>`;
  }).join("");
  return `<main class="sector-app gallery-runtime" dir="${app.direction}" data-sector-group="${dashboardGroup(app)}">${header(app, true)}<section class="gallery-intro"><span>Data & Application Hub</span><h1>${esc(app.title)}</h1><p>تصفح تطبيقات القطاع كما في معرض التطبيقات الأصلي، أو اختر طبقة لفحص جميع معالمها على الخريطة التفاعلية.</p></section><section class="application-gallery"><div class="section-heading"><h2>تطبيقات وخرائط القطاع</h2><p>${related.length} تطبيقات مرتبطة بهذا القطاع</p></div><div class="application-gallery-grid">${cards}</div></section><div class="gallery-runtime-layout"><section><div class="section-heading compact"><h2>طبقات قاعدة البيانات</h2><p>اختر طبقة لإظهارها منفردة وفحص بياناتها.</p></div><div class="filter-cards" id="filter-cards"><button data-gallery-layer="study"><i class="study"></i><b>منطقة الدراسة</b><span data-layer-count="study">—</span></button><button data-gallery-layer="axis"><i class="axis"></i><b>محور الطريق</b><span data-layer-count="axis">—</span></button><button data-gallery-layer="urban"><i class="urban"></i><b>الأراضي العمرانية</b><span data-layer-count="urban">—</span></button><button data-gallery-layer="agricultural"><i class="agricultural"></i><b>الأراضي الزراعية</b><span data-layer-count="agricultural">—</span></button><button data-gallery-layer="industrial"><i class="industrial"></i><b>الأراضي الصناعية</b><span data-layer-count="industrial">—</span></button><button data-gallery-layer="buildings"><i class="buildings"></i><b>المباني</b><span data-layer-count="buildings">—</span></button><button data-gallery-layer="parcels"><i class="parcels"></i><b>قطع الأراضي</b><span data-layer-count="parcels">—</span></button><button data-gallery-layer="landmarks"><i class="landmarks"></i><b>المعالم والخدمات</b><span data-layer-count="landmarks">—</span></button><button data-gallery-layer="water"><i class="water"></i><b>المسطحات المائية</b><span data-layer-count="water">—</span></button><button data-gallery-layer="field-survey"><i class="field-survey"></i><b>الرفع الميداني</b><span data-layer-count="field-survey">—</span></button><button data-gallery-layer="transport"><i class="transport"></i><b>شبكة النقل</b><span data-layer-count="transport">—</span></button><button data-gallery-layer="governorates"><i class="governorates"></i><b>حدود المحافظات</b><span data-layer-count="governorates">—</span></button></div></section><section>${renderSectorMapMarkup()}</section></div></main>`;
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

export async function initSectorApplication(app: TransportApp): Promise<void> {
  const root = document.querySelector<HTMLElement>(".sector-app");
  if (!root) return;
  const galleryKicker = root.querySelector<HTMLElement>(".gallery-intro > span");
  if (galleryKicker) galleryKicker.textContent = app.language === "en" ? "Data & Application Hub" : "مركز البيانات والتطبيقات";
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
  const initialCompareBox = document.querySelector<HTMLElement>("#story-compare");
  if (initialCompareBox?.dataset.compareAfter) {
    const zoomButton = document.createElement("button");
    zoomButton.type = "button";
    zoomButton.className = "compare-zoom-button";
    zoomButton.textContent = "تكبير الصورة";
    zoomButton.addEventListener("click", () => { const link = document.createElement("a"); link.href = initialCompareBox.dataset.compareAfter || ""; openEvidence(link); });
    initialCompareBox.parentElement?.insertBefore(zoomButton, initialCompareBox);
  }
  const group = root.dataset.sectorGroup || dashboardGroup(app);
  const response = await fetch(`../../data/dashboard/${group}/summary.json`);
  if (!response.ok) return;
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
  await initializeMap(group, summary);
  document.querySelectorAll<HTMLButtonElement>("[data-view-layer], [data-gallery-layer]").forEach((button) => {
    const layer = button.dataset.viewLayer || button.dataset.galleryLayer || "";
    const available = summary.layers?.includes(layer) && Number(summary.sourceLayerCounts?.[layer] ?? summary.layerCounts?.[layer] ?? 0) > 0;
    button.hidden = !available;
  });

  const fitStoryComparison = (source?: string) => {
    const compareBox = document.querySelector<HTMLElement>("#story-compare");
    if (!compareBox || !source) return;
    compareBox.dataset.compareAfter = source;
    const sourceImage = new Image();
    sourceImage.addEventListener("load", () => {
      compareBox.style.aspectRatio = `${sourceImage.naturalWidth} / ${sourceImage.naturalHeight}`;
      compareBox.style.maxWidth = `${sourceImage.naturalWidth}px`;
      document.querySelector<HTMLInputElement>("#compare-range")?.dispatchEvent(new Event("input"));
    });
    sourceImage.src = source;
  };

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
    document.querySelectorAll<HTMLElement>("[data-story-detail]").forEach((chapter) => chapter.classList.toggle("active", chapter.dataset.storyDetail === key));
    document.querySelector<HTMLButtonElement>("[data-story-dashboard]")?.classList.remove("active");
    root.classList.remove("story-dashboard-open");
    document.querySelector<HTMLElement>(".story-dashboard-view")?.setAttribute("hidden", "true");
    document.querySelector<HTMLElement>(".story-content")?.removeAttribute("hidden");
    if (compareBox && compareBefore) {
      compareBox.dataset.compareBefore = compareBefore;
      compareBox.dataset.compareAfter = compareAfter;
      compareBox.style.setProperty("--compare-before", `url('${compareBefore}')`);
      compareBox.style.setProperty("--compare-after", `url('${compareAfter}')`);
      fitStoryComparison(compareAfter);
    }
    compareBox?.toggleAttribute("hidden", !compareBefore);
    compareMissing?.toggleAttribute("hidden", Boolean(compareBefore));
    if (compareMissing && !compareBefore) compareMissing.textContent = app.language === "en" ? "No verified comparison is available." : "لا توجد مقارنة موثقة.";
    if (dataNote) dataNote.textContent = app.language === "en" ? (sector === "all" ? "All project sectors are displayed from the local database." : `Only verified local data for ${title} is displayed.`) : (sector === "all" ? "يتم عرض جميع قطاعات المشروع من قاعدة البيانات المحلية." : `يتم عرض بيانات ${title} فقط من قاعدة البيانات المحلية.`);
    const range = document.querySelector<HTMLInputElement>("#compare-range");
    if (range) { range.value = "50"; range.dispatchEvent(new Event("input")); }
    const sectorSelect = document.querySelector<HTMLSelectElement>(".map-sector-select");
    if (sectorSelect && Array.from(sectorSelect.options).some((option) => option.value === sector)) {
      sectorSelect.value = sector;
      sectorSelect.dispatchEvent(new Event("change"));
    }
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
  if (requestedButton) activateStory(requestedButton);
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
    ["طول محور الدراسة", summary.metrics.axisLengthKm, "كم"],
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
  const range = document.querySelector<HTMLInputElement>("#compare-range");
  range?.addEventListener("input", () => {
    const overlay = document.querySelector<HTMLElement>("#compare-overlay");
    const handle = document.querySelector<HTMLElement>("#compare-handle");
    const compare = document.querySelector<HTMLElement>("#story-compare");
    const afterImage = document.querySelector<HTMLElement>(".compare-after-image");
    if (overlay) overlay.style.width = `${range.value}%`;
    if (handle) handle.style.left = `${range.value}%`;
    if (compare && afterImage) afterImage.style.width = `${compare.clientWidth}px`;
    if (compare) compare.style.setProperty("--compare-position", `${range.value}%`);
  });
  const compareBox = document.querySelector<HTMLElement>("#story-compare");
  if (compareBox) {
    new ResizeObserver(() => range?.dispatchEvent(new Event("input"))).observe(compareBox);
    fitStoryComparison(compareBox.dataset.compareAfter);
  }
  range?.dispatchEvent(new Event("input"));
  document.querySelector<HTMLButtonElement>("[data-story-scroll]")?.addEventListener("click", () => document.querySelector(".story-chapter")?.scrollIntoView({ behavior: "smooth" }));
  document.querySelectorAll<HTMLButtonElement>("[data-view-layer], [data-gallery-layer]").forEach((button) => button.addEventListener("click", () => selectOnly(button.dataset.viewLayer || button.dataset.galleryLayer || "study")));
  document.querySelectorAll<HTMLElement>("[data-layer-count]").forEach((element) => { element.textContent = format(summary.layerCounts?.[element.dataset.layerCount || ""] || 0); });
  document.querySelector<HTMLInputElement>("#viewer-search")?.addEventListener("input", (event) => {
    const query = (event.currentTarget as HTMLInputElement).value.toLowerCase();
    document.querySelectorAll<HTMLElement>("#viewer-layer-list button").forEach((button) => { button.hidden = !button.textContent?.toLowerCase().includes(query); });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-basemap]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-basemap]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelector(".gis-map")?.setAttribute("data-basemap", button.dataset.basemap || "light");
  }));
}
