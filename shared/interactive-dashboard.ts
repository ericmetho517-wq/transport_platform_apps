import type { TransportApp } from "./project-runtime";

type LayerName = "study" | "axis" | "urban" | "agricultural" | "industrial" | "baseline" | "civil" | "landcover-start" | "landcover-end" | "buildings" | "parcels" | "landmarks" | "water" | "field-survey" | "transport" | "governorates" | "LRT_Line" | "lRT_Station" | "Metro_Line" | "Metro_Station" | "Road_CairoRing" | "Road_MiddleRing" | "Road_RegionalRing" | "Transit_GreenLine" | "Transit_KafrDawoodSadat" | "Transit_LRT" | "Transit_Metro1" | "Transit_Metro2" | "Transit_Metro3" | "Transit_Metro4" | "Transit_Metro6" | "Transit_MonorailCapital" | "Transit_MonorailOctober" | "Transit_RobikiBelbeis";

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
    <div class="map-layer-toggles"></div><label class="map-change-filter"><span>Change status</span><select class="map-change-select"><option value="all">All features</option><option value="changed">Changed</option><option value="unchanged">Unchanged</option></select></label>
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
  const isIsmailia = group === "ismailia";
  const landuseFilter = isIsmailia && isPriceDashboard(app)
    ? `<label class="dashboard-landuse-filter"><span>استخدامات الأراضي</span><select id="dashboard-landuse-filter" class="price-landuse-select"><option value="all">كل الاستخدامات</option><option value="urban">العمراني</option><option value="agricultural">الزراعي</option><option value="industrial">الصناعي</option></select></label>`
    : "";
  const sectorFilter = isIsmailia ? "" : `<label class="dashboard-sector-filter"><span>القطاعات</span><select id="dashboard-sector-filter"><option value="all">كل القطاعات</option></select></label>`;
  return `<header class="interactive-head"><div><a href="../../index.html" class="mot-badge">وزارة النقل</a><span>${esc(app.category)}</span><h1>${esc(app.title)}</h1></div><div class="dash-actions">${sectorFilter}${landuseFilter}<label class="dashboard-change-filter"><span>حالة التغير</span><select id="dashboard-change-filter"><option value="all">كل العناصر</option><option value="changed">تغير</option><option value="unchanged">لم يتغير</option></select></label><button id="fullscreen-dashboard" type="button">ملء الشاشة</button></div></header>`;
}

function priceMarkup(app: TransportApp, group: string): string {
  const westernComparison = group === "western-upper-egypt" || group === "cairo-suez-road" || group === "ismailia";
  const priceStartYear = group === "ismailia" ? 2016 : 2014;
  const priceEndYear = group === "ismailia" ? 2026 : 2024;
  const mapArea = westernComparison
    ? `<div class="temporal-map-pair price-temporal-map-pair${group === "ismailia" ? " ismailia-temporal-map-pair" : ""}">${mapMarkup("price-baseline", `<span class="map-year-start">${priceStartYear}</span>`, false)}${mapMarkup("price-current", `<span class="map-year-end">${priceEndYear}</span>`, true)}</div>`
    : mapMarkup();
  const trendArea = westernComparison ? "" : `<section class="dark-card line-chart-card"><div class="card-title"><div><span>التغير السنوي لأسعار الأراضي</span><small id="chart-year-label">اضغط على أي نقطة لاستعراض السنة</small></div><div class="series-toggles"><button class="active" data-series="urban">العمرانية</button><button class="active" data-series="agricultural">الزراعية</button><button class="active" data-series="industrial">الصناعية</button></div></div><div id="line-chart" class="svg-chart loading-panel">جارٍ إنشاء الرسم البياني…</div></section>`;
  return `<main class="interactive-dashboard price-dashboard${westernComparison ? " western-price-dashboard" : ""}" dir="${app.direction}" data-dashboard-group="${group}" data-mode="price">
    ${dashboardHeader(app, group)}
    <div class="price-layout">
      <aside class="price-columns" id="price-columns"><div class="loading-panel">جارٍ قراءة أسعار الأراضي من قاعدة بيانات المشروع…</div></aside>
      <section class="price-workspace">
        <div class="dashboard-kpis"><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article class="gold"><span>سنة القياس</span><strong id="active-year">—</strong></article></div>
        ${mapArea}
        ${trendArea}
      </section>
    </div>
  </main>`;
}

function dabaaLandMarkup(app: TransportApp, group: string): string {
  return `<main class="interactive-dashboard dabaa-land-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="agriculture">
    ${dashboardHeader(app)}
    <div class="dabaa-land-layout">
      <section class="dashboard-kpis dabaa-kpis"><article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="lime"><span>إجمالي مساحة الأراضي الزراعية المتغيرة (فدان)</span><strong data-metric="agriculturalAreaFeddan">—</strong></article><article class="gold"><span>إجمالي مساحة الأراضي العمرانية المتغيرة (كم²)</span><strong data-metric="urbanChangeKm2">—</strong></article></section>
      <section class="dabaa-center">${mapMarkup()}<section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدام الأراضي لعامي 2014 - 2023</span><select id="comparison-mode"><option value="all">كل الفئات</option><option value="top4">أكبر 4 فئات</option></select></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section></section>
      <aside class="dabaa-gauges"><section class="dark-card gauge-card"><span>نسبة مساحة التغير العمراني بمنطقة الدراسة لعام 2023</span><div class="gauge" id="urban-gauge"><i></i><strong>—</strong></div></section><section class="dark-card gauge-card"><span>نسبة مساحة التغير الزراعي بمنطقة الدراسة لعام 2023</span><div class="gauge" id="agricultural-gauge"><i></i><strong>—</strong></div></section></aside>
    </div>
  </main>`;
}

function landMarkup(app: TransportApp, group: string): string {
  return `<main class="interactive-dashboard land-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="land">
    ${dashboardHeader(app)}
    <div class="land-layout">
      <aside class="land-left"><article class="opportunity-card"><span>فرص العمل لمشروعات المباني المستحدثة</span><strong data-metric="jobOpportunities">—</strong><small>فرصة عمل تقديرية مرتبطة بمناطق التغير</small></article><section class="dark-card vertical-chart-card"><div class="card-title"><span>مناطق تغير استخدامات الأراضي</span><small>اضغط على العمود لتصفية طبقة الخريطة</small></div><div id="change-bars" class="change-bars loading-panel">جارٍ قراءة البيانات…</div></section></aside>
      <section class="land-center"><div class="dashboard-kpis"><article class="gold"><span>إجمالي مساحة الأراضي المتغيرة (كم²)</span><strong data-metric="totalChangeKm2">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article></div><div class="temporal-map-pair">${mapMarkup("land-baseline", '<span class="map-year-start">2014</span>', false)}${mapMarkup("land-current", '<span class="map-year-end">2024</span>', true)}</div><section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدامات الأراضي</span><select id="comparison-mode"><option value="all">كل الفئات</option><option value="top4">أكبر 4 فئات</option></select></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section></section>
      <aside class="land-right"><section class="dark-card gauge-card"><span>نسبة مساحة التغير العمراني من منطقة الدراسة</span><div class="gauge" id="urban-gauge"><i></i><strong>—</strong></div><small>اضغط لعرض التغير العمراني فقط</small></section><section class="dark-card donut-card"><span>توزيع مناطق التغير</span><div class="donut" id="change-donut"><strong>—</strong></div><div id="donut-legend"></div></section></aside>
    </div>
  </main>`;
}

