import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const registry = JSON.parse(await fs.readFile(path.join(root, "registry", "apps.json"), "utf8"));
for (const app of registry) {
  const target = path.join(root, "projects", app.slug, "data");
  await fs.mkdir(target, { recursive: true });
  const base = `https://www.arcgis.com/sharing/rest/content/items/${app.id}`;
  try {
    const [item, data] = await Promise.all([
      fetch(`${base}?f=json`).then((response) => response.json()),
      fetch(`${base}/data?f=json`).then((response) => response.json()),
    ]);
    await fs.writeFile(path.join(target, "arcgis-item.json"), JSON.stringify(item, null, 2));
    await fs.writeFile(path.join(target, "arcgis-data.json"), JSON.stringify(data, null, 2));
    console.log(`Migrated ${app.slug}`);
  } catch (error) {
    console.error(`Failed ${app.slug}: ${error.message}`);
  }
}
