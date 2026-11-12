# Thenus: interactive map (player edition)

This is a static site with no server code. Open `index.html` locally, or host the folder on any static host (for example GitHub Pages).

## Updating the party position

See **[HOW-TO-UPDATE.md](HOW-TO-UPDATE.md)** for the short version (export from the DM copy, paste over `site/data/party.js` on GitHub, commit; live in about a minute).

1. Open the **DM bundle** (`Thenus-map-DM/index.html`, which stays on your computer and is never published). Drag the red Party crest to where the party is.
2. Press **Export party position** (bottom right), add a date and a short note, and copy the full file it shows.
3. On GitHub, edit `site/data/party.js`, paste over the whole file, and commit.

To skip step 1, you can also type `x` and `y` by hand. Map units are 0–2048 across and 0–1948 down; one travel day is about 24 units.

Bump the number in `config.js` (`version:'14'` → `'15'`) and the matching `?v=` tags in `index.html` whenever you change a data file other than `party.js`, so players' browsers fetch the new one.

## What is in here
- `index.html`, `app.js`, `style.css`, `config.js`: the viewer (DM code removed).
- `data/thenus-data.js`: places, regions, routes and creatures.
- `data/party.js`: the party position.
- `tiles/`: the painted map. `tokens/`: creature art and emblems. `vendor/`: Leaflet 1.9.4 (BSD-2). `fonts/`: Cinzel Decorative and IM Fell English SC (SIL OFL; licences included).

Rebuild this folder from the master copy with `python3 build/public.py`. It also rebuilds `dm/`.
