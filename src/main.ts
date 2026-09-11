import apps from "../registry/apps.json";
import type { TransportApp } from "../shared/project-runtime";
import { dashboardGroup } from "../shared/interactive-dashboard";
import { enableApplicationLocalization } from "../shared/localization";

const registry = apps as TransportApp[];
const axisOptions = [
  ["western-upper-egypt", "محور الصعيد الغربي / Western Upper Egypt"], ["ismailia", "محور القاهرة–الإسماعيلية / Cairo–Ismailia"], ["dahshur-south-link", "وصلة دهشور الجنوبية / Dahshur South Link"],
  ["regional-ring-road", "الدائري الإقليمي / Regional Ring Road"],
  ["kalabsha-axis", "محور كلابشة / Kalabsha Axis"], ["qena-luxor-road", "طريق قنا الأقصر / Qena–Luxor Road"],
  ["qus-axis", "محور قوص / Qus Axis"], ["cairo-suez-road", "طريق القاهرة السويس / Cairo–Suez Road"],
  ["suez-ring-link", "وصلة السويس / Suez Ring Link"], ["dabaa-axis", "محور الضبعة / Dabaa Axis"],
] as const;
const axisOf = (app: TransportApp): string => dashboardGroup(app);
const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app root");

const counts = new Map<string, number>();
registry.forEach((app) => counts.set(app.type, (counts.get(app.type) || 0) + 1));

const typeLabels: Record<string, string> = {
  Dashboard: "لوحات المؤشرات التنفيذية",
  Experience: "التطبيقات التفاعلية",
  StoryMap: "القصص الجغرافية",
  "Web AppViewer": "تطبيقات استعراض الخرائط",
  "Instant Filter Gallery": "كتالوج التطبيقات",
};

const typeClass: Record<string, string> = {
  Dashboard: "dashboard",
  Experience: "experience",
  StoryMap: "storymap",
  "Web AppViewer": "viewer",
  "Instant Filter Gallery": "gallery",
};

const typeIcon: Record<string, string> = {
  Dashboard: "▦",
  Experience: "◫",
  StoryMap: "◇",
  "Web AppViewer": "⌖",
  "Instant Filter Gallery": "▥",
};

const platformParams = new URLSearchParams(window.location.search);
const platformLanguage: "ar" | "en" = platformParams.get("uiLang") === "en" ? "en" : "ar";
document.documentElement.lang = platformLanguage;
document.documentElement.dir = platformLanguage === "en" ? "ltr" : "rtl";

root.innerHTML = `<div class="platform-shell" dir="rtl">
  <header class="platform-header">
    <a class="brand" href="#top" aria-label="العودة إلى بداية المنصة"><span class="brand-logos"><img src="/Picture1.jpg" alt="شعار وزارة النقل"/><img src="/images.jpg" alt="شعار نظم المعلومات الجغرافية"/></span><span><b>منصة تطبيقات وزارة النقل</b><small>Ministry of Transport Digital Platform</small></span></a>
    <nav><a href="#applications">التطبيقات</a></nav>
    <a class="header-cta" href="#applications">استكشف المنصة <span>←</span></a>
  </header>
  <main id="top">
    <section class="platform-hero">
      <div class="hero-copy"><span class="eyebrow"><i></i> منصة جغرافية رقمية مفتوحة المصدر</span><h1>كل مشروعات النقل<br/><em>في منصة واحدة.</em></h1><p>بوابة مؤسسية موحدة لاستعراض لوحات المؤشرات والخرائط التفاعلية والقصص المكانية والبيانات القطاعية بسهولة ووضوح.</p><div class="hero-actions"><a class="primary" href="#applications">استعرض التطبيقات <span>←</span></a><span class="hero-trust">بيانات مكانية موثقة ومترابطة</span></div><div class="hero-tags"><span>خرائط تفاعلية</span><span>بيانات قطاعية</span><span>عربي وEnglish</span></div></div>
      <div class="network-art" aria-hidden="true"><div class="map-grid"></div><span class="route route-one"></span><span class="route route-two"></span><span class="identity-seal"><small>جمهورية مصر العربية</small><b>وزارة النقل</b><em>بوابة التطبيقات المكانية</em></span><i></i><i></i><i></i><i></i><i></i></div>
      <a class="scroll-cue" href="#applications" aria-label="انتقل إلى التطبيقات"><span></span>مرّر للاستكشاف</a>
    </section>
    <section id="applications" class="catalog">
      <div class="section-title"><div><span class="section-kicker">دليل التطبيقات</span><h2>استعرض جميع المشروعات</h2><p>ابحث بالعنوان أو القطاع، ثم صفِّ النتائج حسب النوع واللغة.</p></div><div class="catalog-controls">
        <label class="search-control"><span>بحث</span><input id="app-search" placeholder="ابحث بالعنوان أو القطاع"/></label>
        <label><span>نوع التطبيق</span><select id="type-filter"><option value="all">جميع أنواع التطبيقات</option>${Array.from(counts.keys()).map((type) => `<option value="${type}">${typeLabels[type] || type}</option>`).join("")}</select></label>
        <label><span>اللغة / Language</span><select id="language-filter"><option value="all">الكل / All</option><option value="ar">العربية</option><option value="en">English</option></select></label>
        <label><span>المحور / Axis</span><select id="axis-filter"><option value="all">كل المحاور / All axes</option>${axisOptions.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label>
      </div></div>
      <div class="catalog-toolbar"><div class="quick-filters" aria-label="تصفية سريعة"><button class="active" data-quick-type="all">جميع التطبيقات</button>${Array.from(counts.keys()).map((type) => `<button data-quick-type="${type}">${typeLabels[type] || type}</button>`).join("")}</div><button id="clear-filters" class="clear-filters" type="button">إعادة ضبط الفلاتر</button></div>
      <div class="results-row"><p id="filter-summary" class="filter-summary" aria-live="polite"></p><span>اختر تطبيقًا لعرض تفاصيله وتشغيله</span></div>
      <div id="app-grid" class="app-grid"></div>
    </section>
  </main>
  <footer><span>منصة تطبيقات وزارة النقل</span><span>منصة جغرافية رقمية مفتوحة المصدر</span></footer>
  <button id="back-to-top" class="back-to-top" type="button" aria-label="العودة إلى أعلى الصفحة">↑</button>
</div>`;

