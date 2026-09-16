import path from "node:path";
import registry from "./registry/apps.json";

const projectRoot = path.resolve(import.meta.dirname, "projects");
const projectEntries = Object.fromEntries(
  registry.map((app) => [app.slug, path.resolve(projectRoot, app.slug, "index.html")]),
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
