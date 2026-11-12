# How to update the party pin on the live map

You can move the party pin yourself. Nothing needs to go through anyone else.

1. Open your DM copy (`Thenus-map-DM/index.html`), drag the red Party crest to the new place, and add a date and a short note if you want.
2. Press **Export party position**. It copies the full `party.js` file to your clipboard.
3. On GitHub, open [site/data/party.js](https://github.com/NobuChan702/Thenus-map/edit/main/site/data/party.js) (Thenus-map repo → `site/data/party.js` → the pencil icon).
4. Select all, paste the export over the whole file, and commit.
5. The live player map at https://nobuchan702.github.io/Thenus-map/ updates in about a minute. Refresh the page. If you still see the old pin, do a hard refresh (Ctrl+Shift+R, or Cmd+Shift+R on a Mac).

To skip the DM map, you can type new `x` and `y` values by hand in that file. Map units are 0–2048 across and 0–1948 down; one travel day is about 24 units. Leave the `start` block (where the party joined Draven's Circle) as it is unless that should move too.

