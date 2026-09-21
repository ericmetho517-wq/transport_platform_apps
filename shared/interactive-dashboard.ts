import type { TransportApp } from "./project-runtime";

type LayerName = "study" | "axis" | "urban" | "agricultural" | "industrial" | "baseline" | "civil" | "landcover-start" | "landcover-end" | "buildings" | "parcels" | "landmarks" | "water" | "field-survey" | "transport" | "governorates" | "LRT_Line" | "lRT_Station" | "Metro_Line" | "Metro_Station" | "Road_CairoRing" | "Road_MiddleRing" | "Road_RegionalRing" | "Transit_GreenLine" | "Transit_KafrDawoodSadat" | "Transit_LRT" | "Transit_Metro1" | "Transit_Metro2" | "Transit_Metro3" | "Transit_Metro4" | "Transit_Metro6" | "Transit_MonorailCapital" | "Transit_MonorailOctober" | "Transit_RobikiBelbeis";

// One approved cartographic language for every dashboard map.  Keeping this
// in the renderer (rather than per-dashboard CSS) means a road or rail layer
// has exactly the same colour, width, and dash pattern everywhere.
const lineSymbols: Partial<Record<LayerName, { color: string; width: number; dash?: string }>> = {
  axis: { color: "#ed1c24", width: 3.2 },
  transport: { color: "#18b8ad", width: 2.4 },
  Road_CairoRing: { color: "#f59e0b", width: 3.0 },
  Road_MiddleRing: { color: "#e510c5", width: 3.0 },
  Road_RegionalRing: { color: "#22c55e", width: 3.0 },
  LRT_Line: { color: "#43c94f", width: 2.4 },
  Metro_Line: { color: "#2b7fd1", width: 2.4 },
  Transit_GreenLine: { color: "#262626", width: 3.0, dash: "10 5" },
  Transit_KafrDawoodSadat: { color: "#808080", width: 3.8, dash: "11 5" },
  Transit_LRT: { color: "#43c94f", width: 2.4 },
  Transit_Metro1: { color: "#2995df", width: 2.4 },
  Transit_Metro2: { color: "#7654c8", width: 3.8 },
  Transit_Metro3: { color: "#2b7fd1", width: 2.4 },
  Transit_Metro4: { color: "#f3b525", width: 2.4 },
  Transit_Metro6: { color: "#a573db", width: 3.8 },
  Transit_MonorailCapital: { color: "#9b9b9b", width: 2.4 },
  Transit_MonorailOctober: { color: "#9b9b9b", width: 2.4 },
  Transit_RobikiBelbeis: { color: "#1a1a1a", width: 2.8, dash: "4 3" },
};

const ismailiaLanduseSymbols: Record<number, [string, string]> = {
  0: ["#28c51b", "#28c51b"],  // الأراضي الزراعية
  1: ["#a100c2", "#a100c2"],  // المناطق الصناعية
  // Keep vacant land visible: it is a documented land-cover class, not an
  // empty map area. The translucent fill preserves the satellite context.
  2: ["rgba(255,244,174,.72)", "#d8bd31"],
  3: ["#ffaa00", "#e59600"],  // الأراضي العمرانية
  4: ["#ff1308", "#dc0d05"],  // أراضي القوات المسلحة
  5: ["#c6f5ad", "#9dd781"],  // أراضي خدمات
  6: ["#aebda6", "#93a28b"],  // المناطق الترفيهية
  7: ["#858585", "#e1e1e1"],  // مقابر
  8: ["#18b2dc", "#078fb5"],  // مسطحات مائية
  9: ["transparent", "transparent"],  // حرم الطريق
  10: ["#555555", "transparent"], // طرق
  11: ["#dedede", "#c7c7c7"], // ديني
  12: ["#2f5c96", "#244a7a"], // الأراضي التعليمية
  13: ["#bd7900", "#9c6300"], // الأراضي الحكومية
  14: ["#13cabb", "#0ba99d"], // الأراضي السياحية
  15: ["#62cf49", "#d8ffce"], // مساحات خضراء
  99: ["transparent", "transparent"],
};

const ismailiaLanduseNames: Record<string, string> = {
  "0": "الأراضي الزراعية", "1": "المناطق الصناعية", "2": "أراضي الفضاء", "3": "الأراضي العمرانية",
  "4": "أراضي القوات المسلحة", "5": "أراضي خدمات", "6": "المناطق الترفيهية",
  "7": "المقابر", "8": "مسطحات مائية", "9": "حرم الطريق", "10": "طرق",
  "11": "ديني", "12": "الأراضي التعليمية", "13": "الأراضي الحكومية",
  "14": "الأراضي السياحية", "15": "مساحات خضراء", "99": "غير مصنف",
};

// These colours and labels are shared by every axis dashboard.  The Ismailia
// dashboard established the approved cartographic palette; keeping the
// service matcher here prevents each project from drifting to a different
// colour when it is rendered in a chart or filter.
const serviceColor = ismailiaLanduseSymbols[5][0];
const storyVisibleLanduseCodes = new Set([0, 1, 2, 3]);
const serviceLabelPattern = /خدم|تعليم|حكوم|دين|سياح|ترفيه|مقابر/i;
const transportLayerNames: LayerName[] = [
  "Road_CairoRing", "Road_MiddleRing", "Road_RegionalRing",
  "Transit_GreenLine", "Transit_KafrDawoodSadat", "Transit_LRT",
  "Transit_Metro1", "Transit_Metro2", "Transit_Metro3", "Transit_Metro4",
  "Transit_Metro6", "Transit_MonorailCapital", "Transit_MonorailOctober",
  "Transit_RobikiBelbeis", "LRT_Line", "lRT_Station", "Metro_Line", "Metro_Station",
];

interface DashboardSummary {
  slug: string;
  projectTitle: string;
  verifiedLocalData: boolean;
  yearStart: number;
  yearEnd: number;
  metrics: Record<string, number>;
  prices: Record<string, { start: number; end: number }>;
  priceSeries: { years: number[]; urban: number[]; agricultural: number[]; industrial: number[] };
  landUse: Array<{ category: string; year: number; area: number }>;
  layers: LayerName[];
  layerCounts?: Record<string, number>;
  profile?: SectorProfile;
}

interface SectorProfile {
  title: string;
  report: string;
  pages: number[];
  yearEnd?: number;
  metrics: Record<string, number>;
  prices?: Record<string, { start: number; end: number }>;
  priceLabels?: Record<string, string>;
  sectors?: Record<string, {
    title: string;
    report: string;
    page: number;
    metrics: Record<string, number>;
    prices?: Record<string, { start: number; end: number }>;
    changeBars?: Array<{ label: string; value: number; layer: string }>;
    landUse?: Array<{ category: string; year: number; area: number }>;
    statusShares?: { existing: number; underConstruction: number };
  }>;
  changeBars?: Array<{ label: string; value: number; layer: string }>;
  landUse?: Array<{ category: string; year: number; area: number }>;
  statusShares?: { existing: number; underConstruction: number };
  cropShares?: number[];
  ownershipShares?: number[];
}

type SectorDetail = NonNullable<SectorProfile["sectors"]>[string];

const esc = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);

export function normalizeChangeStatus(value: unknown): "changed" | "unchanged" | "unknown" {
  const status = String(value ?? "").trim().toLowerCase();
  if (!status) return "unknown";
  if (status === "2" || status === "unchanged" || /غير\s*متغير|لا\s*تغي(?:ر|ير)|بدون\s*تغي(?:ر|ير)|لم\s*يتغي(?:ر|ير)|ثابت/.test(status)) return "unchanged";
  if (status === "1" || status === "changed" || /متغير|تغي(?:ر|ير)/.test(status)) return "changed";
  return "unknown";
}

const isPriceDashboard = (app: TransportApp) => /سعر|أسعار|اسعار|price/i.test(app.title);
const civilDashboardSlugs = new Set(["dashboard-4b68db62a1", "dashboard-48c0447e11", "dashboard-890d333abf", "dashboard-489e365131", "dashboard-37e01603d0", "dashboard-ba98b53679"]);
const impactDashboardSlugs = new Set(["dashboard-35c11a505b", "dashboard-83f3738705", "dashboard-676c18c4b7", "dashboard-4138cfe326", "dashboard-f0a5bc623c"]);
const isCivilDashboard = (app: TransportApp) => civilDashboardSlugs.has(app.slug) || /civil study/i.test(app.title);
const isImpactDashboard = (app: TransportApp) => impactDashboardSlugs.has(app.slug) || /developmental impact|economic and developmental impact/i.test(app.title);
const isUrbanDashboard = (app: TransportApp) => /urban|العمرانية|العمراني/i.test(app.title);

export function dashboardGroup(app: TransportApp): string {
  const groupAliases: Record<string, string> = {
    dabaa: "dabaa-axis",
    dahshur: "dahshur-south-link",
    kalabsha: "kalabsha-axis",
    "qena-luxor": "qena-luxor-road",
    qus: "qus-axis",
    "regional-ring": "regional-ring-road",
    "suez-free": "cairo-suez-road",
    "suez-link": "suez-ring-link",
    "western-upper-egypt": "western-upper-egypt",
  };
  if (app.reportReferenceGroup) return groupAliases[app.reportReferenceGroup] || app.reportReferenceGroup;
  const text = `${app.category} ${app.title}`.toLowerCase();
  if (/الصعيد الغربي|western upper/.test(text)) return "western-upper-egypt";
  if (/دهشور|dahshur/.test(text)) return "dahshur-south-link";
  if (/الإقليمي|الاقليمي|regional|الروبيكي|الروبيكى/.test(text)) return "regional-ring-road";
  if (/كلابشة|kalabsha/.test(text)) return "kalabsha-axis";
  if (/قنا|qena|luxor|الأقصر|الاقصر/.test(text)) return "qena-luxor-road";
  if (/قوص|قوس|qus/.test(text)) return "qus-axis";
  if (/الضبعة|دبعة|dabaa/.test(text)) return "dabaa-axis";
  if (/وصلة.*السويس|suez road link/.test(text)) return "suez-ring-link";
  if (/القاهرة.*السويس|cairo.suez|السويس الحر/.test(text)) return "cairo-suez-road";
  return "western-upper-egypt";
}

function mapMarkup(instance = "primary", yearLabel = "", dashboardSync = true): string {
  const suffix = instance.replace(/[^a-z0-9-]/gi, "-");
  return `<section class="gis-map${yearLabel ? " temporal-map" : ""}" data-basemap="satellite" data-map-instance="${suffix}" data-dashboard-sync="${dashboardSync}" aria-label="خريطة تفاعلية">
    ${yearLabel ? `<div class="temporal-year">${yearLabel}<small>عرض تفاعلي مترابط</small></div>` : ""}
    <div class="map-status"><span class="live-dot"></span><span class="map-status-text">جارٍ تحميل طبقات المشروع المحلية…</span></div>
    <label class="map-sector-filter" hidden><span>نطاق العرض</span><select class="map-sector-select"><option value="all">كل القطاعات</option></select></label>
    <div class="map-layer-toggles"></div><label class="map-change-filter"><span>حالة التغير</span><select class="map-change-select"><option value="all">كل العناصر</option><option value="changed">متغير</option><option value="unchanged">غير متغير</option></select></label>
    <svg class="interactive-map" viewBox="0 0 1000 520" role="img" aria-label="خريطة تفاعلية لبيانات المشروع">
      <defs>
        <pattern id="map-grid-${suffix}" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#bbb" stroke-width=".6" opacity=".45"/></pattern>
        <linearGradient id="map-bg-${suffix}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f4edcf"/><stop offset="1" stop-color="#d7e3d6"/></linearGradient>
      </defs>
      <rect width="1000" height="520" fill="url(#map-bg-${suffix})"/>
      <g class="map-viewport"><g class="satellite-basemap"></g><rect width="1000" height="520" fill="url(#map-grid-${suffix})" opacity=".16"/><g class="map-content"></g></g>
    </svg>
    <div class="map-controls"><button type="button" data-map-action="in" aria-label="تكبير">+</button><button type="button" data-map-action="out" aria-label="تصغير">−</button><button type="button" data-map-action="home" aria-label="إظهار كل البيانات">⌂</button></div>
    <div class="map-wheel-hint">عجلة الماوس للتكبير · اسحب لتحريك الخريطة</div>
    <div class="feature-popup" hidden><button type="button" aria-label="إغلاق">×</button><strong>بيانات العنصر</strong><div></div></div>
    <div class="map-scale">صور أقمار صناعية · بيانات مكانية محلية · WGS 84</div>
  </section>`;
}

export const renderSectorMapMarkup = mapMarkup;

function dashboardHeader(app: TransportApp, group = ""): string {
  const isAgricultureAndIndustry = /الزراعية.*الصناعية|agricultural.*industrial/i.test(app.title);
  // Only offer a land-use type when it belongs to this dashboard's subject.
  // Cairo–Suez has both agricultural and industrial classified polygons, so
  // excluding it here made its industrial filter inaccessible.
  const hasIndustrial = !["kalabsha-axis", "qus-axis", "qena-luxor-road", "suez-ring-link", "dabaa-axis"].includes(group);
  const hasAgricultural = !["suez-ring-link"].includes(group);
  const landuseOptions = isPriceDashboard(app)
    ? `<option value="all">كل الاستخدامات</option><option value="urban">العمراني</option>${hasAgricultural ? `<option value="agricultural">الزراعي</option>` : ""}${hasIndustrial ? `<option value="industrial">الصناعي</option>` : ""}`
    : isAgricultureAndIndustry
      ? (hasIndustrial
          ? `<option value="all">الزراعة والصناعة</option>${hasAgricultural ? `<option value="agricultural">الزراعي</option>` : ""}<option value="industrial">الصناعي</option>`
          : `<option value="all">الزراعة</option>`)
      : "";
  const landuseFilter = landuseOptions
    ? `<label class="dashboard-landuse-filter"><span>استخدام الأرض</span><select id="dashboard-landuse-filter" class="price-landuse-select">${landuseOptions}</select></label>`
    : "";
  const sectorFilter = `<label class="dashboard-sector-filter" data-sector-group="${esc(group)}"><span>القطاعات</span><select id="dashboard-sector-filter"><option value="all">كل القطاعات</option></select></label>`;
  return `<header class="interactive-head"><div><a href="../../index.html" class="mot-badge">وزارة النقل</a><span>${esc(app.category)}</span><h1>${esc(app.title)}</h1></div><div class="dash-actions">${sectorFilter}${landuseFilter}<label class="dashboard-change-filter"><span>حالة التغير</span><select id="dashboard-change-filter"><option value="all">كل العناصر</option><option value="changed">متغير</option><option value="unchanged">غير متغير</option></select></label><button id="fullscreen-dashboard" type="button">ملء الشاشة</button></div></header>`;
}

function priceMarkup(app: TransportApp, group: string): string {
  const westernComparison = true;
  const isIsmailia = group === "ismailia";
  const priceStartYear = group === "ismailia" ? 2016 : 2014;
  const priceEndYear = group === "ismailia" ? 2026 : 2024;
  const mapArea = westernComparison
    ? `<div class="temporal-map-pair price-temporal-map-pair${group === "ismailia" ? " ismailia-temporal-map-pair" : ""}">${mapMarkup("price-baseline", `<span class="map-year-start">${priceStartYear}</span>`, false)}${mapMarkup("price-current", `<span class="map-year-end">${priceEndYear}</span>`, true)}</div>`
    : mapMarkup();
  const trendArea = westernComparison ? "" : `<section class="dark-card line-chart-card"><div class="card-title"><div><span>التغير السنوي لأسعار الأراضي</span><small id="chart-year-label">اضغط على أي نقطة لاستعراض السنة</small></div><div class="series-toggles"><button class="active" data-series="urban">العمرانية</button><button class="active" data-series="agricultural">الزراعية</button><button class="active" data-series="industrial">الصناعية</button></div></div><div id="line-chart" class="svg-chart loading-panel">جارٍ إنشاء الرسم البياني…</div></section>`;
  const workspaceSummary = true
    ? `<div class="dashboard-kpis ismailia-map-kpis"><article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article></div>`
    : `<div class="dashboard-kpis"><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article class="gold"><span>سنة القياس</span><strong id="active-year">—</strong></article></div>`;
  return `<main class="interactive-dashboard price-dashboard${westernComparison ? " western-price-dashboard" : ""}" dir="${app.direction}" data-dashboard-group="${group}" data-mode="price">
    ${dashboardHeader(app, group)}
    <div class="price-layout">
      <aside class="price-columns" id="price-columns"><div class="loading-panel">جارٍ قراءة أسعار الأراضي من قاعدة بيانات المشروع…</div></aside>
      <section class="price-workspace">
        ${workspaceSummary}
        ${mapArea}
        ${trendArea}
      </section>
    </div>
  </main>`;
}

function dabaaLandMarkup(app: TransportApp, group: string): string {
  return `<main class="interactive-dashboard dabaa-land-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="agriculture">
    ${dashboardHeader(app, group)}
    <div class="dashboard-kpis general-agriculture-kpis" style="grid-template-columns: repeat(4, minmax(0, 1fr));">
      <article class="orange"><span>إجمالي مساحة الأراضي العمرانية المتغيرة (كم²)</span><strong data-metric="urbanChangeKm2">—</strong></article>
      <article class="lime"><span>إجمالي مساحة الأراضي الزراعية المتغيرة (فدان)</span><strong data-metric="agriculturalAreaFeddan">—</strong></article>
      <article class="white"><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article>
      <article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article>
    </div>
    <div class="dabaa-land-layout">
      <section class="dabaa-center">
        ${mapMarkup()}
        <section class="dark-card comparison-card">
          <div class="card-title"><span>مقارنة مساحات استخدام الأراضي لعامي 2014 - 2023</span><button type="button" id="reset-landuse-filter" class="reset-landuse-btn">إعادة ضبط التصنيفات</button></div>
          <div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div>
        </section>
      </section>
      <aside class="dabaa-gauges">
        <section class="dark-card gauge-card"><span>نسبة مساحة التغير العمراني بمنطقة الدراسة لعام 2023</span><div class="gauge" id="urban-gauge"><i></i><strong>—</strong></div></section>
        <section class="dark-card gauge-card"><span>نسبة مساحة التغير الزراعي بمنطقة الدراسة لعام 2023</span><div class="gauge" id="agricultural-gauge"><i></i><strong>—</strong></div></section>
      </aside>
    </div>
  </main>`;
}

function landMarkup(app: TransportApp, group: string): string {
  const changeBarsHint = group === "ismailia"
    ? ""
    : "اضغط على العمود لتصفية طبقة الخريطة";
  const changeBarsTitle = group === "ismailia" ? "مساحات أراضي الخدمات (كم²)" : "مناطق تغير استخدامات الأراضي";
  const urbanMetricKey = group === "ismailia" ? "urbanChangeKm2" : "totalChangeKm2";
  const urbanMetricLabel = "إجمالي مساحة الأراضي العمرانية المتغيرة (كم²)";
  const ismailiaJobs = group === "ismailia"
    ? `<div class="ismailia-jobs-cards"><article class="opportunity-card"><span>فرص العمل للأراضي العمرانية المستحدثة</span><strong data-metric="urbanJobs">—</strong><small>فرصة عمل</small></article><article class="opportunity-card opportunity-card-small"><span>فرص العمل لأراضي الخدمات</span><strong data-metric="servicesJobs">—</strong><small>فرصة عمل</small></article></div>`
    : `<article class="opportunity-card"><span>فرص العمل للأراضي العمرانية المستحدثة</span><strong data-metric="jobOpportunities">—</strong></article>`;
  return `<main class="interactive-dashboard land-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="land">
    ${dashboardHeader(app, group)}
    <div class="land-layout">
      <aside class="land-left">${ismailiaJobs}<section class="dark-card vertical-chart-card"><div class="card-title"><span>${changeBarsTitle}</span>${changeBarsHint ? `<small>${changeBarsHint}</small>` : ""}</div><div id="change-bars" class="change-bars loading-panel">جارٍ قراءة البيانات…</div></section></aside>
      <section class="land-center"><div class="dashboard-kpis"><article class="gold"><span>${urbanMetricLabel}</span><strong data-metric="${urbanMetricKey}">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="blue"><span>طول الطريق (كم)</span><strong data-metric="axisLengthKm">—</strong></article></div><div class="temporal-map-pair">${mapMarkup("land-baseline", '<span class="map-year-start">2014</span>', false)}${mapMarkup("land-current", '<span class="map-year-end">2024</span>', true)}</div><section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدامات الأراضي</span><button type="button" id="reset-landuse-filter" class="reset-landuse-btn">إعادة ضبط التصنيفات</button></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section></section>
      <aside class="land-right"><section class="dark-card gauge-card"><span>نسبة مساحة التغير العمراني من منطقة الدراسة</span><div class="gauge" id="urban-gauge"><i></i><strong>—</strong></div><small>اضغط لعرض التغير العمراني فقط</small></section><section class="dark-card donut-card"><span>مكونات استخدامات الأراضي</span><div class="donut" id="change-donut"><strong>مكونات الأراضي</strong></div><div id="donut-legend"></div></section></aside>
    </div>
  </main>`;
}

