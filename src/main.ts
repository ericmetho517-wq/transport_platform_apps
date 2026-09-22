import apps from "../registry/apps.json";
import type { TransportApp } from "../shared/project-runtime";
import { dashboardGroup } from "../shared/interactive-dashboard";
import { enableApplicationLocalization } from "../shared/localization";
import { localizedAppCategory, localizedAppTitle } from "../shared/app-titles";

const registry = (apps as TransportApp[]).filter((app) =>
  dashboardGroup(app) !== "suez-ring-link"
  && app.slug !== "web-viewer-30ddd4974b",
);
const axisOptions = [
  ["ismailia", "طريق القاهرة–الإسماعيلية"], ["western-upper-egypt", "طريق الصعيد الغربي"],
  ["cairo-suez-road", "طريق القاهرة السويس"],
  ["regional-ring-road", "الدائري الإقليمي"],
  ["kalabsha-axis", "طريق كلابشة"], ["dahshur-south-link", "وصلة دهشور الجنوبية"],
  ["qus-axis", "طريق قوص"], ["qena-luxor-road", "طريق قنا الأقصر"],
  ["dabaa-axis", "طريق الضبعة"],
] as const;
const axisOf = (app: TransportApp): string => dashboardGroup(app);
const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app root");

const counts = new Map<string, number>();
registry.forEach((app) => counts.set(app.type, (counts.get(app.type) || 0) + 1));

const typeLabels: Record<string, string> = {
  Dashboard: "لوحات البيانات والمؤشرات",
  StoryMap: "القصص المكانية التفاعلية",
  "Web AppViewer": "خرائط التطبيقات الرقمية",
  "Instant Filter Gallery": "بوابات التطبيقات المتكاملة",
};
const englishTypeLabels: Record<string, string> = {
  Dashboard: "Operational Indicator Dashboards",
  StoryMap: "Geographic Stories",
  "Web AppViewer": "Web App Builder",
  "Instant Filter Gallery": "Application Hub",
};

const typeClass: Record<string, string> = {
  Dashboard: "dashboard",
  StoryMap: "storymap",
  "Web AppViewer": "viewer",
  "Instant Filter Gallery": "gallery",
};

const typeIcon: Record<string, string> = {
  Dashboard: "▦",
  StoryMap: "◇",
  "Web AppViewer": "⌖",
  "Instant Filter Gallery": "▥",
};

const platformParams = new URLSearchParams(window.location.search);
const platformLanguage: "ar" | "en" = platformParams.get("uiLang") === "en" ? "en" : "ar";
const displayTypeLabels = platformLanguage === "en" ? englishTypeLabels : typeLabels;
// The catalog has one canonical record per application. Its Arabic and English
// names are switched in-place, so duplicate language cards never appear.
const modeRegistry = registry.filter((app) => app.language === "ar");
const modeCounts = new Map<string, number>();
modeRegistry.forEach((app) => modeCounts.set(app.type, (modeCounts.get(app.type) || 0) + 1));
const totalApplications = modeRegistry.length;
const countOf = (type: string) => modeCounts.get(type) || 0;
const englishAxisLabels: Record<string, string> = {
  "western-upper-egypt": "Western Upper Egypt Road",
  ismailia: "Cairo–Ismailia Road",
  "dahshur-south-link": "Dahshur South Link",
  "regional-ring-road": "Regional Ring Road",
  "kalabsha-axis": "Kalabsha Road",
  "qena-luxor-road": "Qena–Luxor Road",
  "qus-axis": "Qus Road",
  "cairo-suez-road": "Cairo–Suez Road",
  "suez-ring-link": "Suez Ring Link",
  "dabaa-axis": "El Dabaa Road",
};
const displayTitle = (app: TransportApp) => localizedAppTitle(app, platformLanguage);
const t = (arabic: string, english: string) => platformLanguage === "en" ? english : arabic;
document.documentElement.lang = platformLanguage;
document.documentElement.dir = platformLanguage === "en" ? "ltr" : "rtl";

