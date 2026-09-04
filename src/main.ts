import apps from "../registry/apps.json";
import type { TransportApp } from "../shared/project-runtime";
import { dashboardGroup } from "../shared/interactive-dashboard";

const registry = apps as TransportApp[];
const axisOptions = [
  ["western-upper-egypt", "محور الصعيد الغربي / Western Upper Egypt"], ["regional-ring-road", "الدائري الإقليمي / Regional Ring Road"],
  ["kalabsha-axis", "محور كلابشة / Kalabsha Axis"], ["qena-luxor-road", "طريق قنا الأقصر / Qena–Luxor Road"],
  ["qus-axis", "محور قوص / Qus Axis"], ["cairo-suez-road", "طريق القاهرة السويس / Cairo–Suez Road"],
  ["suez-ring-link", "وصلة السويس / Suez Ring Link"], ["dabaa-axis", "محور الضبعة / Dabaa Axis"],
] as const;
const axisOf = (app: TransportApp): string => app.reportReferences?.[0]?.projectGroup || dashboardGroup(app);
const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app root");

const counts = new Map<string, number>();
registry.forEach((app) => counts.set(app.type, (counts.get(app.type) || 0) + 1));

const typeLabels: Record<string, string> = {
  Dashboard: "لوحات المؤشرات",
  Experience: "التجارب التفاعلية",
  StoryMap: "القصص المكانية",
  "Web AppViewer": "عارض الخرائط",
  "Instant Filter Gallery": "معرض التطبيقات",
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

root.innerHTML = `<div class="platform-shell" dir="rtl">
  <header class="platform-header">
    <a class="brand" href="#top" aria-label="العودة إلى بداية المنصة"><span class="brand-mark"><i></i><b>MOT</b></span><span><b>منصة تطبيقات وزارة النقل</b><small>Ministry of Transport Digital Platform</small></span></a>
    <nav><a href="#applications">التطبيقات</a><a href="#about">عن المنصة</a></nav>
    <a class="header-cta" href="#applications">استكشف المنصة <span>←</span></a>
  </header>
  <main id="top">
    <section class="platform-hero">
      <div class="hero-copy"><span class="eyebrow"><i></i> منصة جغرافية رقمية مفتوحة المصدر</span><h1>كل مشروعات النقل<br/><em>في منصة واحدة.</em></h1><p>لوحات مؤشرات وتجارب تفاعلية وقصص مكانية وعوارض خرائط، مجمّعة في بوابة مؤسسية موحدة وسريعة الوصول.</p><div class="hero-actions"><a class="primary" href="#applications">استعرض التطبيقات <span>←</span></a><span class="hero-trust"><b>78</b> تطبيقًا موثقًا عبر <b>9</b> قطاعات</span></div><div class="hero-tags"><span>خرائط تفاعلية</span><span>بيانات قطاعية</span><span>عربي وEnglish</span></div></div>
      <div class="network-art" aria-hidden="true"><div class="map-grid"></div><span class="route route-one"></span><span class="route route-two"></span><span class="identity-seal"><small>جمهورية مصر العربية</small><b>وزارة النقل</b><em>بوابة التطبيقات المكانية</em></span><i></i><i></i><i></i><i></i><i></i></div>
      <a class="scroll-cue" href="#applications" aria-label="انتقل إلى التطبيقات"><span></span>مرّر للاستكشاف</a>
    </section>
    <section class="stats" aria-label="إحصائيات أنواع التطبيقات">${Array.from(counts).map(([type, count]) => `<article data-stat-type="${type}"><strong data-count="${count}">0</strong><span>${typeLabels[type] || type}</span><i></i></article>`).join("")}</section>
    <section id="applications" class="catalog">
      <div class="section-title"><div><span class="section-kicker">دليل التطبيقات</span><h2>استعرض جميع المشروعات</h2><p>ابحث بالعنوان أو القطاع، ثم صفِّ النتائج حسب النوع واللغة.</p></div><div class="catalog-controls">
        <label class="search-control"><span>بحث</span><input id="app-search" placeholder="ابحث بالعنوان أو القطاع"/></label>
        <label><span>نوع التطبيق</span><select id="type-filter"><option value="all">جميع أنواع التطبيقات</option>${Array.from(counts.keys()).map((type) => `<option value="${type}">${typeLabels[type] || type}</option>`).join("")}</select></label>
        <label><span>اللغة / Language</span><select id="language-filter"><option value="all">الكل / All</option><option value="ar">العربية</option><option value="en">English</option></select></label>
        <label><span>المحور / Axis</span><select id="axis-filter"><option value="all">كل المحاور / All axes</option>${axisOptions.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label>
      </div></div>
      <div class="catalog-toolbar"><div class="quick-filters" aria-label="تصفية سريعة"><button class="active" data-quick-type="all">الكل</button>${Array.from(counts.keys()).map((type) => `<button data-quick-type="${type}">${typeLabels[type] || type}<b>${counts.get(type)}</b></button>`).join("")}</div><button id="clear-filters" class="clear-filters" type="button">مسح الفلاتر</button></div>
      <div class="results-row"><p id="filter-summary" class="filter-summary" aria-live="polite"></p><span>اختر أي بطاقة لفتح التطبيق في صفحة مستقلة</span></div>
      <div id="app-grid" class="app-grid"></div>
    </section>
    <section id="about" class="about"><div class="about-copy"><span>هوية رقمية موحّدة</span><h2>بيانات النقل وتطبيقاته في مساحة مؤسسية واحدة.</h2><p>وصول مباشر إلى تطبيقات كل قطاع وبياناته المحلية من واجهة واضحة، متجاوبة ومهيأة للعمل على الحاسب والهاتف.</p></div><div class="about-features"><article><b>01</b><span>بحث وتصنيف سريع</span><small>حسب القطاع والنوع واللغة</small></article><article><b>02</b><span>تجربة متجاوبة</span><small>على جميع أحجام الشاشات</small></article><article><b>03</b><span>بيانات مكانية</span><small>خرائط ومؤشرات مترابطة</small></article></div></section>
  </main>
  <footer><span>منصة تطبيقات وزارة النقل</span><span>78 مشروعًا · TypeScript · Open Source</span></footer>
  <button id="back-to-top" class="back-to-top" type="button" aria-label="العودة إلى أعلى الصفحة">↑</button>
</div>`;

const grid = document.querySelector<HTMLDivElement>("#app-grid")!;
const search = document.querySelector<HTMLInputElement>("#app-search")!;
const typeFilter = document.querySelector<HTMLSelectElement>("#type-filter")!;
const languageFilter = document.querySelector<HTMLSelectElement>("#language-filter")!;
const axisFilter = document.querySelector<HTMLSelectElement>("#axis-filter")!;
const summary = document.querySelector<HTMLParagraphElement>("#filter-summary")!;
const clearFilters = document.querySelector<HTMLButtonElement>("#clear-filters")!;
const quickFilters = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-quick-type]"));

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
  summary.textContent = `عرض ${visible.length.toLocaleString("ar-EG")} من ${registry.length.toLocaleString("ar-EG")} تطبيق`;
  clearFilters.classList.toggle("visible", Boolean(query || type !== "all" || language !== "all"));
  quickFilters.forEach((button) => button.classList.toggle("active", button.dataset.quickType === type));
  grid.innerHTML = visible.map((app, index) => `<a class="app-card type-${typeClass[app.type] || "default"}" href="./projects/${app.slug}/index.html" dir="${app.direction}" style="--card-index:${index % 12}"><span class="card-number">${String(index + 1).padStart(2, "0")}</span><span class="card-type">${typeLabels[app.type] || app.type}</span><span class="card-icon" aria-hidden="true">${typeIcon[app.type] || "·"}</span><h3>${app.title}</h3><p>${app.category}</p><span class="card-language">${app.language === "en" ? "EN" : "ع"}</span><span class="open">${app.language === "en" ? "Open application" : "فتح التطبيق"} <b>${app.direction === "ltr" ? "→" : "←"}</b></span></a>`).join("") || `<div class="empty"><b>لا توجد نتائج مطابقة</b><span>No matching applications</span><button type="button" data-reset-empty>عرض جميع التطبيقات</button></div>`;
  requestAnimationFrame(() => grid.querySelectorAll<HTMLElement>(".app-card").forEach((card) => cardObserver ? cardObserver.observe(card) : card.classList.add("is-visible")));
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

document.querySelectorAll<HTMLElement>("[data-count]").forEach((element) => {
  const target = Number(element.dataset.count || 0);
  const start = performance.now();
  const animate = (now: number) => {
    const progress = Math.min((now - start) / 900, 1);
    element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))).toLocaleString("ar-EG");
    if (progress < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
});

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

render();
