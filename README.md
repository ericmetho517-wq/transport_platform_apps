# Transport Platform — 78 TypeScript Applications

This repository contains 78 independently addressable applications extracted from the two Ministry of Transport Excel registries:

- 50 Dashboards
- 10 Experiences
- 9 StoryMaps
- 5 Web AppViewers
- 4 Instant Filter Galleries

Each application has its own folder under `projects/` with an HTML entry point, TypeScript source, application configuration, details, and a data manifest. The root application provides the searchable platform catalog.

## Report-verified design references

The platform includes the original application screenshots extracted directly from the PDF reports in the Ministry of Transport `التقارير` folder as optional design references. Sixty-three applications are linked to sector-matched report evidence. References that belonged to another application type or corridor were removed instead of being shown as if they were a match. The screenshots are opened from the `مرجع التصميم` button; they are not the dashboard interface.

Applications without a matching screenshot remain data-driven and clearly show unavailable report-only fields instead of using a screenshot or value from another sector.

## Run

1. Install Node.js 22.
2. Run `npm ci`.
3. Run `npm run verify:structure`.
4. Run `npm run verify:sectors`.
5. Run `npm run dev`.

## Optional ArcGIS metadata migration

Run `npm run migrate:arcgis` on an internet-connected computer. Public item metadata and item configuration will be written into each project's `data/` folder. The runtime itself does not use the ArcGIS JavaScript SDK.

## Interactive dashboard runtime

All 50 dashboards use live TypeScript controls. Dashboard pages load the supplied local File Geodatabase layers converted to open GeoJSON: study boundary, axis road, urban change, agricultural change, industrial change, and baseline land cover where available. Map layers can be toggled, zoomed, dragged and queried by clicking a feature. Price dashboards contain selectable live SVG line series and year-point details; land-use dashboards contain selectable change bars, comparison filters, gauge and donut summaries. The report screenshots remain available only as a visual reference for matching the original composition.

Map zoom works with the visible controls and the mouse wheel, centered on the pointer position. At the minimum or maximum zoom boundary, wheel events pass back to normal page scrolling. Touch and pointer dragging remain available.

Dashboard layouts are selected by actual application purpose: land prices, agricultural/industrial land, urban land, civil study, and developmental impact each have a dedicated interactive composition. Experience, StoryMap, Web AppViewer, and Instant Filter Gallery applications also have separate TypeScript runtimes instead of displaying report screenshots as the application.

`npm run verify:sectors` checks every one of the 78 entries against its sector group, local data summary, report references, app type totals, and project entry point. Its last result is saved in `registry/sector-audit.json`.

The Cairo–Suez free-road report profile is included with its report-verified indicators. No sector-matched local geodatabase was identified for that corridor, so its summary deliberately does not reuse the Suez ring-link geometry. This prevents data from one sector appearing in another sector's map.

The original ArcGIS item configurations are not accessible from the supplied links, so any metric not present in the local geodatabase is shown as unavailable rather than fabricated.

## Deploy to Vercel

The repository includes `vercel.json` and is ready to import as a Vite project:

- Install command: `npm ci`
- Build command: `npm run build:vercel`
- Output directory: `dist`
- Required Node.js version: `22.x`

The Vercel build command runs the structure, sector, and GeoJSON integrity audits before producing the site. A failed audit stops the deployment instead of publishing incomplete or cross-sector data.
