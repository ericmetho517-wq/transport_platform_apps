export default async function run(page, ui) {
  const report = {};

  await page.goto("http://localhost:4178/projects/dashboard-135390893b/index.html?lang=ar", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  // Which layers did the page actually manage to load, and with how many features?
  report.layers = await page.evaluate(() => {
    return fetch("/data/dashboard/kalabsha-axis/summary.json")
      .then((r) => r.json())
      .then((summary) => ({
        declaredLayers: summary.layers,
        layerCounts: summary.layerCounts,
        sourceLayerCounts: summary.sourceLayerCounts,
      }))
      .catch((error) => ({ error: String(error) }));
  });

  // What does the rendered legend claim, versus what the map draws?
  report.rendered = await page.evaluate(() => {
    const paths = Array.from(document.querySelectorAll(".map-stage svg path, .map-stage svg polygon"));
    const byGroup = {};
    for (const path of paths) {
      const group = path.closest("[data-layer-group]")?.getAttribute("data-layer-group") || "unknown";
      byGroup[group] = (byGroup[group] || 0) + 1;
    }
    const legend = Array.from(document.querySelectorAll("[data-filter-layer]")).map((el) => el.dataset.filterLayer);
    const svg = document.querySelector(".map-stage svg");
    return {
      pathCount: paths.length,
      byGroup,
      legendEntries: legend,
      svgViewBox: svg?.getAttribute("viewBox"),
      basemap: !!document.querySelector(".map-stage img"),
    };
  });

  return report;
}
