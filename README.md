# CafeMap

A static Leaflet-based cafe ranking map for New Zealand.

## Files
- `index.html` – main page
- `style.css` – styling
- `script.js` – map and data rendering logic
- Google Sheets CSV export – live data source used by the page

## Data source
The app loads cafe data directly from the published Google Sheet CSV export configured in `script.js`.

## Publish with GitHub Pages
1. Create a GitHub repository for this folder.
2. Push the project to the `main` branch.
3. Open GitHub → Settings → Pages.
4. Set source to `GitHub Actions`.
5. Commit and push; the workflow in `.github/workflows/deploy.yml` will publish the site.

## Local preview
You can open `index.html` directly, or run a simple static server if you want browser-like behaviour.
