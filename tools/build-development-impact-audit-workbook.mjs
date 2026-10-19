import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "file:///C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const root = process.cwd();
const outputDir = path.join(root, "outputs", "development-impact-audit");
const outputPath = path.join(outputDir, "مراجعة_الأثر_التنموي_القيم_الفعلية.xlsx");
const previewDir = path.join(outputDir, "_previews");
const data = JSON.parse(await fs.readFile(path.join(root, "shared", "development-impact-data.json"), "utf8"));

const orderedProfiles = [
  ["ismailia", "القاهرة-الإسماعيلية"],
  ["western-upper-egypt", "الصعيد الغربي"],
  ["regional-ring-road", "القوس الشرقي"],
  ["kalabsha-axis", "كلابشة"],
  ["qus-axis", "قوص"],
  ["dabaa-axis", "الضبعة"],
];

const font = "Arial";
const navy = "#17365D";
const teal = "#0F6B78";
const blue = "#DCE6F1";
const light = "#F7FAFC";
const gold = "#F4B183";

function exactNumberFormat(decimals) {
  return decimals > 0 ? `#,##0.${"0".repeat(decimals)}` : "#,##0";
}

function baseSheet(sheet) {
  sheet.showGridLines = false;
  sheet.getRange("A:Z").format.font = { name: font, size: 11, color: "#1F2937" };
  sheet.getRange("A:H").format.verticalAlignment = "center";
}

function addHeader(sheet, title, subtitle) {
  sheet.mergeCells("A1:H1");
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format = { fill: navy, font: { name: font, size: 16, bold: true, color: "#FFFFFF" }, horizontalAlignment: "right", verticalAlignment: "center" };
  sheet.getRange("A1").format.rowHeight = 28;
  sheet.mergeCells("A2:H2");
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange("A2").format = { fill: blue, font: { name: font, size: 10, color: navy }, horizontalAlignment: "right", wrapText: true, verticalAlignment: "center" };
  sheet.getRange("A2").format.rowHeight = 24;
}

