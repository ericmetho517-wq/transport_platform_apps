import { initInteractiveDashboard, renderInteractiveDashboard } from "./interactive-dashboard";
import { initSectorApplication, renderSectorApplication } from "./sector-runtime";
import { enableApplicationLocalization } from "./localization";

export type AppType = "Dashboard" | "Experience" | "StoryMap" | "Web AppViewer" | "Instant Filter Gallery";

export interface ReportReference {
  imagePath: string;
  reportName: string;
  page: number;
  sourceUrls: string[];
  sourceItemIds: string[];
  projectGroup: string;
  referenceKind: string;
  caption: string;
  matchType: "exact-item-id" | "project-and-application-type";
}

export interface TransportApp {
  id: string;
  slug: string;
  title: string;
  alternateTitles: string[];
  category: string;
  type: AppType;
  language: "ar" | "en";
  direction: "rtl" | "ltr";
  sourceUrl: string;
  status: string;
  reportReferences?: ReportReference[];
  reportReferenceGroup?: string;
}

const esc = (value: string) => value.replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char] || char));

function mapPanel(app: TransportApp): string {
  return `<section class="map-panel" aria-label="Map view">
    <svg viewBox="0 0 900 520" role="img" aria-label="Open-source map preview for ${esc(app.title)}">
      <defs><linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d8eef0"/><stop offset="1" stop-color="#a9d4d8"/></linearGradient></defs>
      <rect width="900" height="520" fill="url(#sea)"/>
      <path d="M35 105L190 45l150 58 110-42 180 58 238-29v370L715 430l-152 46-170-34-144 51-214-66z" fill="#e6dfc1" stroke="#fff" stroke-width="5"/>
      <path d="M120 410C240 330 270 200 405 245S605 355 800 145" fill="none" stroke="#d69b39" stroke-width="11" stroke-linecap="round"/>
      <path d="M120 410C240 330 270 200 405 245S605 355 800 145" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="13 12"/>
      <g fill="#0b6b53" stroke="#fff" stroke-width="4"><circle cx="205" cy="330" r="11"/><circle cx="405" cy="245" r="11"/><circle cx="605" cy="300" r="11"/><circle cx="800" cy="145" r="11"/></g>
    </svg>
    <div class="map-tools"><button title="Zoom in">+</button><button title="Zoom out">−</button><button title="Home">⌂</button></div>
    <div class="map-caption">Local data-ready map · Item ${esc(app.id.slice(0, 8))}</div>
  </section>`;
}

function shell(app: TransportApp, content: string): string {
  return `<div class="app-shell" dir="${app.direction}">
    <header class="topbar"><a class="brand" href="../../index.html"><span class="brand-mark">MOT</span><span>Ministry of Transport Platform</span></a><div class="top-actions"><span class="type-pill">${esc(app.type)}</span><button id="theme-toggle" aria-label="Toggle theme">◐</button></div></header>
    <div class="titlebar"><div><p>${esc(app.category)}</p><h1>${esc(app.title)}</h1></div><a class="source-link" href="${esc(app.sourceUrl)}" target="_blank" rel="noreferrer">Original reference ↗</a></div>
    ${content}
    <footer>Open-source TypeScript implementation · ArcGIS SDK not used</footer>
  </div>`;
}

