import type { TransportApp } from "./project-runtime";
import { enableApplicationLocalization } from "./localization";
import { localizedAppCategory, localizedAppTitle } from "./app-titles";
import "./data-pending-app.css";

const esc = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character] || character));

export function renderPendingDataApp(app: TransportApp): void {
  const requested = new URLSearchParams(window.location.search).get("lang");
  const language: "ar" | "en" = requested === "en" ? "en" : "ar";
  const active = {
    ...app,
    language,
    direction: language === "en" ? "ltr" as const : "rtl" as const,
    title: localizedAppTitle(app, language),
    category: localizedAppCategory(app, language),
  };
  const isEnglish = language === "en";
  document.documentElement.lang = language;
  document.documentElement.dir = active.direction;
  document.title = active.title;
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) throw new Error("Missing #app root");
  root.innerHTML = `<main class="pending-app" dir="${active.direction}">
    <header class="pending-topbar">
      <a class="pending-brand" href="../../index.html" aria-label="${isEnglish ? "Back to the applications platform" : "العودة إلى منصة التطبيقات"}">
        <span class="pending-brand-mark" aria-hidden="true">وزارة النقل</span>
        <span>${isEnglish ? "Applications Platform" : "منصة تطبيقات وزارة النقل"}</span>
      </a>
      <button id="language-toggle" type="button">${isEnglish ? "العربية" : "English"}</button>
    </header>
    <section class="pending-hero">
      <div class="pending-breadcrumb">${esc(active.category)}</div>
      <span class="pending-status"><i></i>${isEnglish ? "Data preparation in progress" : "بيانات قيد الاستكمال"}</span>
      <div class="pending-icon" aria-hidden="true">⌁</div>
      <h1>${esc(active.title)}</h1>
      <p>${isEnglish ? "This application is prepared and will be completed as soon as the source data is received." : "بانتظار استلام البيانات المصدرية لاستكمال هذا التطبيق."}</p>
      <div class="pending-divider" aria-hidden="true"><span></span></div>
      <p class="pending-detail">${isEnglish ? "No metrics, maps, or indicators are displayed until verified source data is available." : "لن يتم عرض مؤشرات أو خرائط أو أرقام قبل استلام البيانات المصدرية المعتمدة."}</p>
      <a class="pending-back" href="../../index.html?axis=${encodeURIComponent(active.reportReferenceGroup || "")}">${isEnglish ? "Back to applications" : "العودة إلى التطبيقات"}<b>${isEnglish ? "→" : "←"}</b></a>
    </section>
  </main>`;
  enableApplicationLocalization(active, root);
  root.querySelector<HTMLButtonElement>("#language-toggle")?.addEventListener("click", () => {
    const params = new URLSearchParams(window.location.search);
    params.set("lang", isEnglish ? "ar" : "en");
    window.location.search = params.toString();
  });
}