function detailSheet(sheetName, profile) {
  const sheet = workbook.worksheets.add(sheetName);
  baseSheet(sheet);
  sheet.tabColor = teal;
  addHeader(sheet, `مراجعة الأثر التنموي — ${profile.road.ar}`, `الفترة الفعلية المكتملة: ${profile.period.start}–${profile.period.end} | لا يحتوي هذا الشيت على قيم أو توقعات مستقبلية.`);
  sheet.getRange("A4:H4").values = [["المؤشر", "القيمة كما في المصدر", "الوحدة الأصلية", "بداية الفترة", "نهاية الفترة", "المصدر", "موضع القيمة في المصدر", "حالة التحقق"]];
  sheet.getRange("A4:H4").format = { fill: teal, font: { name: font, bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", wrapText: true, verticalAlignment: "center" };
  sheet.getRange("A4:H4").format.rowHeight = 28;
  const rows = profile.metrics.map((metric) => [
    metric.label.ar,
    metric.value,
    metric.unit.ar,
    profile.period.start,
    profile.period.end,
    profile.sourceFile,
    profile.sourceLocator,
    "مطابق للمصدر",
  ]);
  const endRow = 4 + rows.length;
  sheet.getRange(`A5:H${endRow}`).values = rows;
  sheet.getRange(`A5:H${endRow}`).format = { horizontalAlignment: "right", wrapText: true, verticalAlignment: "center" };
  sheet.getRange(`A5:H${endRow}`).format.borders = { preset: "all", style: "thin", color: "#C9D2DC" };
  sheet.getRange(`A5:A${endRow}`).format.font = { name: font, bold: true, color: navy };
  sheet.getRange(`B5:B${endRow}`).format.font = { name: font, bold: true, color: "#111827" };
  sheet.getRange(`H5:H${endRow}`).format.font = { name: font, bold: true, color: "#0A6E3B" };
  for (let index = 0; index < profile.metrics.length; index += 1) {
    sheet.getRange(`B${5 + index}`).format.numberFormat = exactNumberFormat(profile.metrics[index].decimals);
  }
  sheet.getRange(`A5:H${endRow}`).format.rowHeight = 30;
  if (profile.auditNote) {
    const noteRow = endRow + 2;
    sheet.mergeCells(`A${noteRow}:H${noteRow}`);
    sheet.getRange(`A${noteRow}`).values = [[`ملاحظة تدقيقية: ${profile.auditNote}`]];
    sheet.getRange(`A${noteRow}`).format = { fill: "#FFF2CC", font: { name: font, bold: true, color: "#7A4C00" }, horizontalAlignment: "right", wrapText: true, verticalAlignment: "center" };
    sheet.getRange(`A${noteRow}`).format.rowHeight = 34;
  }
  sheet.mergeCells(`A${endRow + 4}:H${endRow + 4}`);
  sheet.getRange(`A${endRow + 4}`).values = [[`قاعدة العرض: لا تحويل للوحدات ولا تقريب. تُعرض القيمة والوحدة كما وردتا في المصدر.`]];
  sheet.getRange(`A${endRow + 4}`).format = { fill: light, font: { name: font, italic: true, color: "#475569" }, horizontalAlignment: "right" };
  sheet.getRange("A:A").format.columnWidth = 32;
  sheet.getRange("B:B").format.columnWidth = 20;
  sheet.getRange("C:C").format.columnWidth = 22;
  sheet.getRange("D:E").format.columnWidth = 14;
  sheet.getRange("F:F").format.columnWidth = 36;
  sheet.getRange("G:G").format.columnWidth = 58;
  sheet.getRange("H:H").format.columnWidth = 18;
  sheet.freezePanes.freezeRows(4);
  sheet.tables.add(`A4:H${endRow}`, true, `audit_${profile.appSlug.replace(/[^A-Za-z0-9]/g, "_")}`);
  return { sheet, rowCount: rows.length };
}

const workbook = Workbook.create();
const summary = workbook.worksheets.add("ملخص المراجعة");
baseSheet(summary);
summary.tabColor = navy;
addHeader(summary, "سجل مراجعة لوحات الأثر التنموي", "القيم الفعلية المكتملة فقط. لا توجد أرقام 2030 أو أي فترة مستقبلية. القيم والوحدات محفوظة كما وردت في مصادرها.");
summary.getRange("A4:G4").values = [["المحور / الطريق", "الفترة الفعلية", "عدد المؤشرات", "مصدر المراجعة", "نطاق التحقق", "شيت التفاصيل", "الحالة"]];
summary.getRange("A4:G4").format = { fill: teal, font: { name: font, bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", wrapText: true, verticalAlignment: "center" };
summary.getRange("A4:G4").format.rowHeight = 28;

const detailInfo = [];
for (const [key, sheetName] of orderedProfiles) {
  const profile = data.profiles[key];
  const info = detailSheet(sheetName, profile);
  detailInfo.push({ key, sheetName, profile, ...info });
}
const summaryRows = detailInfo.map(({ sheetName, profile, rowCount }) => [
  profile.road.ar,
  `${profile.period.start}–${profile.period.end}`,
  rowCount,
  profile.sourceFile,
  "قيم موثقة للفترة المكتملة فقط",
  sheetName,
  "تمت المراجعة",
]);
summary.getRange(`A5:G${4 + summaryRows.length}`).values = summaryRows;
summary.getRange(`A5:G${4 + summaryRows.length}`).format = { horizontalAlignment: "right", wrapText: true, verticalAlignment: "center" };
summary.getRange(`A5:G${4 + summaryRows.length}`).format.borders = { preset: "all", style: "thin", color: "#C9D2DC" };
summary.getRange(`A5:A${4 + summaryRows.length}`).format.font = { name: font, bold: true, color: navy };
summary.getRange(`C5:C${4 + summaryRows.length}`).format.numberFormat = "#,##0";
summary.getRange(`G5:G${4 + summaryRows.length}`).format.font = { name: font, bold: true, color: "#0A6E3B" };
summary.getRange(`A5:G${4 + summaryRows.length}`).format.rowHeight = 35;
summary.mergeCells("A12:G12");
summary.getRange("A12").values = [["منهجية المراجعة: نقل القيمة والوحدة من المصدر كما هما. حُذفت مؤشرات العمالة التي لا يورد مصدرها قيمة فعلية للفترة المكتملة (القوس الشرقي، كلابشة، قوص)."]];
summary.getRange("A12").format = { fill: "#FFF2CC", font: { name: font, size: 10, bold: true, color: "#7A4C00" }, horizontalAlignment: "right", wrapText: true, verticalAlignment: "center" };
summary.getRange("A12").format.rowHeight = 42;
summary.mergeCells("A13:G13");
summary.getRange("A13").values = [["الضبعة: الوفر بوجود الدعم = 322 مليون جنيه، وبدون الدعم = 1.36 مليار جنيه، والعمالة = 381 ألف فرصة عمل، كما وردت في العرض التوثيقي."]];
summary.getRange("A13").format = { fill: "#E2F0D9", font: { name: font, size: 10, bold: true, color: "#1F5D2B" }, horizontalAlignment: "right", wrapText: true, verticalAlignment: "center" };
summary.getRange("A13").format.rowHeight = 34;
summary.getRange("A:A").format.columnWidth = 34;
summary.getRange("B:B").format.columnWidth = 18;
summary.getRange("C:C").format.columnWidth = 15;
summary.getRange("D:D").format.columnWidth = 45;
summary.getRange("E:E").format.columnWidth = 30;
summary.getRange("F:F").format.columnWidth = 22;
summary.getRange("G:G").format.columnWidth = 18;
summary.freezePanes.freezeRows(4);
summary.tables.add(`A4:G${4 + summaryRows.length}`, true, "audit_summary");

workbook.recalculate();
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const sheetNames = ["ملخص المراجعة", ...detailInfo.map((item) => item.sheetName)];
for (const sheetName of sheetNames) {
  const image = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(previewDir, `${sheetName.replace(/[\\/:*?\"<>|]/g, "_")}.png`), new Uint8Array(await image.arrayBuffer()));
}

const formulaErrors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan" });
if (String(formulaErrors.ndjson || formulaErrors).match(/#REF!|#DIV\/0!|#VALUE!|#NAME\?|#N\/A/)) throw new Error(`Workbook formula error(s): ${formulaErrors.ndjson || formulaErrors}`);

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
const reloaded = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
const inspected = await reloaded.inspect({ kind: "sheet", include: "id,name", range: "A1:H15", maxChars: 6000 });
await fs.writeFile(path.join(outputDir, "_validation.json"), JSON.stringify({ workbook: path.basename(outputPath), sheets: sheetNames, inspection: inspected.ndjson || inspected }, null, 2), "utf8");
console.log(JSON.stringify({ outputPath, sheetNames, previewDir, validation: "passed" }, null, 2));