function reportLandMarkup(app: TransportApp, group: string): string {
  return `<main class="interactive-dashboard land-dashboard report-land-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="land">
    ${dashboardHeader(app)}
    <div class="land-layout">
      <aside class="land-left"><article class="opportunity-card"><span>فرص العمل لمشروعات المباني المستحدثة</span><strong data-metric="jobOpportunities" data-metric-scale="1000">—</strong><small>ألف عامل</small></article><section class="dark-card vertical-chart-card"><div class="card-title"><span>مناطق التغير العمراني المستحدثة</span><small>اضغط على العمود لتصفية طبقة الخريطة</small></div><div id="change-bars" class="change-bars loading-panel">جارٍ قراءة البيانات…</div></section></aside>
      <section class="land-center"><div class="dashboard-kpis"><article class="gold"><span>إجمالي مساحة الأراضي العمرانية المتغيرة (كم²)</span><strong data-metric="totalChangeKm2">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article></div>${mapMarkup()}<section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدامات الأراضي: <bdi>2014</bdi> / <bdi class="map-year-end">2023</bdi></span><select id="comparison-mode"><option value="all">كل الفئات</option><option value="top4">أكبر 4 فئات</option></select></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section></section>
      <aside class="land-right"><section class="dark-card gauge-card"><span>نسبة مساحة التغير العمراني من منطقة الدراسة</span><div class="gauge" id="urban-gauge"><strong>—</strong></div><small>اضغط لعرض التغير العمراني فقط</small></section><section class="dark-card donut-card"><span>نسبة الحالة العمرانية بمناطق التغير</span><div class="donut" id="change-donut"><strong>—</strong></div><div id="donut-legend"></div></section></aside>
    </div>
  </main>`;
}

function southernAgricultureMarkup(app: TransportApp, group: string): string {
  const qena = group === "qena-luxor-road";
  const qus = group === "qus-axis";
  const rightPanels = qena
    ? `<section class="dark-card gauge-card"><span>نسبة مساحة الأراضي الزراعية من إجمالي مساحة الأراضي بالمنطقة</span><div class="gauge" id="agricultural-share-gauge"><strong>—</strong></div></section><section class="dark-card gauge-card"><span>نسبة مساحة التغير العمراني بمنطقة الدراسة</span><div class="gauge" id="urban-gauge"><strong>—</strong></div></section>`
    : qus
      ? `<section class="dark-card gauge-card"><span>نسبة مساحة التغير العمراني بمنطقة الدراسة</span><div class="gauge" id="urban-gauge"><strong>—</strong></div></section><section class="dark-card agriculture-change highlight-stat"><span>إجمالي مساحة التغير بالأراضي الزراعية (فدان)</span><strong data-metric="agriculturalChangeFeddan">—</strong></section>`
      : `<section class="dark-card gauge-card"><span>نسبة مساحة التغير الصناعي بمنطقة الدراسة</span><div class="gauge" id="industrial-gauge"><strong>—</strong></div></section><section class="dark-card gauge-card"><span>نسبة مساحة الأراضي الزراعية من إجمالي مساحة الأراضي</span><div class="gauge" id="agricultural-share-gauge"><strong>—</strong></div></section>`;
  const leftPanels = qena
    ? `<section class="dark-card crop-card"><span>نسب أنواع محاصيل الأراضي الزراعية</span><div class="crop-donut" id="crop-donut"><strong>المحاصيل</strong></div><div id="crop-legend"></div></section><section class="dark-card agriculture-change highlight-stat"><span>إجمالي مساحة التغير بالأراضي الزراعية (فدان)</span><strong data-metric="agriculturalChangeFeddan">—</strong></section>`
    : qus
      ? `<section class="dark-card crop-card"><span>نسب أنواع محاصيل الأراضي الزراعية</span><div class="crop-donut" id="crop-donut"><strong>المحاصيل</strong></div><div id="crop-legend"></div></section><section class="dark-card ownership-card"><span>نسبة ملكية الأراضي الزراعية</span><div class="ownership-donut" id="ownership-donut"><strong>الملكية</strong></div><div id="ownership-legend"></div></section>`
      : `<section class="dark-card crop-card south-crop-card"><span>نسب أنواع محاصيل الأراضي الزراعية</span><div class="crop-donut" id="crop-donut"><strong>المحاصيل</strong></div><div id="crop-legend"></div></section>`;
  return `<main class="interactive-dashboard agriculture-dashboard southern-agriculture-dashboard ${group}" dir="${app.direction}" data-dashboard-group="${group}" data-mode="agriculture">
    ${dashboardHeader(app)}
    <div class="dashboard-kpis south-agriculture-kpis"><article class="lime"><span>إجمالي مساحة الأراضي الزراعية (فدان)</span><strong data-metric="agriculturalAreaFeddan">—</strong></article><article class="lime"><span>العمالة الزراعية (بالألف)</span><strong data-metric="agriculturalWorkersThousands">—</strong></article><article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="gold"><span>إجمالي مساحة الأراضي العمرانية (كم²)</span><strong data-metric="urbanChangeKm2">—</strong></article></div>
    <div class="south-agriculture-layout"><aside class="south-agriculture-side">${leftPanels}</aside><section class="south-agriculture-center">${mapMarkup()}<section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدامات الأراضي لعامي <bdi>2014</bdi> - <bdi class="map-year-end">2023</bdi></span><select id="comparison-mode"><option value="all">كل الفئات</option><option value="top4">أكبر 4 فئات</option></select></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section></section><aside class="south-agriculture-right">${rightPanels}</aside></div>
  </main>`;
}

