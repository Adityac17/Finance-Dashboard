# Project context (for Claude Code)

This file summarizes how this project came to be, so work can continue in
Claude Code without re-explaining the background. Drop this whole file into
the project root (already done) — Claude Code will pick up `CLAUDE.md`
automatically as project context.

## Origin

Built from a personal Excel workbook (`Finances.xlsx`) with three sheets:
"Monthly Budget" (planned vs. actual income/expenses for the current period),
"Transactions" (a dated ledger), and "Annual Overview" (12-month trajectory +
per-category monthly trend). The numbers in the current sample data (July–
September 2026, ₹152–155k monthly income, categories like Rent & Housing,
SIPs & Investments, EMIs, etc.) came from that real workbook, seeded into
`js/store.js` as the default dataset.

## Build history, in order

1. **v1 — single HTML artifact.** A one-file dashboard (KPI cards, income vs.
   expense bar chart, category donut, 12-month line chart, budget-vs-actual
   table, a read-only searchable transaction table) styled as a bank
   passbook / ledger book (cream paper, navy ink, mono digits, ruled lines)
   rather than a generic SaaS card layout — deliberate choice per the
   frontend-design approach of grounding visual style in the subject matter.

2. **v2 — added data refresh.** Added a "reload workbook" file input that
   re-parsed an uploaded `.xlsx` using the *exact* three-sheet template
   structure (hardcoded cell/row assumptions matching the original workbook's
   layout), a "publish to web" Google Sheets CSV fetch option, and a
   statement-import flow (CSV via SheetJS, PDF via pdf.js text extraction)
   with an editable preview table before anything was committed. Explained
   clearly that a live authenticated backend connection isn't possible from a
   static artifact — this was the practical substitute.

3. **v3 — this version: a proper multi-page project.** Rebuilt as a real
   deployable static site (see README.md) because the person wanted to
   deploy it and needed:
   - **Editable categories and transactions** (not just read-only), so the
     rigid workbook-shaped parser from v2 was replaced with a general
     `Store` data model (`js/store.js`) backed by `localStorage`, with full
     CRUD: add/rename/delete category, add/edit/delete transaction.
   - **The transaction ledger moved to its own page** (`ledger.html`),
     linked from the dashboard (`index.html`), since it was getting crowded
     on one page and needed room for the new CRUD UI and category
     management.
   - **A stray accent line removed** — the person flagged "an orange line"
     without a screenshot. Best guess: the reddish-orange vertical ledger
     margin rule (`.margin-rule`, `rgba(166,64,46,0.28)`) that ran down the
     left side of the v1/v2 page as a decorative "ledger paper" touch, and
     the gold tab-underline accent. Both were dropped in this rebuild — the
     active-tab indicator now uses plain ink instead of gold. **If this
     guessed wrong, the person should point to the specific element** (it
     may have been something else, like the gold savings-rate KPI figure or
     the gold "near limit" progress-bar color, which were left in place
     since they carry meaning).
   - **A favicon** — added as `assets/favicon.svg`, a simple navy square
     with a ₹ glyph matching the ledger theme.
   - Also simplified away the v2 "reload whole workbook" parser (too
     brittle/template-specific for a general tool) in favor of the CSV/PDF
     import flow, now feeding the CRUD store via the same preview-and-confirm
     modal, and kept the "publish to web" CSV fetch as an alternative import
     source.

## Current data model (`js/store.js`)

```js
state = {
  nextId: number,                 // for generating transaction ids
  categories: [{ name, planned }],// editable list, no fixed set
  income: { "YYYY-MM": number },  // manually entered monthly income
  transactions: [{ id, date: "YYYY-MM-DD", category, desc, mode, amount }]
}
```

Everything else (monthly totals, YTD totals, category totals per month,
which months appear as tabs) is *derived* on the fly from this state via
`Store.monthTotals()`, `Store.ytdTotals()`, `Store.categoryTotalsForMonth()`,
`Store.months()` — there's no duplicated/denormalized aggregate data to keep
in sync. Any UI change should go through `Store`'s methods, not touch
`localStorage` directly.

## Known gaps / good next steps

- **No sync across devices/browsers** — `localStorage` only. The natural next
  step is swapping the inside of `Store.load()`/`Store.save()` for real API
  calls (e.g. a small Supabase or Express backend) — nothing else in the app
  needs to change if `Store`'s public method signatures stay the same.
- **No auth** — fine for a personal deployment, not for anything shared.
- **PDF import is heuristic** (`js/parse.js`, `parsePDFStatement`) — a
  best-effort date+amount regex over extracted text, not a real statement
  parser. Accuracy will vary a lot by bank/wallet PDF layout.
- **Google Pay / Samsung Pay import was never verified against a real
  export** — the person doesn't have a clean CSV from either yet. Google
  Pay's official export (Google Takeout) is JSON/HTML, not CSV; Samsung Pay
  doesn't offer a clear export at all currently. If a real sample shows up,
  tune the column-matching in `parseGenericCSV()` (`js/parse.js`) to it
  directly rather than relying on the generic header-guessing.
- **Income is entered manually per month** (not derived from transactions,
  since this ledger only tracks spend) — there's currently no UI control for
  editing `state.income` on either page; only the seeded default values
  exist. Worth adding an "edit this month's income" control on the ledger
  page.
- The visual design intentionally avoids generic dashboard/SaaS-card styling
  (see README and the original build notes) — a bank-passbook/ledger-book
  aesthetic (cream paper, navy ink, monospaced amounts, ruled lines,
  Fraunces/IBM Plex Mono/Inter type). Keep that intent in mind for any new
  UI rather than defaulting to rounded cards + drop shadows.
