import type { TransportApp } from "./project-runtime";

const englishTitles: Record<string, string> = {
  "لوحة مؤشرات الأراضى العمرانية": "Urban Land Indicators Dashboard",
  "لوحة مؤشرات الأراضي العمرانية": "Urban Land Indicators Dashboard",
  "لوحة مؤشرات أسعار الأراضى": "Land Prices Indicators Dashboard",
  "لوحة مؤشرات أسعار الأراضي": "Land Prices Indicators Dashboard",
  "لوحة مؤشرات الأراضي الزراعية والصناعية": "Agricultural and Industrial Land Indicators Dashboard",
  "محور الصعيد الغربي (الجيزة / ابوسمبل)": "Western Upper Egypt Axis (Giza / Abu Simbel)",
  "طريق الصعيد الغربي": "Western Upper Egypt Road",
  "لوحة مؤشرات الدراسة المدنية": "Civil Study Indicators Dashboard",
  "لوحة مؤشرات أنماط و انواع الأراضى": "Land Types and Patterns Indicators Dashboard",
  "لوحة مؤشرات أسعار و دراسات الأراضى": "Land Prices and Studies Indicators Dashboard",
  "لوحة مؤشرات الدراسة المدنية الاقليمي": "Regional Civil Study Indicators Dashboard",
  "منطقة الدراسة القوس الشرقى للدائرى الأقليمى و خط الروبيكى": "Eastern Arc of the Regional Ring Road and Robeki Railway Study Area",
  "الدائري الإقليمي والروبيكي": "Regional Ring Road and Robeki Railway",
  "قياس الأثر التنموي في نطاق التأثير التنموي المباشر للقوس الشرقي للطريق الدائري خلال الـ 30 سنة القادمة": "Development Impact Assessment for the Eastern Arc of the Ring Road: Next 30 Years",
  "لوحة مؤشرات الأراضى الزراعية والعمرانية": "Agricultural and Urban Land Indicators Dashboard",
  "تطور الاراضي المحيطة بمحور كلابشة": "Land Development Around Kalabsha Axis",
  "لوحة مؤشرات أنماط و أسعار الأراضى": "Land Types and Prices Indicators Dashboard",
  "منطقة دراسة محور كلابشة": "Kalabsha Axis Study Area",
  "تطور الاراضي المحيطة بطريق قنا الأقصر": "Land Development Around Qena–Luxor Road",
  "لوحة مؤشرات الاسعار الأراضى": "Land Prices Indicators Dashboard",
  "منطقة الدراسة محور قنا": "Qena Axis Study Area",
  "تطور الاراضي المحيطة بوصلة طريق السويس من الطريق الدائري": "Land Development Around the Suez Ring Road Link",
  "وصلة طريق السويس من الطريق الدائري": "Suez Ring Road Link",
  "السويس": "Suez",
  "منطقة الدراسة وصلة طريق السويس من الطريق الدائري الاوسطي": "Suez Ring Road Link Study Area",
  "طريق القاهرة - السويس الصحراوي - (السويس الحر)": "Cairo–Suez Desert Road (Suez Free Zone)",
  "قياس الأثر التنموي في نطاق التأثير التنموي المباشر طريق السويس الحر خلال الـ 30 سنة القادمة": "Development Impact Assessment for Suez Free Road: Next 30 Years",
  "قياس الأثر الاقتصادي والتنموي طريق القاهرة - السويس الصحراوي - (السويس الحر) (2014-2024)": "Economic and Development Impact Assessment: Cairo–Suez Desert Road (2014–2024)",
  "طريق السويس": "Suez Road",
  "تطور الاراضي المحيطة بمحور قوص": "Land Development Around Qus Axis",
  "تطبيق منطقة الدراسة محور قوص": "Qus Axis Study Area Application",
  "محور قوص": "Qus Axis",
  "لوحة مؤشرات الأراضي العمرانية – الإسماعيلية": "Urban Land Indicators Dashboard – Ismailia",
  "لوحة مؤشرات أسعار الأراضي – الإسماعيلية": "Land Prices Indicators Dashboard – Ismailia",
  "لوحة مؤشرات الأراضي الزراعية والصناعية – الإسماعيلية": "Agricultural and Industrial Land Indicators Dashboard – Ismailia",
  "القصة المكانية التفاعلية – محور القاهرة–الإسماعيلية": "Interactive Geographic Story – Cairo–Ismailia Axis",
};

export function localizedAppTitle(app: TransportApp, language: "ar" | "en"): string {
  if (language === "ar") return app.title;
  return englishTitles[app.title]
    || app.alternateTitles?.find((title) => /[A-Za-z]/.test(title))
    || (/^[\x00-\x7F\s\p{P}\p{N}]+$/u.test(app.title) ? app.title : "Transport Application");
}