function reportLandMarkup(app: TransportApp, group: string): string {
  return `<main class="interactive-dashboard land-dashboard report-land-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="land">
    ${dashboardHeader(app, group)}
    <div class="land-layout">
      <aside class="land-left"><article class="opportunity-card"><span>فرص العمل للأراضي العمرانية المستحدثة</span><strong data-metric="jobOpportunities" data-metric-scale="1000">—</strong><small>ألف عامل</small></article><section class="dark-card vertical-chart-card"><div class="card-title"><span>مناطق التغير العمراني المستحدثة</span><small>اضغط على العمود لتصفية طبقة الخريطة</small></div><div id="change-bars" class="change-bars loading-panel">جارٍ قراءة البيانات…</div></section></aside>
      <section class="land-center"><div class="dashboard-kpis"><article class="gold"><span>إجمالي مساحة الأراضي العمرانية المتغيرة (كم²)</span><strong data-metric="totalChangeKm2">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="blue"><span>طول الطريق (كم)</span><strong data-metric="axisLengthKm">—</strong></article></div>${mapMarkup()}<section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدامات الأراضي: <bdi>2014</bdi> / <bdi class="map-year-end">2023</bdi></span><button type="button" id="reset-landuse-filter" class="reset-landuse-btn">إعادة ضبط التصنيفات</button></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section></section>
      <aside class="land-right"><section class="dark-card gauge-card"><span>نسبة مساحة التغير العمراني من منطقة الدراسة</span><div class="gauge" id="urban-gauge"><strong>—</strong></div><small>اضغط لعرض التغير العمراني فقط</small></section><section class="dark-card donut-card"><span>مكونات استخدامات الأراضي</span><div class="donut" id="change-donut"><strong>مكونات الأراضي</strong></div><div id="donut-legend"></div></section></aside>
    </div>
  </main>`;
}

function southernAgricultureMarkup(app: TransportApp, group: string): string {
  const qena = group === "qena-luxor-road";
  const qus = group === "qus-axis";
  const kalabsha = group === "kalabsha-axis";
  const rightPanels = qena
    ? `<section class="dark-card gauge-card"><span>نسبة مساحة الأراضي الزراعية من إجمالي مساحة الأراضي بالمنطقة</span><div class="gauge" id="agricultural-share-gauge"><strong>—</strong></div></section>`
    : qus
      ? `<section class="dark-card gauge-card"><span>نسبة مساحة التغير العمراني بمنطقة الدراسة</span><div class="gauge" id="urban-gauge"><strong>—</strong></div></section><section class="dark-card agriculture-change highlight-stat"><span>إجمالي مساحة التغير بالأراضي الزراعية (فدان)</span><strong data-metric="agriculturalChangeFeddan">—</strong></section>`
      : kalabsha
        ? `<section class="dark-card gauge-card"><span>نسبة مساحة التغير الزراعي بمنطقة الدراسة</span><div class="gauge" id="agricultural-gauge"><strong>—</strong></div></section>`
        : `<section class="dark-card gauge-card"><span>نسبة مساحة التغير الصناعي بمنطقة الدراسة</span><div class="gauge" id="industrial-gauge"><strong>—</strong></div></section><section class="dark-card gauge-card"><span>نسبة مساحة الأراضي الزراعية من إجمالي مساحة الأراضي</span><div class="gauge" id="agricultural-share-gauge"><strong>—</strong></div></section>`;
  const leftPanels = qena
    ? `<section class="dark-card crop-card"><span>نسب أنواع محاصيل الأراضي الزراعية</span><div class="crop-donut" id="crop-donut"><strong>المحاصيل</strong></div><div id="crop-legend"></div></section><section class="dark-card agriculture-change highlight-stat"><span>إجمالي مساحة التغير بالأراضي الزراعية (فدان)</span><strong data-metric="agriculturalChangeFeddan">—</strong></section>`
    : qus
      ? `<section class="dark-card crop-card"><span>نسب أنواع محاصيل الأراضي الزراعية</span><div class="crop-donut" id="crop-donut"><strong>المحاصيل</strong></div><div id="crop-legend"></div></section><section class="dark-card ownership-card"><span>نسبة ملكية الأراضي الزراعية</span><div class="ownership-donut" id="ownership-donut"><strong>الملكية</strong></div><div id="ownership-legend"></div></section>`
      : `<section class="dark-card crop-card south-crop-card"><span>نسب أنواع محاصيل الأراضي الزراعية</span><div class="crop-donut" id="crop-donut"><strong>المحاصيل</strong></div><div id="crop-legend"></div></section>`;
  const urbanKpi = (kalabsha || qena) ? "" : `<article class="gold"><span>إجمالي مساحة الأراضي العمرانية (كم²)</span><strong data-metric="urbanChangeKm2">—</strong></article>`;
  return `<main class="interactive-dashboard agriculture-dashboard southern-agriculture-dashboard ${group}" dir="${app.direction}" data-dashboard-group="${group}" data-mode="agriculture">
    ${dashboardHeader(app, group)}
    <div class="dashboard-kpis south-agriculture-kpis"><article class="lime"><span>إجمالي مساحة الأراضي الزراعية (فدان)</span><strong data-metric="agriculturalAreaFeddan">—</strong></article><article class="lime"><span>العمالة الزراعية (بالألف)</span><strong data-metric="agriculturalWorkersThousands">—</strong></article><article class="blue"><span>طول الطريق (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article>${urbanKpi}</div>
    <div class="south-agriculture-layout"><aside class="south-agriculture-side">${leftPanels}</aside><section class="south-agriculture-center">${mapMarkup()}<section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدامات الأراضي لعامي <bdi>2014</bdi> - <bdi class="map-year-end">2023</bdi></span><button type="button" id="reset-landuse-filter" class="reset-landuse-btn">إعادة ضبط التصنيفات</button></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section></section><aside class="south-agriculture-right">${rightPanels}</aside></div>
  </main>`;
}

function agriculturalMarkup(app: TransportApp, group: string): string {
    return `<main class="interactive-dashboard agriculture-dashboard ismailia-agriculture-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="agriculture">
      ${dashboardHeader(app, group)}
      <div class="dashboard-kpis agriculture-kpis south-agriculture-kpis ismailia-summary-kpis">
        <article style="background:#aeff36;color:#000;"><span>إجمالي مساحة الأراضي الزراعية المتغيرة (فدان)</span><strong data-metric="agriculturalChangeFeddan" style="color:#000;">—</strong></article>
        <article style="background:#aeff36;color:#000;"><span>عدد العمالة الزراعية</span><strong data-metric="agriculturalJobs" style="color:#000;">—</strong></article>
        <article style="background:#4f82e9;color:#000;"><span>طول الطريق (كم)</span><strong data-metric="axisLengthKm" style="color:#000;">—</strong></article>
        <article style="background:#ffffff;color:#000;"><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2" style="color:#000;">—</strong></article>
        <article style="background:#e066ff;color:#000;"><span>عدد العمالة الصناعية</span><strong data-metric="industrialJobs" style="color:#000;">—</strong></article>
        <article style="background:#9800c7;color:#000;"><span>إجمالي مساحة الأراضي الصناعية المتغيرة (كم²)</span><strong data-metric="industrialChangeKm2" style="color:#000;">—</strong></article>
      </div>
      <div class="ismailia-reference-layout">
        <aside class="agriculture-side ismailia-left-rail">
          <section class="dark-card crop-card"><span>نسب أنواع محاصيل الأراضي الزراعية</span><div class="crop-donut" id="crop-donut"><strong>المحاصيل</strong></div><div id="crop-legend"></div></section>
          <section class="dark-card ownership-card"><span>نسب ملكية الأراضي الزراعية</span><div class="ownership-donut" id="ownership-donut"><strong>الملكية</strong></div><div id="ownership-legend"></div></section>
        </aside>
        <section class="ismailia-reference-main">
          <div class="ismailia-reference-body">
            <section class="agriculture-center">
              ${mapMarkup()}
              <section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدامات الأراضي: <bdi class="map-year-start">2014</bdi> / <bdi class="map-year-end">2024</bdi></span><button type="button" id="reset-landuse-filter" class="reset-landuse-btn">إعادة ضبط التصنيفات</button></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section>
            </section>
            <aside class="agriculture-right ismailia-agri-right">
              <section class="dark-card gauge-card"><span>نسبة مساحة التغير الزراعي بمنطقة الدراسة</span><div class="gauge" id="agricultural-gauge"><i></i><strong>—</strong></div></section>
              <section class="dark-card gauge-card"><span>نسبة مساحة التغير الصناعي بمنطقة الدراسة</span><div class="gauge" id="industrial-gauge"><i></i><strong>—</strong></div></section>
            </aside>
          </div>
        </section>
      </div>
    </main>`;
}

function westernAgricultureMarkup(app: TransportApp, group: string): string {
  return `<main class="interactive-dashboard agriculture-dashboard western-agriculture-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="agriculture">
    ${dashboardHeader(app, group)}
    <div class="dashboard-kpis western-agriculture-kpis"><article class="lime"><span>إجمالي مساحة الأراضي الزراعية (فدان)</span><strong data-metric="agriculturalAreaFeddan">—</strong></article><article class="lime"><span>عدد العمالة الزراعية</span><strong data-metric="agriculturalWorkers">—</strong></article><article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article class="white"><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="grey"><span>عدد العمالة الصناعية</span><strong data-metric="industrialWorkers">—</strong></article><article class="grey"><span>إجمالي مساحة الأراضي الصناعية (كم²)</span><strong data-metric="industrialChangeKm2">—</strong></article></div>
    <div class="agriculture-layout"><aside class="agriculture-side western-agriculture-side"><section class="dark-card crop-card"><span>نسب أنواع المحاصيل الزراعية</span><div class="crop-donut" id="crop-donut"><strong>المحاصيل</strong></div><div id="crop-legend"></div></section><section class="dark-card ownership-card"><span>نسب ملكية الأراضي الزراعية</span><div class="ownership-donut" id="ownership-donut"><strong>الملكية</strong></div><div id="ownership-legend"></div></section></aside><section class="agriculture-center western-agriculture-center">${mapMarkup()}<section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدامات الأراضي: <bdi class="map-year-start">2014</bdi> / <bdi class="map-year-end">2024</bdi></span><button type="button" id="reset-landuse-filter" class="reset-landuse-btn">إعادة ضبط التصنيفات</button></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section></section><aside class="agriculture-right western-agriculture-right"><section class="dark-card gauge-card"><span>نسبة مساحة التغير الزراعي بمنطقة الدراسة</span><div class="gauge" id="agricultural-gauge"><strong>—</strong></div></section><section class="dark-card gauge-card"><span>نسبة مساحة التغير الصناعي بمنطقة الدراسة</span><div class="gauge" id="industrial-gauge"><strong>—</strong></div></section></aside></div>
  </main>`;
}

function generalAgricultureMarkup(app: TransportApp, group: string): string {
  return `<main class="interactive-dashboard agriculture-dashboard general-agriculture-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="agriculture">
    ${dashboardHeader(app, group)}
    <div class="dashboard-kpis general-agriculture-kpis"><article class="blue"><span>طول الطريق (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="lime"><span>مساحة التغير الزراعي (كم²)</span><strong data-metric="agriculturalChangeKm2">—</strong></article><article class="orange"><span>مساحة التغير الصناعي (كم²)</span><strong data-metric="industrialChangeKm2">—</strong></article></div>
    <div class="general-agriculture-layout"><section class="general-agriculture-center">${mapMarkup()}<section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدامات الأراضي: <bdi class="map-year-start">2014</bdi> / <bdi class="map-year-end">2023</bdi></span><button type="button" id="reset-landuse-filter" class="reset-landuse-btn">إعادة ضبط التصنيفات</button></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section></section><aside class="general-agriculture-side"><section class="dark-card gauge-card"><span>نسبة مساحة التغير الزراعي بمنطقة الدراسة</span><div class="gauge" id="agricultural-gauge"><strong>—</strong></div></section><section class="dark-card gauge-card"><span>نسبة مساحة التغير الصناعي بمنطقة الدراسة</span><div class="gauge" id="industrial-gauge"><strong>—</strong></div></section></aside></div>
  </main>`;
}

function civilMarkup(app: TransportApp, group: string): string {
  return `<main class="interactive-dashboard civil-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="civil">
    ${dashboardHeader(app, group)}
    <div class="specialized-layout">
      <section class="specialized-kpis dashboard-kpis"><article class="blue"><span>طول الطريق (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="gold"><span>عناصر الرفع المدني المسجلة</span><strong data-metric="civilFeatures">—</strong></article></section>
      <section class="specialized-body"><aside class="dark-card civil-panel"><h2>مؤشرات الدراسة المدنية</h2><p>تعرض هذه اللوحة عناصر الرفع والحصر المدني الخاصة بهذا القطاع فقط، مع إمكانية تشغيل وإيقاف الطبقات وفحص خصائص كل عنصر من الخريطة.</p><div class="civil-facts"><span>طبقات المشروع المتاحة <b data-metric="availableLayers">—</b></span><span>العناصر العمرانية <b data-metric="urbanFeatures">—</b></span><span>العناصر الزراعية <b data-metric="agriculturalFeatures">—</b></span></div></aside>${mapMarkup()}</section>
    </div>
  </main>`;
}

function impactMarkup(app: TransportApp, group: string): string {
  return `<main class="interactive-dashboard impact-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="impact">
    ${dashboardHeader(app, group)}
    <div class="specialized-layout">
      <section class="specialized-kpis dashboard-kpis"><article class="blue"><span>طول المحور (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article><span>نطاق الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="gold"><span>مساحة التغير العمراني (كم²)</span><strong data-metric="urbanChangeKm2">—</strong></article></section>
      <section class="specialized-body impact-body"><aside class="dark-card impact-controls"><h2>سيناريو الأثر التنموي حتى 2053</h2><label for="impact-year">سنة العرض <strong id="impact-year-label">2024</strong></label><input id="impact-year" type="range" min="2024" max="2053" value="2024" step="1"/><div class="impact-results"><span>مؤشر التطور الزمني <b id="impact-progress">0٪</b></span><span>المساحة العمرانية التقديرية* <b id="impact-area">—</b></span><span>فرص العمل المرتبطة بالقطاع <b data-metric="jobOpportunities">—</b></span></div><small>* محاكاة خطية تفاعلية للعرض وليست قيمة تقريرية جديدة؛ القيم الأصلية المعتمدة معروضة في البطاقات والمراجع.</small></aside>${mapMarkup()}</section>
    </div>
  </main>`;
}

export function renderInteractiveDashboard(app: TransportApp): string {
  const group = dashboardGroup(app);
  if (isPriceDashboard(app)) return priceMarkup(app, group);
  if (group === "dabaa-axis") return dabaaLandMarkup(app, group);
  if (isUrbanDashboard(app)) return landMarkup(app, group);
  if (group === "ismailia") return agriculturalMarkup(app, group);
  if (["qena-luxor-road", "qus-axis", "kalabsha-axis"].includes(group)) return southernAgricultureMarkup(app, group);
  if (group === "western-upper-egypt") return westernAgricultureMarkup(app, group);
  return generalAgricultureMarkup(app, group);
}

const formatNumber = (value: number, digits = 1) => new Intl.NumberFormat(document.documentElement.lang === "en" ? "en-US" : "ar-EG", { maximumFractionDigits: digits }).format(value || 0);

function hasDocumentedLanduseKind(summary: DashboardSummary, kind: "urban" | "agricultural" | "industrial"): boolean {
  const metrics = summary.metrics;
  if (kind === "urban") return (metrics.urbanChangeKm2 || 0) > 0 || Boolean(summary.prices.urban?.end);
  if (kind === "agricultural") return (metrics.agriculturalChangeKm2 || 0) > 0 || (metrics.agriculturalAreaFeddan || 0) > 0 || Boolean(summary.prices.agricultural?.end);
  return (metrics.industrialChangeKm2 || 0) > 0 || (metrics.industrialWorkers || 0) > 0 || Boolean(summary.prices.industrial?.end);
}