function reportReferenceApplication(app: TransportApp): string {
  const references = app.reportReferences || [];
  const first = references[0];
  const thumbnails = references.map((reference, index) => `<button class="reference-thumb ${index === 0 ? "active" : ""}" data-reference-index="${index}" aria-label="${esc(reference.reportName)} page ${reference.page}"><img src="${esc(reference.imagePath)}" alt=""/><span>${esc(reference.reportName)} · p.${reference.page}</span></button>`).join("");
  const metadata = references.map((reference) => ({
    imagePath: reference.imagePath,
    reportName: reference.reportName,
    page: reference.page,
    referenceKind: reference.referenceKind,
    matchType: reference.matchType,
    sourceUrl: reference.sourceUrls.find((url) => /arcgis/i.test(url)) || "",
  }));
  return shell(app, `<main class="reference-app">
    <aside class="reference-sidebar"><div class="reference-heading"><span>صور التطبيق من التقارير</span><strong>${references.length}</strong></div><p>الصور الأصلية المستخرجة من تقارير المشروع، بدون أرقام أو رسوم افتراضية.</p><div class="reference-thumbs">${thumbnails}</div></aside>
    <section class="reference-stage">
      <div class="reference-toolbar"><div><b id="reference-report">${esc(first.reportName)}</b><span id="reference-page">صفحة ${first.page} · ${esc(first.referenceKind)}</span></div><div><button id="fit-reference" type="button">ملاءمة</button><button id="zoom-reference" type="button">تكبير</button></div></div>
      <div class="reference-canvas"><img id="reference-image" src="${esc(first.imagePath)}" alt="${esc(app.title)} - الصورة الأصلية من التقرير"/></div>
      <div class="reference-note"><span class="verified-mark">✓</span><div><b>مرجع التصميم المعتمد</b><p id="reference-match">${first.matchType === "exact-item-id" ? "مطابقة مباشرة لمعرّف التطبيق" : "مطابقة حسب المشروع ونوع التطبيق"}</p></div><a id="reference-source" href="${esc(metadata[0].sourceUrl)}" target="_blank" rel="noreferrer" ${metadata[0].sourceUrl ? "" : "hidden"}>الرابط الوارد بالتقرير ↗</a></div>
    </section>
    <script id="reference-data" type="application/json">${JSON.stringify(metadata).replace(/</g, "\\u003c")}</script>
  </main>`);
}

function dashboard(app: TransportApp): string {
  const metrics = [["Land parcels","1,248","+12%"],["Study area","3,620 km²","Updated"],["Projects","37","Active"],["Coverage","82%","+4.6%"]];
  return shell(app, `<main class="dashboard-grid">
    <section class="kpis">${metrics.map(([label,value,trend]) => `<article class="kpi"><span>${label}</span><strong>${value}</strong><small>${trend}</small></article>`).join("")}</section>
    ${mapPanel(app)}
    <section class="chart-card"><div class="card-heading"><h2>Indicator distribution</h2><select><option>All years</option><option>2024</option><option>2023</option></select></div><div class="bars">${[72,48,88,61,39,79].map((v,i)=>`<div><span>${["Urban","Agricultural","Industrial","Roads","Services","Other"][i]}</span><i style="--value:${v}%"></i><b>${v}%</b></div>`).join("")}</div></section>
    <section class="list-card"><h2>Latest records</h2>${["Development corridor","Urban expansion","Agricultural zone","Service center","Industrial cluster"].map((name,i)=>`<button class="record"><span class="dot"></span><span>${name}<small>Record ${String(i+1).padStart(2,"0")}</small></span><b>›</b></button>`).join("")}</section>
  </main>`);
}

function experience(app: TransportApp): string {
  return shell(app, `<main class="experience"><nav class="side-nav"><button class="active">Overview</button><button>Land use</button><button>Indicators</button><button>Projects</button><button>Reports</button></nav><section class="experience-content"><div class="hero"><div><span>Integrated spatial experience</span><h2>${esc(app.title)}</h2><p>Explore project indicators, land-use patterns and transport assets through one responsive workspace.</p><button class="primary">Explore the map</button></div><div class="hero-stat"><strong>78</strong><span>connected applications</span></div></div>${mapPanel(app)}<div class="feature-row"><article><b>01</b><h3>Spatial overview</h3><p>Inspect the project corridor and surrounding development zones.</p></article><article><b>02</b><h3>Land indicators</h3><p>Compare land-use classes and development opportunities.</p></article><article><b>03</b><h3>Project evidence</h3><p>Review locally migrated datasets and public metadata.</p></article></div></section></main>`);
}

function story(app: TransportApp): string {
  return shell(app, `<main class="story"><section class="story-hero"><div class="eyebrow">Transport development story</div><h2>${esc(app.title)}</h2><p>A guided narrative connecting infrastructure, geography and development indicators.</p><span>Scroll to explore ↓</span></section><section class="story-section"><div><span>01 · Context</span><h3>The corridor and its region</h3><p>The project is presented as a sequence of spatial chapters. Local imagery, maps and statistics can be added to the project data folder.</p></div>${mapPanel(app)}</section><section class="story-quote"><blockquote>Transport infrastructure reshapes access, investment and the geography of opportunity.</blockquote></section><section class="story-section reverse"><div><span>02 · Evidence</span><h3>Reading land-use change</h3><p>Indicator panels combine agricultural, urban and industrial land patterns with the project alignment.</p></div><div class="story-visual"><i></i><i></i><i></i><i></i></div></section></main>`);
}

