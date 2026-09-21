export default async function run(page, ui) {
  const purge = () => document.body.innerText;

  // English dashboard, then the story page — both use different runtimes.
  const targets = [
    { name: "dashboard-en", url: "/projects/dashboard-ismailia-urban/index.html?lang=en" },
    { name: "dashboard-ar", url: "/projects/dashboard-ismailia-urban/index.html?lang=ar" },
    { name: "story-en", url: "/projects/storymap-ismailia/index.html?lang=en" },
    { name: "story-ar", url: "/projects/storymap-ismailia/index.html?lang=ar" },
    { name: "dashboard-kalabsha-en", url: "/projects/dashboard-989c5ff2f9/index.html?lang=en" },
  ];

  const results = {};
  for (const target of targets) {
    await page.goto(`http://localhost:4178${target.url}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    results[target.name] = await page.evaluate(() => {
      const text = document.body.innerText;
      const body = text.replace(/[\u0640\u064B-\u0652]/g, "");
      const axisHits = (body.match(/(^|[\s–\-()])Axis([\s–\-()]|$)/g) || []).length;
      const corridorHits = (body.match(/corridor/gi) || []).length;
      const mahwarHits = (body.match(/محور/g) || []).length;
      const sample = body.split("\n").filter((l) => /Axis|Corridor|محور/i.test(l)).slice(0, 3);
      return { title: document.querySelector("h1")?.innerText?.trim(), axisHits, corridorHits, mahwarHits, sample };
    });
  }
  return results;
}
