import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "file:///C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const root = process.cwd();
const workbookPath = path.join(root, "outputs", "development-impact-audit", "مراجعة_الأثر_التنموي_القيم_الفعلية.xlsx");
const dataPath = path.join(root, "shared", "development-impact-data.json");

const sheetProfiles = {
  "القاهرة-الإسماعيلية": "ismailia",
  "الصعيد الغربي": "western-upper-egypt",
  "القوس الشرقي": "regional-ring-road",
  "كلابشة": "kalabsha-axis",
  "قوص": "qus-axis",
  "الضبعة": "dabaa-axis",
};

const metricInfo = {
  "الوفر في الوقود بدون الدعم": { key: "fuelSavingWithoutSubsidy", en: "Fuel saving without subsidy", color: "red", icon: "fuel" },
  "الوفر في الوقود بوجود الدعم": { key: "fuelSavingWithSubsidy", en: "Fuel saving with subsidy", color: "orange", icon: "fuel" },
  "العمالة": { key: "employment", en: "Employment", color: "gold", icon: "people" },
  "مساحة الأرض المنماة": { key: "developedLandArea", en: "Developed land area", color: "purple", icon: "map" },
  "الاستثمارات": { key: "investments", en: "Investments", color: "green", icon: "coins" },
  "القيمة المضافة": { key: "addedValue", en: "Added value", color: "blue", icon: "value" },
  "متوسط  القيمة المضافة للاستثمارات المتوطنة للناتج المحلي سنويا ": { key: "addedValue", en: "Average annual added value", color: "blue", icon: "value" },
  "اجمالي القيمه المضافة": { key: "addedValue", en: "Total added value", color: "blue", icon: "value" },
  "اجمالي قيمه الأرض خلال الفترة ": { key: "totalLandValue", en: "Total land value during the period", color: "gold", icon: "coins" },
  "قيمه الحفاظ علي البيئه بتخفييض الانبعاثات ": { key: "environmentalSavings", en: "Environmental value of reduced emissions", color: "green", icon: "value" },
};

const unitEnglish = {
  "مليار جنيه": "EGP billion",
  "مليون جنيه": "EGP million",
  "تريليون جنيه": "EGP trillion",
  "فرصة عمل": "job opportunities",
  "مليون فرصة عمل": "million job opportunities",
  "الف فرصة عمل": "thousand job opportunities",
  "كم²": "km²",
  " كم²": "km²",
};

const decimals = (value) => {
  if (Number.isInteger(value)) return 0;
  const normalized = Number(value.toFixed(12)).toString();
  return normalized.includes(".") ? normalized.split(".")[1].length : 0;
};

const data = JSON.parse(await fs.readFile(dataPath, "utf8"));
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));

for (const [sheetName, profileKey] of Object.entries(sheetProfiles)) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const values = sheet.getRange("A5:C30").values;
  const metrics = [];
  for (const [label, value, unit] of values) {
    if (!label || value === null || value === undefined || !unit) continue;
    const config = metricInfo[label];
    if (!config) throw new Error(`Unmapped metric in ${sheetName}: ${label}`);
    metrics.push({
      key: config.key,
      label: { ar: label, en: config.en },
      value,
      unit: { ar: unit, en: unitEnglish[unit] || unit },
      decimals: decimals(value),
      color: config.color,
      icon: config.icon,
    });
  }
  data.profiles[profileKey].metrics = metrics;
  delete data.profiles[profileKey].auditNote;
}

data.version = "2026-10-15-workbook-sync";
await fs.writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Synchronized ${Object.keys(sheetProfiles).length} development-impact profiles from the current workbook.`);
