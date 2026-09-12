/* ============================================================
   auth.js — Google sign-in + per-user data binding.

   Load order (all pages): Firebase compat SDKs → firebase-config.js
   → store.js → [parse.js] → page script (dashboard.js / ledger.js)
   → auth.js (this file, last).

   Each app page sets <body data-page="app">; the login page sets
   <body data-page="login">. The page script no longer auto-renders;
   it exposes window.__init(), which auth.js calls once the signed-in
   user's ledger is loaded from Firestore.
   ============================================================ */
(function(){
  const page = document.body.dataset.page || "app";

  function applyTheme(theme){
    if(theme === "dark") document.documentElement.setAttribute("data-theme","dark");
    else document.documentElement.removeAttribute("data-theme");
  }
  function themeLabel(theme){ return theme === "dark" ? "☀ Light" : "☾ Dark"; }

  /* Login page: a standalone toggle that works pre-auth via localStorage. */
  if(page === "login"){
    const t = document.getElementById("themeToggle");
    if(t){
      let cur = "light";
      try{ cur = localStorage.getItem("finance_theme") === "dark" ? "dark" : "light"; }catch(e){}
      t.textContent = themeLabel(cur);
      t.addEventListener("click", ()=>{
        cur = cur === "dark" ? "light" : "dark";
        applyTheme(cur);
        try{ localStorage.setItem("finance_theme", cur); }catch(e){}
        t.textContent = themeLabel(cur);
      });
    }
  }

  if(typeof FIREBASE_CONFIGURED !== "undefined" && !FIREBASE_CONFIGURED){
    // Placeholders still in firebase-config.js.
    const msg = "Firebase isn't configured yet. Paste your project's web "
      + "config into js/firebase-config.js — see FIREBASE_SETUP.md.";
    if(page === "login"){
      const b = document.getElementById("googleBtn");
      const s = document.getElementById("authStatus");
      if(b) b.disabled = true;
      if(s){ s.textContent = msg; s.className = "auth-status err"; }
    }else{
      console.warn(msg);
      // Fall back to local-only mode so the app still works while you set up.
      Store.load();
      applyTheme(Store.getTheme());
      if(window.__init) window.__init();
    }
    return;
  }

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db   = firebase.firestore();
  Store.bindDb(db);

  const provider = new firebase.auth.GoogleAuthProvider();

  /* ---------- login page wiring ---------- */
  if(page === "login"){
    const btn = document.getElementById("googleBtn");
    const status = document.getElementById("authStatus");
    if(btn){
      btn.addEventListener("click", async ()=>{
        btn.disabled = true;
        if(status){ status.textContent = "Opening Google sign-in…"; status.className = "auth-status"; }
        try{
          await auth.signInWithPopup(provider);
          // onAuthStateChanged below handles the redirect.
        }catch(err){
          btn.disabled = false;
          if(status){ status.textContent = "Sign-in failed: " + err.message; status.className = "auth-status err"; }
          console.error(err);
        }
      });
    }
  }

  /* ---------- auth state guard ---------- */
  auth.onAuthStateChanged(async (user)=>{
    if(!user){
      if(page === "app") location.replace("login.html");
      return;
    }
    if(page === "login"){ location.replace("index.html"); return; }

    // Signed in on an app page: show the user, load their ledger, render.
    renderUserBar(user, auth);
    try{
      await Store.bindUser(user.uid);
    }catch(e){
      console.warn("Falling back to local cache — Firestore load failed.", e);
    }
    // apply the user's saved theme + refresh the toggle label
    applyTheme(Store.getTheme());
    try{ localStorage.setItem("finance_theme", Store.getTheme()); }catch(e){}
    const tb = document.getElementById("themeToggle");
    if(tb) tb.textContent = themeLabel(Store.getTheme());
    if(window.__init) window.__init();
  });

  /* ---------- user chip (avatar + sign out) ---------- */
  function renderUserBar(user, auth){
    let bar = document.getElementById("userBar");
    if(!bar){
      bar = document.createElement("div");
      bar.id = "userBar";
      bar.className = "user-bar";
      document.body.appendChild(bar);
    }
    const name = user.displayName || user.email || "Signed in";
    const photo = user.photoURL
      ? `<img class="user-avatar" src="${user.photoURL}" alt="" referrerpolicy="no-referrer">`
      : `<span class="user-avatar user-avatar--blank">${(name[0]||"?").toUpperCase()}</span>`;
    bar.innerHTML = `${photo}<span class="user-name"></span>`
      + `<button id="themeToggle" class="user-signout" type="button"></button>`
      + `<button id="signOutBtn" class="user-signout">Sign out</button>`;
    bar.querySelector(".user-name").textContent = name;   // textContent = XSS-safe
    const tbtn = bar.querySelector("#themeToggle");
    tbtn.textContent = themeLabel(Store.getTheme());
    tbtn.addEventListener("click", ()=>{
      const next = Store.getTheme() === "dark" ? "light" : "dark";
      Store.setTheme(next);
      applyTheme(next);
      tbtn.textContent = themeLabel(next);
    });
    bar.querySelector("#signOutBtn").addEventListener("click", ()=>{
      auth.signOut().then(()=> location.replace("login.html"));
    });
  }
})();
