export default async function run(page, ui) {
  const read = () => page.evaluate(() => {
    const head = document.querySelector(".brand b")?.innerText?.trim();
    const sub = document.querySelector(".brand small")?.innerText?.trim();
    const filterLabel = document.querySelector("#axis-filter")?.previousElementSibling?.innerText?.trim();
    const options = Array.from(document.querySelectorAll("#axis-filter option")).map((o) => o.innerText.trim());
    const groups = Array.from(document.querySelectorAll(".sector-group-heading h3")).map((h) => h.innerText.trim());
    const cards = Array.from(document.querySelectorAll(".app-card h3")).slice(0, 4).map((h) => h.innerText.trim());
    const axisWord = /(^|[\s–-])Axis([\s-]|$)/.test(document.body.innerText);
    return { head, sub, filterLabel, options, groups, cards, axisWordOnPage: axisWord };
  });

  const en = await read();

  // Switch to Arabic from inside the page so both modes are checked in one run.
  await page.evaluate(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("uiLang", "ar");
    window.location.href = url.toString();
  });
  await page.waitForFunction(() => document.documentElement.lang === "ar", null, { timeout: 15000 });
  const ar = await read();

  return { en, ar };
}