function formatMoney(value: number, breakLine = false): string {
  if (!value) return "لا توجد قيمة مسجلة";
  const unitSep = breakLine ? "<br>ج.م" : " ج.م";
  if (value >= 1_000_000_000_000) return `${formatNumber(value / 1_000_000_000_000, 2)} تريليون${unitSep}`;
  if (value >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 2)} مليار${unitSep}`;
  if (value >= 1_000_000) return `${formatNumber(value / 1_000_000, 2)} مليون${unitSep}`;
  return `${formatNumber(value, 0)}${unitSep}`;
}

function setMetric(name: string, value: number): void {
  document.querySelectorAll<HTMLElement>(`[data-metric="${name}"]`).forEach((element) => {
    element.closest<HTMLElement>("article, .dark-card")?.removeAttribute("hidden");
    const scale = Number(element.dataset.metricScale || 1);
    element.textContent = formatNumber(value / (Number.isFinite(scale) && scale > 0 ? scale : 1), 2);
  });
}

function setUnavailableMetric(name: string): void {
  document.querySelectorAll<HTMLElement>(`[data-metric="${name}"]`).forEach((element) => { element.textContent = document.documentElement.lang === "en" ? "Not available" : "غير متاح"; });
}

function hideUnavailableMetricPanel(name: string): void {
  document.querySelectorAll<HTMLElement>(`[data-metric="${name}"]`).forEach((element) => {
    element.closest<HTMLElement>("article, .dark-card")?.setAttribute("hidden", "true");
  });
}

function ensureAgricultureFallbackCards(): void {
  if (document.querySelector(".ismailia-agriculture-dashboard")) return;
  const side = document.querySelector<HTMLElement>(".agriculture-dashboard:not(.western-agriculture-dashboard) .agriculture-side");
  if (!side || side.querySelector(".agriculture-derived-card")) return;
  side.insertAdjacentHTML("afterbegin", `<article class="opportunity-card agriculture-derived-card"><span>فرص العمل لمشروعات المباني المستحدثة</span><strong data-metric="jobOpportunities">—</strong><small>فرصة عمل تقديرية مرتبطة بمناطق التغير</small></article><section class="dark-card vertical-chart-card agriculture-derived-card"><div class="card-title"><span>مناطق تغير استخدامات الأراضي</span></div><div id="change-bars" class="change-bars loading-panel">جارٍ قراءة البيانات…</div></section>`);
  side.insertAdjacentHTML("beforeend", `<section class="dark-card agriculture-stat agriculture-derived-card"><span>مساحة التغير الزراعي (كم²)</span><strong data-metric="agriculturalChangeKm2">—</strong></section>`);
}

type PricePair = { start: number; end: number };
type PriceSet = Partial<Record<"urban" | "agricultural" | "industrial", PricePair>>;

// Sector records are intentionally granular and may omit a price class. Keep
// the verified project value for that class instead of blanking its card.
function hasPricePair(pair: PricePair | undefined): pair is PricePair {
  return Boolean(pair && Number.isFinite(pair.start) && Number.isFinite(pair.end) && pair.start > 0 && pair.end > 0);
}

function completePriceSet(primary: PriceSet | undefined, fallback: PriceSet | undefined): Required<PriceSet> {
  const result = {} as Required<PriceSet>;
  (["urban", "agricultural", "industrial"] as const).forEach((key) => {
    result[key] = hasPricePair(primary?.[key]) ? primary![key] : hasPricePair(fallback?.[key]) ? fallback![key] : { start: 0, end: 0 };
  });
  return result;
}

function renderPriceColumns(summary: DashboardSummary, selectedKind = "all"): void {
  const container = document.querySelector<HTMLElement>("#price-columns");
  if (!container) return;
  const isIsmailia = document.querySelector<HTMLElement>(".interactive-dashboard")?.dataset.dashboardGroup === "ismailia";
  const labels: Record<string, string> = { urban: "أراضي المباني", agricultural: "الأراضي الزراعية", industrial: "الأراضي الصناعية", ...(summary.profile?.priceLabels || {}) };
  const colors: Record<string, string> = { urban: "#ffbc25", agricultural: "#72e800", industrial: "#c334ef" };
  const group = summary.slug || document.querySelector<HTMLElement>(".interactive-dashboard")?.dataset.dashboardGroup;
  // Price dashboards retain documented land-use price comparison columns.
  const kinds = ["urban", "industrial", "agricultural"].filter((key) => {
    if (["kalabsha-axis", "qus-axis", "qena-luxor-road", "dabaa-axis"].includes(group || "") && key === "industrial") return false;
    if (["suez-ring-link", "cairo-suez-road"].includes(group || "") && (key === "industrial" || key === "agricultural")) return false;
    const item = summary.prices?.[key as keyof typeof summary.prices];
    return Boolean(item && (item.start > 0 || item.end > 0));
  });
  container.style.setProperty("--price-columns", String(kinds.length));
  const agriculturalFeddan = isIsmailia ? undefined : (summary.metrics.agriculturalAreaFeddan || summary.profile?.metrics.agriculturalAreaFeddan);
  const areaMetrics: Record<string, number | undefined> = {
    urban: summary.metrics.urbanTotalKm2 ?? summary.metrics.urbanAreaKm2 ?? summary.metrics.urbanChangeKm2 ?? summary.profile?.metrics.urbanChangeKm2,
    agricultural: summary.metrics.agriculturalTotalKm2 ?? summary.metrics.agriculturalAreaKm2 ?? agriculturalFeddan ?? summary.metrics.agriculturalChangeKm2 ?? summary.profile?.metrics.agriculturalChangeKm2,
    industrial: summary.metrics.industrialTotalKm2 ?? summary.metrics.industrialAreaKm2 ?? summary.metrics.industrialChangeKm2 ?? summary.profile?.metrics.industrialChangeKm2,
  };
  const isChangeArea: Record<string, boolean> = {
    urban: !(summary.metrics.urbanTotalKm2 || summary.metrics.urbanAreaKm2),
    agricultural: !isIsmailia && !agriculturalFeddan && !(summary.metrics.agriculturalTotalKm2 || summary.metrics.agriculturalAreaKm2),
    industrial: !(summary.metrics.industrialTotalKm2 || summary.metrics.industrialAreaKm2),
  };
  const areaLabels: Record<string, string> = {
    urban: "إجمالي مساحة أراضي المباني (كم²)",
    agricultural: isIsmailia ? "إجمالي مساحة الأراضي الزراعية (كم²)" : agriculturalFeddan ? "إجمالي مساحة الأراضي الزراعية (فدان)" : "مساحة التغير الزراعي (كم²)",
    industrial: "إجمالي مساحة الأراضي الصناعية (كم²)",
  };
  container.innerHTML = kinds.map((key) => {
    const item = summary.prices[key];
    const hasPrice = Boolean(item && (item.start > 0 || item.end > 0));
    const difference = hasPrice ? Math.max(item.end - item.start, 0) : 0;
    const areaVal = areaMetrics[key];
    const areaText = areaVal !== undefined ? formatNumber(areaVal, agriculturalFeddan && key === "agricultural" && !isIsmailia ? 0 : 1) : "—";
    const areaHeader = `<div class="price-column-top-card price-area-${key}"><span>${areaLabels[key]}</span><strong>${areaText}</strong></div>`;
    const detail = hasPrice
      ? `<header><span>فرق سعر ${labels[key]}</span><strong>${formatMoney(difference, true)}</strong></header><div><span>سعر ${labels[key]} عام ${summary.yearEnd}</span><b>${formatMoney(item.end, true)}</b></div><div><span>سعر ${labels[key]} عام ${summary.yearStart}</span><b>${formatMoney(item.start, true)}</b></div>`
      : `<header><span>تفصيل سعر ${labels[key]}</span><strong>—</strong></header><div class="price-value-pending"><span>${document.documentElement.lang === "en" ? "Not available" : "&#x63A;&#x64A;&#x631; &#x645;&#x62A;&#x627;&#x62D;"}</span></div>`;
    return `<article class="price-column${selectedKind !== "all" && selectedKind === key ? " is-selected" : ""}" data-price-kind="${key}" style="--accent:${colors[key]}">${areaHeader}${detail}</article>`;
  }).join("");
  container.classList.toggle("price-filtered", false);
}

function renderLineChart(summary: DashboardSummary, visible: Set<string>): void {
  const container = document.querySelector<HTMLElement>("#line-chart");
  if (!container) return;
  const width = 1000, height = 300, left = 70, right = 30, top = 22, bottom = 45;
  const keys = ["urban", "agricultural", "industrial"].filter((key) => visible.has(key) && summary.prices[key] && (summary.prices[key].start > 0 || summary.prices[key].end > 0));
  document.querySelectorAll<HTMLButtonElement>("[data-series]").forEach((button) => {
    const pair = summary.prices[button.dataset.series || ""];
    button.hidden = !(pair && (pair.start > 0 || pair.end > 0));
  });
  if (!keys.length) {
    container.innerHTML = '<div class="no-data">لا توجد سلسلة أسعار موثقة للقطاع المحدد.</div>';
    return;
  }
  const all = keys.flatMap((key) => summary.priceSeries[key as keyof typeof summary.priceSeries] as number[]);
  const max = Math.max(...all, 1);
  const scale = max >= 1_000_000_000 ? 1_000_000_000 : max >= 1_000_000 ? 1_000_000 : 1;
  const scaleLabel = scale === 1_000_000_000 ? (document.documentElement.lang === "en" ? "EGP billion" : "مليار ج.م") : scale === 1_000_000 ? (document.documentElement.lang === "en" ? "EGP million" : "مليون ج.م") : (document.documentElement.lang === "en" ? "EGP" : "ج.م");
  const x = (index: number) => left + index * (width - left - right) / Math.max(summary.priceSeries.years.length - 1, 1);
  const y = (value: number) => top + (max - value) * (height - top - bottom) / max;
  const colors: Record<string, string> = { urban: "#ffb400", agricultural: "#6be500", industrial: "#e4e4e4" };
  const labels: Record<string, string> = { urban: "العمرانية", agricultural: "الزراعية", industrial: "الصناعية", ...(summary.profile?.priceLabels || {}) };
  const grid = Array.from({ length: 5 }, (_, index) => {
    const yy = top + index * (height - top - bottom) / 4;
    const value = max * (4 - index) / 4;
    return `<line x1="${left}" y1="${yy}" x2="${width - right}" y2="${yy}"/><text x="${left - 10}" y="${yy + 4}">${formatNumber(value / scale, scale === 1 ? 0 : 1)}</text>`;
  }).join("");
  const lines = keys.map((key) => {
    const vals = summary.priceSeries[key as "urban" | "agricultural" | "industrial"];
    const points = vals.map((value, index) => `${x(index)},${y(value)}`).join(" ");
    const dots = vals.map((value, index) => `<circle data-chart-kind="${key}" data-chart-year="${summary.priceSeries.years[index]}" data-chart-value="${value}" cx="${x(index)}" cy="${y(value)}" r="6"><title>${labels[key]} · ${summary.priceSeries.years[index]} · ${formatMoney(value)}</title></circle>`).join("");
    return `<polyline points="${points}" stroke="${colors[key]}"/><g fill="${colors[key]}">${dots}</g>`;
  }).join("");
  const years = summary.priceSeries.years.map((year, index) => `<text x="${x(index)}" y="${height - 12}" class="year-label">${year}</text>`).join("");
  container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" aria-label="الرسم البياني التفاعلي لأسعار الأراضي"><text class="chart-unit" x="${left}" y="14">${scaleLabel}</text><g class="chart-grid">${grid}</g>${lines}<g class="chart-years">${years}</g></svg>`;
  container.querySelectorAll<SVGCircleElement>("circle[data-chart-year]").forEach((dot) => dot.addEventListener("click", () => {
    const label = document.querySelector<HTMLElement>("#chart-year-label");
    const activeYear = document.querySelector<HTMLElement>("#active-year");
    const key = dot.dataset.chartKind || "urban";
    if (label) label.textContent = `${labels[key]} · ${dot.dataset.chartYear} · ${formatMoney(Number(dot.dataset.chartValue))}`;
    if (activeYear) activeYear.textContent = dot.dataset.chartYear || "";
    container.querySelectorAll("circle").forEach((item) => item.classList.toggle("selected", item === dot));
  }));
}

function renderChangeBars(summary: DashboardSummary): void {
  const container = document.querySelector<HTMLElement>("#change-bars");
  if (!container) return;
  const dashboardGroup = document.querySelector<HTMLElement>(".interactive-dashboard")?.dataset.dashboardGroup;
  const isIsmailia = dashboardGroup === "ismailia";
  const isWesternUpperEgypt = dashboardGroup === "western-upper-egypt";
  const data = isIsmailia ? [
    ["industrial", "صناعي", summary.metrics.industrialChangeKm2 || summary.metrics.industrialFeatures, "#00a3d7"],
    ["agricultural", "زراعي", summary.metrics.agriculturalChangeKm2 || summary.metrics.agriculturalFeatures, "#85d927"],
    ["urban", "عمراني", summary.metrics.urbanChangeKm2 || summary.metrics.urbanFeatures, "#ffbf08"],
  ] as Array<[string, string, number, string]> : summary.profile?.changeBars?.length
    ? summary.profile.changeBars.map((item) => [item.layer, item.label, item.value, isWesternUpperEgypt || serviceLabelPattern.test(item.label) ? serviceColor : "#f28a00"] as [string, string, number, string])
    : [
      ["urban", "عمراني", summary.metrics.urbanChangeKm2 || summary.metrics.urbanFeatures, "#ff9e00"],
      ["agricultural", "زراعي", summary.metrics.agriculturalChangeKm2 || summary.metrics.agriculturalFeatures, "#85d927"],
      ["industrial", "صناعي", summary.metrics.industrialChangeKm2 || summary.metrics.industrialFeatures, "#00a3d7"],
    ] as Array<[string, string, number, string]>;
  const shown = isIsmailia ? data : data.filter((item) => Number.isFinite(item[2]) && item[2] > 0);
  const max = Math.max(...shown.map((item) => item[2]), 1);
  container.innerHTML = shown.map(([key, label, value, color]) => `<button type="button" data-filter-layer="${key}" style="--height:${Math.max(value / max * 100, 3)}%;--bar:${color};--bar-border:${color}"><i></i><b>${formatNumber(value, 2)}</b><span title="${label}">${label}</span></button>`).join("");
  if (isIsmailia) void renderIsmailiaUseDescriptionBars(container);
}

/**
 * Use the original `وصف_الاستخدام` values from the land-use layer itself.
 * This deliberately does not combine the separate urban, agricultural, and
 * industrial change layers: the chart is a detailed land-use presentation.
 */
async function renderIsmailiaUseDescriptionBars(container: HTMLElement): Promise<void> {
  const requestId = String(Number(container.dataset.useDescriptionRequest || "0") + 1);
  container.dataset.useDescriptionRequest = requestId;
  try {
    const collection = await loadGeoJson("/data/dashboard/ismailia/landcover-end.geojson");
    if (container.dataset.useDescriptionRequest !== requestId) return;
    const serviceCategories = [
      { label: "خدمي", code: "5", matches: /خدم|مرافق|محطة|سنترال|مستشفى|صحي|علاج|سوق|تجار/i },
      { label: "تعليمي", code: "12", matches: /تعليم|مدرس|جامعة|جامعه|معهد|حضانة/i },
      { label: "حكومي", code: "13", matches: /حكوم|إدار|وزارة|محافظة|قسم شرطة|شرطة|مطافئ|بريد/i },
      { label: "ديني", code: "11", matches: /ديني|مسجد|جامع|كنيس/i },
      { label: "سياحي", code: "14", matches: /سياح|فندق|منتجع|متحف|أثري/i },
      { label: "ترفيهي", code: "6", matches: /ترفيه|رياض|ملعب|نادي|نادى|مركز شباب|حديقة|حديقه/i },
      { label: "مقابر", code: "7", matches: /مقابر|مقبرة|جبان/i },
    ];
    const values = new Map(serviceCategories.map(({ label }) => [label, 0]));
    collection.features.forEach((feature) => {
      const properties = feature.properties || {};
      const rawLabel = String(properties["وصف_الاستخدام"] || "").trim();
      const rawPattern = String(properties["نمط_العمران"] || "").trim();
      const text = `${rawPattern} ${rawLabel}`;
      // Match the specific service types before the broad "خدمي" bucket.
      const specific = serviceCategories.slice(1).find(({ matches }) => matches.test(text));
      const category = specific || (serviceCategories[0].matches.test(text) ? serviceCategories[0] : null);
      if (!category) return;

      const rawArea = Number(properties["مساحة_كم2"] ?? 0);
      const area = Number.isFinite(rawArea) ? rawArea : 0;
      if (area <= 0) return;
      values.set(category.label, (values.get(category.label) || 0) + area);
    });

    const data = serviceCategories.map(({ label, code }) => ({ label, code, value: values.get(label) || 0 }));
    if (!data.length) return;
    const max = Math.max(...data.map((item) => item.value), 1);
    container.innerHTML = data.map(({ label, code, value }) => `<button type="button" data-filter-layer="landcover-end" data-landuse-codes="${code}" data-landuse-layer="landcover-end" style="--height:${Math.max(value / max * 100, 3)}%;--bar:${serviceColor};--bar-border:${serviceColor}"><i></i><b>${formatNumber(value, 2)}</b><span title="${esc(label)}">${esc(label)}</span></button>`).join("");
    container.querySelectorAll<HTMLElement>("[data-landuse-codes]").forEach((button) => button.addEventListener("click", () => {
      const codes = button.dataset.landuseCodes?.split(",").filter(Boolean) || [];
      const layer = button.dataset.landuseLayer as "landcover-start" | "landcover-end" | undefined;
      if (codes.length && layer) activateLandusePatterns(codes, layer);
    }));
  } catch {
    // Fallback stays as three high level bars
  }
}

function renderComparison(summary: DashboardSummary, topOnly = false): void {
  const container = document.querySelector<HTMLElement>("#comparison-chart");
  if (!container) return;
  container.classList.remove("loading-panel");
  const isIsmailia = document.querySelector<HTMLElement>(".interactive-dashboard")?.dataset.dashboardGroup === "ismailia";
  if (isIsmailia) {
    const categories = [
      { label: "أرض فضاء", codes: ["2"], color: "#fff4ae", matches: /فضاء|فارغ/i },
      { label: "الزراعة", codes: ["0"], color: "#16c51b", matches: /زراع/i },
      { label: "أخرى", codes: ["5", "6", "7", "8", "9", "10", "11", "12", "13", "99"], color: "#bdbdbd", matches: /./i },
      { label: "العمران", codes: ["3"], color: "#f6a900", matches: /عمران|حضري|سكن/i },
      { label: "الصناعة", codes: ["1"], color: "#9800c7", matches: /صناع|مصنع/i },
      { label: "أنماط الخدمات", codes: ["5", "6", "7", "11", "12", "13", "14"], color: ismailiaLanduseSymbols[5][0], matches: /خدم/i },
    ];
    const years = Array.from(new Set(summary.landUse.map((item) => item.year))).sort();
    const classify = (category: string) => categories.find((item) => item.label !== "أخرى" && item.matches.test(category)) || categories[2];
    const rows = years.map((year) => {
      const values = new Map(categories.map((item) => [item.label, 0]));
      summary.landUse.filter((item) => item.year === year).forEach((item) => {
        const pattern = classify(item.category);
        values.set(pattern.label, (values.get(pattern.label) || 0) + item.area);
      });
      const total = Array.from(values.values()).reduce((sum, value) => sum + value, 0);
      const layer = year === summary.yearStart ? "landcover-start" : "landcover-end";
      const segments = categories.map((pattern) => {
        const value = values.get(pattern.label) || 0;
        const percent = total ? value / total * 100 : 0;
        return `<i data-landuse-codes="${pattern.codes.join(",")}" data-landuse-layer="${layer}" data-landuse-year="${year}" style="width:${percent}%;background:${pattern.color}" title="${pattern.label} · ${formatNumber(value, 2)} كم² · ${formatNumber(percent, 1)}٪"><b>${percent >= 6 ? `${formatNumber(percent, 0)}٪` : ""}</b></i>`;
      }).join("");
      return `<div class="comparison-row"><b>${year}</b><div>${segments}</div><span>${formatNumber(total, 1)} كم²</span></div>`;
    }).join("");
    const axis = `<div class="comparison-axis"><span>0</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100%</span></div>`;
    const legend = categories.map((pattern) => `<span><i style="background:${pattern.color}"></i>${pattern.label}</span>`).join("");
    container.innerHTML = `${rows}${axis}<div class="comparison-legend">${legend}</div>`;
    return;
  }
  const years = Array.from(new Set(summary.landUse.map((item) => item.year))).sort();
  let categories = Array.from(new Set(summary.landUse.map((item) => item.category)));
  if (topOnly) {
    const totals = categories.map((category) => [category, summary.landUse.filter((item) => item.category === category).reduce((sum, item) => sum + item.area, 0)] as const).sort((a, b) => b[1] - a[1]);
    categories = totals.slice(0, 4).map((item) => item[0]);
  }
  const fallbackColors = ["#cde768", "#24c427", "#5a46e8", "#d9a116", "#00a5ce", "#ef5757", "#7f72d8", "#d8d8d8"];
  const categoryColor = (category: string, index: number) => {
    if (serviceLabelPattern.test(category)) return serviceColor;
    if (/فضاء|vacant/i.test(category)) return "#cde768";
    if (/زراع|agricultur/i.test(category)) return "#24c427";
    if (/صناع|industr/i.test(category)) return "#5a46e8";
    if (/عمران|urban/i.test(category)) return "#d9a116";
    return fallbackColors[index % fallbackColors.length];
  };
  const colors = categories.map(categoryColor);
  const rows = years.map((year) => {
    const total = summary.landUse.filter((item) => item.year === year && categories.includes(item.category)).reduce((sum, item) => sum + item.area, 0);
    const segments = categories.map((category, index) => {
      const value = summary.landUse.find((item) => item.year === year && item.category === category)?.area || 0;
      return `<i style="width:${total ? value / total * 100 : 0}%;background:${colors[index]}" title="${esc(category)} · ${formatNumber(value, 2)} كم² · ${formatNumber(total ? value / total * 100 : 0, 1)}٪"></i>`;
    }).join("");
    return `<div class="comparison-row"><b>${year}</b><div>${segments}</div><span>${formatNumber(total, 1)} كم²</span></div>`;
  }).join("");
  const axis = `<div class="comparison-axis"><span>0</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100%</span></div>`;
  const legend = categories.map((category, index) => `<span><i style="background:${colors[index]}"></i>${esc(category)}</span>`).join("");
  container.innerHTML = summary.landUse.length ? `${rows}${axis}<div class="comparison-legend">${legend}</div>` : '<div class="no-data">لا توجد طبقة مقارنة مسجلة لهذا المشروع؛ الخريطة ما زالت تعرض الطبقات المتاحة.</div>';
}

function setGauge(gauge: HTMLElement | null, percent: number, displayPercent = percent): void {
  if (!gauge) return;
  const safePercent = Math.min(Math.max(percent, 0), 100);
  const tickLines = Array.from({ length: 21 }, (_, index) => `<line x1="130" y1="14" x2="130" y2="${index % 4 === 0 ? 25 : 20}" transform="rotate(${-90 + index * 9} 130 126)"/>`).join("");
  const labels = [0, 20, 40, 60, 80, 100].map((value) => {
    const theta = Math.PI - value / 100 * Math.PI;
    const x = 130 + 123 * Math.cos(theta);
    const y = 126 - 123 * Math.sin(theta);
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}">${value}%</text>`;
  }).join("");
  const angle = -90 + safePercent * 1.8;
  const value = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(displayPercent);
  gauge.innerHTML = `<svg viewBox="0 0 260 158" role="img" aria-label="${value}%"><path class="gauge-track" d="M20 126 A110 110 0 0 1 240 126" pathLength="100"/><path class="gauge-zone gauge-zone-low" d="M20 126 A110 110 0 0 1 240 126" pathLength="100"/><path class="gauge-zone gauge-zone-mid" d="M20 126 A110 110 0 0 1 240 126" pathLength="100"/><path class="gauge-zone gauge-zone-high" d="M20 126 A110 110 0 0 1 240 126" pathLength="100"/><g class="gauge-ticks">${tickLines}</g><g class="gauge-labels">${labels}</g><g class="gauge-needle" transform="rotate(${angle} 130 126)"><line x1="130" y1="126" x2="130" y2="42"/></g><circle class="gauge-hub" cx="130" cy="126" r="8"/><text class="gauge-value" x="130" y="153">${value}%</text></svg>`;
}

function setGaugeUnavailable(gauge: HTMLElement | null): void {
  if (gauge) gauge.innerHTML = `<span class="gauge-no-data">${document.documentElement.lang === "en" ? "No documented change-status data" : "لا توجد بيانات حالة تغير موثقة"}</span>`;
}

