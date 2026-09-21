import type { TransportApp } from "./project-runtime";

const arabicTitles: Record<string, string> = {
  "Dabaa axis": "طريق الضبعة",
  "Development of the lands surrounding the Dabaa axis": "تطور الأراضي المحيطة بطريق الضبعة",
  "Land Price Indicators Dashboard – El Dabaa Axis": "لوحة مؤشرات أسعار الأراضي – طريق الضبعة",
  "Agricultural and Urban Land Indicators – El Dabaa Axis": "لوحة مؤشرات الأراضي الزراعية والعمرانية – طريق الضبعة",
};

const englishTitles: Record<string, string> = {
  "لوحة مؤشرات الأراضى العمرانية": "Urban Land Indicators Dashboard",
  "لوحة مؤشرات الأراضي العمرانية": "Urban Land Indicators Dashboard",
  "لوحة مؤشرات أسعار الأراضى": "Land Prices Indicators Dashboard",
  "لوحة مؤشرات أسعار الأراضي": "Land Prices Indicators Dashboard",
  "لوحة مؤشرات الأراضي الزراعية والصناعية": "Agricultural and Industrial Land Indicators Dashboard",
  "طريق الصعيد الغربي (الجيزة / ابوسمبل)": "Western Upper Egypt Road (Giza / Abu Simbel)",
  "طريق الصعيد الغربي": "Western Upper Egypt Road",
  "لوحة مؤشرات الدراسة المدنية": "Civil Study Indicators Dashboard",
  "لوحة مؤشرات أنماط و انواع الأراضى": "Land Types and Patterns Indicators Dashboard",
  "لوحة مؤشرات أسعار و دراسات الأراضى": "Land Prices and Studies Indicators Dashboard",
  "لوحة مؤشرات الدراسة المدنية الاقليمي": "Regional Civil Study Indicators Dashboard",
  "منطقة الدراسة القوس الشرقى للدائرى الأقليمى و خط الروبيكى": "Eastern Arc of the Regional Ring Road and Robeki Railway Study Area",
  "الدائري الإقليمي والروبيكي": "Regional Ring Road and Robeki Railway",
  "قياس الأثر التنموي في نطاق التأثير التنموي المباشر للقوس الشرقي للطريق الدائري خلال الـ 30 سنة القادمة": "Development Impact Assessment for the Eastern Arc of the Ring Road: Next 30 Years",
  "لوحة مؤشرات الأراضى الزراعية والعمرانية": "Agricultural and Urban Land Indicators Dashboard",
  "تطور الاراضي المحيطة بطريق كلابشة": "Land Development Around Kalabsha Road",
  "لوحة مؤشرات أنماط و أسعار الأراضى": "Land Types and Prices Indicators Dashboard",
  "منطقة دراسة طريق كلابشة": "Kalabsha Road Study Area",
  "تطور الاراضي المحيطة بطريق قنا الأقصر": "Land Development Around Qena–Luxor Road",
  "لوحة مؤشرات الاسعار الأراضى": "Land Prices Indicators Dashboard",
  "منطقة الدراسة طريق قنا": "Qena Road Study Area",
  "تطور الاراضي المحيطة بوصلة طريق السويس من الطريق الدائري": "Land Development Around the Suez Ring Road Link",
  "وصلة طريق السويس من الطريق الدائري": "Suez Ring Road Link",
  "السويس": "Suez",
  "منطقة الدراسة وصلة طريق السويس من الطريق الدائري الاوسطي": "Suez Ring Road Link Study Area",
  "طريق القاهرة - السويس الصحراوي - (السويس الحر)": "Cairo–Suez Desert Road (Suez Free Zone)",
  "قياس الأثر التنموي في نطاق التأثير التنموي المباشر طريق السويس الحر خلال الـ 30 سنة القادمة": "Development Impact Assessment for Suez Free Road: Next 30 Years",
  "قياس الأثر الاقتصادي والتنموي طريق القاهرة - السويس الصحراوي - (السويس الحر) (2014-2024)": "Economic and Development Impact Assessment: Cairo–Suez Desert Road (2014–2024)",
  "طريق السويس": "Suez Road",
  "تطور الاراضي المحيطة بطريق قوص": "Land Development Around Qus Road",
  "تطبيق منطقة الدراسة طريق قوص": "Qus Road Study Area Application",
  "طريق قوص": "Qus Road",
  "لوحة مؤشرات الأراضي العمرانية – الإسماعيلية": "Urban Land Indicators Dashboard – Ismailia",
  "لوحة مؤشرات أسعار الأراضي – الإسماعيلية": "Land Prices Indicators Dashboard – Ismailia",
  "لوحة مؤشرات الأراضي الزراعية والصناعية – الإسماعيلية": "Agricultural and Industrial Land Indicators Dashboard – Ismailia",
  "القصة المكانية التفاعلية – طريق القاهرة–الإسماعيلية": "Interactive Geographic Story – Cairo–Ismailia Road",
  "القصة المكانية التفاعلية – وصلة دهشور الجنوبية": "Interactive Geographic Story – Dahshur South Link",
};

export function localizedAppTitle(app: TransportApp, language: "ar" | "en"): string {
  if (language === "ar") return arabicTitles[app.title] || app.title;
  return englishTitles[app.title]
    || app.alternateTitles?.find((title) => /[A-Za-z]/.test(title))
    || (/^[\x00-\x7F\s\p{P}\p{N}]+$/u.test(app.title) ? app.title : "Transport Application");
}

export function localizedAppCategory(app: TransportApp, language: "ar" | "en"): string {
  const englishCategories: Record<string, string> = {
    "western-upper-egypt": "Western Upper Egypt Road applications",
    dahshur: "Dahshur South Link applications",
    "regional-ring": "Eastern Regional Ring Road and Robeki Railway applications",
    kalabsha: "Kalabsha Road applications",
    "qena-luxor": "Qena - Luxor Road applications",
    "suez-link": "Suez Ring Road Link applications",
    "suez-free": "Cairo - Suez Desert Road applications",
    qus: "Qus Road applications",
    dabaa: "El Dabaa Road applications",
    ismailia: "Cairo - Ismailia Road applications",
  };
  if (language === "ar") return /[A-Za-z]/.test(app.category) ? "تطبيقات طريق الضبعة" : app.category;
  return englishCategories[app.reportReferenceGroup || ""] || "Ministry of Transport applications";
}
