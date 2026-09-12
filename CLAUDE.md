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

4. **v3.1 — bug fixes (Sep 2026).** Two defects found reviewing the shipped
   code: (a) `Store.load()` referenced `raw` outside the `try` block it was
   `const`-declared in → `ReferenceError` on every load, so the app never
   rendered; (b) stored-XSS — category names / imported descriptions / payment
   modes were interpolated into `innerHTML` without escaping. Fixed by hoisting
   `raw` and adding an `esc()` helper (in both `dashboard.js` and `ledger.js`)
   applied to every user-supplied string.

5. **v4 — Google login + cloud sync + eight features.** The person wanted a
   real login and easier day-to-day management.
   - **Auth + sync:** Google Sign-In (Firebase Auth, compat SDK) gates the
     app; each user's ledger is a Firestore doc at `ledgers/{uid}`, protected
     by per-user security rules (`firestore.rules`). `localStorage` is kept as
     an offline cache, now namespaced per uid. `login.html` is the entry
     point; `js/auth.js` handles sign-in/out, the auth-state redirect guard,
     and the signed-in user chip. Setup steps for the Firebase project live in
     `FIREBASE_SETUP.md`; the web config placeholder is `js/firebase-config.js`
     (those keys are public by design — security is the rules + authorized
     domains, not secrecy). Before config is filled in, the app degrades to
     local-only mode with a clear message.
   - **Load flow changed:** page scripts no longer auto-render at the bottom;
     each exposes `window.__init()`, which `auth.js` calls once the signed-in
     user's ledger is loaded (async). `Store.bindDb()` / `Store.bindUser()`
     wire Firestore; `Store.save()` writes localStorage immediately and
     debounces a Firestore write.
   - **Eight features (F1–F8):** recurring transactions (auto-post monthly,
     `materializeRecurring()`), monthly-income edit UI, JSON backup/restore,
     an insights strip (avg daily spend, projected month-end, MoM delta, top
     category), savings goals with progress bars, upcoming-bill reminders
     (next 7 days, derived from recurring), a ledger date-range filter +
     per-category 6-month sparklines in the budget table, and a light/dark
     theme toggle (persisted in `settings.theme`, mirrored to a plain
     `finance_theme` localStorage key for a no-flash early-apply script).

## Current data model (`js/store.js`)

```js
state = {
  nextId: number,                  // transaction id generator
  categories: [{ name, planned }], // editable list, no fixed set
  income: { "YYYY-MM": number },   // per-month income (editable on ledger page)
  transactions: [{ id, date: "YYYY-MM-DD", category, desc, mode, amount,
                   recurringId? }],// recurringId tags auto-posted rows
  recurring: [{ id, day, category, desc, mode, amount, active, lastPosted }],
  nextRecurringId: number,
  goals: [{ id, name, target, saved }],
  nextGoalId: number,
  settings: { theme: "light" | "dark" }
}
```

`_migrate()` backfills any of these fields missing from an older localStorage
blob or a fresh Firestore doc, so new features don't break existing ledgers.

Everything derived (monthly totals, YTD totals, per-category totals,
per-category series for sparklines, which months are tabs, upcoming bills) is
computed on the fly via `Store.monthTotals()`, `ytdTotals()`,
`categoryTotalsForMonth()`, `categorySeries()`, `months()`, `upcomingBills()`
— no denormalized aggregates to keep in sync. Any UI change should go through
`Store`'s methods; never touch `localStorage` or Firestore directly.

## Known gaps / good next steps

- **Auth + sync are done (v4)** via Firebase — `Store.load()`/`save()` now sit
  in front of Firestore with a localStorage cache, exactly the swap the v3
  notes anticipated, and public method signatures stayed stable. Remaining
  Firebase caveat: the **first sign-in seeds fresh sample data** in Firestore;
  there's no automatic import of a pre-existing local-only ledger (a one-time
  "import my local data" step could be added if wanted).
- **SVG charts are tuned for the light theme** — `dashboard.js` emits chart
  colors as literal hex strings (grid, axis text, donut-centre label), so in
  dark mode a few of them (notably the donut centre text) sit low-contrast.
  Fixing properly means routing those through CSS variables / `currentColor`.
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
  since this ledger only tracks spend). The v4 "Monthly income" section on the
  ledger page now edits/adds/removes `state.income` entries — the v3 gap is
  closed.
- The visual design intentionally avoids generic dashboard/SaaS-card styling
  (see README and the original build notes) — a bank-passbook/ledger-book
  aesthetic (cream paper, navy ink, monospaced amounts, ruled lines,
  Fraunces/IBM Plex Mono/Inter type). Keep that intent in mind for any new
  UI rather than defaulting to rounded cards + drop shadows.
