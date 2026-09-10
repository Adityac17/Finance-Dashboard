# Monthly Budget Ledger

A two-page personal finance dashboard: an overview page (charts, KPIs, budget vs.
actual) and a ledger page (add/edit/delete transactions, manage categories,
import statements). No backend — everything is static HTML/CSS/JS, and data is
kept in the browser's `localStorage`.

## Structure

```
finance-dashboard/
├── index.html          Dashboard (KPIs, charts, budget-vs-actual table)
├── ledger.html          Transaction ledger + category management + import
├── css/
│   └── styles.css       Shared styling (ledger/passbook visual theme)
├── js/
│   ├── store.js          Data model + localStorage persistence + all CRUD
│   ├── parse.js          CSV / PDF / published-sheet-link import parsing
│   ├── dashboard.js       Rendering logic for index.html
│   └── ledger.js          Rendering + event logic for ledger.html
├── assets/
│   └── favicon.svg
└── README.md
```

No build step, no `npm install`, no framework. It's plain HTML/CSS/JS, so it
runs by opening `index.html` directly or by serving the folder from any static
host.

## Running locally

Just open `index.html` in a browser. For `fetch()` (the "Fetch from link"
button) to work reliably, serve it over HTTP rather than `file://`:

```bash
cd finance-dashboard
python3 -m http.server 8000
# visit http://localhost:8000
```

## Deploying

Any static host works, since there's nothing to build:

- **Netlify / Vercel**: drag-and-drop the `finance-dashboard` folder in their
  dashboard, or connect the git repo and set the build command to "none" /
  output directory to `.`.
- **GitHub Pages**: push this folder to a repo and enable Pages on the `main`
  branch (root).
- **Any static bucket** (S3 + CloudFront, Cloudflare Pages, etc.): upload the
  folder as-is.

## Data & persistence

All categories and transactions live in the browser's `localStorage` under the
key `finance_ledger_v1` (see `js/store.js`). That means:

- Data persists across reloads and browser restarts, **on that one browser**.
- It does **not** sync across devices or browsers — there's no server.
- Clearing site data / browsing data for this domain wipes the ledger.
- "Reset to sample data" on the ledger page wipes your edits and restores the
  original example dataset — use it deliberately.

If you want real cross-device sync later, the natural next step is swapping
`js/store.js`'s localStorage calls for calls to a small backend (e.g. a
Supabase table, or a tiny Express/Flask API) — the rest of the app (dashboard
and ledger rendering) doesn't need to change, since everything already goes
through the `Store` object.

## Importing transactions

On the ledger page:

- **CSV** — auto-detects date / amount / description / category / payment-mode
  columns from whatever headers your file has (case-insensitive, flexible
  matching). Works well for most bank/wallet CSV exports.
- **PDF** — best-effort text extraction (via pdf.js) looking for date + amount
  patterns per line. Accuracy depends heavily on the statement's layout —
  always reviewed in the preview modal before anything is added.
- **Published Google Sheet link** — if you publish a sheet to the web as CSV
  (File → Share → Publish to web → CSV) and paste that link, it fetches and
  parses it the same way as an uploaded CSV. Publishing makes that sheet
  viewable by anyone with the link.

Neither Google Pay nor Samsung Pay currently offers a clean, uniform
CSV/PDF export, so the parser hasn't been tuned against a real sample of
either. If you get an export from one of them, share its format (or a
redacted sample) and the column-matching in `js/parse.js` can be adjusted to
fit it exactly.

## Known limitations

- Single-browser storage only (no accounts, no sync, no multi-device).
- PDF import is heuristic, not a real statement parser — always check the
  preview.
- No authentication — anyone with access to the deployed URL and browser can
  edit the ledger stored there. Fine for personal/local use; not meant for a
  shared or public deployment as-is.