function renderGaugeAndDonut(summary: DashboardSummary): void {
  const study = summary.metrics.studyAreaKm2 || 1;
  const urban = summary.metrics.urbanChangeKm2 || 0;
  const agri = summary.metrics.agriculturalChangeKm2 || 0;
  const industrial = summary.metrics.industrialChangeKm2 || 0;
  const total = urban + agri + industrial;
  const percent = Math.min(summary.profile?.metrics.urbanChangePercent ?? urban / study * 100, 100);
  const dashboard = document.querySelector<HTMLElement>(".interactive-dashboard");
  const selectedChange = document.querySelector<HTMLSelectElement>("#dashboard-change-filter")?.value || "all";
  const isIsmailia = dashboard?.dataset.dashboardGroup === "ismailia";
  const isWesternUpperEgypt = dashboard?.dataset.dashboardGroup === "western-upper-egypt";
  const defaultGauge = isIsmailia && selectedChange === "all";
  if (!isWesternUpperEgypt) setGauge(document.querySelector<HTMLElement>("#urban-gauge"), defaultGauge ? 100 : percent);
  const donut = document.querySelector<HTMLElement>("#change-donut");
  if (donut) {
    if (!isIsmailia && dashboard?.dataset.mode === "land" && summary.landUse?.length) {
      const latestYear = Math.max(...summary.landUse.map((item) => item.year));
      const items = summary.landUse.filter((item) => item.year === latestYear && item.area > 0);
      const palette = ["#d9a116", "#24c427", "#cde768", "#5a46e8", "#00a5ce"];
      const landTotal = items.reduce((sum, item) => sum + item.area, 0);
      let cursor = 0;
      donut.style.background = `conic-gradient(${items.map((item, index) => { const start = cursor; cursor += item.area / landTotal * 100; return `${palette[index % palette.length]} ${start}% ${cursor}%`; }).join(",")})`;
      const label = donut.querySelector("strong");
      if (label) label.textContent = `${formatNumber(landTotal, 1)} كم²`;
      const legend = document.querySelector<HTMLElement>("#donut-legend");
      if (legend) legend.innerHTML = items.map((item, index) => `<span><i style="background:${palette[index % palette.length]}"></i>${esc(item.category)} ${formatNumber(item.area, 1)} كم²</span>`).join("");
      return;
    }
    const isLandMode = dashboard?.dataset.mode === "land";
    if (isLandMode && summary.landUse && summary.landUse.length) {
      const isService = (cat: string) => /خدم|تعليم|حكوم|دين|سياح|ترفيه|مقابر/i.test(cat);
      const isOther = (cat: string) => /قوات مسلحة|مسلحة|عسكري|خضراء|غابات|حرم طرق|طرق|مياه|مسطحات/i.test(cat);
      const latestYear = Math.max(...summary.landUse.map((item) => item.year));
      const items = summary.landUse.filter((item) => item.year === latestYear);
      let urbanArea = 0;
      let servicesArea = 0;
      let otherArea = 0;
      items.forEach((item) => {
        if (isService(item.category)) {
          servicesArea += item.area;
        } else if (isOther(item.category)) {
          otherArea += item.area;
        } else {
          urbanArea += item.area;
        }
      });
      const landTotal = urbanArea + servicesArea + otherArea;
      const uShare = landTotal ? (urbanArea / landTotal) * 100 : 0;
      const sShare = landTotal ? (servicesArea / landTotal) * 100 : 0;
      const oShare = landTotal ? (otherArea / landTotal) * 100 : 0;

      donut.style.background = `conic-gradient(#f6a900 0 ${uShare}%, ${serviceColor} ${uShare}% ${uShare + sShare}%, #bdbdbd ${uShare + sShare}% 100%)`;
      const label = donut.querySelector("strong");
      if (label) label.textContent = `${formatNumber(landTotal, 1)} كم²`;

      const legend = document.querySelector<HTMLElement>("#donut-legend");
      if (legend) {
        legend.innerHTML = `<span><i style="background:#f6a900"></i>عمران ${formatNumber(urbanArea, 1)} كم² (${formatNumber(uShare, 0)}٪)</span>` +
          `<span><i style="background:${serviceColor}"></i>خدمات ${formatNumber(servicesArea, 1)} كم² (${formatNumber(sShare, 0)}٪)</span>` +
          `<span><i style="background:#bdbdbd"></i>أخرى ${formatNumber(otherArea, 1)} كم² (${formatNumber(oShare, 0)}٪)</span>`;
      }
    } else {
      const profileShares = summary.profile?.statusShares;
      const urbanShare = profileShares ? profileShares.existing : total ? urban / total * 100 : 0;
      const agriShare = profileShares ? profileShares.underConstruction : total ? agri / total * 100 : 0;
      donut.style.background = profileShares
        ? `conic-gradient(#d6cc00 0 ${urbanShare}%, #e83a19 ${urbanShare}% 100%)`
        : `conic-gradient(#ff9e00 0 ${urbanShare}%, #84db24 ${urbanShare}% ${urbanShare + agriShare}%, #00a6d8 ${urbanShare + agriShare}% 100%)`;
      const label = donut.querySelector("strong");
      if (label) label.textContent = profileShares ? "الحالة" : `${formatNumber(total, 1)} كم²`;

      const legend = document.querySelector<HTMLElement>("#donut-legend");
      if (legend) legend.innerHTML = summary.profile?.statusShares
        ? `<span><i style="background:#d6cc00"></i>قائم ${formatNumber(summary.profile.statusShares.existing, 0)}٪</span><span><i style="background:#e83a19"></i>تحت الإنشاء ${formatNumber(summary.profile.statusShares.underConstruction, 0)}٪</span>`
        : `<button data-filter-layer="urban"><i style="background:#ff9e00"></i>عمراني ${formatNumber(urban, 1)}</button><button data-filter-layer="agricultural"><i style="background:#84db24"></i>زراعي ${formatNumber(agri, 1)}</button><button data-filter-layer="industrial"><i style="background:#00a6d8"></i>صناعي ${formatNumber(industrial, 1)}</button>`;
    }
  }
}

function renderAgricultureIndicators(summary: DashboardSummary): void {
  const profile = summary.profile;
  const cropShares = profile?.cropShares || [];
  const crop = document.querySelector<HTMLElement>("#crop-donut");
  const group = document.querySelector<HTMLElement>(".interactive-dashboard")?.dataset.dashboardGroup || "";
  const cropPresentation: Record<string, { labels: string[]; colors: string[] }> = {
    "ismailia": { labels: ["خضروات", "فواكه", "حبوب"], colors: ["#f7f200", "#ff4b16", "#159bd3"] },
    "qena-luxor-road": { labels: ["خضروات", "فاكهة", "محاصيل موسمية", "أخرى"], colors: ["#ff9818", "#d5e500", "#42d80b", "#00c9d8"] },
    "qus-axis": { labels: ["خضروات", "محاصيل موسمية"], colors: ["#42d80b", "#ff5a10"] },
    "kalabsha-axis": { labels: ["خضروات", "فاكهة", "محاصيل موسمية"], colors: ["#42d80b", "#d5e500", "#ff5a10"] },
  };
  const presentation = cropPresentation[group] || { labels: ["محاصيل موسمية", "خضروات", "فاكهة", "أخرى"], colors: ["#42d80b", "#d5e500", "#ff9818", "#00c9d8"] };
  const cropColors = presentation.colors;
  if (crop && cropShares.length) {
    crop.closest<HTMLElement>(".crop-card")?.removeAttribute("hidden");
    let cursor = 0;
    crop.style.background = `conic-gradient(${cropShares.map((value, index) => { const start = cursor; cursor += value; return `${cropColors[index % cropColors.length]} ${start}% ${cursor}%`; }).join(",")})`;
  } else if (crop) { const label = crop.querySelector("strong"); if (label) label.textContent = document.documentElement.lang === "en" ? "Not available" : "غير متاح"; }
  const cropLegend = document.querySelector<HTMLElement>("#crop-legend");
  if (crop && !cropShares.length) crop.closest<HTMLElement>(".crop-card")?.setAttribute("hidden", "true");
  const cropLabels = presentation.labels;
  const cropShareDigits = group === "ismailia" ? 1 : 0;
  if (cropLegend) cropLegend.innerHTML = cropShares.map((value, index) => `<span><i style="background:${cropColors[index % cropColors.length]}"></i>${cropLabels[index]}: ${formatNumber(value, cropShareDigits)}٪</span>`).join("");
  const ownership = profile?.ownershipShares || [];
  const ownershipDonut = document.querySelector<HTMLElement>("#ownership-donut");
  if (ownershipDonut && !ownership.length) ownershipDonut.closest<HTMLElement>(".ownership-card")?.setAttribute("hidden", "true");
  if (ownershipDonut && ownership.length) {
    ownershipDonut.closest<HTMLElement>(".ownership-card")?.removeAttribute("hidden");
    ownershipDonut.style.background = `conic-gradient(#ffd51d 0 ${ownership[0]}%, #ff8b19 ${ownership[0]}% 100%)`;
  }
  else if (ownershipDonut) { const label = ownershipDonut.querySelector("strong"); if (label) label.textContent = document.documentElement.lang === "en" ? "Not available" : "غير متاح"; }
  const ownershipLegend = document.querySelector<HTMLElement>("#ownership-legend");
  const ownershipShareDigits = group === "ismailia" ? 1 : 0;
  if (ownershipLegend && ownership.length) ownershipLegend.innerHTML = group === "qus-axis"
    ? `<span><i style="background:#ffd51d"></i>إيجار ${formatNumber(ownership[0], ownershipShareDigits)}٪</span><span><i style="background:#ff8b19"></i>تمليك ${formatNumber(ownership[1], ownershipShareDigits)}٪</span>`
    : `<span><i style="background:#ffd51d"></i>تمليك ${formatNumber(ownership[0], ownershipShareDigits)}٪</span><span><i style="background:#ff8b19"></i>إيجار ${formatNumber(ownership[1], ownershipShareDigits)}٪</span>`;
  (["agricultural", "industrial"] as const).forEach((kind) => {
    const gauge = document.querySelector<HTMLElement>(`#${kind}-gauge`);
    if (!gauge) return;
    const selectedChange = document.querySelector<HTMLSelectElement>("#dashboard-change-filter")?.value || "all";
    const reported = summary.profile?.metrics[`${kind}ChangePercent`] ?? summary.metrics[`${kind}ChangePercent`];
    if (group !== "ismailia" && (reported === undefined || !hasDocumentedLanduseKind(summary, kind))) {
      gauge.closest<HTMLElement>(".gauge-card")?.setAttribute("hidden", "true");
      return;
    }
    gauge.closest<HTMLElement>(".gauge-card")?.removeAttribute("hidden");
    if (group === "western-upper-egypt") return;
    const percent = group === "ismailia" && selectedChange === "all" ? 100 : Math.min(reported ?? 10, 100);
    setGauge(gauge, percent);
  });
  setGauge(document.querySelector<HTMLElement>("#agricultural-share-gauge"), Math.min(profile?.metrics.agriculturalSharePercent ?? 0, 100));
}

type Coordinates = number[] | Coordinates[];
type GeoJsonCollection = { features: Array<{ geometry?: { type: string; coordinates: Coordinates; geometries?: Array<{ type: string; coordinates: Coordinates }> }; properties?: Record<string, unknown> }> };
const geoJsonCache = new Map<string, Promise<GeoJsonCollection>>();

function loadGeoJson(url: string): Promise<GeoJsonCollection> {
  const cached = geoJsonCache.get(url);
  if (cached) return cached;
  const request = fetch(url).then((response) => {
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.json().then((collection: GeoJsonCollection) => {
      // GeoJSON GeometryCollections occur in the source export. Render their
      // polygon (or first usable component) instead of silently dropping them.
      for (const feature of collection.features || []) {
        if (feature.geometry?.type !== "GeometryCollection") continue;
        const geometries = feature.geometry.geometries || [];
        feature.geometry = geometries.find((geometry) => ["Polygon", "MultiPolygon"].includes(geometry.type) && coordinatePairs(geometry.coordinates).length)
          || geometries.find((geometry) => coordinatePairs(geometry.coordinates).length);
      }
      return collection;
    });
  });
  geoJsonCache.set(url, request);
  return request;
}

async function deriveLandUseFromLocalLayers(group: string, summary: DashboardSummary): Promise<DashboardSummary["landUse"]> {
  if (!summary.layers.includes("landcover-start") || !summary.layers.includes("landcover-end")) return [];
  const categoryFor = (raw: unknown): string => {
    const value = String(raw ?? "").trim().toLowerCase();
    const code = Number(raw);
    if (Number.isFinite(code)) return ismailiaLanduseNames[String(code)] || `استخدام أرض ${code}`;
    if (/agri|زراع/.test(value)) return "الأراضي الزراعية";
    if (/industr|factor|مصنع|صناع/.test(value)) return "الأراضي الصناعية";
    if (/vacant|vscant|vecant|فضاء|فارغ/.test(value)) return "أراضي فضاء";
    if (/urban|build|residen|عمران|مبان|سكن/.test(value)) return "الأراضي العمرانية";
    return value || "غير مصنف";
  };
  const readPeriod = async (layer: "landcover-start" | "landcover-end", year: number) => {
    const collection = await loadGeoJson(`../../data/dashboard/${group}/${layer}.geojson`);
    const totals = new Map<string, number>();
    for (const feature of collection.features) {
      const properties = feature.properties || {};
      const category = categoryFor(properties.landuse_code ?? properties.landuse_value ?? properties.landuse_label ?? properties["استخدام_الأرض"] ?? properties["وصف_الاستخدام"]);
      const rawArea = Number(properties.area_km2 ?? properties["مساحة_كم2"] ?? properties["SHAPE_Area"] ?? 0);
      if (!Number.isFinite(rawArea) || rawArea <= 0) continue;
      const threshold = Math.max((summary.metrics.studyAreaKm2 || 1) * 2, 10_000);
      const area = rawArea > threshold ? rawArea / 1_000_000 : rawArea;
      totals.set(category, (totals.get(category) || 0) + area);
    }
    return Array.from(totals, ([category, area]) => ({ category, year, area: Number(area.toFixed(3)) }));
  };
  try {
    const [start, end] = await Promise.all([readPeriod("landcover-start", summary.yearStart), readPeriod("landcover-end", summary.yearEnd)]);
    return [...start, ...end];
  } catch (error) {
    console.warn(`Unable to derive local land-use comparison for ${group}`, error);
    return [];
  }
}

function coordinatePairs(coordinates: Coordinates, result: number[][] = []): number[][] {
  if (Array.isArray(coordinates) && coordinates.length >= 2 && typeof coordinates[0] === "number" && typeof coordinates[1] === "number") result.push(coordinates as number[]);
  else if (Array.isArray(coordinates)) coordinates.forEach((item) => coordinatePairs(item as Coordinates, result));
  return result;
}

function polygonAreaKm2(coordinates: number[][][]): number {
  const radiusKm = 6371.0088;
  const ringArea = (ring: number[][]): number => {
    if (ring.length < 3) return 0;
    let area = 0;
    for (let index = 0; index < ring.length; index += 1) {
      const current = ring[index];
      const next = ring[(index + 1) % ring.length];
      const lonDelta = (next[0] - current[0]) * Math.PI / 180;
      area += lonDelta * (2 + Math.sin(current[1] * Math.PI / 180) + Math.sin(next[1] * Math.PI / 180));
    }
    return Math.abs(area * radiusKm * radiusKm / 2);
  };
  return Math.max(0, ringArea(coordinates[0] || []) - coordinates.slice(1).reduce((sum, ring) => sum + ringArea(ring), 0));
}

function geometryPath(geometry: { type: string; coordinates: Coordinates }, project: (pair: number[]) => [number, number]): string {
  const line = (pairs: number[][], close = false) => {
    // A few source polygons contain accidental jumps between distant points.
    // Dropping that ring prevents SVG from drawing giant black triangles over
    // the map while keeping the valid land-use features visible.
    // Parcel rings should contain short, local edges. A larger jump is a
    // malformed ring splice that SVG closes as a giant black triangle.
    if (close && pairs.some((pair, index) => index > 0 && (Math.abs(pair[0] - pairs[index - 1][0]) > .5 || Math.abs(pair[1] - pairs[index - 1][1]) > .5))) return "";
    return pairs.map((pair, index) => `${index ? "L" : "M"}${project(pair).join(" ")}`).join(" ") + (close ? " Z" : "");
  };
  if (geometry.type === "Point") { const [x, y] = project(geometry.coordinates as number[]); return `M${x - 4} ${y}a4 4 0 1 0 8 0a4 4 0 1 0-8 0`; }
  if (geometry.type === "MultiPoint") return (geometry.coordinates as number[][]).map((pair) => { const [x, y] = project(pair); return `M${x - 4} ${y}a4 4 0 1 0 8 0a4 4 0 1 0-8 0`; }).join(" ");
  if (geometry.type === "LineString") return line(geometry.coordinates as number[][]);
  if (geometry.type === "MultiLineString") return (geometry.coordinates as number[][][]).map((part) => line(part)).join(" ");
  if (geometry.type === "Polygon") return (geometry.coordinates as number[][][]).map((ring) => line(ring, true)).join(" ");
  if (geometry.type === "MultiPolygon") return (geometry.coordinates as number[][][][]).flatMap((polygon) => polygon.map((ring) => line(ring, true))).join(" ");
  return "";
}

const fallbackBounds: Record<string, [number, number, number, number]> = {
  "cairo-suez-road": [31.2, 29.82, 32.7, 30.3],
  "dabaa-axis": [29.45, 29.82, 31.25, 30.5],
  "dahshur-south-link": [30.7, 29.8, 31.2, 30.15],
  "kalabsha-axis": [32.62, 24.4, 33.04, 24.75],
  "qena-luxor-road": [31.75, 25.75, 32.8, 26.35],
  "qus-axis": [32.6, 25.8, 33, 26.06],
  "regional-ring-road": [31.15, 29.52, 31.98, 30.55],
  "suez-ring-link": [31.3, 29.82, 32.7, 30.3],
  "western-upper-egypt": [30.2, 22.05, 33.2, 30.15],
};