function agriculturalMarkup(app: TransportApp, group: string): string {
  const rawChangeData = group === "western-upper-egypt";
  if (rawChangeData) {
    return `<main class="interactive-dashboard agriculture-dashboard western-agriculture-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="agriculture">
      ${dashboardHeader(app)}
      <div class="western-agriculture-kpis dashboard-kpis">
        <article class="lime"><span>إجمالي مساحة الأراضي الزراعية (فدان)</span><strong data-metric="agriculturalAreaFeddan">—</strong></article>
        <article><span>عدد العمالة الزراعية</span><strong data-metric="agriculturalWorkers">—</strong></article>
        <article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article>
        <article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article>
        <article class="gold"><span>عدد العمالة الصناعية</span><strong data-metric="industrialWorkers">—</strong></article>
        <article class="orange"><span>إجمالي مساحة الأراضي الصناعية (كم²)</span><strong data-metric="industrialChangeKm2">—</strong></article>
      </div>
      <div class="agriculture-layout">
        <aside class="agriculture-side western-agriculture-side"><section class="dark-card crop-card"><span>نسب أنواع محاصيل الأراضي الزراعية</span><div class="crop-donut" id="crop-donut"><strong>المحاصيل</strong></div><div id="crop-legend"></div></section><section class="dark-card ownership-card"><span>نسب ملكية الأراضي الزراعية</span><div class="ownership-donut" id="ownership-donut"><strong>الملكية</strong></div><div id="ownership-legend"></div></section></aside>
        <section class="agriculture-center western-agriculture-center">${mapMarkup()}<section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدامات الأراضي: <bdi>2014</bdi> / <bdi class="map-year-end">2024</bdi></span><select id="comparison-mode"><option value="all">كل الفئات</option><option value="top4">أكبر 4 فئات</option></select></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section></section>
        <aside class="agriculture-right western-agriculture-right"><section class="dark-card gauge-card"><span>نسبة التغير بالأراضي الزراعية</span><div class="gauge" id="agricultural-gauge"><i></i><strong>—</strong></div></section><section class="dark-card gauge-card"><span>نسبة التغير بالأراضي الصناعية</span><div class="gauge" id="industrial-gauge"><i></i><strong>—</strong></div></section></aside>
      </div>
    </main>`;
  }
  const mixedLandData = /industrial|الصناعية/i.test(app.title);
  const agriculturalAreaLabel = rawChangeData ? "مساحة التغير الزراعي المحصورة (فدان)" : "إجمالي مساحة الأراضي الزراعية (فدان)";
  const urbanAreaLabel = rawChangeData ? "مساحة التغير العمراني المحصورة (كم²)" : "إجمالي مساحة الأراضي العمرانية (كم²)";
  return `<main class="interactive-dashboard agriculture-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="agriculture">
    ${dashboardHeader(app)}
    <div class="agriculture-layout">
      <aside class="agriculture-side"><section class="dark-card agriculture-stat"><span>${agriculturalAreaLabel}</span><strong data-metric="agriculturalAreaFeddan">—</strong></section><section class="dark-card agriculture-stat"><span>العمالة الزراعية (بالألف)</span><strong data-metric="agriculturalWorkersThousands">—</strong></section><section class="dark-card crop-card"><span>نسب أنواع محاصيل الأراضي الزراعية</span><div class="crop-donut" id="crop-donut"><strong>المحاصيل</strong></div><div id="crop-legend"></div></section></aside>
      <section class="agriculture-center"><div class="dashboard-kpis agriculture-kpis"><article class="gold"><span>${urbanAreaLabel}</span><strong data-metric="urbanChangeKm2">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article></div>${mapMarkup()}<section class="dark-card comparison-card"><div class="card-title"><span>مقارنة مساحات استخدامات الأراضي: <bdi>2014</bdi> / <bdi class="map-year-end">2024</bdi></span><select id="comparison-mode"><option value="all">كل الفئات</option><option value="top4">أكبر 4 فئات</option></select></div><div id="comparison-chart" class="loading-panel">جارٍ إنشاء المقارنة…</div></section></section>
      <aside class="agriculture-right"><section class="dark-card gauge-card"><span>نسبة التغير العمراني بمنطقة الدراسة</span><div class="gauge" id="urban-gauge"><i></i><strong>—</strong></div></section><section class="dark-card agriculture-change"><span>إجمالي مساحة التغير بالأراضي الزراعية (فدان)</span><strong data-metric="agriculturalChangeFeddan">—</strong></section>${mixedLandData ? '<section class="dark-card agriculture-change"><span>إجمالي مساحة الأراضي الصناعية المتغيرة (كم²)</span><strong data-metric="industrialChangeKm2">—</strong></section>' : ''}<section class="dark-card ownership-card"><span>نسب ملكية الأراضي الزراعية</span><div class="ownership-donut" id="ownership-donut"><strong>الملكية</strong></div><div id="ownership-legend"></div></section></aside>
    </div>
  </main>`;
}

function civilMarkup(app: TransportApp, group: string): string {
  return `<main class="interactive-dashboard civil-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="civil">
    ${dashboardHeader(app)}
    <div class="specialized-layout">
      <section class="specialized-kpis dashboard-kpis"><article class="blue"><span>طول محور الدراسة (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article><span>مساحة منطقة الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="gold"><span>عناصر الرفع المدني المسجلة</span><strong data-metric="civilFeatures">—</strong></article></section>
      <section class="specialized-body"><aside class="dark-card civil-panel"><h2>مؤشرات الدراسة المدنية</h2><p>تعرض هذه اللوحة عناصر الرفع والحصر المدني الخاصة بهذا القطاع فقط، مع إمكانية تشغيل وإيقاف الطبقات وفحص خصائص كل عنصر من الخريطة.</p><div class="civil-facts"><span>طبقات المشروع المتاحة <b data-metric="availableLayers">—</b></span><span>العناصر العمرانية <b data-metric="urbanFeatures">—</b></span><span>العناصر الزراعية <b data-metric="agriculturalFeatures">—</b></span></div></aside>${mapMarkup()}</section>
    </div>
  </main>`;
}

function impactMarkup(app: TransportApp, group: string): string {
  return `<main class="interactive-dashboard impact-dashboard" dir="${app.direction}" data-dashboard-group="${group}" data-mode="impact">
    ${dashboardHeader(app)}
    <div class="specialized-layout">
      <section class="specialized-kpis dashboard-kpis"><article class="blue"><span>طول المحور (كم)</span><strong data-metric="axisLengthKm">—</strong></article><article><span>نطاق الدراسة (كم²)</span><strong data-metric="studyAreaKm2">—</strong></article><article class="gold"><span>مساحة التغير العمراني (كم²)</span><strong data-metric="urbanChangeKm2">—</strong></article></section>
      <section class="specialized-body impact-body"><aside class="dark-card impact-controls"><h2>سيناريو الأثر التنموي حتى 2053</h2><label for="impact-year">سنة العرض <strong id="impact-year-label">2024</strong></label><input id="impact-year" type="range" min="2024" max="2053" value="2024" step="1"/><div class="impact-results"><span>مؤشر التطور الزمني <b id="impact-progress">0٪</b></span><span>المساحة العمرانية التقديرية* <b id="impact-area">—</b></span><span>فرص العمل المرتبطة بالقطاع <b data-metric="jobOpportunities">—</b></span></div><small>* محاكاة خطية تفاعلية للعرض وليست قيمة تقريرية جديدة؛ القيم الأصلية المعتمدة معروضة في البطاقات والمراجع.</small></aside>${mapMarkup()}</section>
    </div>
  </main>`;
}

export function renderInteractiveDashboard(app: TransportApp): string {
  const group = dashboardGroup(app);
  if (isCivilDashboard(app)) return civilMarkup(app, group);
  if (isImpactDashboard(app)) return impactMarkup(app, group);
  if (isPriceDashboard(app)) return priceMarkup(app, group);
  if (isUrbanDashboard(app)) return landMarkup(app, group);
  if (group === "dabaa-axis") return dabaaLandMarkup(app, group);
  if (["regional-ring-road", "dahshur-south-link", "suez-ring-link"].includes(group)) return reportLandMarkup(app, group);
  if (["qena-luxor-road", "qus-axis", "kalabsha-axis"].includes(group)) return southernAgricultureMarkup(app, group);
  return group === "western-upper-egypt" || group === "cairo-suez-road" ? landMarkup(app, group) : agriculturalMarkup(app, group);
}

const formatNumber = (value: number, digits = 1) => new Intl.NumberFormat(document.documentElement.lang === "en" ? "en-US" : "ar-EG", { maximumFractionDigits: digits }).format(value || 0);

