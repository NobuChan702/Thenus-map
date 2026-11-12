# Thenus: interactive map (player edition)

This is a static site with no server code. Open `index.html` locally, or host the folder on any static host (for example GitHub Pages).

## Updating the party position
1. Open the **DM bundle** (`dm/index.html`, which stays on your computer and is never published). Drag the red Party crest to where the party is.
2. Press **Export party position** (bottom right), add a date and a short note, and copy the JSON it shows.
3. In this folder, open `data/party.js` and replace the `"position": {...}` block with the copied JSON. Keep the commas.
4. Publish. To skip step 1, you can also type `x` and `y` by hand. Map units are 0–2048 across and 0–1948 down; one travel day is about 24 units.

Bump the number in `config.js` (`version:'12'` → `'13'`) whenever you change a data file, so players' browsers fetch the new one.

## Updating the fog of war
In the DM bundle, use the **Fog of war (DM)** panel:
- **Reveal region**: click a region to cycle clear → light → hidden.
- **Reveal area**: click to clear a circle; pick the radius and strength first.
- **Hide again**: click a revealed area, path or region.
- **Undo**, then **Export** (or Download fog.js).

Paste the export into `app/data/fog.js` (the master copy), then run `python3 build/public.py`. The build leaves creature tokens and landmarks under fog out of this folder entirely, so a newly revealed area only gets its creatures and landmarks after a rebuild. If you only replace `public/data/fog.js`, the mist clears but nothing new appears. Players see a soft parchment mist over anything unrevealed, never black. Creature tokens and landmark pins under thick fog are hidden.

## What is in here
- `index.html`, `app.js`, `style.css`, `config.js`: the viewer (DM code removed).
- `data/thenus-data.js`: places, regions, routes and creatures.
- `data/party.js`: the party position. `data/fog.js`: the revealed areas.
- `tiles/`: the painted map. `tokens/`: creature art and emblems. `vendor/`: Leaflet 1.9.4 (BSD-2). `fonts/`: Cinzel Decorative and IM Fell English SC (SIL OFL; licences included).

Rebuild this folder from the master copy with `python3 build/public.py`. It also rebuilds `dm/`.