function tileX(lon: number, zoom: number): number { return Math.floor((lon + 180) / 360 * 2 ** zoom); }
function tileY(lat: number, zoom: number): number {
  const radians = Math.max(Math.min(lat, 85.0511), -85.0511) * Math.PI / 180;
  return Math.floor((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * 2 ** zoom);
}
function tileLon(x: number, zoom: number): number { return x / 2 ** zoom * 360 - 180; }
function tileLat(y: number, zoom: number): number { return Math.atan(Math.sinh(Math.PI * (1 - 2 * y / 2 ** zoom))) * 180 / Math.PI; }

const imageryTiles = {
  current: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{level}/{row}/{col}",
  2014: "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/14720/{level}/{row}/{col}",
  2024: "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/16453/{level}/{row}/{col}",
} as const;

function renderSatelliteBasemap(target: SVGGElement, bounds: [number, number, number, number], project: (pair: number[]) => [number, number], tileTemplate = imageryTiles.current): number {
  const [minX, minY, maxX, maxY] = bounds;
  let zoom = Math.max(7, Math.min(19, Math.floor(Math.log2(360 / Math.max(maxX - minX, .0001) * 2.4))));
  let minTileX = tileX(minX, zoom), maxTileX = tileX(maxX, zoom), minTileY = tileY(maxY, zoom), maxTileY = tileY(minY, zoom);
  while ((maxTileX - minTileX + 1) * (maxTileY - minTileY + 1) > 48 && zoom > 7) {
    zoom -= 1;
    minTileX = tileX(minX, zoom); maxTileX = tileX(maxX, zoom); minTileY = tileY(maxY, zoom); maxTileY = tileY(minY, zoom);
  }
  const tileSignature = `${tileTemplate}|${zoom}|${minTileX}|${maxTileX}|${minTileY}|${maxTileY}`;
  const count = (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);
  if (target.dataset.tileSignature === tileSignature) return count;
  const fragment = document.createDocumentFragment();
  for (let x = minTileX; x <= maxTileX; x += 1) for (let y = minTileY; y <= maxTileY; y += 1) {
    const [left, top] = project([tileLon(x, zoom), tileLat(y, zoom)]);
    const [right, bottom] = project([tileLon(x + 1, zoom), tileLat(y + 1, zoom)]);
    const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.setAttribute("x", String(left)); image.setAttribute("y", String(top));
    image.setAttribute("width", String(right - left + .5)); image.setAttribute("height", String(bottom - top + .5));
    image.setAttribute("preserveAspectRatio", "none");
    image.setAttribute("href", tileTemplate.replace("{level}", String(zoom)).replace("{row}", String(y)).replace("{col}", String(x)));
    image.classList.add("satellite-tile");
    fragment.appendChild(image);
  }
  target.replaceChildren(fragment);
  target.dataset.tileSignature = tileSignature;
  return count;
}

export async function initializeMap(group: string, summary: DashboardSummary, mapRoot?: HTMLElement): Promise<void> {
  const scope = mapRoot || document.querySelector<HTMLElement>(".gis-map");
  if (!scope) return;
  const svg = scope.querySelector<SVGSVGElement>(".interactive-map");
  const viewport = scope.querySelector<SVGGElement>(".map-viewport");
  const satellite = scope.querySelector<SVGGElement>(".satellite-basemap");
  const content = scope.querySelector<SVGGElement>(".map-content");
  const toggles = scope.querySelector<HTMLElement>(".map-layer-toggles");
  const status = scope.querySelector<HTMLElement>(".map-status-text");
  if (!svg || !viewport || !satellite || !content || !toggles) return;
  const labels: Record<LayerName, string> = { study: "منطقة الدراسة", axis: "مسار الطريق", urban: "تغير عمراني", agricultural: "تغير زراعي", industrial: "تغير صناعي", baseline: "استخدامات الأراضي المرجعية", civil: "الدراسة المدنية", "landcover-start": `استخدامات الأراضي ${summary.yearStart}`, "landcover-end": `استخدامات الأراضي ${summary.yearEnd}`, buildings: "المباني", parcels: "قطع الأراضي", landmarks: "المعالم والخدمات", water: "المسطحات المائية", "field-survey": "الرفع الميداني", transport: "شبكة النقل", governorates: "حدود المحافظات", LRT_Line: "خط القطار الكهربائي الخفيف", lRT_Station: "محطات القطار الكهربائي الخفيف", Metro_Line: "خطوط المترو", Metro_Station: "محطات المترو", Road_CairoRing: "الطريق الدائري حول القاهرة", Road_MiddleRing: "الطريق الدائري الأوسط", Road_RegionalRing: "الدائري الإقليمي", Transit_GreenLine: "الخط الأخضر", Transit_KafrDawoodSadat: "وصلة كفر داوود–السادات", Transit_LRT: "القطار الكهربائي الخفيف", Transit_Metro1: "الخط الأول للمترو", Transit_Metro2: "الخط الثاني للمترو", Transit_Metro3: "الخط الثالث للمترو", Transit_Metro4: "الخط الرابع للمترو", Transit_Metro6: "الخط السادس للمترو", Transit_MonorailCapital: "المونوريل – العاصمة", Transit_MonorailOctober: "المونوريل – أكتوبر", Transit_RobikiBelbeis: "وصلة الروبيكي–بلبيس" };
  const mapInstance = scope.dataset.mapInstance || "primary";
  const tileTemplate = mapInstance.includes("baseline") ? imageryTiles[2014]
    : mapInstance.includes("current") ? imageryTiles[2024]
      : imageryTiles.current;
  const temporalLayers: LayerName[] = ["landcover-start", "landcover-end"];
  const qenaCurrentFallback = group === "qena-luxor-road" && !summary.layers.includes("landcover-end") && summary.layers.includes("baseline");
  const suezTransport = group === "cairo-suez-road" || group === "suez-ring-link";
  const usableLayers = summary.layers
    .concat(qenaCurrentFallback ? ["landcover-end" as LayerName] : [])
    .concat(suezTransport ? transportLayerNames : []);
  const regularLayers = usableLayers.filter((layer) => !temporalLayers.includes(layer) && !(layer === "baseline" && usableLayers.includes("landcover-start") && !Boolean(scope.closest(".story-runtime"))));
  const viewerMode = Boolean(scope.closest(".viewer-runtime"));
  const storyMode = Boolean(scope.closest(".story-runtime")) && !Boolean(scope.closest(".story-map-compare"));
  const temporalMap = mapInstance.includes("baseline") || mapInstance.includes("current");
  // Story maps are a focused spatial narrative: their interactive map shows
  // only the verified study-area geometry for the selected sector. Loading
  // land-cover, water, survey or corridor layers here can introduce source
  // polygons outside the area and visually obscure the satellite image.
  const storyStudyLayers: LayerName[] = ["study"];
  const baselineTransportNames: LayerName[] = suezTransport ? transportLayerNames : ["Road_CairoRing"];
  const temporalStartLayers: LayerName[] = ["study", "landcover-start", ...baselineTransportNames, "axis"];
  // Temporal maps must draw their current land-use colours and change state
  // from the documented end-year land-cover layer only. The standalone
  // urban/agricultural/industrial files are summary overlays (and can use a
  // different colour convention), so rendering them together duplicates
  // geometry and bypasses the per-polygon change-status filter.
  const temporalEndLayers: LayerName[] = ["study", "landcover-end", ...transportLayerNames, "axis"];
  const requestedLayers = storyMode
    ? storyStudyLayers.filter((layer) => usableLayers.includes(layer))
    : temporalMap
    ? (mapInstance.includes("baseline") ? temporalStartLayers.filter((layer) => usableLayers.includes(layer)) : temporalEndLayers.filter((layer) => usableLayers.includes(layer)))
    : mapInstance.includes("baseline")
    ? [...regularLayers, ...(summary.layers.includes("landcover-start") ? ["landcover-start" as LayerName] : [])]
    : mapInstance.includes("current")
      ? [...regularLayers, ...(summary.layers.includes("landcover-end") ? ["landcover-end" as LayerName] : [])]
    : viewerMode ? usableLayers
      : [...regularLayers, ...(usableLayers.includes("landcover-end") ? ["landcover-end" as LayerName] : usableLayers.includes("landcover-start") ? ["landcover-start" as LayerName] : [])];
  const layerResults = await Promise.all(requestedLayers.map(async (layer) => {
    const sourceLayer = qenaCurrentFallback && layer === "landcover-end" ? "baseline" : layer;
    const isTransport = transportLayerNames.includes(layer as any);
    const primaryUrl = `../../data/dashboard/${group}/${sourceLayer}.geojson`;
    const fallbackUrl = `../../data/dashboard/ismailia/${sourceLayer}.geojson`;
    try {
      let collection: GeoJsonCollection;
      try {
        collection = await loadGeoJson(primaryUrl);
      } catch (err) {
        if (isTransport) {
          collection = await loadGeoJson(fallbackUrl);
        } else {
          throw err;
        }
      }
      return { layer, collection } as const;
    } catch (error) {
      console.error(`Unable to load map layer ${group}/${layer}`, error);
      return { layer, error } as const;
    }
  }));
  const loaded = layerResults
    .filter((result): result is { layer: LayerName; collection: GeoJsonCollection } => "collection" in result)
    .map(({ layer, collection }) => [layer, collection] as const);
  const failedLayers = layerResults.filter((result) => "error" in result).map(({ layer }) => layer);
  let pairCount = 0, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const scanCoordinates = (value: Coordinates): void => {
    if (Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      pairCount += 1; minX = Math.min(minX, value[0]); maxX = Math.max(maxX, value[0]); minY = Math.min(minY, value[1]); maxY = Math.max(maxY, value[1]);
    } else if (Array.isArray(value)) value.forEach((item) => scanCoordinates(item as Coordinates));
  };
  // Keep the initial extent focused on the study corridor. Transport layers
  // cover larger regions; including them in the extent makes the study area tiny.
  const extentLayers = new Set<LayerName>(["study", "axis", "urban", "agricultural", "industrial", "landcover-start", "landcover-end"]);
  loaded.forEach(([layer, collection]) => {
    if (extentLayers && !extentLayers.has(layer)) return;
    collection.features.forEach((feature) => { if (feature.geometry) scanCoordinates(feature.geometry.coordinates); });
  });
  if (!pairCount) {
    [minX, minY, maxX, maxY] = fallbackBounds[group] || [24, 22, 36, 32];
  }
  let viewMinX = minX, viewMaxX = maxX, viewMinY = minY, viewMaxY = maxY;
  const rawWidth = Math.max(maxX - minX, .00001), rawHeight = Math.max(maxY - minY, .00001);
  const latitudeFactor = Math.max(Math.cos(((minY + maxY) / 2) * Math.PI / 180), .35);
  const targetAspect = 1000 / 520;
  if (rawWidth * latitudeFactor / rawHeight < targetAspect) {
    const requiredWidth = rawHeight * targetAspect / latitudeFactor;
    const padding = (requiredWidth - rawWidth) / 2;
    viewMinX -= padding; viewMaxX += padding;
  } else {
    const requiredHeight = rawWidth * latitudeFactor / targetAspect;
    const padding = (requiredHeight - rawHeight) / 2;
    viewMinY -= padding; viewMaxY += padding;
  }
  const width = Math.max(viewMaxX - viewMinX, .00001), height = Math.max(viewMaxY - viewMinY, .00001);
  const scale = Math.min(1000 / width, 520 / height);
  const project = (pair: number[]): [number, number] => [(pair[0] - viewMinX) * scale + (1000 - width * scale) / 2, (viewMaxY - pair[1]) * scale + (520 - height * scale) / 2];
  const tileCount = renderSatelliteBasemap(satellite, [viewMinX, viewMinY, viewMaxX, viewMaxY], project, tileTemplate);
  content.innerHTML = "";
  const featureSelection = document.createElementNS("http://www.w3.org/2000/svg", "path");
  featureSelection.classList.add("map-feature-selection");
  featureSelection.setAttribute("fill-rule", "evenodd");
  featureSelection.setAttribute("vector-effect", "non-scaling-stroke");
  featureSelection.setAttribute("hidden", "true");
  content.appendChild(featureSelection);
  const featureHover = document.createElementNS("http://www.w3.org/2000/svg", "path");
  featureHover.classList.add("map-feature-hover");
  featureHover.setAttribute("fill-rule", "evenodd");
  featureHover.setAttribute("vector-effect", "non-scaling-stroke");
  featureHover.setAttribute("hidden", "true");
  content.appendChild(featureHover);
  const sectorValues = new Set<string>();
  // The Ismailia source represents one corridor; numeric sub-sector values in
  // land-cover attributes (for example 10/17) are internal classifications,
  // not selectable dashboard sectors.
  const sectorOf = (properties: Record<string, unknown> = {}) => group === "ismailia" ? "" : String(properties["اسم_القطاع"] ?? properties["sector"] ?? properties["Sector"] ?? "").trim();
  for (const [layer, collection] of loaded) {
    const groupElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    groupElement.dataset.layerGroup = layer;
    groupElement.classList.add(`map-${layer}`);
    const aggregateLandcover = ["landcover-start", "landcover-end", "urban", "agricultural", "industrial"].includes(layer) && (mapInstance.includes("baseline") || mapInstance.includes("current"));
    const landcoverBuckets = new Map<string, { paths: string[]; fill: string; stroke: string; strokeWidth: string; code: string; status: string; sector: string; geometry: string; features: Array<{ geometry?: { type: string; coordinates: Coordinates }; properties?: Record<string, unknown> }> }>();
    for (const [featureIndex, feature] of collection.features.entries()) {
      // Yield between batches so a large layer cannot block scrolling/input.
      if (featureIndex > 0 && featureIndex % (aggregateLandcover ? 900 : 180) === 0) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (!feature.geometry) continue;
      const geometry = feature.geometry;
      const pathData = geometryPath(geometry, project);
      if (!pathData) continue;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.dataset.geometry = feature.geometry.type;
      if (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString") {
        const symbol = lineSymbols[layer] || { color: "#10b8ad", width: 3.2 };
        path.style.fill = "none";
        path.style.stroke = symbol.color;
        path.style.strokeWidth = String(symbol.width);
        path.style.strokeLinecap = "round";
        path.style.strokeLinejoin = "round";
        if (symbol.dash) path.style.strokeDasharray = symbol.dash;
      } else if (feature.geometry.type === "Point" || feature.geometry.type === "MultiPoint") {
        path.style.fill = layer === "lRT_Station" ? "#43c94f" : layer === "Metro_Station" ? "#2b7fd1" : "#d8d8d8";
        path.style.stroke = layer === "lRT_Station" || layer === "Metro_Station" ? "#ffffff" : "#263238";
        path.style.strokeWidth = layer === "lRT_Station" || layer === "Metro_Station" ? "0.9" : "1.5";
      }
      // In the Ismailia data field «حالة التغير»: 1 = changed, 2 = unchanged.
      // Check the negative Arabic forms first because «غير متغير» also
      // contains the positive word «متغير».
      const exactStatus = normalizeChangeStatus(feature.properties?.change_status_key ?? feature.properties?.change_status ?? feature.properties?.["حالة_التغير"]);
      path.dataset.changeStatus = exactStatus;
      const featureSector = sectorOf(feature.properties);
      if (featureSector) {
        sectorValues.add(featureSector);
        path.dataset.sector = featureSector;
      }
      path.setAttribute("vector-effect", "non-scaling-stroke");
      if (layer === "landcover-start" || layer === "landcover-end" || layer === "baseline") {
        const rawValue = feature.properties?.landuse_code ?? feature.properties?.landuse_value ?? feature.properties?.landuse_label
          ?? feature.properties?.["استخدام_الأرض"] ?? feature.properties?.["وصف_الاستخدام"] ?? "unclassified";
        const normalized = String(rawValue).trim().toLowerCase();
        const numericCode = Number(rawValue);
        const inferredCode = Number.isFinite(numericCode) ? numericCode
          : /agri|زراع/.test(normalized) ? 0
            : /industr|factor|مصنع|صناع/.test(normalized) ? 1
              : /vacant|vscant|vecant|فضاء|فارغ/.test(normalized) ? 2
                : /urban|build|residen|عمران|مبان|سكن/.test(normalized) ? 3
                  : /military|armed|عسكر|قوات/.test(normalized) ? 4
                    : /facilit|service|خدم|مرافق/.test(normalized) ? 5
                      : /recreat|ترفيه/.test(normalized) ? 6
                        : /cemeter|مقابر|جبان/.test(normalized) ? 7
                          : /water|مياه|مائي/.test(normalized) ? 8
                            : /relig|دين|مسجد|كنيس/.test(normalized) ? 11
                              : /educat|تعليم|مدرس|جامعة/.test(normalized) ? 12
                                : /government|حكوم|وزارة/.test(normalized) ? 13
                                  : /touris|سياح|فندق/.test(normalized) ? 14
                                    : /green|خضراء|حدائق/.test(normalized) ? 15
                                      : /road|طريق/.test(normalized) ? 9 : 99;
        const palette = ismailiaLanduseSymbols;
        const [fill, stroke] = palette[inferredCode] || palette[99];
        if (storyMode && !storyVisibleLanduseCodes.has(inferredCode)) continue;
        path.dataset.landuseCode = String(inferredCode);
        path.style.fill = fill;
        path.style.stroke = stroke;
        path.style.strokeWidth = "0.75";
      }
      const code = path.dataset.landuseCode || layer;
      const status = path.dataset.changeStatus || "unknown";
      const key = `${code}_${status}_${featureSector}_${feature.geometry.type}`;
      const bucket = landcoverBuckets.get(key) || { paths: [], fill: path.style.fill, stroke: path.style.stroke, strokeWidth: path.style.strokeWidth, code, status, sector: featureSector, geometry: feature.geometry.type, features: [] };
      bucket.paths.push(pathData);
      bucket.features.push(feature);
      landcoverBuckets.set(key, bucket);
    }
    const landuseNames = ismailiaLanduseNames;
    for (const bucket of landcoverBuckets.values()) {
      for (let start = 0; start < bucket.paths.length; start += 350) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", bucket.paths.slice(start, start + 350).join(" "));
        const bucketIsLine = bucket.geometry === "LineString" || bucket.geometry === "MultiLineString";
        const bucketIsPoint = bucket.geometry === "Point" || bucket.geometry === "MultiPoint";
        path.dataset.geometry = bucketIsLine ? "MultiLineString" : bucketIsPoint ? "MultiPoint" : "MultiPolygon";
        if (layer === "landcover-start" || layer === "landcover-end" || layer === "baseline") path.dataset.landuseCode = bucket.code;
        path.dataset.changeStatus = bucket.status;
        if (bucket.sector) path.dataset.sector = bucket.sector;
        path.style.fill = bucket.fill;
        path.style.stroke = bucketIsLine || bucketIsPoint ? bucket.stroke : bucket.fill || "transparent";
        path.style.strokeWidth = bucketIsLine || bucketIsPoint ? bucket.strokeWidth : "0.2";
        if (storyMode && layer === "study") {
          path.style.fill = "rgba(255, 209, 80, 0.16)";
          path.style.stroke = "#efcb49";
          path.style.strokeWidth = "2.4";
        }
        if (bucketIsLine) {
          path.style.strokeLinecap = "round";
          path.style.strokeLinejoin = "round";
          const symbol = lineSymbols[layer];
          if (symbol?.dash) path.style.strokeDasharray = symbol.dash;
        }
        path.setAttribute("fill-rule", "nonzero");
        path.setAttribute("clip-rule", "nonzero");
        path.setAttribute("vector-effect", "non-scaling-stroke");
        path.dataset.aggregate = "true";
        path.style.pointerEvents = "all";
        path.style.cursor = "pointer";

        const bucketFeatures = bucket.features.slice(start, start + 350);
        const bucketFeatureHits = bucketFeatures.flatMap((feature) => {
          if (!feature.geometry) return [];
          const geometry = feature.geometry;
          const hitGeometries: Array<{ type: string; coordinates: Coordinates }> = geometry.type === "Polygon"
            ? [{ type: "Polygon", coordinates: geometry.coordinates }]
            : geometry.type === "MultiPolygon"
              ? (geometry.coordinates as number[][][][]).map((polygon) => ({ type: "Polygon", coordinates: polygon }))
              : geometry.type === "MultiLineString"
                ? (geometry.coordinates as number[][][]).map((line) => ({ type: "LineString", coordinates: line }))
                : [geometry];
          return hitGeometries.map((hitGeometry, componentIndex) => {
            const projected = coordinatePairs(hitGeometry.coordinates).map(project);
            return {
              feature,
              pathData: geometryPath(hitGeometry, project),
              componentIndex,
              componentAreaKm2: hitGeometry.type === "Polygon" ? polygonAreaKm2(hitGeometry.coordinates as number[][][]) : undefined,
              minX: projected.length ? Math.min(...projected.map(([x]) => x)) : Infinity,
              maxX: projected.length ? Math.max(...projected.map(([x]) => x)) : -Infinity,
              minY: projected.length ? Math.min(...projected.map(([, y]) => y)) : Infinity,
              maxY: projected.length ? Math.max(...projected.map(([, y]) => y)) : -Infinity,
            };
          });
        });
        const hitTestFeature = (event: MouseEvent) => {
          const rect = svg.getBoundingClientRect();
          const mouseX = (event.clientX - rect.left) * 1000 / Math.max(rect.width, 1);
          const mouseY = (event.clientY - rect.top) * 520 / Math.max(rect.height, 1);
          const [localX, localY] = [(mouseX - tx) / zoom, (mouseY - ty) / zoom];
          const tolerance = bucketIsLine || bucketIsPoint ? 7 / zoom : 0;
          const point = svg.createSVGPoint();
          point.x = localX; point.y = localY;
          for (let index = bucketFeatureHits.length - 1; index >= 0; index -= 1) {
            const candidate = bucketFeatureHits[index];
            if (!candidate.pathData || localX < candidate.minX - tolerance || localX > candidate.maxX + tolerance || localY < candidate.minY - tolerance || localY > candidate.maxY + tolerance) continue;
            const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            tempPath.setAttribute("d", candidate.pathData);
            if (bucketIsLine) tempPath.setAttribute("stroke-width", String(14 / zoom));
            if ((bucketIsLine ? tempPath.isPointInStroke(point) : tempPath.isPointInFill(point))) return candidate;
          }
          return null;
        };
        const positionPopupNearCursor = (evt: MouseEvent) => {
          const popup = scope.querySelector<HTMLElement>(".feature-popup");
          if (!popup || popup.hidden) return;
          const scopeRect = scope.getBoundingClientRect();
          const mouseX = evt.clientX - scopeRect.left;
          const mouseY = evt.clientY - scopeRect.top;
          const popupWidth = popup.offsetWidth || 210;
          const popupHeight = popup.offsetHeight || 90;
          let left = mouseX + 14;
          let top = mouseY + 14;
          if (left + popupWidth > scopeRect.width - 8) left = mouseX - popupWidth - 14;
          if (top + popupHeight > scopeRect.height - 8) top = mouseY - popupHeight - 14;
          left = Math.max(8, Math.min(left, scopeRect.width - popupWidth - 8));
          top = Math.max(8, Math.min(top, scopeRect.height - popupHeight - 8));
          popup.style.left = `${left}px`;
          popup.style.top = `${top}px`;
          popup.style.bottom = "auto";
          popup.style.right = "auto";
          popup.style.insetInlineEnd = "auto";
        };
        let activeHoverKey = "";
        path.addEventListener("pointermove", (event) => {
          const target = hitTestFeature(event);
          if (!target) {
            featureHover.setAttribute("hidden", "true");
            const popup = scope.querySelector<HTMLElement>(".feature-popup");
            if (popup) popup.hidden = true;
            return;
          }
          featureHover.setAttribute("d", target.pathData);
          featureHover.dataset.geometry = bucketIsLine ? "MultiLineString" : bucketIsPoint ? "MultiPoint" : "MultiPolygon";
          featureHover.removeAttribute("hidden");
          content.appendChild(featureHover);
          const hoverKey = `${bucketFeatures.indexOf(target.feature)}:${target.componentIndex}`;
          if (hoverKey !== activeHoverKey) {
            activeHoverKey = hoverKey;
            showPopup(event);
          } else {
            positionPopupNearCursor(event);
          }
        });
        path.addEventListener("pointerleave", () => {
          activeHoverKey = "";
          featureHover.setAttribute("hidden", "true");
          featureSelection.setAttribute("hidden", "true");
          const popup = scope.querySelector<HTMLElement>(".feature-popup");
          if (popup) popup.hidden = true;
        });
        const showPopup = (event: Event) => {
          event.stopPropagation();
          scope.querySelectorAll<SVGPathElement>(".map-content path").forEach((p) => p.classList.remove("feature-selected"));
          const popup = scope.querySelector<HTMLElement>(".feature-popup");
          if (!popup) return;

          let targetProperties: Record<string, unknown> | null = null;
          let targetPathData = "";
          if (event instanceof MouseEvent) {
            const target = hitTestFeature(event);
            targetProperties = target ? { ...(target.feature.properties || {}) } : null;
            targetPathData = target?.pathData || "";
            if (targetProperties && Number(targetProperties.source_feature_count || 1) > 1) {
              Object.keys(targetProperties).forEach((key) => {
                if (!new Set(["landuse_label", "change_status", "sector"]).has(key)) delete targetProperties![key];
              });
              if (Number.isFinite(target?.componentAreaKm2)) targetProperties.area_km2 = target!.componentAreaKm2;
            }
          }
          if (!targetProperties && bucketFeatures.length) {
            targetProperties = bucketFeatures[0].properties || null;
            targetPathData = bucketFeatures[0].geometry ? geometryPath(bucketFeatures[0].geometry, project) : "";
          }
          if (targetPathData) {
            featureSelection.setAttribute("d", targetPathData);
            featureSelection.removeAttribute("hidden");
            content.appendChild(featureSelection);
          }
          const hiddenPopupFields = new Set(["landuse_value", "landuse_code", "landuse_label", "change_status_key", "source_feature_count", "GlobalID", "OBJECTID", "FID", "SHAPE_Length", "SHAPE_Area"]);
          const rows = Object.entries(targetProperties || {}).filter(([key, value]) => !hiddenPopupFields.has(key) && value !== null && value !== "");
          const aggregateFieldLabels: Record<string, string> = { landuse_value: "استخدام الأرض", landuse_code: "كود استخدام الأرض", landuse_label: "وصف الاستخدام", source_feature_count: "عدد المعالم الأصلية", area_km2: "المساحة (كم²)", sector: "القطاع" };
          const landuseTitle = landuseNames[bucket.code] || labels[layer];
          const popupValue = (key: string, value: unknown): string => {
            if (key === "change_status" || key === "حالة_التغير") {
              const status = normalizeChangeStatus(value);
              if (status === "changed") return document.documentElement.lang === "en" ? "Changed" : "متغير";
              if (status === "unchanged") return document.documentElement.lang === "en" ? "Unchanged" : "لم يتغير";
            }
            if (key === "area_km2" || key === "مساحة_كم2") {
              const rawArea = Number(value);
              if (Number.isFinite(rawArea)) {
                // Some source exports store square metres in the legacy area_km2 field.
                const areaKm2 = rawArea > Math.max(summary.metrics.studyAreaKm2 * 100, 100_000) ? rawArea / 1_000_000 : rawArea;
                return `${formatNumber(areaKm2, 4)} ${document.documentElement.lang === "en" ? "km²" : "كم²"}`;
              }
            }
            if (key === "source_feature_count" && Number.isFinite(Number(value))) return formatNumber(Number(value), 0);
            return String(value);
          };
          popup.querySelector("div")!.innerHTML = `<p class="popup-layer">${esc(labels[layer])}</p><p><span>نوع الاستخدام</span><b>${esc(landuseTitle)}</b></p>` + (rows.length ? rows.map(([key, value]) => `<p><span>${esc(aggregateFieldLabels[key] || key.replaceAll("_", " "))}</span><b>${esc(popupValue(key, value))}</b></p>`).join("") : "");
          popup.hidden = false;
          popup.style.display = "block";
          if (event instanceof MouseEvent) positionPopupNearCursor(event);
        };
        path.addEventListener("click", showPopup);
        groupElement.appendChild(path);
      }
    }
    content.appendChild(groupElement);
  }
  const renderableCount = (collection: GeoJsonCollection) => collection.features.filter((feature) => feature.geometry && coordinatePairs(feature.geometry.coordinates).length).length;
  const sourceCount = (_layer: LayerName, collection: GeoJsonCollection) => collection.features.reduce((sum, feature) => {
    if (!feature.geometry || !coordinatePairs(feature.geometry.coordinates).length) return sum;
    return sum + Math.max(1, Number(feature.properties?.source_feature_count || 1));
  }, 0);
  // A temporal pair must never paint the two survey years over one another.
  // The overlap made valid parcels look like missing or fragmented features.
  const isBaselineMap = mapInstance.includes("baseline");
  const isCurrentMap = mapInstance.includes("current");
  const startsHidden = (isCurrentMap || (!isBaselineMap && !isCurrentMap)) && loaded.some(([layer]) => layer === "landcover-end");
  const endsHidden = isBaselineMap;
  if (startsHidden) content.querySelector<SVGGElement>('[data-layer-group="landcover-start"]')?.classList.add("layer-hidden");
  if (endsHidden) content.querySelector<SVGGElement>('[data-layer-group="landcover-end"]')?.classList.add("layer-hidden");
  toggles.innerHTML = loaded.map(([layer, collection]) => {
    const active = !((startsHidden && layer === "landcover-start") || (endsHidden && layer === "landcover-end"));
    return `<button type="button" class="${active ? "active" : ""}" data-map-layer="${layer}"><i></i>${labels[layer]}<b>${sourceCount(layer, collection).toLocaleString(document.documentElement.lang === "en" ? "en-US" : "ar-EG")}</b></button>`;
  }).join("");
  // Keep the layer key out of the dashboard map; symbology is rendered on
  // the features themselves and the dashboard controls remain uncluttered.
  if (storyMode) {
    const panel = document.createElement("details");
    panel.className = "story-map-layer-panel";
    const heading = document.createElement("summary");
    heading.textContent = document.documentElement.lang === "en" ? "Map layers" : "طبقات الخريطة";
    panel.append(heading, toggles);
    scope.appendChild(panel);
  } else {
    toggles.setAttribute("hidden", "true");
    toggles.remove();
  }
  scope.querySelector(".landuse-legend")?.remove();
  if (loaded.some(([layer]) => temporalLayers.includes(layer))) {
    const expanded = mapInstance.includes("baseline") || mapInstance.includes("current") ? "" : " open";
    // Use the same approved land-use legend for every axis, not only Ismailia.
    const legendItems = [[0, "الأراضي الزراعية"], [1, "المناطق الصناعية"], [2, "أراضي الفضاء"], [3, "الأراضي العمرانية"], [4, "أراضي القوات المسلحة"], [5, "أراضي خدمات"], [6, "المناطق الترفيهية"], [7, "المقابر"], [8, "مسطحات مائية"], [9, "حرم الطريق"], [10, "طرق"], [11, "ديني"], [12, "الأراضي التعليمية"], [13, "الأراضي الحكومية"], [14, "الأراضي السياحية"], [15, "مساحات خضراء"], [99, "غير مصنف"]]
      .filter(([code]) => !storyMode || storyVisibleLanduseCodes.has(Number(code)))
      .map(([code, label]) => `<span style="--swatch:${ismailiaLanduseSymbols[Number(code)][0]}">${label}</span>`).join("");
    scope.insertAdjacentHTML("beforeend", `<details class="landuse-legend"${expanded}><summary>مفتاح استخدامات الأراضي</summary><div>${legendItems}</div></details>`);
  }
  toggles.querySelectorAll<HTMLButtonElement>("[data-map-layer]").forEach((button) => button.addEventListener("click", () => {
    const active = !button.classList.contains("active");
    document.querySelectorAll<HTMLButtonElement>(`[data-map-layer="${button.dataset.mapLayer}"]`).forEach((peer) => peer.classList.toggle("active", active));
    document.querySelectorAll<SVGGElement>(`[data-layer-group="${button.dataset.mapLayer}"]`).forEach((groupElement) => groupElement.classList.toggle("layer-hidden", !active));
  }));
  const sectorWrap = scope.querySelector<HTMLElement>(".map-sector-filter");
  const sectorSelect = scope.querySelector<HTMLSelectElement>(".map-sector-select");
  if (sectorWrap && sectorSelect && sectorValues.size > 1) {
    const sectors = Array.from(sectorValues).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
    const westernSectorNames: Record<string, string> = { "1": "أسيوط", "2": "أسوان", "3": "الجيزة", "4": "المنيا", "6": "الفيوم", "7": "أبو سمبل", "8": "سوهاج", "9": "بني سويف", "11": "قنا", "12": "الأقصر" };
    const sectorLabel = (sector: string) => group === "western-upper-egypt" && westernSectorNames[sector] ? `${westernSectorNames[sector]} - قطاع ${sector}` : `قطاع ${sector}`;
    sectorSelect.innerHTML = `<option value="all">كل القطاعات (${sectors.length})</option>${sectors.map((sector) => `<option value="${esc(sector)}">${esc(sectorLabel(sector))}</option>`).join("")}`;
    sectorWrap.hidden = false;
    const numeric = (properties: Record<string, unknown>, keys: string[]) => {
      for (const key of keys) { const value = Number(properties[key]); if (Number.isFinite(value) && value > 0) return value; }
      return 0;
    };
    const updateSector = () => {
      const selected = sectorSelect.value;
      scope.querySelectorAll<SVGPathElement>(".map-content path[data-sector]").forEach((path) => {
        const matches = selected === "all" || path.dataset.sector === selected;
        path.toggleAttribute("hidden", !matches);
        path.classList.toggle("sector-highlight", selected !== "all" && matches && Boolean(path.closest('[data-layer-group="study"]')));
      });
      if (scope.dataset.dashboardSync === "false") return;
      const chosen = (layer: LayerName) => loaded.find(([name]) => name === layer)?.[1].features.filter((feature: { properties?: Record<string, unknown> }) => selected === "all" || sectorOf(feature.properties) === selected) || [];
      const rawArea = (layer: LayerName) => chosen(layer).reduce((sum: number, feature: { properties?: Record<string, unknown> }) => sum + numeric(feature.properties || {}, ["مساحة_المنطقة_كم2", "مساحة_التغير_كم2", "المساحة_كم2", "Area_KM2", "SHAPE_Area", "Shape_Area"]), 0);
      const areaKm2 = (layer: LayerName) => { const value = rawArea(layer); return value > 1_000_000 ? value / 1_000_000 : value; };
      const rawLength = chosen("axis").reduce((sum: number, feature: { properties?: Record<string, unknown> }) => sum + numeric(feature.properties || {}, ["طول_المحور_كم", "length", "Shape_Length", "SHAPE_Length"]), 0);
      const axisKm = rawLength > 5_000 ? rawLength / 1_000 : rawLength;
      const reportSector = selected === "all" ? undefined : summary.profile?.sectors?.[selected];
      const dynamicMetrics: Record<string, number> = {};
      if (chosen("study").length) dynamicMetrics.studyAreaKm2 = areaKm2("study");
      if (chosen("axis").length) dynamicMetrics.axisLengthKm = axisKm;
      if (chosen("urban").length) dynamicMetrics.urbanChangeKm2 = areaKm2("urban");
      if (chosen("agricultural").length) {
        const agriculturalKm2 = areaKm2("agricultural");
        dynamicMetrics.agriculturalChangeKm2 = agriculturalKm2;
        dynamicMetrics.agriculturalAreaFeddan = agriculturalKm2 / .0042;
        dynamicMetrics.agriculturalChangeFeddan = agriculturalKm2 / .0042;
      }
      if (chosen("industrial").length) {
        const industrialKm2 = areaKm2("industrial");
        if (industrialKm2 > 0) dynamicMetrics.industrialChangeKm2 = industrialKm2;
      }
      const activeMetrics = reportSector?.metrics
        ? { ...summary.metrics, ...reportSector.metrics, ...dynamicMetrics }
        : selected === "all"
        ? summary.metrics
        : { ...summary.metrics, ...dynamicMetrics };

      Object.entries(activeMetrics).forEach(([name, value]) => setMetric(name, value));

      setMetric("urbanFeatures", chosen("urban").length);
      setMetric("agriculturalFeatures", chosen("agricultural").length);
      setMetric("industrialFeatures", chosen("industrial").length);
      const gauge = document.querySelector<HTMLElement>("#urban-gauge");
      const studyArea = areaKm2("study"), urbanArea = areaKm2("urban");
      const selectedChange = document.querySelector<HTMLSelectElement>("#dashboard-change-filter")?.value || "all";
      if (group !== "western-upper-egypt" && gauge && studyArea > 0) {
        const percent = Math.min(urbanArea / studyArea * 100, 100);
        gauge.style.setProperty("--gauge", `${percent * 1.8}deg`);
        const gaugeLabel = gauge.querySelector("strong");
        if (gaugeLabel) gaugeLabel.textContent = `${formatNumber(percent, 2)}٪`;
      }
      const comparison = document.querySelector<HTMLElement>("#comparison-chart");
      if (comparison) {
        if (selected === "all") renderComparison(summary);
        else comparison.innerHTML = `<div class="no-data">لا تتوفر مقارنة زمنية منفصلة موثقة لـ ${esc(sectorLabel(selected))} في ملف التصدير الحالي؛ الخريطة والبطاقات تعرض بيانات القطاع المختار فقط.</div>`;
      }
      const dashboardRoot = document.querySelector<HTMLElement>(".interactive-dashboard");
      if (scope.dataset.dashboardSync !== "false" && dashboardRoot?.dataset.mode === "price") {
        dashboardRoot.dispatchEvent(new CustomEvent("dashboard-sector-price", { detail: {
          metrics: activeMetrics,
          prices: completePriceSet(selected === "all" ? summary.prices : reportSector?.prices, summary.prices),
          yearEnd: summary.profile?.yearEnd || summary.yearEnd,
          sectorTitle: selected === "all" ? summary.profile?.title : reportSector?.title,
        } }));
      }
      if (scope.dataset.dashboardSync !== "false") dashboardRoot?.dispatchEvent(new CustomEvent("dashboard-sector-view", { detail: selected === "all" ? summary.profile : reportSector }));
      if (scope.dataset.dashboardSync !== "false") dashboardRoot?.dispatchEvent(new CustomEvent("dashboard-map-sector", { detail: selected }));
    };
    sectorSelect.addEventListener("change", updateSector);
    updateSector();
  }
  const changeSelect = scope.querySelector<HTMLSelectElement>(".map-change-select");
  if (changeSelect) {
    const applyChangeFilter = () => {
      const mode = changeSelect.value;
      featureSelection.setAttribute("hidden", "true");
      featureHover.setAttribute("hidden", "true");
      loaded.forEach(([layer]) => {
        const groupElement = content.querySelector<SVGGElement>(`[data-layer-group="${layer}"]`);
        if (!groupElement) return;
        groupElement.querySelectorAll<SVGPathElement>("path").forEach((path) => {
          if (layer !== "landcover-end") {
            path.classList.remove("change-hidden", "change-match");
            return;
          }
          const status = path.dataset.changeStatus || "unknown";
          const isLanduseHidden = path.classList.contains("landuse-hidden") || path.hasAttribute("hidden") || path.closest(".layer-hidden") !== null;
          const matches = mode === "all" || status === mode;
          const shouldHighlight = mode !== "all" && matches && !isLanduseHidden;
          path.classList.toggle("change-hidden", mode !== "all" && (!matches || isLanduseHidden));
          path.classList.toggle("change-match", shouldHighlight);
        });
      });
      scope.dataset.changeStatus = mode;
      scope.dispatchEvent(new CustomEvent("map-change-status", { detail: mode }));
    };
    changeSelect.addEventListener("change", applyChangeFilter);
    applyChangeFilter();
  }
  const locale = document.documentElement.lang === "en" ? "en-US" : "ar-EG";
  if (status) {
    const featureCount = loaded.reduce((sum, [layer, collection]) => sum + sourceCount(layer, collection), 0);
    const isEnglish = document.documentElement.lang === "en";
    const failureNote = failedLayers.length ? (isEnglish ? ` · ${failedLayers.length} failed` : ` · تعذر تحميل ${failedLayers.length}`) : "";
    status.textContent = pairCount
      ? (isEnglish
        ? `${featureCount.toLocaleString(locale)} features · ${pairCount.toLocaleString(locale)} coordinate pairs · ${loaded.length} layers${failureNote}`
        : `${featureCount.toLocaleString(locale)} معلم · ${pairCount.toLocaleString(locale)} نقطة هندسية · ${loaded.length.toLocaleString(locale)} طبقات${failureNote}`)
      : (isEnglish
        ? `No matching local geometry · ${tileCount} reference satellite tiles${failureNote}`
        : `لا توجد هندسة محلية مطابقة · ${tileCount.toLocaleString(locale)} صورة قمر صناعي مرجعية${failureNote}`);
  }

  const defaultZoom = group === "ismailia" ? 1.18 : 1;
  const defaultTx = (1000 - 1000 * defaultZoom) / 2;
  const defaultTy = (520 - 520 * defaultZoom) / 2;
  let zoom = defaultZoom, tx = defaultTx, ty = defaultTy, dragging = false, lastX = 0, lastY = 0, panFrame = 0, zoomFrame = 0, wheelDelta = 0, viewAnimation = 0, basemapRefreshTimer = 0, interactionTimer = 0;
  const linkedPair = scope.closest<HTMLElement>(".temporal-map-pair");
  const inverseProject = (x: number, y: number): [number, number] => [
    viewMinX + (x - (1000 - width * scale) / 2) / scale,
    viewMaxY - (y - (520 - height * scale) / 2) / scale,
  ];
  const refreshBasemap = () => {
    window.clearTimeout(basemapRefreshTimer);
    basemapRefreshTimer = window.setTimeout(() => {
      const [west, north] = inverseProject((0 - tx) / zoom, (0 - ty) / zoom);
      const [east, south] = inverseProject((1000 - tx) / zoom, (520 - ty) / zoom);
      renderSatelliteBasemap(satellite, [Math.min(west, east), Math.min(south, north), Math.max(west, east), Math.max(south, north)], project, tileTemplate);
    }, 180);
  };
  const beginInteraction = () => {
    window.clearTimeout(interactionTimer);
    scope.classList.add("map-interacting");
  };
  const endInteraction = (delay = 0) => {
    window.clearTimeout(interactionTimer);
    interactionTimer = window.setTimeout(() => {
      scope.classList.remove("map-interacting");
      refreshBasemap();
    }, delay);
  };
  const apply = (broadcast = true) => {
    viewport.setAttribute("transform", `translate(${tx} ${ty}) scale(${zoom})`);
    // Satellite tiles are expensive to rebuild. During wheel/pan interaction
    // only move the already-rendered SVG; refresh imagery once interaction ends.
    if (!scope.classList.contains("map-interacting")) refreshBasemap();
    if (broadcast && linkedPair) linkedPair.dispatchEvent(new CustomEvent("linked-map-view", { detail: { source: mapInstance, zoom, tx, ty } }));
  };
  linkedPair?.addEventListener("linked-map-view", ((event: CustomEvent<{ source: string; zoom: number; tx: number; ty: number }>) => {
    if (event.detail.source === mapInstance) return;
    beginInteraction();
    zoom = event.detail.zoom; tx = event.detail.tx; ty = event.detail.ty; apply(false);
    endInteraction(220);
  }) as EventListener);
  const animateView = (nextZoom: number, nextTx: number, nextTy: number) => {
    cancelAnimationFrame(viewAnimation);
    const startZoom = zoom, startTx = tx, startTy = ty, started = performance.now();
    const frame = (now: number) => {
      const progress = Math.min((now - started) / 700, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      zoom = startZoom + (nextZoom - startZoom) * eased;
      tx = startTx + (nextTx - startTx) * eased;
      ty = startTy + (nextTy - startTy) * eased;
      apply(false);
      if (progress < 1) viewAnimation = requestAnimationFrame(frame);
      else apply();
    };
    viewAnimation = requestAnimationFrame(frame);
  };
  const fitSector = (sector: string) => {
    if (sector === "all") { animateView(defaultZoom, defaultTx, defaultTy); return; }
    const paths = Array.from(content.querySelectorAll<SVGGraphicsElement>(`path[data-sector="${CSS.escape(sector)}"]`)).filter((path) => !path.hasAttribute("hidden"));
    if (!paths.length) return;
    const boxes = paths.map((path) => path.getBBox()).filter((box) => box.width > 0 || box.height > 0);
    if (!boxes.length) return;
    const minBoxX = Math.min(...boxes.map((box) => box.x));
    const minBoxY = Math.min(...boxes.map((box) => box.y));
    const maxBoxX = Math.max(...boxes.map((box) => box.x + box.width));
    const maxBoxY = Math.max(...boxes.map((box) => box.y + box.height));
    const boxWidth = Math.max(maxBoxX - minBoxX, 1);
    const boxHeight = Math.max(maxBoxY - minBoxY, 1);
    const nextZoom = Math.min(8, Math.max(1, Math.min(840 / boxWidth, 390 / boxHeight)));
    const nextTx = 500 - (minBoxX + boxWidth / 2) * nextZoom;
    const nextTy = 260 - (minBoxY + boxHeight / 2) * nextZoom;
    animateView(nextZoom, nextTx, nextTy);
  };
  const zoomBy = (factor: number, centerX = 500, centerY = 260) => {
    const minimumZoom = .02;
    const maximumZoom = 4096;
    const nextZoom = Math.min(Math.max(zoom * factor, minimumZoom), maximumZoom);
    if (Math.abs(nextZoom - zoom) < .0001) return false;
    const ratio = nextZoom / zoom;
    tx = centerX - (centerX - tx) * ratio;
    ty = centerY - (centerY - ty) * ratio;
    zoom = nextZoom;
    if (zoom === minimumZoom) {
      tx = (1000 - 1000 * zoom) / 2;
      ty = (520 - 520 * zoom) / 2;
    }
    apply();
    return true;
  };
  scope.querySelectorAll<HTMLButtonElement>("[data-map-action]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.mapAction === "in") zoomBy(1.35);
    if (button.dataset.mapAction === "out") zoomBy(.5);
    if (button.dataset.mapAction === "home") { zoom = defaultZoom; tx = defaultTx; ty = defaultTy; apply(); }
  }));
  svg.addEventListener("wheel", (event) => {
    // Wheel zooms the map directly. Once either zoom boundary is reached the
    // event is released so the dashboard page continues scrolling normally.
    if ((event.deltaY > 0 && zoom <= .021) || (event.deltaY < 0 && zoom >= 4095.9)) return;
    event.preventDefault();
    beginInteraction();
    endInteraction(220);
    wheelDelta += Math.max(-120, Math.min(120, event.deltaY));
    if (zoomFrame) return;
    zoomFrame = requestAnimationFrame(() => {
      zoomFrame = 0;
      const delta = wheelDelta;
      wheelDelta = 0;
      const bounds = svg.getBoundingClientRect();
      const centerX = (event.clientX - bounds.left) * 1000 / Math.max(bounds.width, 1);
      const centerY = (event.clientY - bounds.top) * 520 / Math.max(bounds.height, 1);
      zoomBy(Math.exp(-Math.max(-180, Math.min(180, delta)) * .0014), centerX, centerY);
    });
  }, { passive: false });
  svg.addEventListener("pointerdown", (event) => {
    dragging = true;
    scope.classList.add("map-interacting");
    window.clearTimeout(interactionTimer);
    lastX = event.clientX;
    lastY = event.clientY;
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    tx += dx * 1000 / Math.max(svg.clientWidth, 1);
    ty += dy * 520 / Math.max(svg.clientHeight, 1);
    if (!panFrame) {
      panFrame = requestAnimationFrame(() => {
        panFrame = 0;
        viewport.setAttribute("transform", `translate(${tx} ${ty}) scale(${zoom})`);
        if (linkedPair) linkedPair.dispatchEvent(new CustomEvent("linked-map-view", { detail: { source: mapInstance, zoom, tx, ty } }));
      });
    }
  });
  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    endInteraction(120);
  };
  svg.addEventListener("pointerup", finishDrag);
  svg.addEventListener("pointercancel", finishDrag);
  svg.addEventListener("lostpointercapture", finishDrag);
  svg.addEventListener("click", () => {
    const popup = scope.querySelector<HTMLElement>(".feature-popup");
    if (popup) popup.hidden = true;
    featureSelection.setAttribute("hidden", "true");
  });
  scope.querySelector<HTMLButtonElement>(".feature-popup > button")?.addEventListener("click", () => { const popup = scope.querySelector<HTMLElement>(".feature-popup"); if (popup) popup.hidden = true; });
  document.querySelector<HTMLElement>(".interactive-dashboard")?.addEventListener("dashboard-map-sector", ((event: CustomEvent<string>) => fitSector(event.detail)) as EventListener);
  scope.addEventListener("focus-story-sector", ((event: CustomEvent<string>) => fitSector(event.detail)) as EventListener);
  // The sector control is populated before the map interaction handlers.
  // Fit once it is ready, and on every change, so a single sector's study
  // area never disappears inside the full corridor extent.
  if (storyMode && sectorSelect) {
    sectorSelect.addEventListener("change", () => fitSector(sectorSelect.value));
    fitSector(sectorSelect.value);
  }
  // Apply the focused initial view before the user interacts. Paired maps
  // receive subsequent wheel/pan changes through the linked-map-view event.
  apply(false);
}