function formatMoney(value: number): string {
  if (!value) return "لا توجد قيمة مسجلة";
  if (value >= 1_000_000_000_000) return `${formatNumber(value / 1_000_000_000_000, 2)} تريليون ج.م`;
  if (value >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 2)} مليار ج.م`;
  if (value >= 1_000_000) return `${formatNumber(value / 1_000_000, 2)} مليون ج.م`;
  return `${formatNumber(value, 0)} ج.م`;
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
  const side = document.querySelector<HTMLElement>(".agriculture-dashboard:not(.western-agriculture-dashboard) .agriculture-side");
  if (!side || side.querySelector(".agriculture-derived-card")) return;
  side.insertAdjacentHTML("afterbegin", `<article class="opportunity-card agriculture-derived-card"><span>\u0641\u0631\u0635 \u0627\u0644\u0639\u0645\u0644 \u0644\u0645\u0634\u0631\u0648\u0639\u0627\u062a \u0627\u0644\u0645\u0628\u0627\u0646\u064a \u0627\u0644\u0645\u0633\u062a\u062d\u062f\u062b\u0629</span><strong data-metric="jobOpportunities">—</strong><small>\u0641\u0631\u0635\u0629 \u0639\u0645\u0644 \u062a\u0642\u062f\u064a\u0631\u064a\u0629 \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u062a\u063a\u064a\u0631</small></article><section class="dark-card vertical-chart-card agriculture-derived-card"><div class="card-title"><span>\u0645\u0646\u0627\u0637\u0642 \u062a\u063a\u064a\u0631 \u0627\u0633\u062a\u062e\u062f\u0627\u0645\u0627\u062a \u0627\u0644\u0623\u0631\u0627\u0636\u064a</span></div><div id="change-bars" class="change-bars loading-panel">\u062c\u0627\u0631\u064d \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a…</div></section>`);
  side.insertAdjacentHTML("beforeend", `<section class="dark-card agriculture-stat agriculture-derived-card"><span>\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u062a\u063a\u064a\u0631 \u0627\u0644\u0632\u0631\u0627\u0639\u064a (\u0643\u0645\u00b2)</span><strong data-metric="agriculturalChangeKm2">—</strong></section>`);
}

function renderPriceColumns(summary: DashboardSummary, selectedKind = "all"): void {
  const container = document.querySelector<HTMLElement>("#price-columns");
  if (!container) return;
  const labels: Record<string, string> = { urban: "الأراضي العمرانية", agricultural: "الأراضي الزراعية", industrial: "الأراضي الصناعية", ...(summary.profile?.priceLabels || {}) };
  const colors: Record<string, string> = { urban: "#ffbc25", agricultural: "#72e800", industrial: "#e6e6e6" };
  const available = ["urban", "industrial", "agricultural"].filter((key) => {
    const item = summary.prices[key];
    return Boolean(item && (item.start > 0 || item.end > 0));
  });
  container.style.setProperty("--price-columns", String(Math.max(available.length, 1)));
  if (!available.length) {
    container.innerHTML = '<div class="no-data price-no-data">لا توجد قيم أسعار موثقة لهذا القطاع في ملفات التقارير الحالية. اختر «كل القطاعات» أو قطاعًا آخر من قائمة الخريطة.</div>';
    return;
  }
  container.innerHTML = available.map((key) => {
    const item = summary.prices[key];
    const difference = Math.max(item.end - item.start, 0);
    const selected = selectedKind === "all" || selectedKind === key;
    return `<article class="price-column${selectedKind !== "all" && selected ? " is-selected" : ""}" data-price-kind="${key}"${selectedKind !== "all" && !selected ? " hidden" : ""} style="--accent:${colors[key]}"><header><span>فرق أسعار ${labels[key]}</span><strong>${formatMoney(difference)}</strong></header><div><span>أسعار ${labels[key]} ${summary.yearEnd}</span><b>${formatMoney(item.end)}</b></div><div><span>أسعار ${labels[key]} ${summary.yearStart}</span><b>${formatMoney(item.start)}</b></div></article>`;
  }).join("");
  container.classList.toggle("price-filtered", selectedKind !== "all");
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
  const isIsmailia = document.querySelector<HTMLElement>(".interactive-dashboard")?.dataset.dashboardGroup === "ismailia";
  const data = isIsmailia ? [
    ["industrial", "صناعي", summary.metrics.industrialChangeKm2 || summary.metrics.industrialFeatures, "#00a3d7"],
    ["agricultural", "زراعي", summary.metrics.agriculturalChangeKm2 || summary.metrics.agriculturalFeatures, "#85d927"],
    ["urban", "عمراني", summary.metrics.urbanChangeKm2 || summary.metrics.urbanFeatures, "#ffbf08"],
  ] as Array<[string, string, number, string]> : summary.profile?.changeBars?.length
    ? summary.profile.changeBars.map((item) => [item.layer, item.label, item.value, "#f28a00"] as [string, string, number, string])
    : [
      ["urban", "عمراني", summary.metrics.urbanChangeKm2 || summary.metrics.urbanFeatures, "#ff9e00"],
      ["agricultural", "زراعي", summary.metrics.agriculturalChangeKm2 || summary.metrics.agriculturalFeatures, "#85d927"],
      ["industrial", "صناعي", summary.metrics.industrialChangeKm2 || summary.metrics.industrialFeatures, "#00a3d7"],
    ] as Array<[string, string, number, string]>;
  const max = Math.max(...data.map((item) => item[2]), 1);
  container.innerHTML = data.map(([key, label, value, color]) => `<button type="button" data-filter-layer="${key}" style="--height:${Math.max(value / max * 100, 3)}%;--bar:${color}"><i></i><b>${formatNumber(value, 2)}</b><span title="${label}">${label}</span></button>`).join("");
}

function renderComparison(summary: DashboardSummary, topOnly = false): void {
  const container = document.querySelector<HTMLElement>("#comparison-chart");
  if (!container) return;
  container.classList.remove("loading-panel");
  const years = Array.from(new Set(summary.landUse.map((item) => item.year))).sort();
  let categories = Array.from(new Set(summary.landUse.map((item) => item.category)));
  if (topOnly) {
    const totals = categories.map((category) => [category, summary.landUse.filter((item) => item.category === category).reduce((sum, item) => sum + item.area, 0)] as const).sort((a, b) => b[1] - a[1]);
    categories = totals.slice(0, 4).map((item) => item[0]);
  }
  const fallbackColors = ["#cde768", "#24c427", "#5a46e8", "#d9a116", "#00a5ce", "#ef5757", "#7f72d8", "#d8d8d8"];
  const categoryColor = (category: string, index: number) => {
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

function renderGaugeAndDonut(summary: DashboardSummary): void {
  const study = summary.metrics.studyAreaKm2 || 1;
  const urban = summary.metrics.urbanChangeKm2 || 0;
  const agri = summary.metrics.agriculturalChangeKm2 || 0;
  const industrial = summary.metrics.industrialChangeKm2 || 0;
  const total = urban + agri + industrial;
  const percent = Math.min(summary.profile?.metrics.urbanChangePercent ?? urban / study * 100, 100);
  const dashboard = document.querySelector<HTMLElement>(".interactive-dashboard");
  const selectedSector = document.querySelector<HTMLSelectElement>("#dashboard-sector-filter")?.value || "all";
  const selectedChange = document.querySelector<HTMLSelectElement>("#dashboard-change-filter")?.value || "all";
  const westernAxisDefault = dashboard?.dataset.dashboardGroup === "western-upper-egypt" && selectedSector === "all";
  setGauge(document.querySelector<HTMLElement>("#urban-gauge"), westernAxisDefault || selectedChange === "all" ? 100 : percent, westernAxisDefault ? 1000 : selectedChange === "all" ? 100 : percent);
  const donut = document.querySelector<HTMLElement>("#change-donut");
  if (donut) {
    const profileShares = summary.profile?.statusShares;
    const urbanShare = profileShares ? profileShares.existing : total ? urban / total * 100 : 0;
    const agriShare = profileShares ? profileShares.underConstruction : total ? agri / total * 100 : 0;
    donut.style.background = profileShares
      ? `conic-gradient(#d6cc00 0 ${urbanShare}%, #e83a19 ${urbanShare}% 100%)`
      : `conic-gradient(#ff9e00 0 ${urbanShare}%, #84db24 ${urbanShare}% ${urbanShare + agriShare}%, #00a6d8 ${urbanShare + agriShare}% 100%)`;
    const label = donut.querySelector("strong");
    if (label) label.textContent = profileShares ? "الحالة" : `${formatNumber(total, 1)} كم²`;
  }
  const legend = document.querySelector<HTMLElement>("#donut-legend");
  if (legend) legend.innerHTML = summary.profile?.statusShares
    ? `<span><i style="background:#d6cc00"></i>قائم ${formatNumber(summary.profile.statusShares.existing, 0)}٪</span><span><i style="background:#e83a19"></i>تحت الإنشاء ${formatNumber(summary.profile.statusShares.underConstruction, 0)}٪</span>`
    : `<button data-filter-layer="urban"><i style="background:#ff9e00"></i>عمراني ${formatNumber(urban, 1)}</button><button data-filter-layer="agricultural"><i style="background:#84db24"></i>زراعي ${formatNumber(agri, 1)}</button><button data-filter-layer="industrial"><i style="background:#00a6d8"></i>صناعي ${formatNumber(industrial, 1)}</button>`;
}

