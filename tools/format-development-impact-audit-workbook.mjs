import { FileBlob, SpreadsheetFile } from "file:///C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node format-development-impact-audit-workbook.mjs <input.xlsx> <output.xlsx>");
}

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));

const sheets = [
  { name: "القاهرة-الإسماعيلية", title: "مراجعة الأثر التنموي — طريق القاهرة - الإسماعيلية", lastRow: 10 },
  { name: "الصعيد الغربي", title: "مراجعة الأثر التنموي — محور الصعيد الصحراوي الغربي – طريق الجيزة / أبو سمبل", lastRow: 11 },
  { name: "القوس الشرقي", title: "مراجعة الأثر التنموي — القوس الشرقي للطريق الدائري الإقليمي وخط الروبيكي", lastRow: 12 },
  { name: "كلابشة", title: "مراجعة الأثر التنموي — محور كلابشة", lastRow: 12 },
  { name: "قوص", title: "مراجعة الأثر التنموي — محور قوص", lastRow: 11 },
  { name: "الضبعة", title: "مراجعة الأثر التنموي — محور الضبعة", lastRow: 10 },
];

for (const config of sheets) {
  const sheet = workbook.worksheets.getItem(config.name);

  // The user-entered values and units in A:C remain untouched. Only remove the
  // orphaned empty table columns left after the previous manual edits.
  for (const table of [...sheet.tables.items]) table.delete();
  sheet.unmergeCells("A1:H1");
  sheet.getRange("A2:H3").clear({ applyTo: "all" });
  sheet.getRange(`D1:H20`).clear({ applyTo: "all" });
  sheet.getRange(`A${config.lastRow + 1}:H20`).clear({ applyTo: "all" });

  sheet.getRange("A1:C1").merge();
  sheet.getRange("A1").values = [[config.title]];
  sheet.getRange("A1:C1").format = {
    fill: "#1F4E78",
    font: { name: "Arial", size: 13, bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
  sheet.getRange("A1:C1").format.rowHeight = 26;

  const header = sheet.getRange("A4:C4");
  header.format = {
    fill: "#0F6E78",
    font: { name: "Arial", size: 10, bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: "#B7D7E8" },
  };

  const body = sheet.getRange(`A5:C${config.lastRow}`);
  body.format.font = { name: "Arial", size: 10, color: "#18344D" };
  body.format.verticalAlignment = "center";
  body.format.borders = { preset: "all", style: "thin", color: "#D7E4EA" };
  for (let row = 5; row <= config.lastRow; row += 1) {
    sheet.getRange(`A${row}:C${row}`).format.fill = row % 2 ? "#CDEBF7" : "#FFFFFF";
  }

  sheet.getRange(`B5:B${config.lastRow}`).format = {
    horizontalAlignment: "center",
    verticalAlignment: "center",
    font: { name: "Arial", size: 10, bold: true, color: "#18344D" },
    numberFormat: "#,##0.###",
  };
  sheet.getRange(`A5:A${config.lastRow}`).format.horizontalAlignment = "right";
  sheet.getRange(`C5:C${config.lastRow}`).format.horizontalAlignment = "center";

  sheet.getRange("A1").format.columnWidth = 33;
  sheet.getRange("B1").format.columnWidth = 18;
  sheet.getRange("C1").format.columnWidth = 22;
  sheet.getRange(`A4:C${config.lastRow}`).format.rowHeight = 22;
  sheet.showGridLines = false;

  sheet.tables.add(`A4:C${config.lastRow}`, true, `ImpactAudit${config.lastRow}${config.name.length}`);
  sheet.getRange(`B5:B${config.lastRow}`).setNumberFormat("#,##0.###");
}

workbook.recalculate();
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