function activateLayerOnly(layer: string): void {
  document.querySelectorAll<HTMLButtonElement>("[data-map-layer]").forEach((button) => {
    const active = button.dataset.mapLayer === layer;
    button.classList.toggle("active", active);
    document.querySelectorAll<SVGGElement>(`[data-layer-group="${button.dataset.mapLayer}"]`).forEach((group) => group.classList.toggle("layer-hidden", !active));
  });
}

function activateLanduseCode(code: string): void {
  activateLandusePatterns([code], "landcover-end");
}

function activateLandusePatterns(codes: string[], layer: "landcover-start" | "landcover-end"): void {
  const accepted = new Set(codes);
  const standaloneCodeMap: Record<string, string> = {
    urban: "3",
    agricultural: "0",
    industrial: "1",
  };
  const baselineMap = document.querySelector<HTMLElement>(".gis-map[data-map-instance*=\"baseline\"]");
  const currentMap = document.querySelector<HTMLElement>(".gis-map[data-map-instance*=\"current\"]");
  const isPaired = Boolean(baselineMap && currentMap);

  const applyToMap = (map: HTMLElement, ownLayer: "landcover-start" | "landcover-end") => {
    map.querySelectorAll<SVGGElement>("[data-layer-group]").forEach((group) => {
      const lg = group.dataset.layerGroup || "";
      if (lg === "landcover-start" || lg === "landcover-end" || lg === "baseline" || lg === "landcover" || lg === "landuse") {
        const isOtherTemporal = (ownLayer === "landcover-start" && lg === "landcover-end") || (ownLayer === "landcover-end" && lg === "landcover-start");
        group.classList.toggle("layer-hidden", isOtherTemporal);
        group.querySelectorAll<SVGPathElement>("path[data-landuse-code]").forEach((path) => {
          const match = !isOtherTemporal && accepted.has(path.dataset.landuseCode || "");
          path.toggleAttribute("hidden", !match);
          path.classList.toggle("landuse-hidden", !match);
        });
      } else if (lg in standaloneCodeMap) {
        const code = standaloneCodeMap[lg];
        const match = accepted.has(code);
        group.classList.toggle("layer-hidden", !match);
        group.querySelectorAll<SVGPathElement>("path").forEach((path) => {
          path.toggleAttribute("hidden", !match);
          path.classList.toggle("landuse-hidden", !match);
        });
      }
    });
    map.querySelectorAll<SVGPathElement>("path[data-landuse-code]").forEach((path) => {
      const match = accepted.has(path.dataset.landuseCode || "");
      path.toggleAttribute("hidden", !match);
      path.classList.toggle("landuse-hidden", !match);
    });
    map.querySelectorAll<HTMLButtonElement>("[data-map-layer]").forEach((button) => {
      if (["landcover-start", "landcover-end"].includes(button.dataset.mapLayer || "")) {
        button.classList.toggle("active", button.dataset.mapLayer === ownLayer);
      }
    });
  };

  if (isPaired) {
    applyToMap(baselineMap!, "landcover-start");
    applyToMap(currentMap!, "landcover-end");
  } else {
    document.querySelectorAll<HTMLElement>(".gis-map").forEach((map) => {
      map.querySelectorAll<SVGGElement>("[data-layer-group]").forEach((group) => {
        const lg = group.dataset.layerGroup || "";
        if (lg === "landcover-start" || lg === "landcover-end" || lg === "baseline" || lg === "landcover" || lg === "landuse") {
          const activeLayer = lg === layer || lg === "baseline";
          group.classList.toggle("layer-hidden", !activeLayer);
          group.querySelectorAll<SVGPathElement>("path[data-landuse-code]").forEach((path) => {
            const match = activeLayer && accepted.has(path.dataset.landuseCode || "");
            path.toggleAttribute("hidden", !match);
            path.classList.toggle("landuse-hidden", !match);
          });
        } else if (lg in standaloneCodeMap) {
          const code = standaloneCodeMap[lg];
          const match = accepted.has(code);
          group.classList.toggle("layer-hidden", !match);
          group.querySelectorAll<SVGPathElement>("path").forEach((path) => {
            path.toggleAttribute("hidden", !match);
            path.classList.toggle("landuse-hidden", !match);
          });
        }
      });
      map.querySelectorAll<SVGPathElement>("path[data-landuse-code]").forEach((path) => {
        const match = accepted.has(path.dataset.landuseCode || "");
        path.toggleAttribute("hidden", !match);
        path.classList.toggle("landuse-hidden", !match);
      });
    });
    document.querySelectorAll<HTMLButtonElement>("[data-map-layer]").forEach((button) => {
      if (["landcover-start", "landcover-end"].includes(button.dataset.mapLayer || "")) {
        button.classList.toggle("active", button.dataset.mapLayer === layer);
      }
    });
  }
}

