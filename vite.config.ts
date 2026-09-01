import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "projects");
const projectEntries = Object.fromEntries(
  fs.readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [entry.name, path.resolve(projectRoot, entry.name, "index.html")]),
);

export default {
  base: "./",
  build: {
    rollupOptions: {
      input: {
        platform: path.resolve(import.meta.dirname, "index.html"),
        ...projectEntries,
      },
    },
  },
};
