/* ============================================================
   store.js — single source of truth for the ledger app.
   State persists to localStorage under STORAGE_KEY.
   Both index.html and ledger.html load this file and call
   Store.load() once, then read/write through Store's methods.
   ============================================================ */

const STORAGE_KEY = "finance_ledger_v1";
const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function defaultState(){
  return {
    nextId: 1000,
    categories: [
      { name:"Rent & Housing",               planned:30000 },
      { name:"Groceries & Household",        planned:15000 },
      { name:"EMIs & Loan Repayments",       planned:18000 },
      { name:"Utilities & Bills",            planned:6000  },
      { name:"SIPs & Investments",           planned:25000 },
      { name:"Transportation & Fuel",        planned:7000  },
      { name:"Dining & Food Delivery",       planned:6000  },
      { name:"Shopping & Lifestyle",         planned:5000  },
      { name:"Healthcare & Insurance",       planned:4000  },
      { name:"Miscellaneous & Personal Care",planned:3000  }
    ],
    income: { "2026-07":152000, "2026-08":152000, "2026-09":155000 },
    transactions: [
      ["2026-09-01","Rent & Housing","Monthly Apartment Rent","Net Banking",30000],
      ["2026-09-02","Utilities & Bills","Electricity Bill (Tata Power)","UPI",2800],
      ["2026-09-03","Groceries & Household","Blinkit / Weekly Groceries","UPI",3450],
      ["2026-09-05","SIPs & Investments","Nifty 50 Index Fund SIP","Auto-Debit",15000],
      ["2026-09-05","SIPs & Investments","PPF / Parag Parikh Flexi Cap","Auto-Debit",10000],
      ["2026-09-06","EMIs & Loan Repayments","Home Loan EMI (SBI)","Auto-Debit",18000],
      ["2026-09-07","Transportation & Fuel","Car Fuel Tank Full (HPCL)","Credit Card",3200],
      ["2026-09-08","Dining & Food Delivery","Family Weekend Dinner","Credit Card",2400],
      ["2026-09-10","Groceries & Household","Monthly D-Mart Supplies","UPI",4200],
      ["2026-09-12","Utilities & Bills","Airtel Fiber Broadband","UPI",1199],
      ["2026-09-14","Healthcare & Insurance","Apollo Pharmacy & Checkup","Credit Card",2600],
      ["2026-09-15","Dining & Food Delivery","Zomato Food Orders","UPI",1350],
      ["2026-09-17","Transportation & Fuel","Metro Card Recharge & Uber","UPI",1650],
      ["2026-09-18","Groceries & Household","Local Market Fruits & Milk","Cash",1850],
      ["2026-09-20","Shopping & Lifestyle","Myntra Festive Sale","Credit Card",3100],
      ["2026-09-22","Miscellaneous & Personal Care","Salon & Personal Care","UPI",1200],
      ["2026-09-24","Dining & Food Delivery","Starbucks & Office Coffee","UPI",950],
      ["2026-09-25","Utilities & Bills","Jio Postpaid Mobile Bill","UPI",799],
      ["2026-09-26","Miscellaneous & Personal Care","Plumbing & Appliance Service","Cash",800],
      ["2026-09-28","Shopping & Lifestyle","Kindle & Books Subscription","UPI",650],
      ["2026-07-01","Rent & Housing","Monthly Apartment Rent","Net Banking",30000],
      ["2026-07-02","Utilities & Bills","Electricity Bill (BESCOM)","UPI",2650],
      ["2026-07-04","Groceries & Household","Zepto / Weekly Essentials","UPI",3100],
      ["2026-07-05","SIPs & Investments","Nifty 50 Index Fund SIP","Auto-Debit",15000],
      ["2026-07-05","SIPs & Investments","PPF / Parag Parikh Flexi Cap","Auto-Debit",10000],
      ["2026-07-06","EMIs & Loan Repayments","Home Loan EMI (SBI)","Auto-Debit",18000],
      ["2026-07-08","Transportation & Fuel","Petrol (Indian Oil)","Credit Card",3000],
      ["2026-07-10","Groceries & Household","D-Mart Supermarket","Credit Card",4500],
      ["2026-07-12","Utilities & Bills","ACT Fibernet Broadband","Net Banking",1150],
      ["2026-07-15","Dining & Food Delivery","Weekend Dining Out","Credit Card",2800],
      ["2026-07-18","Shopping & Lifestyle","Amazon Prime Day Sale","Credit Card",4200],
      ["2026-07-20","Healthcare & Insurance","Annual Dental Checkup & Meds","Debit Card",2200],
      ["2026-07-22","Transportation & Fuel","Uber & Ola Commutes","UPI",1400],
      ["2026-07-25","Dining & Food Delivery","Swiggy Orders","UPI",1250],
      ["2026-07-27","Miscellaneous & Personal Care","House Cleaning & Repairs","Cash",1500],
      ["2026-07-29","Groceries & Household","Organic Vegetables & Fruits","Cash",1200],
      ["2026-08-01","Rent & Housing","Monthly Apartment Rent","Net Banking",30000],
      ["2026-08-02","Utilities & Bills","Electricity Bill (Tata Power)","UPI",2950],
      ["2026-08-03","Groceries & Household","Nature's Basket / Groceries","UPI",3800],
      ["2026-08-05","SIPs & Investments","Nifty 50 Index Fund SIP","Auto-Debit",15000],
      ["2026-08-05","SIPs & Investments","PPF / Parag Parikh Flexi Cap","Auto-Debit",10000],
      ["2026-08-06","EMIs & Loan Repayments","Home Loan EMI (SBI)","Auto-Debit",18000],
      ["2026-08-07","Transportation & Fuel","Fuel & Toll Charges","Credit Card",3500],
      ["2026-08-09","Dining & Food Delivery","Independence Day Celebration Dinner","Credit Card",3400],
      ["2026-08-11","Groceries & Household","Blinkit Household Restock","UPI",2600],
      ["2026-08-13","Healthcare & Insurance","Routine Lab Tests & Vitamins","UPI",1900],
      ["2026-08-16","Utilities & Bills","Airtel Broadband & DTH","UPI",1299],
      ["2026-08-19","Shopping & Lifestyle","Independence Day Apparel Sale","Credit Card",3900],
      ["2026-08-22","Transportation & Fuel","Auto / Metro Travel","UPI",1300],
      ["2026-08-24","Dining & Food Delivery","Zomato Office Lunches","UPI",1650],
      ["2026-08-26","Miscellaneous & Personal Care","Vehicle Servicing & Washing","Debit Card",2100],
      ["2026-08-28","Groceries & Household","Milk & Fresh Produce","Cash",1400]
    ].map((r,i)=>({ id:i+1, date:r[0], category:r[1], desc:r[2], mode:r[3], amount:r[4] })),
    /* recurring templates auto-post one transaction per month on the given
       day. lastPosted = last "YYYY-MM" already materialized. */
    recurring: [
      { id:1, day:1,  category:"Rent & Housing",         desc:"Monthly Apartment Rent",   mode:"Net Banking", amount:30000, active:true, lastPosted:"2026-09" },
      { id:2, day:5,  category:"SIPs & Investments",     desc:"Nifty 50 Index Fund SIP",  mode:"Auto-Debit",  amount:15000, active:true, lastPosted:"2026-09" },
      { id:3, day:5,  category:"SIPs & Investments",     desc:"PPF / Parag Parikh Flexi Cap", mode:"Auto-Debit", amount:10000, active:true, lastPosted:"2026-09" },
      { id:4, day:6,  category:"EMIs & Loan Repayments", desc:"Home Loan EMI (SBI)",      mode:"Auto-Debit",  amount:18000, active:true, lastPosted:"2026-09" }
    ],
    nextRecurringId: 5,
    /* savings goals: track progress toward a target amount. */
    goals: [
      { id:1, name:"Emergency Fund", target:300000, saved:120000 }
    ],
    nextGoalId: 2,
    settings: { theme:"light" }
  };
}

