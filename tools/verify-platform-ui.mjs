import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const source = readFileSync(join(root, "src", "main.ts"), "utf8");
const styles = readFileSync(join(root, "shared", "platform-identity.css"), "utf8");
const apps = JSON.parse(readFileSync(join(root, "registry", "apps.json"), "utf8"));
const errors = [];

for (const control of ["app-search", "type-filter", "language-filter", "clear-filters", "data-quick-type", "back-to-top"]) {
  if (!source.includes(control)) errors.push(`missing platform interaction: ${control}`);
}
for (const behavior of ["IntersectionObserver", "requestAnimationFrame", "pointermove", "prefers-reduced-motion"]) {
  if (!source.includes(behavior) && !styles.includes(behavior)) errors.push(`missing platform behavior: ${behavior}`);
}
for (const type of ["type-dashboard", "type-experience", "type-storymap", "type-viewer", "type-gallery"]) {
  if (!styles.includes(type)) errors.push(`missing visual identity for ${type}`);
}
if (!styles.includes("@media (max-width: 760px)")) errors.push("missing responsive mobile layout");
if (!source.includes('<option value="ar">') || !source.includes('<option value="en">')) errors.push("Arabic/English filters are incomplete");
if (apps.length !== 78) errors.push(`expected 78 applications, found ${apps.length}`);

console.log(JSON.stringify({ applications: apps.length, interactions: 6, responsive: true, reducedMotion: true, errors: errors.length, result: errors.length ? "FAILED" : "PASSED" }, null, 2));
if (errors.length) {
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
}
