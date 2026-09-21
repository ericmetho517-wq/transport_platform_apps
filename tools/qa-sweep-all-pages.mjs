import { readFileSync, readdirSync } from "node:fs";

// Build the list of every real application page from the registry slugs.
const registry = JSON.parse(readFileSync("registry/apps.json", "utf8"));
const slugs = registry.map((app) => app.slug);
const targets = [];
for (const slug of slugs) {
  targets.push({ name: `${slug}-en`, url: `/projects/${slug}/index.html?lang=en` });
  targets.push({ name: `${slug}-ar`, url: `/projects/${slug}/index.html?lang=ar` });
}

export default async function run(page, ui) {
  const offenders = {};
  let checked = 0;
  let failed = 0;

  for (const target of targets) {
    try {
      await page.goto(`http://localhost:4178${target.url}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(900);
      const result = await page.evaluate(() => {
        const body = document.body.innerText.replace(/[\u0640\u064B-\u0652]/g, "");
        const axis = (body.match(/(^|[\s–\-():])Axis([\s–\-():]|$)/g) || []).length;
        const corridor = (body.match(/\bcorridor\b/gi) || []).length;
        const mahwar = (body.match(/محور/g) || []).length;
        return { axis, corridor, mahwar, chars: body.length, title: document.querySelector("h1")?.innerText?.trim() };
      });
      checked += 1;
      // Skip pages that never mounted (they have no visible text at all).
      if (result.chars < 50) { failed += 1; continue; }
      if (result.axis || result.corridor || result.mahwar) offenders[target.name] = result;
    } catch (error) {
      failed += 1;
    }
  }
  return { checked, failed, offenderCount: Object.keys(offenders).length, offenders };
}