root.innerHTML = `<div class="platform-shell" dir="${platformLanguage === "en" ? "ltr" : "rtl"}">
  <header class="platform-header">
    <a class="brand" href="#top" aria-label="${platformLanguage === "en" ? "Back to platform home" : "العودة إلى بداية المنصة"}"><span class="brand-logos"><img src="/Picture1.jpg" alt="${platformLanguage === "en" ? "Ministry of Transport logo" : "شعار وزارة النقل"}"/></span><span><b>${platformLanguage === "en" ? "Applications Platform Ministry of Transport" : "منصة تطبيقات وزارة النقل"}</b><small>${t("المنصة الرقمية لوزارة النقل", "Ministry of Transport Digital Platform")}</small></span></a>
    <nav><a href="#applications">${platformLanguage === "en" ? "Applications" : "التطبيقات"}</a></nav>
    <a class="header-cta" href="#applications">${platformLanguage === "en" ? "Explore the Platform" : "استكشف المنصة"} <span>${platformLanguage === "en" ? "→" : "←"}</span></a>
  </header>
  <main id="top">
    <section class="platform-hero">
      <div class="hero-copy"><span class="eyebrow"><i></i> ${platformLanguage === "en" ? "Ministry of Transport Digital Platform" : "المنصة الرقمية لوزارة النقل"}</span><p>${platformLanguage === "en" ? "Dashboards, maps, and geospatial applications for transport projects." : "لوحات مؤشرات وخرائط وتطبيقات مكانية لمشروعات النقل."}</p><div class="hero-actions"><a class="primary" href="#applications">${platformLanguage === "en" ? "View Applications" : "عرض التطبيقات"} <span>${platformLanguage === "en" ? "→" : "←"}</span></a></div></div>
      <div class="network-art" aria-hidden="true"><div class="map-grid"></div><span class="route route-one"></span><span class="route route-two"></span><span class="identity-seal identity-logo"><img src="/images.jpg" alt="${platformLanguage === "en" ? "Geographic Information Systems logo" : "شعار نظم المعلومات الجغرافية"}"/></span><i></i><i></i><i></i><i></i><i></i></div>
      <a class="scroll-cue" href="#applications" aria-label="${platformLanguage === "en" ? "Go to applications" : "انتقل إلى التطبيقات"}"><span></span>${platformLanguage === "en" ? "Scroll to explore" : "مرّر للاستكشاف"}</a>
    </section>
    <section id="applications" class="catalog">
      <div class="section-title"><div><span class="section-kicker">${t("دليل التطبيقات", "Application Directory")}</span><h2>${t("التطبيقات", "Applications")}</h2><p>${t("ابحث واختر التطبيق.", "Search and select an application.")}</p></div><div class="catalog-controls">
        <label class="search-control"><span>${platformLanguage === "en" ? "Search" : "بحث"}</span><input id="app-search" placeholder="${platformLanguage === "en" ? "Search by title or sector" : "ابحث بالعنوان أو القطاع"}"/></label>
        <label><span>${t("نوع التطبيق", "Application Type")}</span><select id="type-filter"><option value="all">${t("جميع أنواع التطبيقات", "All Application Types")}</option>${Array.from(counts.keys()).map((type) => `<option value="${type}">${displayTypeLabels[type] || type}</option>`).join("")}</select></label>
        <label><span>${t("الطريق", "Road")}</span><select id="axis-filter"><option value="all">${t("كل الطرق", "All roads")}</option>${axisOptions.map(([value, label]) => `<option value="${value}">${platformLanguage === "en" ? englishAxisLabels[value] : label}</option>`).join("")}</select></label>
        <label><span>${t("لغة الواجهة", "Interface language")}</span><select id="language-filter" value="${platformLanguage}"><option value="ar"${platformLanguage === "ar" ? " selected" : ""}>العربية</option><option value="en"${platformLanguage === "en" ? " selected" : ""}>English</option></select></label>
      </div></div>
      <div class="catalog-toolbar"><div class="quick-filters" aria-label="${t("تصفية سريعة", "Quick filters")}"><button class="active" data-quick-type="all">${t("جميع التطبيقات", "All Applications")}</button>${Array.from(counts.keys()).map((type) => `<button data-quick-type="${type}">${displayTypeLabels[type] || type}</button>`).join("")}</div><button id="clear-filters" class="clear-filters" type="button">${t("إعادة ضبط الفلاتر", "Reset filters")}</button></div>
      <div class="results-row"><p id="filter-summary" class="filter-summary" aria-live="polite"></p><span>${t("اختر تطبيقًا لعرض تفاصيله وتشغيله", "Choose an application to view its details and open it")}</span></div>
      <div id="app-grid" class="app-grid"></div>
    </section>
  </main>
  <footer><span>${platformLanguage === "en" ? "Applications Platform Ministry of Transport" : "منصة تطبيقات وزارة النقل"}</span><span>${platformLanguage === "en" ? "Open-source digital geospatial platform" : "منصة جغرافية رقمية مفتوحة المصدر"}</span></footer>
  <button id="back-to-top" class="back-to-top" type="button" aria-label="${platformLanguage === "en" ? "Back to top" : "العودة إلى أعلى الصفحة"}">↑</button>
</div>`;

