import apps from "../registry/apps.json";
import type { TransportApp } from "../shared/project-runtime";

const registry = apps as TransportApp[];
const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app root");

const counts = new Map<string, number>();
registry.forEach((app) => counts.set(app.type, (counts.get(app.type) || 0) + 1));

const typeLabels: Record<string, string> = { Dashboard: "لوحات المؤشرات", Experience: "التجارب التفاعلية", StoryMap: "القصص المكانية", "Web AppViewer": "عارض الخرائط", "Instant Filter Gallery": "معرض التطبيقات" };

root.innerHTML = `<div class="platform-shell" dir="rtl">
  <header class="platform-header"><a class="brand" href="#"><span class="brand-mark">MOT</span><span><b>منصة تطبيقات وزارة النقل</b><small>Ministry of Transport Digital Platform</small></span></a><nav><a href="#applications">التطبيقات</a><a href="#about">عن المنصة</a></nav></header>
  <main><section class="platform-hero"><div class="hero-copy"><span class="eyebrow">منصة جغرافية رقمية مفتوحة المصدر</span><h1>منصة واحدة.<br/><em>78 تطبيقًا للنقل.</em></h1><p>لوحات مؤشرات وتجارب تفاعلية وقصص مكانية وعوارض خرائط، مجمّعة في بوابة مؤسسية واحدة بهوية وزارة النقل.</p><a class="primary" href="#applications">استعرض التطبيقات <span>←</span></a></div><div class="network-art" aria-hidden="true"><span class="identity-seal">وزارة<br/><b>النقل</b><small>جمهورية مصر العربية</small></span><i></i><i></i><i></i><i></i><i></i></div></section>
  <section class="stats">${Array.from(counts).map(([type,count])=>`<article><strong>${count}</strong><span>${typeLabels[type] || type}</span></article>`).join("")}</section>
  <section id="applications" class="catalog"><div class="section-title"><div><span class="section-kicker">دليل التطبيقات</span><h2>استعرض جميع المشروعات</h2><p>اختر التطبيق المطلوب أو ابحث باسم المشروع والقطاع.</p></div><div class="catalog-controls"><label><span>بحث</span><input id="app-search" placeholder="ابحث بالعنوان أو القطاع"/></label><label><span>نوع التطبيق</span><select id="type-filter"><option value="all">جميع أنواع التطبيقات</option>${Array.from(counts.keys()).map(type=>`<option value="${type}">${typeLabels[type] || type}</option>`).join("")}</select></label></div></div><div id="app-grid" class="app-grid"></div></section>
  <section id="about" class="about"><span>هوية رقمية موحّدة</span><h2>بيانات النقل وتطبيقاته في منصة مؤسسية واحدة.</h2><p>لكل تطبيق مجلد مستقل وإعداداته وبياناته المحلية، مع واجهة مشتركة تسهّل الوصول إلى مشروعات القطاعات المختلفة وإدارتها.</p></section></main>
  <footer><span>منصة تطبيقات وزارة النقل</span><span>78 مشروعًا · TypeScript · Open Source</span></footer>
</div>`;

const grid = document.querySelector<HTMLDivElement>("#app-grid")!;
const search = document.querySelector<HTMLInputElement>("#app-search")!;
const filter = document.querySelector<HTMLSelectElement>("#type-filter")!;
const render = () => {
  const query = search.value.trim().toLowerCase();
  const type = filter.value;
  const visible = registry.filter((app) => (type === "all" || app.type === type) && `${app.title} ${app.category}`.toLowerCase().includes(query));
  grid.innerHTML = visible.map((app,index)=>`<a class="app-card" href="./projects/${app.slug}/index.html" dir="${app.direction}"><span class="card-number">${String(index+1).padStart(2,"0")}</span><span class="card-type">${typeLabels[app.type] || app.type}</span><span class="card-icon" aria-hidden="true">${app.type === "Dashboard" ? "▦" : app.type === "StoryMap" ? "◇" : app.type === "Web AppViewer" ? "⌖" : app.type === "Experience" ? "◫" : "▥"}</span><h3>${app.title}</h3><p>${app.category}</p><span class="open">فتح التطبيق <b>←</b></span></a>`).join("") || `<p class="empty">لا توجد تطبيقات مطابقة لعملية البحث.</p>`;
};
search.addEventListener("input", render);
filter.addEventListener("change", render);
render();
