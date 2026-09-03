import type { TransportApp } from "./project-runtime";
import { dashboardGroup, initializeMap, renderSectorMapMarkup } from "./interactive-dashboard";
import applicationRegistry from "../registry/apps.json";

const esc = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);

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
  compare: string;
}

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
];

function storyEntries(app: TransportApp): StoryEntry[] {
  const references = (app.reportReferences || []).filter((reference) => reference.referenceKind.startsWith("story"));
  if (dashboardGroup(app) !== "western-upper-egypt") {
    const hero = references.find((reference) => reference.referenceKind === "story-hero") || references[0];
    const comparison = references.find((reference) => reference.referenceKind === "story-comparison") || references[1];
    return [{ key: "project", label: app.title, sector: "all", report: hero?.reportName || "", hero: hero?.imagePath || "", compare: comparison?.imagePath || "" }];
  }
  return westernStoryReports.map((item) => {
    const matching = item.report ? references.filter((reference) => reference.reportName === item.report) : [];
    return { ...item, hero: matching[0]?.imagePath || "", compare: matching[1]?.imagePath || matching[0]?.imagePath || "" };
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
  };
  return links[dashboardGroup(app)]?.[app.language] || "";
}

function storyHeader(app: TransportApp, entries: StoryEntry[]): string {
  const dashboard = relatedDashboard(app);
  const isWestern = dashboardGroup(app) === "western-upper-egypt";
  const collectionHero = entries.find((entry) => entry.hero)?.hero || "";
  const collectionCompare = entries.find((entry) => entry.compare)?.compare || "";
  return `<header class="story-app-header"><div class="story-identity"><a href="../../index.html" aria-label="العودة إلى المنصة"><b>وزارة النقل</b><span>الهيئة العامة لتخطيط مشروعات النقل</span></a><strong>${esc(app.title)}</strong></div>${isWestern ? `<nav class="story-sector-tabs" aria-label="قطاعات محور الصعيد الغربي"><button class="active" data-story-key="all" data-story-sector="all" data-story-title="${esc(app.title)}" data-story-report="" data-story-hero="${esc(collectionHero)}" data-story-compare="${esc(collectionCompare)}">محور الصعيد الغربي</button>${entries.map((entry) => `<button data-story-key="${entry.key}" data-story-sector="${entry.sector}" data-story-title="${esc(entry.label)}" data-story-report="${esc(entry.report)}" data-story-hero="${esc(entry.hero)}" data-story-compare="${esc(entry.compare)}">${esc(entry.label)}</button>`).join("")}</nav>` : ""}<nav class="story-chapter-tabs"><a class="active" href="#story-intro">مقدمة</a><a href="#story-map">الخريطة التفاعلية</a><a href="#story-development">الخرائط والتطورات</a><a href="#story-evidence">مرفقات المشروع</a>${dashboard ? `<a class="story-dashboard-link" href="../${dashboard}/index.html">لوحة المؤشرات</a>` : ""}</nav></header>`;
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
  const initialCompare = firstAvailable?.compare || "";
  return `<main class="sector-app story-runtime" dir="${app.direction}" data-sector-group="${dashboardGroup(app)}">${storyHeader(app, entries)}
    <section id="story-intro" class="story-sector-hero" ${firstAvailable?.hero ? `style="--story-image:url('${esc(firstAvailable.hero)}')"` : ""}><div><span>قصة مكانية تفاعلية</span><h1 id="story-active-title">${esc(app.title)}</h1><p id="story-active-subtitle">تطور استخدامات الأراضي المحيطة بالمحور قبل وبعد الإنشاء</p><button data-story-scroll>ابدأ التصفح ↓</button></div></section>
    ${isWestern ? `<section class="story-collection"><div class="section-heading"><span>قطاعات المحور</span><h2>اختر القطاع لعرض القصة والخرائط والمقارنة الخاصة به</h2><p>كل صورة ومقارنة مرتبطة بالقطاع والتقرير الأصلي الظاهر في مراجع المشروع.</p></div><div class="story-sector-cards">${entries.map((entry) => `<button data-story-card="${entry.key}" class="${entry.hero ? "" : "data-only"}" ${entry.hero ? `style="--card-image:url('${esc(entry.hero)}')"` : ""}><span>${esc(entry.label)}</span><small>${entry.report ? `${esc(entry.report)} · بيانات القطاع ${esc(entry.sector)}` : "بيانات مكانية محلية"}</small></button>`).join("")}</div></section>` : ""}
    <section id="story-map" class="story-chapter"><div><b>01</b><h2>منطقة الدراسة ومسار المحور</h2><p>خريطة قمر صناعي تفاعلية تعرض حدود الدراسة ومسار الطريق ومناطق التغير العمراني والزراعي للقطاع المحدد فقط. استخدم أزرار التكبير واسحب الخريطة، وانقر على أي عنصر لعرض بياناته الوصفية.</p><div class="story-data-note" id="story-data-note">يتم عرض البيانات المحلية المراجعة للقطاع.</div><div class="story-kpis" id="story-kpis"><article><span>مساحة الدراسة</span><strong>—</strong><small>كم²</small></article><article><span>طول المحور</span><strong>—</strong><small>كم</small></article><article><span>التغير العمراني</span><strong>—</strong><small>كم²</small></article><article><span>المعالم المكانية</span><strong>—</strong><small>عنصر</small></article></div></div>${renderSectorMapMarkup()}</section>
    <section id="story-development" class="story-compare-section"><div class="section-heading"><span>02</span><h2>تطور استخدامات الأراضي من 2014 حتى ${isWestern ? "2024" : "2023"}</h2><p>حرّك الفاصل يمينًا ويسارًا للمقارنة بين جانبي الصورة الأصلية الواردة في تقرير القطاع.</p></div><div class="story-compare" id="story-compare" ${initialCompare ? `data-compare-src="${esc(initialCompare)}" style="--compare-image:url('${esc(initialCompare)}')"` : "hidden"}><div class="compare-before"><span>2014</span></div><div class="compare-after" id="compare-overlay"><div class="compare-after-image"></div><span>${isWestern ? "2024" : "2023"}</span></div><i id="compare-handle">↔</i><input id="compare-range" type="range" min="0" max="100" value="50" aria-label="نسبة المقارنة الزمنية لاستخدامات الأراضي"/></div><div class="story-compare-missing" id="story-compare-missing" ${initialCompare ? "hidden" : ""}>${isWestern ? "اختر أحد قطاعات المحور من الشريط العلوي لعرض المقارنة الزمنية الموثقة الخاصة به." : "لا توجد صورة مقارنة زمنية موثقة لهذا القطاع داخل ملفات التقارير الحالية؛ الخريطة بالأعلى تعرض بياناته المكانية المتاحة دون إضافة صورة افتراضية."}</div></section>
    <section id="story-evidence" class="story-evidence-section"><div class="section-heading"><span>03</span><h2>أعمال ومرفقات القطاع</h2><p>الصور الأصلية المستخرجة من تقرير القطاع دون استبدالها بصور عامة.</p></div>${evidence(app)}</section>
  </main>`;
}

function viewerMarkup(app: TransportApp): string {
  return `<main class="sector-app viewer-runtime" dir="${app.direction}" data-sector-group="${dashboardGroup(app)}">${header(app, true)}<div class="viewer-runtime-layout"><aside><h1>${esc(app.title)}</h1><label>بحث في الطبقات<input id="viewer-search" placeholder="اكتب اسم الطبقة"/></label><h2>قائمة الطبقات</h2><div id="viewer-layer-list"><button data-view-layer="study">حدود منطقة الدراسة</button><button data-view-layer="axis">مسار المحور</button><button data-view-layer="urban">التغير العمراني</button><button data-view-layer="agricultural">التغير الزراعي</button><button data-view-layer="industrial">التغير الصناعي</button><button data-view-layer="civil">الدراسة المدنية</button><button data-view-layer="landcover-start">استخدامات الأراضي - سنة البداية</button><button data-view-layer="landcover-end">استخدامات الأراضي - سنة النهاية</button><button data-view-layer="buildings">المباني</button><button data-view-layer="parcels">قطع الأراضي</button><button data-view-layer="landmarks">المعالم والخدمات</button><button data-view-layer="water">المسطحات المائية</button><button data-view-layer="field-survey">الرفع الميداني</button><button data-view-layer="transport">شبكة النقل</button><button data-view-layer="governorates">حدود المحافظات</button><button data-view-layer="baseline">استخدامات الأراضي المرجعية</button></div><h2>خريطة الأساس</h2><div class="basemap-switch"><button class="active" data-basemap="satellite">قمر صناعي</button></div><div class="viewer-help">يمكنك التكبير والسحب والنقر على أي معلم لعرض بياناته.</div></aside><section>${renderSectorMapMarkup()}</section></div></main>`;
}

function galleryMarkup(app: TransportApp): string {
  const related = (applicationRegistry as TransportApp[]).filter((candidate) => candidate.slug !== app.slug && dashboardGroup(candidate) === dashboardGroup(app));
  const cards = related.map((candidate) => {
    const thumbnail = candidate.reportReferences?.[0]?.imagePath || "";
    return `<a class="application-gallery-card" href="../${esc(candidate.slug)}/index.html" dir="${candidate.direction}">${thumbnail ? `<img src="${esc(thumbnail)}" alt="" loading="lazy"/>` : '<div class="application-gallery-placeholder">MOT</div>'}<div><b>${esc(candidate.title)}</b><span>${esc(candidate.type)} · ${candidate.language === "en" ? "English" : "العربية"}</span><small>عرض تفاصيل التطبيق ↗</small></div></a>`;
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
    compareBox.dataset.compareSrc = source;
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
    const compare = button.dataset.storyCompare || "";
    const report = button.dataset.storyReport || "";
    const sector = button.dataset.storySector || "all";
    const key = button.dataset.storyKey || "all";
    const heroSection = document.querySelector<HTMLElement>(".story-sector-hero");
    const activeTitle = document.querySelector<HTMLElement>("#story-active-title");
    const compareBox = document.querySelector<HTMLElement>("#story-compare");
    const compareMissing = document.querySelector<HTMLElement>("#story-compare-missing");
    const dataNote = document.querySelector<HTMLElement>("#story-data-note");
    if (activeTitle) activeTitle.textContent = title;
    if (heroSection && hero) heroSection.style.setProperty("--story-image", `url('${hero}')`);
    if (compareBox && compare) {
      compareBox.style.setProperty("--compare-image", `url('${compare}')`);
      fitStoryComparison(compare);
    }
    compareBox?.toggleAttribute("hidden", !compare);
    compareMissing?.toggleAttribute("hidden", Boolean(compare));
    if (compareMissing && !compare) compareMissing.textContent = sector === "all" ? "اختر أحد قطاعات المحور من الشريط العلوي لعرض المقارنة الزمنية الموثقة الخاصة به." : "لا توجد صورة مقارنة زمنية موثقة لهذا القطاع داخل ملفات التقارير الحالية؛ الخريطة بالأعلى تعرض بياناته المكانية المتاحة دون إضافة صورة افتراضية.";
    if (dataNote) dataNote.textContent = app.language === "en" ? (sector === "all" ? "All project sectors are displayed from the local database." : `Only verified local data for ${title} is displayed.`) : (sector === "all" ? "يتم عرض جميع قطاعات المشروع من قاعدة البيانات المحلية." : `يتم عرض بيانات ${title} فقط من قاعدة البيانات المحلية.`);
    const range = document.querySelector<HTMLInputElement>("#compare-range");
    if (range) { range.value = "50"; range.dispatchEvent(new Event("input")); }
    document.querySelectorAll<HTMLElement>("[data-evidence-report]").forEach((figure) => { figure.hidden = Boolean(report) && figure.dataset.evidenceReport !== report; });
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
  document.querySelectorAll<HTMLButtonElement>("[data-story-key]").forEach((button) => button.addEventListener("click", () => activateStory(button)));
  document.querySelectorAll<HTMLButtonElement>("[data-story-card]").forEach((card) => card.addEventListener("click", () => {
    const button = document.querySelector<HTMLButtonElement>(`[data-story-key="${card.dataset.storyCard}"]`);
    if (button) { activateStory(button); document.querySelector("#story-intro")?.scrollIntoView({ behavior: "smooth" }); }
  }));
  const requestedStory = new URLSearchParams(window.location.search).get("sector");
  const requestedButton = requestedStory ? document.querySelector<HTMLButtonElement>(`[data-story-key="${requestedStory}"]`) : null;
  if (requestedButton) activateStory(requestedButton);
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
  });
  const compareBox = document.querySelector<HTMLElement>("#story-compare");
  if (compareBox) {
    new ResizeObserver(() => range?.dispatchEvent(new Event("input"))).observe(compareBox);
    fitStoryComparison(compareBox.dataset.compareSrc);
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