const platformApp: TransportApp = { id: "platform", slug: "platform", title: "منصة تطبيقات وزارة النقل", alternateTitles: ["Ministry of Transport Digital Platform"], category: "منصة التطبيقات", type: "Dashboard", language: platformLanguage, direction: platformLanguage === "en" ? "ltr" : "rtl", sourceUrl: "", status: "local" };
enableApplicationLocalization(platformApp, root);
const languageHeader = root.querySelector<HTMLElement>(".platform-header");
if (languageHeader) {
  const languageButton = document.createElement("button");
  languageButton.id = "platform-language-toggle";
  languageButton.type = "button";
  languageButton.textContent = platformLanguage === "en" ? "العربية" : "English";
  languageButton.setAttribute("aria-label", t("تغيير لغة المنصة", "Switch platform language"));
  languageHeader.appendChild(languageButton);
  languageButton.addEventListener("click", () => {
    const next = platformLanguage === "en" ? "ar" : "en";
    const params = new URLSearchParams(window.location.search);
    params.set("uiLang", next);
    params.delete("lang");
    window.location.search = params.toString();
  });
}

const grid = document.querySelector<HTMLDivElement>("#app-grid")!;
const search = document.querySelector<HTMLInputElement>("#app-search")!;
const typeFilter = document.querySelector<HTMLSelectElement>("#type-filter")!;
const languageFilter = document.querySelector<HTMLSelectElement>("#language-filter") || document.createElement("select");
const axisFilter = document.querySelector<HTMLSelectElement>("#axis-filter")!;
const summary = document.querySelector<HTMLParagraphElement>("#filter-summary")!;
const clearFilters = document.querySelector<HTMLButtonElement>("#clear-filters")!;
const quickFilters = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-quick-type]"));

// Keep the catalog state shareable. Example: `?axis=ismailia` opens the
// platform already filtered to the Cairo–Ismailia corridor.
const restoreFiltersFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const selectValue = (select: HTMLSelectElement, value: string | null) => {
    if (value && Array.from(select.options).some((option) => option.value === value)) select.value = value;
  };
  search.value = params.get("q") || "";
  selectValue(typeFilter, params.get("type"));
  selectValue(languageFilter, params.get("lang"));
  selectValue(axisFilter, params.get("axis"));
};

const syncFiltersToUrl = () => {
  const url = new URL(window.location.href);
  const set = (name: string, value: string, fallback = "all") => {
    if (!value || value === fallback) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
  };
  set("q", search.value.trim(), "");
  set("type", typeFilter.value);
  set("lang", languageFilter.value, platformLanguage);
  set("axis", axisFilter.value);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
};

let cardObserver: IntersectionObserver | undefined;
if ("IntersectionObserver" in window) {
  cardObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    cardObserver?.unobserve(entry.target);
  }), { rootMargin: "0px 0px -40px", threshold: 0.08 });
}

