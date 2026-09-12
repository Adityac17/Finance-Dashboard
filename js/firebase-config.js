/* ============================================================
   firebase-config.js — YOUR Firebase project's web config.

   These values are NOT secret. A Firebase web config is meant to
   ship in client code; access is controlled by Firestore security
   rules (see firestore.rules) and the "Authorized domains" list in
   Authentication settings — not by hiding these keys.

   HOW TO FILL THIS IN (see FIREBASE_SETUP.md for the full walkthrough):
     Firebase console → Project settings (gear) → "Your apps" →
     Web app → "SDK setup and configuration" → Config.
   Paste those values over the placeholders below.
   ============================================================ */

const firebaseConfig = {
  apiKey:            "PASTE_API_KEY",
  authDomain:        "PASTE_PROJECT_ID.firebaseapp.com",
  projectId:         "PASTE_PROJECT_ID",
  storageBucket:     "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId:             "PASTE_APP_ID"
};

// True once real values are in place. auth.js checks this and shows a
// helpful message instead of silently failing while placeholders remain.
const FIREBASE_CONFIGURED = !firebaseConfig.apiKey.startsWith("PASTE_");
