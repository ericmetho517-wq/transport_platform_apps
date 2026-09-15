import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const localizationSource = readFileSync(join(root, "shared", "localization.ts"), "utf8");
const arabicPattern = /[\u0600-\u06ff]/;

function readTranslationArray(name) {
  const declaration = localizationSource.indexOf(`const ${name}`);
  const start = localizationSource.indexOf("= [", declaration) + 2;
  const end = localizationSource.indexOf("\n];", start) + 2;
  if (declaration < 0 || start < 2 || end < 2) throw new Error(`Cannot read ${name} from localization.ts`);
  return Function(`"use strict"; return (${localizationSource.slice(start, end)});`)();
}

const translations = [...readTranslationArray("replacements"), ...readTranslationArray("englishWords")]
  .sort(([left], [right]) => right.length - left.length);
const translate = (value) => translations.reduce((result, [arabic, english]) => result.replaceAll(arabic, english), value);

const failures = [];
for (const relativePath of ["shared/interactive-dashboard.ts", "shared/sector-runtime.ts"]) {
  const source = readFileSync(join(root, relativePath), "utf8");
  const textNodes = [...source.matchAll(/>([^<>\n]*[\u0600-\u06ff][^<>\n]*)</g)]
    .map((match) => match[1])
    .filter((value) => !value.includes("${"))
    .map((value) => value.trim())
    .filter(Boolean);
  for (const value of new Set(textNodes)) {
    const translated = translate(value);
    if (arabicPattern.test(translated.replaceAll("٪", ""))) failures.push(`${relativePath}: ${value} => ${translated}`);
  }
}

const dynamicWidgetSamples = [
  "فرق سعر الأراضي العمرانية", "سعر الأراضي العمرانية عام 2023",
  "عمران 3.2 كم² (10٪)", "خدمات 1.2 كم² (4٪)", "أخرى 2.0 كم² (6٪)",
  "قائم 70٪", "تحت الإنشاء 30٪", "إيجار 20٪", "تمليك 80٪",
  "12 معلم · 20 نقطة هندسية · 3 طبقات", "قطاع 2",
  "أراضي فضاء", "لم يتغير", "حالة التغير",
];
for (const value of dynamicWidgetSamples) {
  const translated = translate(value);
  if (arabicPattern.test(translated.replaceAll("٪", ""))) failures.push(`dynamic widget: ${value} => ${translated}`);
}

if (failures.length) {
  console.error(`English UI localization audit failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("English UI localization audit passed: dashboard, map, experience, story, viewer and gallery widgets.");