const render = () => {
  const query = search.value.trim().toLocaleLowerCase();
  const type = typeFilter.value;
  const axis = axisFilter.value;
  const visible = modeRegistry.filter((app) =>
    (type === "all" || app.type === type)
    && (axis === "all" || axisOf(app) === axis)
    && `${displayTitle(app)} ${platformLanguage === "en" ? englishAxisLabels[axisOf(app)] || "" : app.category}`.toLocaleLowerCase().includes(query));
  summary.textContent = platformLanguage === "en"
    ? (visible.length ? "Applications matching your search and filter selections" : "No matching applications")
    : (visible.length ? "التطبيقات المطابقة لاختيارات البحث والتصفية" : "لا توجد تطبيقات مطابقة");
  clearFilters.classList.toggle("visible", Boolean(query || type !== "all" || axis !== "all"));
  quickFilters.forEach((button) => button.classList.toggle("active", button.dataset.quickType === type));
  const groups = axisOptions.map(([value, label]) => [value, label, visible.filter((app) => axisOf(app) === value)] as const).filter(([, , items]) => items.length);
  const uncategorized = visible.filter((app) => !axisOptions.some(([value]) => axisOf(app) === value));
  if (uncategorized.length) {
    const sharedGroup: [string, string, TransportApp[]] = ["other", t("تطبيقات مشتركة", "Shared applications"), uncategorized];
    (groups as [string, string, TransportApp[]][]).push(sharedGroup);
  }
  let cardIndex = 0;
  grid.innerHTML = groups.map(([value, label, items]) => { const groupLabel = platformLanguage === "en" ? (englishAxisLabels[value] || label) : label; return `<section class="sector-group" aria-label="${groupLabel}"><div class="sector-group-heading"><div><span>${t("قطاع", "Sector")}</span><h3>${groupLabel}</h3></div></div><div class="sector-group-grid">${items.map((app) => `<a class="app-card type-${typeClass[app.type] || "default"}" href="./projects/${app.slug}/index.html?lang=${platformLanguage}" target="_blank" rel="noopener noreferrer" dir="${platformLanguage === "en" ? "ltr" : "rtl"}" style="--card-index:${cardIndex++ % 12}"><span class="card-type">${displayTypeLabels[app.type] || app.type}</span><span class="card-icon" aria-hidden="true">${typeIcon[app.type] || "·"}</span><h3>${displayTitle(app)}</h3><p>${platformLanguage === "en" ? groupLabel : localizedAppCategory(app, "ar")}</p><span class="card-language">${platformLanguage === "en" ? "EN" : "ع"}</span><span class="open">${t("فتح التطبيق", "Open application")} <b>${platformLanguage === "en" ? "→" : "←"}</b></span></a>`).join("")}</div></section>`; }).join("") || `<div class="empty"><b>${t("لا توجد نتائج مطابقة", "No matching applications")}</b><span>${t("جرّب تغيير خيارات البحث والتصفية.", "Try changing the filters.")}</span><button type="button" data-reset-empty>${t("عرض جميع التطبيقات", "View all applications")}</button></div>`;
  requestAnimationFrame(() => grid.querySelectorAll<HTMLElement>(".app-card").forEach((card) => cardObserver ? cardObserver.observe(card) : card.classList.add("is-visible")));
  syncFiltersToUrl();
};

search.addEventListener("input", render);
typeFilter.addEventListener("change", render);
languageFilter.addEventListener("change", () => {
  const next = languageFilter.value === "en" ? "en" : "ar";
  const params = new URLSearchParams(window.location.search);
  params.set("uiLang", next);
  window.location.search = params.toString();
});
axisFilter.addEventListener("change", render);
quickFilters.forEach((button) => button.addEventListener("click", () => {
  typeFilter.value = button.dataset.quickType || "all";
  render();
}));

const resetFilters = () => {
  search.value = "";
  typeFilter.value = "all";
  languageFilter.value = platformLanguage;
  axisFilter.value = "all";
  render();
};
clearFilters.addEventListener("click", resetFilters);
grid.addEventListener("click", (event) => {
  if ((event.target as HTMLElement).closest("[data-reset-empty]")) resetFilters();
});

window.addEventListener("popstate", () => { restoreFiltersFromUrl(); render(); });

const platformHeader = document.querySelector<HTMLElement>(".platform-header")!;
const backToTop = document.querySelector<HTMLButtonElement>("#back-to-top")!;
const updateScrollState = () => {
  platformHeader.classList.toggle("scrolled", window.scrollY > 24);
  backToTop.classList.toggle("visible", window.scrollY > 650);
};
window.addEventListener("scroll", updateScrollState, { passive: true });
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const networkArt = document.querySelector<HTMLElement>(".network-art");
networkArt?.addEventListener("pointermove", (event) => {
  const bounds = networkArt.getBoundingClientRect();
  networkArt.style.setProperty("--pointer-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 14}px`);
  networkArt.style.setProperty("--pointer-y", `${((event.clientY - bounds.top) / bounds.height - .5) * 14}px`);
});
networkArt?.addEventListener("pointerleave", () => {
  networkArt.style.setProperty("--pointer-x", "0px");
  networkArt.style.setProperty("--pointer-y", "0px");
});

restoreFiltersFromUrl();
render();