const platformApp: TransportApp = { id: "platform", slug: "platform", title: "منصة تطبيقات وزارة النقل", alternateTitles: ["Ministry of Transport Digital Platform"], category: "منصة التطبيقات", type: "Dashboard", language: platformLanguage, direction: platformLanguage === "en" ? "ltr" : "rtl", sourceUrl: "", status: "local" };
enableApplicationLocalization(platformApp, root);
const languageHeader = root.querySelector<HTMLElement>(".platform-header");
if (languageHeader) {
  const languageButton = document.createElement("button");
  languageButton.id = "platform-language-toggle";
  languageButton.type = "button";
  languageButton.textContent = platformLanguage === "en" ? "العربية" : "English";
  languageButton.setAttribute("aria-label", "Switch platform language");
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
const languageFilter = document.querySelector<HTMLSelectElement>("#language-filter")!;
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
  set("lang", languageFilter.value);
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
  const language = languageFilter.value;
  const axis = axisFilter.value;
  const visible = registry.filter((app) =>
    (type === "all" || app.type === type)
    && (language === "all" || app.language === language)
    && (axis === "all" || axisOf(app) === axis)
    && `${app.title} ${app.category}`.toLocaleLowerCase().includes(query));
  summary.textContent = visible.length ? "التطبيقات المطابقة لاختيارات البحث والتصفية" : "لا توجد تطبيقات مطابقة";
  clearFilters.classList.toggle("visible", Boolean(query || type !== "all" || language !== "all" || axis !== "all"));
  quickFilters.forEach((button) => button.classList.toggle("active", button.dataset.quickType === type));
  const groups = axisOptions.map(([value, label]) => [value, label, visible.filter((app) => axisOf(app) === value)] as const).filter(([, , items]) => items.length);
  const uncategorized = visible.filter((app) => !axisOptions.some(([value]) => axisOf(app) === value));
  if (uncategorized.length) groups.push(["other", "تطبيقات مشتركة / Shared applications", uncategorized]);
  let cardIndex = 0;
  grid.innerHTML = groups.map(([, label, items]) => `<section class="sector-group" aria-label="${label}"><div class="sector-group-heading"><div><span>قطاع / Sector</span><h3>${label}</h3></div><b>${items.length} تطبيق</b></div><div class="sector-group-grid">${items.map((app) => `<a class="app-card type-${typeClass[app.type] || "default"}" href="./projects/${app.slug}/index.html?lang=${platformLanguage}" dir="${app.direction}" style="--card-index:${cardIndex++ % 12}"><span class="card-type">${typeLabels[app.type] || app.type}</span><span class="card-icon" aria-hidden="true">${typeIcon[app.type] || "·"}</span><h3>${app.title}</h3><p>${app.category}</p><span class="card-language">${app.language === "en" ? "EN" : "ع"}</span><span class="open">${app.language === "en" ? "Open application" : "فتح التطبيق"} <b>${app.direction === "ltr" ? "→" : "←"}</b></span></a>`).join("")}</div></section>`).join("") || `<div class="empty"><b>لا توجد نتائج مطابقة</b><span>No matching applications</span><button type="button" data-reset-empty>عرض جميع التطبيقات</button></div>`;
  requestAnimationFrame(() => grid.querySelectorAll<HTMLElement>(".app-card").forEach((card) => cardObserver ? cardObserver.observe(card) : card.classList.add("is-visible")));
  syncFiltersToUrl();
};

search.addEventListener("input", render);
typeFilter.addEventListener("change", render);
languageFilter.addEventListener("change", render);
axisFilter.addEventListener("change", render);
quickFilters.forEach((button) => button.addEventListener("click", () => {
  typeFilter.value = button.dataset.quickType || "all";
  render();
}));

const resetFilters = () => {
  search.value = "";
  typeFilter.value = "all";
  languageFilter.value = "all";
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