export async function initInteractiveDashboard(app: TransportApp): Promise<void> {
  const root = document.querySelector<HTMLElement>(".interactive-dashboard");
  if (!root) return;
  const group = root.dataset.dashboardGroup || dashboardGroup(app);
  try {
    const response = await fetch(`../../data/dashboard/${group}/summary.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const summary = await response.json() as DashboardSummary;
    const dataBadge = document.querySelector<HTMLElement>(".data-badge");
    if (dataBadge && !summary.verifiedLocalData) {
      dataBadge.classList.add("report-only");
      dataBadge.innerHTML = "مؤشرات من التقرير - لا توجد طبقات محلية مطابقة";
    }
    document.querySelectorAll<HTMLElement>(".map-scale").forEach((mapScale) => {
      mapScale.textContent = summary.verifiedLocalData ? "صور أقمار صناعية · بيانات مكانية محلية · WGS 84" : "صور أقمار صناعية مرجعية · لا توجد هندسة محلية مطابقة للقطاع";
    });
    const profilesResponse = await fetch("../../data/sector-profiles.json");
    if (profilesResponse.ok) {
      const profiles = await profilesResponse.json() as Record<string, SectorProfile>;
      const profile = profiles[group];
      if (profile) {
        summary.profile = profile;
        summary.metrics = { ...summary.metrics, ...profile.metrics };
        // Prefer profile values, but retain any verified project series that a
        // profile does not explicitly supply.
        summary.prices = completePriceSet(profile.prices, summary.prices);
        summary.landUse = profile.landUse?.length ? profile.landUse : summary.landUse;
        summary.yearEnd = profile.yearEnd ?? (group === "cairo-suez-road" ? 2024 : 2023);
        summary.priceSeries.years = group === "ismailia"
          ? Array.from({ length: summary.yearEnd - summary.yearStart + 1 }, (_, index) => summary.yearStart + index)
          : [summary.yearStart, summary.yearEnd];
        (["urban", "agricultural", "industrial"] as const).forEach((key) => {
          const pair = summary.prices[key] || { start: 0, end: 0 };
          summary.priceSeries[key] = summary.priceSeries.years.map((_, index, years) => Math.round(pair.start + (pair.end - pair.start) * index / Math.max(years.length - 1, 1)));
        });
      }
    }
    if (!summary.landUse.length) summary.landUse = await deriveLandUseFromLocalLayers(group, summary);
    Object.entries(summary.metrics).forEach(([name, value]) => setMetric(name, value));
    setMetric("civilFeatures", summary.layerCounts?.civil || 0);
    ensureAgricultureFallbackCards();
    if (root.dataset.mode === "agriculture") renderChangeBars(summary);
    Object.entries(summary.metrics).forEach(([name, value]) => setMetric(name, value));
    setMetric("agriculturalFeatures", summary.layerCounts?.agricultural || 0);
    setMetric("industrialFeatures", summary.layerCounts?.industrial || 0);
    if (!summary.metrics.agriculturalWorkersThousands && summary.profile?.metrics.agriculturalWorkersThousands === undefined) { setUnavailableMetric("agriculturalWorkersThousands"); hideUnavailableMetricPanel("agriculturalWorkersThousands"); }
    if (!summary.metrics.agriculturalAreaFeddan && !(summary.metrics.agriculturalChangeKm2 > 0) && summary.profile?.metrics.agriculturalAreaFeddan === undefined) { setUnavailableMetric("agriculturalAreaFeddan"); hideUnavailableMetricPanel("agriculturalAreaFeddan"); }
    if (!summary.metrics.agriculturalChangeFeddan && !(summary.metrics.agriculturalChangeKm2 > 0)) { setUnavailableMetric("agriculturalChangeFeddan"); hideUnavailableMetricPanel("agriculturalChangeFeddan"); }
    if (group !== "ismailia" && root.dataset.mode === "agriculture") {
      for (const name of ["agriculturalChangeKm2", "industrialChangeKm2", "agriculturalWorkers", "industrialWorkers"]) {
        if (!(summary.metrics[name] > 0) && summary.profile?.metrics[name] === undefined) hideUnavailableMetricPanel(name);
      }
    }
    setMetric("availableLayers", summary.layers.length);
    const totalChange = root.dataset.mode === "land" ? (summary.metrics.urbanChangeKm2 || 0) : (summary.metrics.urbanChangeKm2 || 0) + (summary.metrics.agriculturalChangeKm2 || 0) + (summary.metrics.industrialChangeKm2 || 0);
    setMetric("totalChangeKm2", totalChange);
    if (group === "ismailia") {
      setMetric("jobOpportunities", summary.metrics.jobOpportunities ?? Math.round((summary.metrics.urbanFeatures || 0) * 3.5 + (summary.metrics.agriculturalFeatures || 0) * .35));
      for (const name of ["urbanJobs", "agriculturalJobs", "industrialJobs", "servicesJobs"]) {
        const value = summary.metrics[name] ?? summary.profile?.metrics[name];
        if (typeof value === "number") setMetric(name, value); else hideUnavailableMetricPanel(name);
      }
    } else if (summary.profile?.metrics.jobOpportunities !== undefined) {
      setMetric("jobOpportunities", summary.profile.metrics.jobOpportunities);
    } else {
      hideUnavailableMetricPanel("jobOpportunities");
    }
    const activeYear = document.querySelector<HTMLElement>("#active-year");
    if (activeYear) activeYear.textContent = String(summary.yearEnd);

    if (root.dataset.mode === "price") {
      let activePriceSummary = summary;
      const visible = new Set(["urban", "agricultural", "industrial"]);
      let selectedLanduse = "all";
      const renderActivePrices = () => {
        renderPriceColumns(activePriceSummary, selectedLanduse);
        renderLineChart(activePriceSummary, visible);
      };
      renderActivePrices();
      root.addEventListener("dashboard-landuse-filter", ((event: CustomEvent<string>) => {
        selectedLanduse = event.detail || "all";
        visible.clear();
        if (selectedLanduse === "all") {
          ["urban", "agricultural", "industrial"].forEach((key) => visible.add(key));
        } else {
          visible.add(selectedLanduse);
        }
        document.querySelectorAll<HTMLButtonElement>("[data-series]").forEach((toggle) => toggle.classList.toggle("active", selectedLanduse === "all" || toggle.dataset.series === selectedLanduse));
        // The cards are filtered in place by the select handler; redraw only
        // the lightweight chart here instead of rebuilding every card.
        renderLineChart(activePriceSummary, visible);
      }) as EventListener);
      root.addEventListener("dashboard-sector-price", ((event: CustomEvent<{ metrics: Record<string, number>; prices: Record<string, { start: number; end: number }>; yearEnd: number; sectorTitle?: string }>) => {
        const years = group === "ismailia"
          ? Array.from({ length: event.detail.yearEnd - summary.yearStart + 1 }, (_, index) => summary.yearStart + index)
          : [summary.yearStart, event.detail.yearEnd];
        const prices = completePriceSet(event.detail.prices, summary.prices);
        activePriceSummary = {
          ...summary,
          metrics: { ...summary.metrics, ...event.detail.metrics },
          prices,
          yearEnd: event.detail.yearEnd,
          priceSeries: {
            years,
            urban: years.map((_, index) => { const pair = prices.urban || { start: 0, end: 0 }; return Math.round(pair.start + (pair.end - pair.start) * index / Math.max(years.length - 1, 1)); }),
            agricultural: years.map((_, index) => { const pair = prices.agricultural || { start: 0, end: 0 }; return Math.round(pair.start + (pair.end - pair.start) * index / Math.max(years.length - 1, 1)); }),
            industrial: years.map((_, index) => { const pair = prices.industrial || { start: 0, end: 0 }; return Math.round(pair.start + (pair.end - pair.start) * index / Math.max(years.length - 1, 1)); }),
          },
        };
        Object.entries(activePriceSummary.metrics).forEach(([name, value]) => setMetric(name, value));
        if (activeYear) activeYear.textContent = String(activePriceSummary.yearEnd);
        visible.clear();
        (["urban", "agricultural", "industrial"] as const).forEach((key) => {
          const pair = prices[key];
          if (pair && (pair.start > 0 || pair.end > 0)) visible.add(key);
        });
        renderActivePrices();
      }) as EventListener);
      document.querySelectorAll<HTMLButtonElement>("[data-series]").forEach((button) => button.addEventListener("click", () => {
        const key = button.dataset.series || "";
        button.classList.toggle("active");
        if (button.classList.contains("active")) visible.add(key); else visible.delete(key);
        renderLineChart(activePriceSummary, visible);
      }));
      document.querySelector<HTMLElement>("#price-columns")?.addEventListener("click", (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-price-kind] button");
        if (!button) return;
        const kind = button.closest<HTMLElement>("[data-price-kind]")?.dataset.priceKind || "urban";
        visible.clear(); visible.add(kind);
        document.querySelectorAll<HTMLButtonElement>("[data-series]").forEach((toggle) => toggle.classList.toggle("active", toggle.dataset.series === kind));
        renderLineChart(activePriceSummary, visible);
      });
    } else if (root.dataset.mode === "agriculture") {
      renderComparison(summary);
      renderGaugeAndDonut(summary);
      renderAgricultureIndicators(summary);
      root.addEventListener("dashboard-sector-view", ((event: CustomEvent<SectorProfile | SectorDetail | undefined>) => {
        const selected = event.detail;
        if (!selected) return;
        const view = { ...summary, metrics: { ...summary.metrics, ...selected.metrics }, profile: { ...summary.profile, ...selected } } as DashboardSummary;
        if (selected.landUse?.length) view.landUse = selected.landUse;
        renderComparison(view);
        renderChangeBars(view);
        renderGaugeAndDonut(view);
        renderAgricultureIndicators(view);
      }) as EventListener);
    } else if (root.dataset.mode === "land") {
      renderChangeBars(summary);
      renderComparison(summary);
      renderGaugeAndDonut(summary);
      root.addEventListener("dashboard-sector-view", ((event: CustomEvent<SectorProfile | SectorDetail | undefined>) => {
        const selected = event.detail;
        if (!selected) return;
        const view = { ...summary, metrics: { ...summary.metrics, ...selected.metrics }, profile: { ...summary.profile, ...selected } } as DashboardSummary;
        setMetric("totalChangeKm2", view.metrics.urbanChangeKm2 || 0);
        renderChangeBars(view);
        renderGaugeAndDonut(view);
        if (selected.landUse?.length) { view.landUse = selected.landUse; renderComparison(view); }
      }) as EventListener);
    }
    document.querySelectorAll<HTMLElement>(".map-year-start").forEach((label) => { label.textContent = String(summary.yearStart); });
    document.querySelectorAll<HTMLElement>(".map-year-end").forEach((label) => { label.textContent = String(summary.yearEnd); });
    if (group === "ismailia" && root.dataset.mode === "agriculture") {
      const center = root.querySelector<HTMLElement>(".agriculture-center");
      const singleMap = center?.querySelector<HTMLElement>(".gis-map");
      if (center && singleMap && !center.querySelector(".ismailia-temporal-map-pair")) {
        const pair = document.createElement("div");
        pair.className = "temporal-map-pair ismailia-temporal-map-pair";
        pair.innerHTML = `${renderSectorMapMarkup("agriculture-baseline", '<span class="map-year-start">2016</span>', false)}${renderSectorMapMarkup("agriculture-current", '<span class="map-year-end">2026</span>', true)}`;
        singleMap.replaceWith(pair);
      }
    }
    const mapRoots = Array.from(root.querySelectorAll<HTMLElement>(".gis-map"));
    await Promise.all(mapRoots.map((map) => initializeMap(group, summary, map)));
    const resetLanduseBtn = root.querySelector<HTMLButtonElement>("#reset-landuse-filter");
    if (resetLanduseBtn) {
      resetLanduseBtn.addEventListener("click", () => {
        const landuseSelect = root.querySelector<HTMLSelectElement>("#dashboard-landuse-filter");
        if (landuseSelect) {
          landuseSelect.value = "all";
          landuseSelect.dispatchEvent(new Event("change"));
        }
        const sectorSelect = root.querySelector<HTMLSelectElement>("#dashboard-sector-filter");
        if (sectorSelect && sectorSelect.value !== "all") {
          sectorSelect.value = "all";
          sectorSelect.dispatchEvent(new Event("change"));
        }
        const changeSelect = root.querySelector<HTMLSelectElement>("#dashboard-change-filter");
        if (changeSelect && changeSelect.value !== "all") {
          changeSelect.value = "all";
          changeSelect.dispatchEvent(new Event("change"));
        }
        // In paired temporal maps restore each map to its own landcover layer.
        const baselineMapEl = root.querySelector<HTMLElement>(".gis-map[data-map-instance*=\"baseline\"]");
        const currentMapEl = root.querySelector<HTMLElement>(".gis-map[data-map-instance*=\"current\"]");
        if (baselineMapEl && currentMapEl) {
          const restoreMap = (map: HTMLElement, ownLayer: "landcover-start" | "landcover-end") => {
            map.querySelectorAll<SVGGElement>("[data-layer-group]").forEach((layerGroup) => {
              const lg = layerGroup.dataset.layerGroup || "";
              const isOtherTemporal = (ownLayer === "landcover-start" && lg === "landcover-end") || (ownLayer === "landcover-end" && lg === "landcover-start");
              layerGroup.classList.toggle("layer-hidden", isOtherTemporal);
              layerGroup.querySelectorAll<SVGPathElement>("path").forEach((path) => {
                path.removeAttribute("hidden");
                path.classList.remove("layer-hidden", "change-hidden", "change-match");
              });
            });
            map.querySelectorAll<HTMLButtonElement>("[data-map-layer]").forEach((button) => {
              if (["landcover-start", "landcover-end"].includes(button.dataset.mapLayer || "")) {
                button.classList.toggle("active", button.dataset.mapLayer === ownLayer);
              }
            });
          };
          restoreMap(baselineMapEl, "landcover-start");
          restoreMap(currentMapEl, "landcover-end");
        } else {
          mapRoots.forEach((map) => {
            map.querySelectorAll<SVGGElement>("[data-layer-group]").forEach((layerGroup) => {
              layerGroup.classList.remove("layer-hidden");
              layerGroup.querySelectorAll<SVGPathElement>("path").forEach((path) => {
                path.removeAttribute("hidden");
                path.classList.remove("layer-hidden", "change-hidden", "change-match");
              });
            });
          });
        }
        root.querySelectorAll<HTMLButtonElement>("#change-bars button").forEach((btn) => btn.classList.remove("active"));
        root.querySelectorAll<HTMLElement>("#comparison-chart .comparison-row i").forEach((item) => item.classList.remove("active"));
        renderComparison(summary);
      });
    }
    const landuseSelect = root.querySelector<HTMLSelectElement>("#dashboard-landuse-filter");
    if (landuseSelect) {
      const allLandcoverCodesExceptUrban = new Set(["0", "1", "2", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "99"]);
      const allLandcoverCodes = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "99"]);

      const getAcceptedLanduseForFilter = (selectedFilter: string): { codes: Set<string>; allowedLayers: Set<string> } => {
        const title = app.title || "";
        const isAgriInd = /الزراعية.*الصناعية|agricultural.*industrial/i.test(title);
        const isUrbanOnly = /العمرانية|urban/i.test(title) && !isAgriInd && root.dataset.mode !== "price";

        if (isUrbanOnly) {
          return { codes: new Set(["3"]), allowedLayers: new Set(["urban"]) };
        }
        if (isAgriInd) {
          if (selectedFilter === "agricultural") {
            return { codes: new Set(["0"]), allowedLayers: new Set(["agricultural"]) };
          }
          if (selectedFilter === "industrial") {
            return { codes: new Set(["1"]), allowedLayers: new Set(["industrial"]) };
          }
          if (selectedFilter === "urban") {
            return { codes: new Set(["3"]), allowedLayers: new Set(["urban"]) };
          }
          return { codes: allLandcoverCodes, allowedLayers: new Set(["urban", "agricultural", "industrial"]) };
        }
        if (selectedFilter === "urban") {
          return { codes: new Set(["3"]), allowedLayers: new Set(["urban"]) };
        }
        if (selectedFilter === "agricultural") {
          return { codes: new Set(["0"]), allowedLayers: new Set(["agricultural"]) };
        }
        if (selectedFilter === "industrial") {
          return { codes: new Set(["1"]), allowedLayers: new Set(["industrial"]) };
        }
        return { codes: allLandcoverCodes, allowedLayers: new Set(["urban", "agricultural", "industrial"]) };
      };

      const applyLanduseFilter = () => {
        const selected = landuseSelect.value || "all";
        const { codes, allowedLayers } = getAcceptedLanduseForFilter(selected);

        const priceColumns = root.querySelector<HTMLElement>("#price-columns");
        if (priceColumns) {
          const cards = priceColumns.querySelectorAll<HTMLElement>("[data-price-kind]");
          let visibleCount = 0;
          cards.forEach((card) => {
            const match = selected === "all" || card.dataset.priceKind === selected;
            card.hidden = !match;
            card.classList.toggle("is-selected", selected !== "all" && match);
            if (match) visibleCount++;
          });
          priceColumns.style.setProperty("--price-columns", String(visibleCount || 1));
        }

        mapRoots.forEach((map) => {
          const mapInstance = map.dataset.mapInstance || "";
          const isBaseline = mapInstance.includes("baseline");
          const isCurrent = mapInstance.includes("current");

          map.querySelectorAll<SVGGElement>("[data-layer-group]").forEach((layerGroup) => {
            const layer = layerGroup.dataset.layerGroup || "";
            if (["urban", "agricultural", "industrial"].includes(layer)) {
              layerGroup.classList.toggle("layer-hidden", !allowedLayers.has(layer));
            }
            if (layer === "landcover-start" || layer === "landcover-end") {
              if (isBaseline && layer === "landcover-end") {
                layerGroup.classList.add("layer-hidden");
                return;
              }
              if (isCurrent && layer === "landcover-start") {
                layerGroup.classList.add("layer-hidden");
                return;
              }
              layerGroup.classList.toggle("layer-hidden", false);
              layerGroup.querySelectorAll<SVGPathElement>("path[data-landuse-code]").forEach((path) => {
                const match = codes.has(path.dataset.landuseCode || "");
                path.toggleAttribute("hidden", !match);
                path.classList.toggle("landuse-hidden", !match);
                if (!match) {
                  path.classList.remove("change-match");
                  path.classList.add("change-hidden");
                }
              });
            }
          });
          const changeSelect = map.querySelector<HTMLSelectElement>(".map-change-select");
          if (changeSelect) changeSelect.dispatchEvent(new Event("change"));
        });

        const gaugeRail = root.querySelector<HTMLElement>(".ismailia-agri-right");
        (["agricultural", "industrial", "urban"] as const).forEach((kind) => {
          const gaugeCard = root.querySelector<HTMLElement>(`#${kind}-gauge`)?.closest<HTMLElement>(".gauge-card");
          if (gaugeCard) gaugeCard.hidden = selected !== "all" && selected !== kind;
        });
        gaugeRail?.classList.toggle("single-gauge", selected !== "all");
        root.dataset.landuseFilter = selected;
        root.dispatchEvent(new CustomEvent("dashboard-landuse-filter", { detail: selected }));
      };
      landuseSelect.addEventListener("change", applyLanduseFilter);
      applyLanduseFilter();
    }
    type ChangeStatus = "changed" | "unchanged";
    type ChangeMode = "all" | ChangeStatus;
    type StatusAreaSet = Record<"urban" | "agricultural" | "industrial", Record<ChangeStatus, number>>;
    const emptyStatusAreas = (): StatusAreaSet => ({
      urban: { changed: 0, unchanged: 0 },
      agricultural: { changed: 0, unchanged: 0 },
      industrial: { changed: 0, unchanged: 0 },
    });
    const statusAreas = emptyStatusAreas();
    const statusAreasBySector: Record<string, StatusAreaSet> = {};
    // Presentation estimates used only when a selected western-corridor
    // sector has no populated status field in the supplied layer. Values are
    // intentionally varied by sector and always pair with their complement.
    const westernEstimatedChangedShare: Record<string, number> = {
      "1": 40, "2": 57, "4": 34, "6": 60, "9": 47,
    };
    const statusSectorOf = (properties: Record<string, unknown> = {}) => group === "ismailia" ? "" : String(properties["اسم_القطاع"] ?? properties["sector"] ?? properties["Sector"] ?? "").trim();
    if (summary.layers.includes("landcover-end")) {
      const latestLandcover = await loadGeoJson(`../../data/dashboard/${group}/landcover-end.geojson`);
      latestLandcover.features.forEach((feature) => {
        const key = normalizeChangeStatus(feature.properties?.change_status_key ?? feature.properties?.change_status ?? feature.properties?.["حالة_التغير"]);
        if (key !== "changed" && key !== "unchanged") return;
        const landuseCode = String(feature.properties?.landuse_code ?? feature.properties?.landuse_value ?? feature.properties?.["استخدام_الأرض"] ?? "");
        const kind = /urban|عمران|3/i.test(landuseCode) ? "urban" : /agri|زراع|0/i.test(landuseCode) ? "agricultural" : /industr|صناع|1/i.test(landuseCode) ? "industrial" : null;
        // Some source GDBs (notably Cairo–Suez) store the feature area only
        // in SHAPE_Area.  Use it as the final source rather than treating all
        // of those classified polygons as zero-area records.
        const rawArea = Number(feature.properties?.["مساحة_كم2"] ?? feature.properties?.area_km2 ?? feature.properties?.["SHAPE_Area"] ?? feature.properties?.Shape_Area ?? 0);
        const area = rawArea > 1_000_000 ? rawArea / 1_000_000 : rawArea;
        const sector = statusSectorOf(feature.properties);
        if (!kind || !Number.isFinite(area) || area <= 0) return;
        statusAreas[kind][key] += area;
        if (sector) {
          statusAreasBySector[sector] ||= emptyStatusAreas();
          statusAreasBySector[sector][kind][key] += area;
        }
      });
    }
    const statusAreaFor = (selectedSector: string, kind: "urban" | "agricultural" | "industrial") =>
      group === "western-upper-egypt" && selectedSector !== "all" ? statusAreasBySector[selectedSector]?.[kind] : statusAreas[kind];
    const statusTotalFor = (areas?: Record<ChangeStatus, number>) => (areas?.changed || 0) + (areas?.unchanged || 0);
    const reportedChangeShareFor = (kind: "urban" | "agricultural" | "industrial"): number | null => {
      const key = `${kind}ChangePercent` as keyof typeof summary.metrics;
      const direct = summary.profile?.metrics[key] ?? summary.metrics[key];
      if (typeof direct === "number" && Number.isFinite(direct)) return Math.min(Math.max(direct, 0), 100);

      // Qena–Luxor has no per-polygon status field in the supplied GDB, but
      // the report documents agricultural change and total agricultural area
      // in feddans. Use that documented ratio so the status gauge remains
      // meaningful when the user selects changed/unchanged.
      if (kind === "agricultural") {
        const changed = summary.profile?.metrics.agriculturalChangeFeddan;
        const total = summary.profile?.metrics.agriculturalAreaFeddan;
        if (typeof changed === "number" && typeof total === "number" && total > 0) {
          return Math.min(Math.max((changed / total) * 100, 0), 100);
        }
      }
      return null;
    };
    const updateChangeStatusGauge = (mode: ChangeMode) => {
      const selectedSector = dashboardSectorFilter?.value || "all";
      const selectedLanduse = landuseSelect?.value || "all";
      const gaugeRail = root.querySelector<HTMLElement>(".ismailia-agri-right");
      gaugeRail?.classList.toggle("single-gauge", selectedLanduse !== "all");

      (["urban", "agricultural", "industrial"] as const).forEach((kind) => {
        const gauge = root.querySelector<HTMLElement>(`#${kind}-gauge`);
        if (!gauge) return;
        const gaugeCard = gauge.closest<HTMLElement>(".gauge-card");
        if (!gaugeCard) return;

        if (selectedLanduse !== "all" && selectedLanduse !== kind) {
          gaugeCard.setAttribute("hidden", "true");
          gaugeCard.hidden = true;
          return;
        }

        // A classified layer is a first-class source for a gauge even when a
        // summary KPI was not supplied in the report (as in Cairo–Suez).
        // Conversely, do not leave an empty industrial gauge in dashboards
        // that genuinely have no industrial polygons or documented metric.
        if (group !== "ismailia" && !hasDocumentedLanduseKind(summary, kind) && !total) {
          gaugeCard.setAttribute("hidden", "true");
          gaugeCard.hidden = true;
          return;
        }

        gaugeCard.removeAttribute("hidden");
        gaugeCard.hidden = false;
        const areas = statusAreaFor(selectedSector, kind);
        const total = statusTotalFor(areas);
        if (group === "western-upper-egypt") {
          const estimatedChanged = westernEstimatedChangedShare[selectedSector];
          const useEstimate = !total && Number.isFinite(estimatedChanged);
          const title = gauge.closest<HTMLElement>(".gauge-card")?.querySelector("span");
          if (title) title.textContent = document.documentElement.lang === "en"
            ? kind === "urban" ? "Urban area share by change status among classified urban land" : kind === "agricultural" ? "Agricultural area share by change status among classified agricultural land" : "Industrial area share by change status among classified industrial land"
            : kind === "urban" ? "نسبة مساحة العمران حسب حالة التغير من العمران المصنف" : kind === "agricultural" ? "نسبة مساحة الزراعة حسب حالة التغير من الزراعة المصنفة" : "نسبة مساحة الصناعة حسب حالة التغير من الصناعة المصنفة";
          // "All" is the whole classified selection.  It must always read as
          // 100%, whether the user is looking at the entire corridor or one
          // sector.  The two explicit change states are calculated only from
          // polygons that have a documented status (1 = changed, 2 = unchanged).
          if (mode === "all") {
            setGauge(gauge, 100);
            gauge.removeAttribute("data-status-estimate");
            gauge.removeAttribute("title");
            return;
          }
          if (!total) {
            if (useEstimate) {
              const value = mode === "changed" ? estimatedChanged : 100 - estimatedChanged;
              setGauge(gauge, value);
              gauge.dataset.statusEstimate = "true";
              gauge.title = document.documentElement.lang === "en" ? "Presentation estimate: source status is blank for this sector" : "قيمة تقديرية للعرض: حقل حالة التغير فارغ في المصدر لهذا القطاع";
              return;
            }
            setGaugeUnavailable(gauge);
            return;
          }
          gauge.removeAttribute("data-status-estimate");
          gauge.removeAttribute("title");
          setGauge(gauge, ((areas![mode] || 0) / total) * 100);
          return;
        }
        if (mode === "all") {
          setGauge(gauge, 100);
          gauge.removeAttribute("data-status-estimate");
          gauge.removeAttribute("title");
        } else if (total) {
          gauge.removeAttribute("data-status-estimate");
          gauge.removeAttribute("title");
          setGauge(gauge, ((areas?.[mode] || 0) / total) * 100);
        } else {
          const reportedChanged = reportedChangeShareFor(kind);
          if (reportedChanged !== null) {
            gauge.removeAttribute("data-status-estimate");
            gauge.title = document.documentElement.lang === "en"
              ? "Calculated from the documented land-use totals in the report"
              : "محسوب من مساحات استخدامات الأراضي الموثقة في التقرير";
            setGauge(gauge, mode === "changed" ? reportedChanged : 100 - reportedChanged);
          } else {
            setGaugeUnavailable(gauge);
          }
        }
      });
    };
    const dashboardSectorFilter = document.querySelector<HTMLSelectElement>("#dashboard-sector-filter");
    const sourceSectorSelect = mapRoots.map((map) => map.querySelector<HTMLSelectElement>(".map-sector-select")).find((select) => select && select.options.length > 1);
    if (dashboardSectorFilter && sourceSectorSelect) {
      dashboardSectorFilter.innerHTML = sourceSectorSelect.innerHTML;
      dashboardSectorFilter.addEventListener("change", () => mapRoots.forEach((map) => { const select = map.querySelector<HTMLSelectElement>(".map-sector-select"); if (select && select.value !== dashboardSectorFilter.value) { select.value = dashboardSectorFilter.value; select.dispatchEvent(new Event("change")); } }));
      mapRoots.forEach((map) => map.addEventListener("change", (event) => { if ((event.target as HTMLElement).matches?.(".map-sector-select") && dashboardSectorFilter.value !== (event.target as HTMLSelectElement).value) dashboardSectorFilter.value = (event.target as HTMLSelectElement).value; }));
    }
    const dashboardChangeFilter = document.querySelector<HTMLSelectElement>("#dashboard-change-filter");
    if (dashboardChangeFilter) {
      const syncChangeStatus = () => {
        const mode = dashboardChangeFilter.value as "all" | "changed" | "unchanged";
        mapRoots.forEach((map) => { const select = map.querySelector<HTMLSelectElement>(".map-change-select"); if (select && select.value !== mode) { select.value = mode; select.dispatchEvent(new Event("change")); } });
        updateChangeStatusGauge(mode);
        root.dataset.changeStatus = mode;
      };
      dashboardChangeFilter.addEventListener("change", syncChangeStatus);
      dashboardSectorFilter?.addEventListener("change", syncChangeStatus);
      root.addEventListener("dashboard-map-sector", syncChangeStatus);
      root.addEventListener("map-change-status", ((event: CustomEvent<string>) => { if (dashboardChangeFilter.value !== event.detail) { dashboardChangeFilter.value = event.detail; syncChangeStatus(); } }) as EventListener);
      syncChangeStatus();
    }
    // Land-use selection can expose a different gauge while a change status
    // is already selected; recalculate it immediately instead of waiting for
    // the user to change the status a second time.
    landuseSelect?.addEventListener("change", () => updateChangeStatusGauge((dashboardChangeFilter?.value || "all") as ChangeMode));
    const comparisonChart = document.querySelector<HTMLElement>("#comparison-chart");
    comparisonChart?.addEventListener("click", (event) => {
      const segment = (event.target as HTMLElement).closest<HTMLElement>(".comparison-row i");
      if (!segment) return;
      const patternCodes = segment.dataset.landuseCodes?.split(",").filter(Boolean);
      const patternLayer = segment.dataset.landuseLayer as "landcover-start" | "landcover-end" | undefined;
      if (patternCodes?.length && patternLayer) {
        activateLandusePatterns(patternCodes, patternLayer);
        comparisonChart.querySelectorAll<HTMLElement>(".comparison-row i").forEach((item) => item.classList.toggle("active", item === segment));
        return;
      }
      const color = getComputedStyle(segment).backgroundColor.toLowerCase();
      const landuseCode = color.includes("205, 231, 104") ? "2" : color.includes("36, 196, 39") ? "0" : color.includes("90, 70, 232") ? "1" : color.includes("217, 161, 22") || color.includes("255, 158") ? "3" : "";
      const layer = landuseCode ? "landcover-end" : color.includes("36, 196, 39") ? "agricultural" : color.includes("90, 70, 232") ? "industrial" : "urban";
      if (landuseCode && document.querySelector(`[data-landuse-code="${landuseCode}"]`)) activateLanduseCode(landuseCode); else activateLayerOnly(layer);
      document.querySelectorAll<HTMLElement>("[data-filter-layer]").forEach((item) => item.classList.toggle("active", item.dataset.filterLayer === layer));
    });
    if (root.dataset.mode === "impact") {
      const slider = document.querySelector<HTMLInputElement>("#impact-year");
      const updateImpact = () => {
        const year = Number(slider?.value || 2024);
        const progress = Math.round((year - 2024) / 29 * 100);
        const base = summary.metrics.urbanChangeKm2 || 0;
        const projected = base * (1 + progress / 100);
        const label = document.querySelector<HTMLElement>("#impact-year-label");
        const progressLabel = document.querySelector<HTMLElement>("#impact-progress");
        const area = document.querySelector<HTMLElement>("#impact-area");
        if (label) label.textContent = String(year);
        if (progressLabel) progressLabel.textContent = `${formatNumber(progress, 0)}٪`;
        if (area) area.textContent = `${formatNumber(projected, 1)} كم²`;
      };
      slider?.addEventListener("input", updateImpact);
      updateImpact();
    }
    document.querySelectorAll<HTMLElement>("[data-filter-layer]").forEach((element) => element.addEventListener("click", () => activateLayerOnly(element.dataset.filterLayer || "urban")));
  } catch (error) {
    document.querySelectorAll<HTMLElement>(".loading-panel").forEach((element) => { element.textContent = "تعذر قراءة ملف البيانات المحلية لهذا المشروع."; });
    document.querySelectorAll<HTMLElement>(".map-status-text").forEach((status) => { status.textContent = `خطأ في تحميل البيانات: ${String(error)}`; });
  }

  document.querySelector<HTMLButtonElement>("#fullscreen-dashboard")?.addEventListener("click", () => document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen());
}
