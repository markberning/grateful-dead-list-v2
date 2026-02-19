# Grateful Dead List V2

A lightweight, static web app that lists Grateful Dead shows with fast search.

## Run

Open `index.html` in a browser.

## Data

Edit `data/shows.js` and replace the sample entries with the full show list.
Each show supports:

- `date` (YYYY-MM-DD)
- `venue`
- `city`
- `state`
- `country`
- `tour` (optional)
- `sets` (array of sets with `name` + `songs`)

If you already have a CSV or JSON of shows, tell me the format and I can add an
import script to transform it into `data/shows.js`.

## Commercial releases

Release metadata lives in:

- `data/releases.js` (format: `cd`, `cd_box`, `vinyl`, `vinyl_box`, `cassette`)
- `data/links.js` (maps `show_id` to `release_id` with `coverage: full|partial`)
