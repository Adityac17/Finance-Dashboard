# Firebase setup — Google login + cloud sync

The app now gates access behind Google Sign-In and stores each user's ledger
in Firestore (synced across devices), with `localStorage` kept as an offline
cache. All of this runs on Firebase's **free (Spark) tier** — no card needed.

You only need to do the console steps once and paste 6 config values into
[`js/firebase-config.js`](js/firebase-config.js). ~5 minutes.

---

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. Name it (e.g. `finance-dashboard`). Google Analytics is optional — skip it.

## 2. Enable Google as a sign-in provider

1. Left sidebar → **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Google** → toggle **Enable** → pick a support
   email → **Save**.

## 3. Create the Firestore database

1. Left sidebar → **Build → Firestore Database → Create database**.
2. Start in **production mode** (the rules below lock it down properly).
3. Pick a location close to you (e.g. `asia-south1` / Mumbai) → **Enable**.

## 4. Apply the security rules

Firestore → **Rules** tab → replace everything with the contents of
[`firestore.rules`](firestore.rules) → **Publish**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ledgers/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

This is what makes the login *real*: each user can read/write only
`ledgers/<their-own-uid>`. Nobody can see anyone else's data.

## 5. Register a Web app and copy the config

1. Project **Overview** (top of sidebar) → click the **Web** icon `</>`.
2. Give it a nickname → **Register app** (skip Firebase Hosting).
3. On **SDK setup and configuration**, choose **Config**. You'll see:

   ```js
   const firebaseConfig = {
     apiKey: "AIza…",
     authDomain: "finance-dashboard.firebaseapp.com",
     projectId: "finance-dashboard",
     storageBucket: "finance-dashboard.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123"
   };
   ```

4. Paste those 6 values over the `PASTE_…` placeholders in
   [`js/firebase-config.js`](js/firebase-config.js), commit, and push.

> These values are **not secret** — a web config is designed to ship in
> client code. Security comes from the rules in step 4 and the authorized
> domains in step 6, not from hiding these keys.

## 6. Authorize your domains

Authentication → **Settings** → **Authorized domains** → **Add domain**.

- `localhost` is there by default (local testing works out of the box).
- Add your GitHub Pages host: **`adityac17.github.io`**.
- Add any custom domain you later deploy to.

Sign-in will fail with an `auth/unauthorized-domain` error on any domain not
in this list.

---

## Done

Visit the site → you land on `login.html` → **Sign in with Google** → your
ledger loads (seeded with the sample data on first sign-in) and every change
syncs to Firestore. Open it on your phone with the same Google account and the
same data is there.

### Notes
- **Free-tier limits** (Spark) are generous for personal use: 50k Firestore
  reads / 20k writes per day, 1 GiB stored. This app makes ~1 read on load and
  a debounced write per edit — nowhere near the ceiling.
- **Before config is filled in**, the app runs in local-only mode (a console
  warning, data stays in `localStorage`) so you can still work; the login page
  shows a "not configured yet" message.
- **Migrating existing local data**: the first sign-in seeds fresh sample data
  in Firestore. If you'd rather carry over what you already entered locally,
  say so and I'll add a one-time "import my local ledger" step.