function viewer(app: TransportApp, filters = false): string {
  const panel = filters ? `<aside class="layer-panel"><h2>Filter gallery</h2><label>Search<input id="search" placeholder="Search records" /></label><label>Land type<select id="land-filter"><option value="all">All types</option><option>Urban</option><option>Agricultural</option><option>Industrial</option></select></label><div id="gallery" class="gallery">${["Urban area","Agricultural land","Industrial zone","Transport asset","Service area","Development site"].map((x,i)=>`<button data-kind="${["Urban","Agricultural","Industrial"][i%3]}"><span class="thumb t${i%3}"></span><b>${x}</b><small>${12+i*7} records</small></button>`).join("")}</div></aside>` : `<aside class="layer-panel"><h2>Map layers</h2>${["Project alignment","Study boundary","Urban land","Agricultural land","Industrial land","Services"].map((x,i)=>`<label class="layer"><input type="checkbox" ${i<3?"checked":""}/><span class="swatch s${i}"></span>${x}</label>`).join("")}<hr/><h3>Basemap</h3><select><option>Light canvas</option><option>Topographic</option><option>Satellite</option></select></aside>`;
  return shell(app, `<main class="viewer">${panel}<div class="viewer-map">${mapPanel(app)}<div class="legend"><b>Legend</b><span><i class="road"></i>Project road</span><span><i class="urban"></i>Urban area</span><span><i class="agri"></i>Agricultural area</span></div></div></main>`);
}

export function renderProject(app: TransportApp): void {
  document.documentElement.lang = app.language;
  document.documentElement.dir = app.direction;
  document.title = app.title;
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) throw new Error("Missing #app root");
  root.innerHTML = app.type === "Dashboard" ? renderInteractiveDashboard(app) : renderSectorApplication(app);
  enableApplicationLocalization(app, root);
  if (app.type === "Dashboard") void initInteractiveDashboard(app); else void initSectorApplication(app);
  document.querySelector<HTMLButtonElement>("#theme-toggle")?.addEventListener("click", () => document.body.classList.toggle("dark"));
  const search = document.querySelector<HTMLInputElement>("#search");
  const select = document.querySelector<HTMLSelectElement>("#land-filter");
  const applyFilter = () => document.querySelectorAll<HTMLElement>("#gallery button").forEach((button) => {
    const query = search?.value.toLowerCase() || "";
    const kind = select?.value || "all";
    button.hidden = !button.textContent?.toLowerCase().includes(query) || (kind !== "all" && button.dataset.kind !== kind);
  });
  search?.addEventListener("input", applyFilter);
  select?.addEventListener("change", applyFilter);
  const referenceDataElement = document.querySelector<HTMLScriptElement>("#reference-data");
  if (referenceDataElement) {
    const references = JSON.parse(referenceDataElement.textContent || "[]") as Array<{imagePath:string;reportName:string;page:number;referenceKind:string;matchType:string;sourceUrl:string}>;
    const image = document.querySelector<HTMLImageElement>("#reference-image");
    const report = document.querySelector<HTMLElement>("#reference-report");
    const page = document.querySelector<HTMLElement>("#reference-page");
    const match = document.querySelector<HTMLElement>("#reference-match");
    const source = document.querySelector<HTMLAnchorElement>("#reference-source");
    document.querySelectorAll<HTMLButtonElement>("[data-reference-index]").forEach((button) => button.addEventListener("click", () => {
      const index = Number(button.dataset.referenceIndex || 0);
      const reference = references[index];
      if (!reference || !image) return;
      image.src = reference.imagePath;
      image.classList.remove("zoomed");
      if (report) report.textContent = reference.reportName;
      if (page) page.textContent = `صفحة ${reference.page} · ${reference.referenceKind}`;
      if (match) match.textContent = reference.matchType === "exact-item-id" ? "مطابقة مباشرة لمعرّف التطبيق" : "مطابقة حسب المشروع ونوع التطبيق";
      if (source) { source.href = reference.sourceUrl; source.hidden = !reference.sourceUrl; }
      document.querySelectorAll("[data-reference-index]").forEach((item) => item.classList.toggle("active", item === button));
    }));
    document.querySelector<HTMLButtonElement>("#zoom-reference")?.addEventListener("click", () => image?.classList.toggle("zoomed"));
    document.querySelector<HTMLButtonElement>("#fit-reference")?.addEventListener("click", () => image?.classList.remove("zoomed"));
  }
}