function renderAgricultureIndicators(summary: DashboardSummary): void {
  const profile = summary.profile;
  const cropShares = profile?.cropShares || [];
  const crop = document.querySelector<HTMLElement>("#crop-donut");
  const group = document.querySelector<HTMLElement>(".interactive-dashboard")?.dataset.dashboardGroup || "";
  const cropPresentation: Record<string, { labels: string[]; colors: string[] }> = {
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
  if (cropLegend) cropLegend.innerHTML = cropShares.map((value, index) => `<span><i style="background:${cropColors[index % cropColors.length]}"></i>${cropLabels[index]}: ${formatNumber(value, 0)}٪</span>`).join("");
  const ownership = profile?.ownershipShares || [];
  const ownershipDonut = document.querySelector<HTMLElement>("#ownership-donut");
  if (ownershipDonut && !ownership.length) ownershipDonut.closest<HTMLElement>(".ownership-card")?.setAttribute("hidden", "true");
  if (ownershipDonut && ownership.length) {
    ownershipDonut.closest<HTMLElement>(".ownership-card")?.removeAttribute("hidden");
    ownershipDonut.style.background = `conic-gradient(#ffd51d 0 ${ownership[0]}%, #ff8b19 ${ownership[0]}% 100%)`;
  }
  else if (ownershipDonut) { const label = ownershipDonut.querySelector("strong"); if (label) label.textContent = document.documentElement.lang === "en" ? "Not available" : "غير متاح"; }
  const ownershipLegend = document.querySelector<HTMLElement>("#ownership-legend");
  if (ownershipLegend && ownership.length) ownershipLegend.innerHTML = group === "qus-axis"
    ? `<span><i style="background:#ffd51d"></i>إيجار ${formatNumber(ownership[0], 0)}٪</span><span><i style="background:#ff8b19"></i>تمليك ${formatNumber(ownership[1], 0)}٪</span>`
    : `<span><i style="background:#ffd51d"></i>ملك ${formatNumber(ownership[0], 0)}٪</span><span><i style="background:#ff8b19"></i>إيجار ${formatNumber(ownership[1], 0)}٪</span>`;
  (["agricultural", "industrial"] as const).forEach((kind) => {
    const gauge = document.querySelector<HTMLElement>(`#${kind}-gauge`);
    if (!gauge) return;
    const percent = Math.min(summary.profile?.metrics[`${kind}ChangePercent`] ?? 0, 100);
    setGauge(gauge, percent);
  });
  setGauge(document.querySelector<HTMLElement>("#agricultural-share-gauge"), Math.min(profile?.metrics.agriculturalSharePercent ?? 0, 100));
}

type Coordinates = number[] | Coordinates[];
type GeoJsonCollection = { features: Array<{ geometry?: { type: string; coordinates: Coordinates }; properties?: Record<string, unknown> }> };
const geoJsonCache = new Map<string, Promise<GeoJsonCollection>>();

function loadGeoJson(url: string): Promise<GeoJsonCollection> {
  const cached = geoJsonCache.get(url);
  if (cached) return cached;
  const request = fetch(url).then((response) => {
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.json() as Promise<GeoJsonCollection>;
  });
  geoJsonCache.set(url, request);
  return request;
}

async function deriveLandUseFromLocalLayers(group: string, summary: DashboardSummary): Promise<DashboardSummary["landUse"]> {
  if (!summary.layers.includes("landcover-start") || !summary.layers.includes("landcover-end")) return [];
  const categoryFor = (raw: unknown): string => {
    const value = String(raw ?? "").trim().toLowerCase();
    const code = Number(raw);
    if (Number.isFinite(code)) return ({ 0: "الأراضي الزراعية", 1: "الأراضي الصناعية", 2: "أراضي فضاء", 3: "الأراضي العمرانية", 4: "خدمات ومرافق", 5: "حكومي وعسكري", 6: "ترفيهي وسياحي", 7: "غير مصنف", 8: "مسطحات مائية", 9: "نقل ومرافق عامة", 10: "مقابر", 11: "تعليمي", 12: "طرق", 13: "استخدامات أخرى" } as Record<number, string>)[code] || `استخدام أرض ${code}`;
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
      const category = categoryFor(properties.landuse_code ?? properties.landuse_value ?? properties.landuse_label);
      const rawArea = Number(properties.area_km2 ?? 0);
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

function geometryPath(geometry: { type: string; coordinates: Coordinates }, project: (pair: number[]) => [number, number]): string {
  const line = (pairs: number[][], close = false) => {
    // A few source polygons contain accidental jumps between distant points.
    // Dropping that ring prevents SVG from drawing giant black triangles over
    // the map while keeping the valid land-use features visible.
    // Parcel rings should contain short, local edges. A larger jump is a
    // malformed ring splice that SVG closes as a giant black triangle.
    if (close && pairs.some((pair, index) => index > 0 && (Math.abs(pair[0] - pairs[index - 1][0]) > .05 || Math.abs(pair[1] - pairs[index - 1][1]) > .05))) return "";
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
  const labels: Record<LayerName, string> = { study: "منطقة الدراسة", axis: "محور الطريق", urban: "تغير عمراني", agricultural: "تغير زراعي", industrial: "تغير صناعي", baseline: "استخدامات الأراضي المرجعية", civil: "الدراسة المدنية", "landcover-start": `استخدامات الأراضي ${summary.yearStart}`, "landcover-end": `استخدامات الأراضي ${summary.yearEnd}`, buildings: "المباني", parcels: "قطع الأراضي", landmarks: "المعالم والخدمات", water: "المسطحات المائية", "field-survey": "الرفع الميداني", transport: "شبكة النقل", governorates: "حدود المحافظات", LRT_Line: "خط القطار الكهربائي الخفيف", lRT_Station: "محطات القطار الكهربائي الخفيف", Metro_Line: "خطوط المترو", Metro_Station: "محطات المترو", Road_CairoRing: "الطريق الدائري حول القاهرة", Road_MiddleRing: "الطريق الدائري الأوسط", Road_RegionalRing: "الدائري الإقليمي", Transit_GreenLine: "الخط الأخضر", Transit_KafrDawoodSadat: "وصلة كفر داوود–السادات", Transit_LRT: "القطار الكهربائي الخفيف", Transit_Metro1: "الخط الأول للمترو", Transit_Metro2: "الخط الثاني للمترو", Transit_Metro3: "الخط الثالث للمترو", Transit_Metro4: "الخط الرابع للمترو", Transit_Metro6: "الخط السادس للمترو", Transit_MonorailCapital: "المونوريل – العاصمة", Transit_MonorailOctober: "المونوريل – أكتوبر", Transit_RobikiBelbeis: "وصلة الروبيكي–بلبيس" };
  const mapInstance = scope.dataset.mapInstance || "primary";
  const tileTemplate = mapInstance.includes("baseline") ? imageryTiles[2014]
    : mapInstance.includes("current") ? imageryTiles[2024]
      : imageryTiles.current;
  const temporalLayers: LayerName[] = ["landcover-start", "landcover-end"];
  const regularLayers = summary.layers.filter((layer) => !temporalLayers.includes(layer) && !(layer === "baseline" && summary.layers.includes("landcover-start")));
  const viewerMode = Boolean(scope.closest(".viewer-runtime"));
  const focusedPriceMap = group === "ismailia" && Boolean(scope.closest(".price-dashboard"));
  const ismailiaTemporalMap = group === "ismailia" && (mapInstance.includes("baseline") || mapInstance.includes("current"));
  const ismailiaStartLayers: LayerName[] = ["study", "axis", "landcover-start", "Road_CairoRing"];
  const requestedLayers = focusedPriceMap
    ? (mapInstance.includes("baseline") ? ["study", "axis", "landcover-start"] as LayerName[] : ["study", "axis", "landcover-end"] as LayerName[])
    : ismailiaTemporalMap
    ? (mapInstance.includes("baseline") ? ismailiaStartLayers.filter((layer) => summary.layers.includes(layer)) : [...regularLayers, "landcover-end" as LayerName])
    : mapInstance.includes("baseline")
    ? group === "ismailia" ? [...regularLayers, "landcover-start" as LayerName] : summary.layers.filter((layer) => ["study", "axis", "landcover-start"].includes(layer))
    : mapInstance.includes("current")
      ? group === "ismailia" ? [...regularLayers, "landcover-end" as LayerName] : summary.layers.filter((layer) => ["study", "axis", "landcover-end"].includes(layer))
      : viewerMode ? summary.layers : [...regularLayers, ...(summary.layers.includes("landcover-end") ? ["landcover-end" as LayerName] : summary.layers.includes("landcover-start") ? ["landcover-start" as LayerName] : [])];
  const layerResults = await Promise.all(requestedLayers.map(async (layer) => {
    const url = `../../data/dashboard/${group}/${layer}.geojson`;
    try {
      return { layer, collection: await loadGeoJson(url) } as const;
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
  // Keep the initial extent focused on the study corridor. Ismailia also
  // contains reference transport layers covering much of Egypt; including
  // those in the extent makes the actual study area appear tiny.
  const extentLayers = group === "ismailia"
    ? new Set<LayerName>(["study", "axis", "urban", "agricultural", "industrial", "landcover-start", "landcover-end"])
    : null;
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
  const sectorValues = new Set<string>();
  // The Ismailia source represents one corridor; numeric sub-sector values in
  // land-cover attributes (for example 10/17) are internal classifications,
  // not selectable dashboard sectors.
  const sectorOf = (properties: Record<string, unknown> = {}) => group === "ismailia" ? "" : String(properties["اسم_القطاع"] ?? properties["sector"] ?? properties["Sector"] ?? "").trim();
  for (const [layer, collection] of loaded) {
    const groupElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    groupElement.dataset.layerGroup = layer;
    groupElement.classList.add(`map-${layer}`);
    for (const [featureIndex, feature] of collection.features.entries()) {
      // Yield between batches so a large layer cannot block scrolling/input.
      if (featureIndex > 0 && featureIndex % 100 === 0) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (!feature.geometry) continue;
      // Exclude source features whose extent is clearly outside a single
      // land-use parcel; these malformed polygons create giant black fills.
      if (layer === "landcover-start" || layer === "landcover-end") {
        const points = coordinatePairs(feature.geometry.coordinates);
        if (points.length) {
          const dx = Math.max(...points.map((point) => point[0])) - Math.min(...points.map((point) => point[0]));
          const dy = Math.max(...points.map((point) => point[1])) - Math.min(...points.map((point) => point[1]));
          // Land-use parcels are small local polygons. Anything wider than
          // roughly ten kilometres is a concatenated source artifact and
          // would render as a large black wedge when SVG closes the ring.
          if (dx > .1 || dy > .1) continue;
        }
      }
      const pathData = geometryPath(feature.geometry, project);
      if (!pathData) continue;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.dataset.geometry = feature.geometry.type;
      if (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString") {
        path.style.fill = "none";
        path.style.stroke = layer === "axis" ? "#ff1edc" : "#10b8ad";
        path.style.strokeWidth = layer === "axis" ? "6" : "2.4";
        path.style.strokeLinecap = "round";
      } else if (feature.geometry.type === "Point" || feature.geometry.type === "MultiPoint") {
        path.style.fill = "#d8d8d8";
        path.style.stroke = "#25323a";
      }
      const exactStatus = feature.properties?.change_status_key;
      path.dataset.changeStatus = exactStatus === "changed" || exactStatus === "unchanged" ? exactStatus : "unknown";
      path.setAttribute("vector-effect", "non-scaling-stroke");
      if (layer === "landcover-start" || layer === "landcover-end") {
        const rawValue = feature.properties?.landuse_code ?? feature.properties?.landuse_value ?? feature.properties?.landuse_label
          ?? feature.properties?.["استخدام_الأرض"] ?? feature.properties?.["وصف_الاستخدام"] ?? "unclassified";
        const normalized = String(rawValue).trim().toLowerCase();
        const numericCode = Number(rawValue);
        const inferredCode = Number.isFinite(numericCode) ? numericCode
          : /agri|زراع/.test(normalized) ? 0
            : /industr|factor|مصنع|صناع/.test(normalized) ? 1
              : /vacant|vscant|vecant|فضاء|فارغ/.test(normalized) ? 2
                : /urban|build|residen|عمران|مبان|سكن/.test(normalized) ? 3
                  : /facilit|service|خدم/.test(normalized) ? 4
                    : /military|government|حكوم|عسكر/.test(normalized) ? 5
                      : /water|مياه|مائي/.test(normalized) ? 8
                        : /road|طريق/.test(normalized) ? 12 : 99;
        const palette: Record<number, [string, string]> = group === "ismailia" ? {
          0: ["#16c51b", "#d9ff9b"], 1: ["#9800c7", "#f2c7ff"], 2: ["#fff4ae", "#fffbd8"],
          3: ["#f6a900", "#ffe47d"], 4: ["#10b8ad", "#b9fff3"], 5: ["#ff1717", "#ffd1d1"],
          6: ["#00cdbd", "#bafff5"], 7: ["#a9b8aa", "#e8f0e8"], 8: ["#08afe1", "#bcefff"],
          9: ["#a5a5a5", "#eeeeee"], 10: ["#777777", "#d9d9d9"], 11: ["#f2f2f2", "#ffffff"],
          12: ["#777777", "#d5d5d5"], 13: ["#b77b00", "#ffe19a"], 99: ["#9aa5ad", "#eef3f6"],
        } : {
          0: ["#45c51a", "#d7ff91"], 1: ["#6657d9", "#dad5ff"], 2: ["#cfe566", "#f4ffc0"],
          3: ["#e4a313", "#ffe18a"], 4: ["#ef6c35", "#ffd1b8"], 5: ["#b17ad1", "#f3d5ff"],
          6: ["#21b7a8", "#b8fff4"], 7: ["#74826d", "#dce8d7"], 8: ["#22a9e0", "#c8f2ff"],
          9: ["#c7ad72", "#fff0c3"], 10: ["#d94f70", "#ffd0dc"], 11: ["#b89158", "#f7e5bd"],
          12: ["#5d82c9", "#dce8ff"], 13: ["#8f5aae", "#eddbf8"], 99: ["#9aa5ad", "#eef3f6"],
        };
        const [fill, stroke] = palette[inferredCode] || palette[99];
        path.dataset.landuseCode = String(inferredCode);
        path.style.fill = `${fill}d9`;
        path.style.stroke = stroke;
        path.style.strokeWidth = group === "ismailia" ? "0.65" : "1.1";
      }
      const representative = Object.entries(feature.properties || {}).find(([, value]) => value !== null && value !== "")?.[1];
      path.setAttribute("aria-label", `${labels[layer]}${representative ? `: ${String(representative)}` : ""}`);
      const sector = sectorOf(feature.properties);
      if (sector) { path.dataset.sector = sector; sectorValues.add(sector); }
      path.addEventListener("click", (event) => {
        event.stopPropagation();
        const popup = scope.querySelector<HTMLElement>(".feature-popup");
        if (!popup) return;
        const rows = Object.entries(feature.properties || {}).filter(([, value]) => value !== null && value !== "");
        const aggregateFieldLabels: Record<string, string> = { landuse_value: "استخدام الأرض", landuse_code: "كود استخدام الأرض", landuse_label: "وصف الاستخدام", source_feature_count: "عدد المعالم الأصلية", area_km2: "المساحة (كم²)", sector: "القطاع" };
        popup.querySelector("div")!.innerHTML = `<p class="popup-layer">${labels[layer]}</p>${rows.map(([key, value]) => `<p><span>${esc(aggregateFieldLabels[key] || key.replaceAll("_", " "))}</span><b>${esc(String(value))}</b></p>`).join("")}`;
        popup.hidden = false;
      });
      groupElement.appendChild(path);
    }
    content.appendChild(groupElement);
  }
  const renderableCount = (collection: GeoJsonCollection) => collection.features.filter((feature) => feature.geometry && coordinatePairs(feature.geometry.coordinates).length).length;
  const sourceCount = (_layer: LayerName, collection: GeoJsonCollection) => collection.features.reduce((sum, feature) => {
    if (!feature.geometry || !coordinatePairs(feature.geometry.coordinates).length) return sum;
    return sum + Math.max(1, Number(feature.properties?.source_feature_count || 1));
  }, 0);
  const startsHidden = !mapInstance.includes("baseline") && !mapInstance.includes("current") && loaded.some(([layer]) => layer === "landcover-end");
  if (startsHidden) content.querySelector<SVGGElement>('[data-layer-group="landcover-start"]')?.classList.add("layer-hidden");
  toggles.innerHTML = loaded.map(([layer, collection]) => {
    const active = !(startsHidden && layer === "landcover-start");
    return `<button type="button" class="${active ? "active" : ""}" data-map-layer="${layer}"><i></i>${labels[layer]}<b>${sourceCount(layer, collection).toLocaleString(document.documentElement.lang === "en" ? "en-US" : "ar-EG")}</b></button>`;
  }).join("");
  // Keep the layer key out of the dashboard map; symbology is rendered on
  // the features themselves and the dashboard controls remain uncluttered.
  toggles.setAttribute("hidden", "true");
  toggles.remove();
  scope.querySelector(".landuse-legend")?.remove();
  if (loaded.some(([layer]) => temporalLayers.includes(layer))) {
    const expanded = mapInstance.includes("baseline") || mapInstance.includes("current") ? "" : " open";
    scope.insertAdjacentHTML("beforeend", `<details class="landuse-legend"${expanded}><summary>مفتاح استخدامات الأراضي</summary><div><span style="--swatch:#45c51a">زراعي</span><span style="--swatch:#6657d9">صناعي</span><span style="--swatch:#cfe566">أراضٍ فضاء</span><span style="--swatch:#e4a313">عمراني</span><span style="--swatch:#ef6c35">خدمات ومرافق</span><span style="--swatch:#b17ad1">نقل ومرافق عامة</span><span style="--swatch:#21b7a8">ترفيهي وسياحي</span><span style="--swatch:#74826d">مقابر</span><span style="--swatch:#22a9e0">مسطحات مائية</span><span style="--swatch:#c7ad72">جزر</span><span style="--swatch:#d94f70">طرق</span><span style="--swatch:#5d82c9">تعليمي</span><span style="--swatch:#8f5aae">حكومي</span><span style="--swatch:#9aa5ad">غير مصنف</span></div></details>`);
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
      const reportMetrics = selected === "all" ? summary.metrics : reportSector?.metrics;
      if (reportMetrics) Object.entries(reportMetrics).forEach(([name, value]) => setMetric(name, value));
      else {
        if (chosen("study").length) setMetric("studyAreaKm2", areaKm2("study"));
        if (chosen("axis").length) setMetric("axisLengthKm", axisKm);
        if (chosen("urban").length) setMetric("urbanChangeKm2", areaKm2("urban"));
      }
      if (!reportMetrics && chosen("agricultural").length) {
        const agriculturalKm2 = areaKm2("agricultural");
        setMetric("agriculturalChangeKm2", agriculturalKm2);
        setMetric("agriculturalAreaFeddan", agriculturalKm2 / .0042);
        setMetric("agriculturalChangeFeddan", agriculturalKm2 / .0042);
      }
      setMetric("urbanFeatures", chosen("urban").length);
      setMetric("agriculturalFeatures", chosen("agricultural").length);
      setMetric("industrialFeatures", chosen("industrial").length);
      const gauge = document.querySelector<HTMLElement>("#urban-gauge");
      const studyArea = areaKm2("study"), urbanArea = areaKm2("urban");
      if (gauge && studyArea > 0) {
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
          metrics: reportMetrics || {},
          prices: selected === "all" ? summary.prices : (reportSector?.prices || {}),
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
      loaded.forEach(([layer]) => {
        const groupElement = content.querySelector<SVGGElement>(`[data-layer-group="${layer}"]`);
        if (!groupElement) return;
        groupElement.querySelectorAll<SVGPathElement>("path").forEach((path) => {
          if (layer !== "landcover-end") {
            path.classList.remove("change-hidden");
            return;
          }
          const status = path.dataset.changeStatus || "unknown";
          // Empty database values mean that no change was recorded for the
          // feature. Keep them with the unchanged view instead of making an
          // entire sector disappear when its status column is blank.
          const matches = mode === "all" || status === mode || (mode === "unchanged" && status === "unknown");
          path.classList.toggle("change-hidden", !matches);
          path.classList.toggle("change-match", mode !== "all" && matches);
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
  svg.addEventListener("pointerdown", (event) => { dragging = true; beginInteraction(); lastX = event.clientX; lastY = event.clientY; svg.setPointerCapture(event.pointerId); });
  svg.addEventListener("pointermove", (event) => { if (!dragging) return; tx += (event.clientX - lastX) * 1000 / Math.max(svg.clientWidth, 1); ty += (event.clientY - lastY) * 520 / Math.max(svg.clientHeight, 1); lastX = event.clientX; lastY = event.clientY; if (!panFrame) panFrame = requestAnimationFrame(() => { panFrame = 0; apply(); }); });
  svg.addEventListener("pointerup", () => { dragging = false; endInteraction(120); });
  svg.addEventListener("pointercancel", () => { dragging = false; endInteraction(120); });
  svg.addEventListener("lostpointercapture", () => { dragging = false; endInteraction(120); });
  svg.addEventListener("click", () => { const popup = scope.querySelector<HTMLElement>(".feature-popup"); if (popup) popup.hidden = true; });
  scope.querySelector<HTMLButtonElement>(".feature-popup > button")?.addEventListener("click", () => { const popup = scope.querySelector<HTMLElement>(".feature-popup"); if (popup) popup.hidden = true; });
  document.querySelector<HTMLElement>(".interactive-dashboard")?.addEventListener("dashboard-map-sector", ((event: CustomEvent<string>) => fitSector(event.detail)) as EventListener);
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
  document.querySelectorAll<SVGPathElement>("[data-landuse-code]").forEach((path) => path.classList.toggle("layer-hidden", path.dataset.landuseCode !== code));
  document.querySelectorAll<SVGGElement>('[data-layer-group="landcover-start"], [data-layer-group="landcover-end"]').forEach((group) => group.classList.remove("layer-hidden"));
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
        summary.prices = { ...summary.prices, ...(profile.prices || {}) };
        summary.landUse = profile.landUse?.length ? profile.landUse : summary.landUse;
        summary.yearEnd = profile.yearEnd ?? (group === "cairo-suez-road" ? 2024 : 2023);
        summary.priceSeries.years = Array.from({ length: summary.yearEnd - summary.yearStart + 1 }, (_, index) => summary.yearStart + index);
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
    if (!summary.metrics.agriculturalWorkersThousands) { setUnavailableMetric("agriculturalWorkersThousands"); hideUnavailableMetricPanel("agriculturalWorkersThousands"); }
    if (!summary.metrics.agriculturalAreaFeddan && !(summary.metrics.agriculturalChangeKm2 > 0)) { setUnavailableMetric("agriculturalAreaFeddan"); hideUnavailableMetricPanel("agriculturalAreaFeddan"); }
    if (!summary.metrics.agriculturalChangeFeddan && !(summary.metrics.agriculturalChangeKm2 > 0)) { setUnavailableMetric("agriculturalChangeFeddan"); hideUnavailableMetricPanel("agriculturalChangeFeddan"); }
    setMetric("availableLayers", summary.layers.length);
    const totalChange = root.dataset.mode === "land" ? (summary.metrics.urbanChangeKm2 || 0) : (summary.metrics.urbanChangeKm2 || 0) + (summary.metrics.agriculturalChangeKm2 || 0) + (summary.metrics.industrialChangeKm2 || 0);
    setMetric("totalChangeKm2", totalChange);
    setMetric("jobOpportunities", summary.metrics.jobOpportunities ?? Math.round((summary.metrics.urbanFeatures || 0) * 3.5 + (summary.metrics.agriculturalFeatures || 0) * .35));
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
        const years = Array.from({ length: event.detail.yearEnd - summary.yearStart + 1 }, (_, index) => summary.yearStart + index);
        const prices = event.detail.prices;
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
      document.querySelector<HTMLSelectElement>("#comparison-mode")?.addEventListener("change", (event) => renderComparison(summary, (event.currentTarget as HTMLSelectElement).value === "top4"));
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
      document.querySelector<HTMLSelectElement>("#comparison-mode")?.addEventListener("change", (event) => renderComparison(summary, (event.currentTarget as HTMLSelectElement).value === "top4"));
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
    const priceLanduseSelect = root.querySelector<HTMLSelectElement>("#dashboard-landuse-filter");
    if (priceLanduseSelect) {
      const landuseCodes: Record<string, string> = { urban: "3", agricultural: "0", industrial: "1" };
      const applyPriceLanduseFilter = () => {
        const selected = priceLanduseSelect.value || "all";
        const priceColumns = root.querySelector<HTMLElement>("#price-columns");
        priceColumns?.classList.toggle("price-filtered", selected !== "all");
        priceColumns?.querySelectorAll<HTMLElement>("[data-price-kind]").forEach((card) => {
          card.hidden = selected !== "all" && card.dataset.priceKind !== selected;
          card.classList.toggle("is-selected", selected !== "all" && card.dataset.priceKind === selected);
        });
        mapRoots.forEach((map) => {
          map.querySelectorAll<SVGGElement>("[data-layer-group]").forEach((layerGroup) => {
            const layer = layerGroup.dataset.layerGroup || "";
            if (["urban", "agricultural", "industrial"].includes(layer)) {
              layerGroup.classList.toggle("layer-hidden", selected !== "all" && layer !== selected);
            }
            if (layer === "landcover-start" || layer === "landcover-end") {
              layerGroup.classList.toggle("layer-hidden", false);
              layerGroup.querySelectorAll<SVGPathElement>("path[data-landuse-code]").forEach((path) => {
                path.toggleAttribute("hidden", selected !== "all" && path.dataset.landuseCode !== landuseCodes[selected]);
              });
            }
          });
        });
        root.dispatchEvent(new CustomEvent("dashboard-landuse-filter", { detail: selected }));
      };
      priceLanduseSelect.addEventListener("change", applyPriceLanduseFilter);
      applyPriceLanduseFilter();
    }
    const statusTotals = { changed: 0, unchanged: 0 };
    if (summary.layers.includes("landcover-end")) {
      const latestLandcover = await loadGeoJson(`../../data/dashboard/${group}/landcover-end.geojson`);
      latestLandcover.features.forEach((feature) => {
        const key = feature.properties?.change_status_key;
        if (key === "changed" || key === "unchanged") statusTotals[key] += Math.max(1, Number(feature.properties?.source_feature_count || 1));
      });
    }
    const dashboardSectorFilter = document.querySelector<HTMLSelectElement>("#dashboard-sector-filter");
    const sourceSectorSelect = mapRoots.map((map) => map.querySelector<HTMLSelectElement>(".map-sector-select")).find((select) => select && select.options.length > 1);
    if (dashboardSectorFilter && sourceSectorSelect) {
      dashboardSectorFilter.innerHTML = sourceSectorSelect.innerHTML;
      dashboardSectorFilter.addEventListener("change", () => mapRoots.forEach((map) => { const select = map.querySelector<HTMLSelectElement>(".map-sector-select"); if (select && select.value !== dashboardSectorFilter.value) { select.value = dashboardSectorFilter.value; select.dispatchEvent(new Event("change")); } }));
      mapRoots.forEach((map) => map.addEventListener("change", (event) => { if ((event.target as HTMLElement).matches?.(".map-sector-select") && dashboardSectorFilter.value !== (event.target as HTMLSelectElement).value) dashboardSectorFilter.value = (event.target as HTMLSelectElement).value; }));
    } else if (dashboardSectorFilter) dashboardSectorFilter.closest("label")?.setAttribute("hidden", "true");
    const dashboardChangeFilter = document.querySelector<HTMLSelectElement>("#dashboard-change-filter");
    if (dashboardChangeFilter) {
      const syncChangeStatus = () => {
        const mode = dashboardChangeFilter.value;
        mapRoots.forEach((map) => { const select = map.querySelector<HTMLSelectElement>(".map-change-select"); if (select && select.value !== mode) { select.value = mode; select.dispatchEvent(new Event("change")); } });
        const classifiedTotal = statusTotals.changed + statusTotals.unchanged;
        const changedPercent = classifiedTotal ? statusTotals.changed / classifiedTotal * 100 : 0;
        const gauge = root.querySelector<HTMLElement>("#urban-gauge");
        if (gauge) {
          const urbanGrowth = summary.profile?.metrics.urbanChangePercent ?? ((summary.metrics.urbanChangeKm2 || 0) / Math.max(summary.metrics.studyAreaKm2 || 1, 1) * 100);
          const value = mode === "all" ? 100 : mode === "changed" ? changedPercent : classifiedTotal ? statusTotals.unchanged / classifiedTotal * 100 : urbanGrowth;
          setGauge(gauge, value);
        }
        root.dataset.changeStatus = mode;
      };
      dashboardChangeFilter.addEventListener("change", syncChangeStatus);
      root.addEventListener("map-change-status", ((event: CustomEvent<string>) => { if (dashboardChangeFilter.value !== event.detail) { dashboardChangeFilter.value = event.detail; syncChangeStatus(); } }) as EventListener);
      syncChangeStatus();
    }
    const comparisonChart = document.querySelector<HTMLElement>("#comparison-chart");
    comparisonChart?.addEventListener("click", (event) => {
      const segment = (event.target as HTMLElement).closest<HTMLElement>(".comparison-row i");
      if (!segment) return;
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