const Store = {
  _state: null,
  _db: null,        // firebase.firestore() instance, set via bindDb()
  _uid: null,       // signed-in user id, set via bindUser()
  _saveTimer: null, // debounce handle for remote writes

  /* localStorage key is namespaced per user so multiple Google accounts
     on the same browser don't clobber each other; falls back to the base
     key when running local-only (no user bound). */
  _key(){ return STORAGE_KEY + (this._uid ? "_" + this._uid : ""); },
  _persistLocal(){ try{ localStorage.setItem(this._key(), JSON.stringify(this._state)); }catch(e){} },

  /* Fill in fields added in later versions so ledgers saved by an older
     build (or a fresh Firestore doc) don't break newer features. */
  _migrate(s){
    if(!s) return s;
    const d = defaultState();
    if(!Array.isArray(s.recurring)) s.recurring = [];
    if(typeof s.nextRecurringId !== "number"){
      s.nextRecurringId = s.recurring.reduce((m,r)=>Math.max(m, r.id||0), 0) + 1;
    }
    if(!Array.isArray(s.goals)) s.goals = [];
    if(typeof s.nextGoalId !== "number"){
      s.nextGoalId = s.goals.reduce((m,g)=>Math.max(m, g.id||0), 0) + 1;
    }
    if(!s.settings || typeof s.settings !== "object") s.settings = { theme:"light" };
    if(s.settings.theme !== "dark") s.settings.theme = s.settings.theme || "light";
    if(!s.income || typeof s.income !== "object") s.income = {};
    if(!Array.isArray(s.categories)) s.categories = d.categories;
    if(!Array.isArray(s.transactions)) s.transactions = [];
    if(typeof s.nextId !== "number") s.nextId = 1000;
    return s;
  },

  /* ---------- Firebase sync ---------- */
  bindDb(db){ this._db = db; },
  // Load this user's ledger from Firestore into _state. Falls back to the
  // per-user localStorage cache (or seed data) if there's no remote doc yet
  // or the network fails; in the fallback case it pushes a doc up so the
  // account has one going forward.
  async bindUser(uid){
    this._uid = uid;
    this._state = null;
    if(this._db){
      try{
        const snap = await this._db.collection("ledgers").doc(uid).get();
        if(snap.exists){
          this._state = this._migrate(snap.data());
          this.materializeRecurring();  // catch up any months missed since last visit
          this._persistLocal();
          return this._state;
        }
      }catch(e){
        console.warn("Firestore read failed — using local cache.", e);
      }
    }
    this.load();        // hydrate _state from per-user localStorage or defaults
    this._saveRemote(); // seed the remote doc for a first-time / offline user
    return this._state;
  },
  _scheduleRemote(){
    if(!this._db || !this._uid) return;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(()=>this._saveRemote(), 800);
  },
  _saveRemote(){
    if(!this._db || !this._uid) return;
    this._db.collection("ledgers").doc(this._uid).set(this._state)
      .catch(e=>console.warn("Firestore write failed (kept locally).", e));
  },

  load(){
    if(this._state) return this._state;
    let raw = null;
    try{
      raw = localStorage.getItem(this._key());
      this._state = raw ? JSON.parse(raw) : defaultState();
    }catch(e){
      console.warn("Could not read stored ledger, starting fresh.", e);
      this._state = defaultState();
      raw = null;
    }
    this._migrate(this._state);
    this.materializeRecurring();
    if(!raw) this.save();
    return this._state;
  },
  save(){
    this._persistLocal();
    this._scheduleRemote();
  },
  resetToDefaults(){ this._state = defaultState(); this.save(); return this._state; },

  /* ---------- derived helpers ---------- */
  monthKeyOf(dateStr){ return (dateStr||"").slice(0,7); },
  monthLabel(key){
    if(!key) return "";
    const [y,m] = key.split("-").map(Number);
    return `${MONTH_ABBR[m-1]} ${y}`;
  },
  months(){
    const s = this.load();
    const set = new Set(Object.keys(s.income));
    s.transactions.forEach(t=> set.add(this.monthKeyOf(t.date)));
    return Array.from(set).sort();
  },
  monthTotals(key){
    const s = this.load();
    const income = s.income[key] || 0;
    const expenses = s.transactions
      .filter(t=>this.monthKeyOf(t.date)===key)
      .reduce((sum,t)=>sum+Number(t.amount||0),0);
    const savings = income - expenses;
    const rate = income ? savings/income : 0;
    return { income, expenses, savings, rate };
  },
  ytdTotals(){
    const months = this.months();
    let income=0, expenses=0;
    months.forEach(k=>{ const t=this.monthTotals(k); income+=t.income; expenses+=t.expenses; });
    const savings = income-expenses;
    return { income, expenses, savings, rate: income? savings/income : 0 };
  },
  categoryTotalsForMonth(key){
    const s = this.load();
    const totals = {};
    s.categories.forEach(c=> totals[c.name]=0);
    s.transactions.filter(t=>this.monthKeyOf(t.date)===key).forEach(t=>{
      totals[t.category] = (totals[t.category]||0) + Number(t.amount||0);
    });
    return totals;
  },

  /* ---------- transaction CRUD ---------- */
  addTransaction({date, category, desc, mode, amount}){
    const s = this.load();
    const id = s.nextId++;
    s.transactions.push({ id, date, category, desc, mode: mode||"", amount:Number(amount)||0 });
    this.save();
    return id;
  },
  addTransactions(rows){
    const s = this.load();
    rows.forEach(r=>{
      s.transactions.push({ id:s.nextId++, date:r.date, category:r.category, desc:r.desc||"", mode:r.mode||"Imported", amount:Number(r.amount)||0 });
    });
    this.save();
  },
  updateTransaction(id, patch){
    const s = this.load();
    const tx = s.transactions.find(t=>t.id===id);
    if(!tx) return false;
    Object.assign(tx, patch);
    tx.amount = Number(tx.amount)||0;
    this.save();
    return true;
  },
  deleteTransaction(id){
    const s = this.load();
    s.transactions = s.transactions.filter(t=>t.id!==id);
    this.save();
  },

  /* ---------- category CRUD ---------- */
  addCategory(name, planned){
    const s = this.load();
    if(s.categories.some(c=>c.name.toLowerCase()===name.toLowerCase())) return false;
    s.categories.push({ name, planned:Number(planned)||0 });
    this.save();
    return true;
  },
  renameCategory(oldName, newName, planned){
    const s = this.load();
    const cat = s.categories.find(c=>c.name===oldName);
    if(!cat) return false;
    cat.name = newName;
    cat.planned = Number(planned)||0;
    s.transactions.forEach(t=>{ if(t.category===oldName) t.category = newName; });
    this.save();
    return true;
  },
  deleteCategory(name){
    const s = this.load();
    s.categories = s.categories.filter(c=>c.name!==name);
    s.transactions.forEach(t=>{ if(t.category===name) t.category = "Uncategorized"; });
    this.save();
  },

  /* ---------- income ---------- */
  setIncome(monthKey, value){
    const s = this.load();
    s.income[monthKey] = Number(value)||0;
    this.save();
  },
  deleteIncome(monthKey){
    const s = this.load();
    delete s.income[monthKey];
    this.save();
  },

  /* ---------- category trend (for sparklines) ---------- */
  categorySeries(name){
    return this.months().map(k => this.categoryTotalsForMonth(k)[name] || 0);
  },

  /* ============================================================
     Recurring transactions (F1). Each template posts one
     transaction per month on `day`, tagged with recurringId so
     re-runs never duplicate. materializeRecurring() catches up
     every month from lastPosted+1 through the current month.
     ============================================================ */
  _curMonthKey(){
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;
  },
  materializeRecurring(){
    const s = this._state;
    if(!s || !Array.isArray(s.recurring)) return 0;
    const curKey = this._curMonthKey();
    let posted = 0;
    s.recurring.forEach(r=>{
      if(!r.active) return;
      let [y,m] = (r.lastPosted || curKey).split("-").map(Number);
      while(true){
        m++; if(m>12){ m=1; y++; }
        const key = `${y}-${String(m).padStart(2,'0')}`;
        if(key > curKey) break;
        const exists = s.transactions.some(t => t.recurringId===r.id && this.monthKeyOf(t.date)===key);
        if(!exists){
          const day = String(Math.min(Math.max(r.day||1,1),28)).padStart(2,'0');
          s.transactions.push({
            id:s.nextId++, date:`${key}-${day}`, category:r.category,
            desc:r.desc||"", mode:r.mode||"Auto-Debit",
            amount:Number(r.amount)||0, recurringId:r.id
          });
          posted++;
        }
        r.lastPosted = key;
      }
    });
    if(posted) this.save();
    return posted;
  },
  addRecurring({day, category, desc, mode, amount, active=true}){
    const s = this.load();
    const id = s.nextRecurringId++;
    // seed lastPosted to previous month so this month posts immediately
    let [y,m] = this._curMonthKey().split("-").map(Number);
    m--; if(m<1){ m=12; y--; }
    const prevKey = `${y}-${String(m).padStart(2,'0')}`;
    s.recurring.push({
      id, day:Number(day)||1, category, desc:desc||"",
      mode:mode||"Auto-Debit", amount:Number(amount)||0,
      active:!!active, lastPosted:prevKey
    });
    this.save();
    this.materializeRecurring();
    return id;
  },
  updateRecurring(id, patch){
    const s = this.load();
    const r = s.recurring.find(x=>x.id===id);
    if(!r) return false;
    Object.assign(r, patch);
    r.amount = Number(r.amount)||0;
    r.day = Math.min(Math.max(Number(r.day)||1,1),28);
    this.save();
    return true;
  },
  deleteRecurring(id){
    const s = this.load();
    s.recurring = s.recurring.filter(x=>x.id!==id);
    this.save();
  },
  upcomingBills(withinDays=7){
    const s = this.load();
    const today = new Date(); today.setHours(0,0,0,0);
    const out = [];
    s.recurring.filter(r=>r.active).forEach(r=>{
      const day = Math.min(Math.max(r.day||1,1),28);
      let d = new Date(today.getFullYear(), today.getMonth(), day);
      if(d < today) d = new Date(today.getFullYear(), today.getMonth()+1, day);
      const inDays = Math.round((d - today)/86400000);
      if(inDays <= withinDays){
        out.push({ id:r.id, category:r.category, desc:r.desc, amount:r.amount,
                   dueDate:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, inDays });
      }
    });
    return out.sort((a,b)=>a.inDays-b.inDays);
  },

  /* ============================================================
     Savings goals (F5)
     ============================================================ */
  addGoal({name, target, saved=0}){
    const s = this.load();
    const id = s.nextGoalId++;
    s.goals.push({ id, name:name||"Untitled goal", target:Number(target)||0, saved:Number(saved)||0 });
    this.save();
    return id;
  },
  updateGoal(id, patch){
    const s = this.load();
    const g = s.goals.find(x=>x.id===id);
    if(!g) return false;
    Object.assign(g, patch);
    g.target = Number(g.target)||0;
    g.saved  = Number(g.saved)||0;
    this.save();
    return true;
  },
  deleteGoal(id){
    const s = this.load();
    s.goals = s.goals.filter(x=>x.id!==id);
    this.save();
  },

  /* ============================================================
     Theme (F8). Mirrored to a plain localStorage key so the login
     page and an early <head> script can apply it before auth.
     ============================================================ */
  getTheme(){ const s = this.load(); return (s.settings && s.settings.theme) || "light"; },
  setTheme(t){
    const s = this.load();
    s.settings.theme = (t === "dark" ? "dark" : "light");
    this.save();
    try{ localStorage.setItem("finance_theme", s.settings.theme); }catch(e){}
    return s.settings.theme;
  },

  /* ============================================================
     Backup / restore (F3)
     ============================================================ */
  exportJSON(){ return JSON.stringify(this.load(), null, 2); },
  importState(obj){
    if(!obj || typeof obj !== "object") throw new Error("Invalid backup: not an object.");
    if(!Array.isArray(obj.transactions) || !Array.isArray(obj.categories))
      throw new Error("Invalid backup: missing categories or transactions.");
    this._state = this._migrate(obj);
    this.save();
    return this._state;
  }
};
