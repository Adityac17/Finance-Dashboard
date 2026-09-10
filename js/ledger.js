const inr = n => "₹" + Math.round(n||0).toLocaleString("en-IN");
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function setStatus(msg, kind){
  const el = document.getElementById("dataStatus");
  el.textContent = msg;
  el.className = "data-status" + (kind ? " "+kind : "");
}

/* ================= Category management ================= */
function renderCategories(){
  const s = Store.load();
  document.getElementById("catBody").innerHTML = s.categories.map(c=>`
    <tr data-name="${esc(c.name)}">
      <td class="name-cell"><input type="text" class="catName" value="${esc(c.name)}"></td>
      <td class="planned-cell num"><input type="text" class="catPlanned" value="${esc(c.planned)}"></td>
      <td class="num">
        <button class="icon-btn save" data-action="save-cat">Save</button>
        <button class="icon-btn" data-action="delete-cat">Delete</button>
      </td>
    </tr>`).join("");
  populateCategoryDatalist();
}
function populateCategoryDatalist(){
  const s = Store.load();
  const dl = document.getElementById("categoryOptions");
  dl.innerHTML = s.categories.map(c=>`<option value="${esc(c.name)}">`).join("");
}
document.getElementById("catBody").addEventListener("click", (e)=>{
  const btn = e.target.closest("button");
  if(!btn) return;
  const tr = btn.closest("tr");
  const oldName = tr.dataset.name;
  if(btn.dataset.action === "save-cat"){
    const newName = tr.querySelector(".catName").value.trim();
    const planned = tr.querySelector(".catPlanned").value;
    if(!newName){ setStatus("Category name can't be empty.", "err"); return; }
    Store.renameCategory(oldName, newName, planned);
    setStatus(`Saved category "${newName}".`, "ok");
    renderCategories(); renderTransactions();
  } else if(btn.dataset.action === "delete-cat"){
    if(!confirm(`Delete "${oldName}"? Existing transactions in this category will move to "Uncategorized".`)) return;
    Store.deleteCategory(oldName);
    setStatus(`Deleted category "${oldName}".`, "ok");
    renderCategories(); renderTransactions();
  }
});
document.getElementById("addCatForm").addEventListener("submit", (e)=>{
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const planned = form.planned.value;
  if(!name) return;
  const ok = Store.addCategory(name, planned);
  if(!ok){ setStatus(`A category named "${name}" already exists.`, "err"); return; }
  form.reset();
  setStatus(`Added category "${name}".`, "ok");
  renderCategories();
});

/* ================= Transaction table (CRUD) ================= */
function populateModes(){
  const s = Store.load();
  const modes = Array.from(new Set(s.transactions.map(t=>t.mode).filter(Boolean))).sort();
  const sel = document.getElementById("txModeFilter");
  const current = sel.value;
  sel.innerHTML = '<option value="">All payment modes</option>' + modes.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join("");
  sel.value = current;
}
function populateMonthFilter(){
  const months = Store.months();
  const sel = document.getElementById("txMonthFilter");
  const current = sel.value;
  sel.innerHTML = '<option value="">All months</option>' + months.map(m=>`<option value="${m}">${Store.monthLabel(m)}</option>`).join("");
  sel.value = months.includes(current) ? current : "";
}

function renderTransactions(){
  const s = Store.load();
  const search = document.getElementById("txSearch").value.trim().toLowerCase();
  const mode = document.getElementById("txModeFilter").value;
  const monthFilter = document.getElementById("txMonthFilter").value;
  const catNames = s.categories.map(c=>c.name);

  const rows = s.transactions.filter(t=>{
    if(monthFilter && Store.monthKeyOf(t.date) !== monthFilter) return false;
    if(mode && t.mode !== mode) return false;
    if(search && !((t.desc||"").toLowerCase().includes(search) || (t.category||"").toLowerCase().includes(search))) return false;
    return true;
  }).sort((a,b)=> b.date.localeCompare(a.date));

  document.getElementById("txCount").textContent = `${rows.length} entr${rows.length===1?'y':'ies'}`;

  const body = document.getElementById("txBody");
  if(rows.length===0){ body.innerHTML = `<tr><td colspan="6" class="tx-empty">No matching entries.</td></tr>`; return; }

  body.innerHTML = rows.map(t=>`
    <tr data-id="${t.id}">
      <td><input type="date" class="date-input" value="${t.date}"></td>
      <td><select class="catSelect">${catNames.map(c=>`<option ${c===t.category?'selected':''}>${esc(c)}</option>`).join("")}${catNames.includes(t.category)?"":`<option selected>${esc(t.category)}</option>`}</select></td>
      <td><input type="text" class="descInput" value="${esc(t.desc)}"></td>
      <td><input type="text" class="modeInput" value="${esc(t.mode)}"></td>
      <td class="num"><input type="text" class="amt-input" value="${esc(t.amount)}"></td>
      <td class="num">
        <button class="icon-btn save" data-action="save-tx">Save</button>
        <button class="icon-btn" data-action="delete-tx">Delete</button>
      </td>
    </tr>`).join("");
}

document.getElementById("txBody").addEventListener("click", (e)=>{
  const btn = e.target.closest("button");
  if(!btn) return;
  const tr = btn.closest("tr");
  const id = Number(tr.dataset.id);
  if(btn.dataset.action === "save-tx"){
    const patch = {
      date: tr.querySelector(".date-input").value,
      category: tr.querySelector(".catSelect").value,
      desc: tr.querySelector(".descInput").value,
      mode: tr.querySelector(".modeInput").value,
      amount: tr.querySelector(".amt-input").value
    };
    Store.updateTransaction(id, patch);
    setStatus("Entry updated.", "ok");
    populateMonthFilter(); populateModes(); renderTransactions();
  } else if(btn.dataset.action === "delete-tx"){
    if(!confirm("Delete this entry?")) return;
    Store.deleteTransaction(id);
    setStatus("Entry deleted.", "ok");
    populateMonthFilter(); populateModes(); renderTransactions();
  }
});

document.getElementById("addTxForm").addEventListener("submit", (e)=>{
  e.preventDefault();
  const f = e.target;
  const date = f.date.value, category = f.category.value.trim() || "Uncategorized",
        desc = f.desc.value.trim(), mode = f.mode.value.trim(), amount = f.amount.value;
  if(!date || !amount){ setStatus("Date and amount are required.", "err"); return; }
  Store.addTransaction({date, category, desc, mode, amount});
  f.reset();
  setStatus("Entry added.", "ok");
  populateMonthFilter(); populateModes(); renderTransactions();
});

["txSearch","txModeFilter","txMonthFilter"].forEach(id=>{
  document.getElementById(id).addEventListener("input", renderTransactions);
  document.getElementById(id).addEventListener("change", renderTransactions);
});

/* ================= Import preview modal ================= */
let pendingImportRows = [];
function openPreview(rows, sourceLabel){
  pendingImportRows = rows;
  const known = Store.load().categories.map(c=>c.name);
  document.getElementById("modalSubcount").textContent = `${rows.length} row(s) found in ${sourceLabel}`;
  document.getElementById("previewBody").innerHTML = rows.map((r,i)=>`
    <tr data-idx="${i}">
      <td><input type="checkbox" checked class="rowInclude"></td>
      <td><input type="date" class="rowDate" value="${r.date||''}"></td>
      <td><input type="text" class="rowDesc" value="${esc(r.desc)}"></td>
      <td><select class="rowCat">${known.map(k=>`<option ${k===r.category?'selected':''}>${esc(k)}</option>`).join("")}</select></td>
      <td><input type="text" class="rowAmt" value="${esc(r.amount||0)}"></td>
    </tr>`).join("");
  document.getElementById("modalBackdrop").classList.add("open");
}
document.getElementById("modalCancel").onclick = ()=> document.getElementById("modalBackdrop").classList.remove("open");
document.getElementById("modalConfirm").onclick = ()=>{
  const trs = document.querySelectorAll("#previewBody tr");
  const toAdd = [];
  trs.forEach(tr=>{
    if(!tr.querySelector(".rowInclude").checked) return;
    const date = tr.querySelector(".rowDate").value;
    const desc = tr.querySelector(".rowDesc").value.trim();
    const category = tr.querySelector(".rowCat").value;
    const amount = Number(tr.querySelector(".rowAmt").value)||0;
    if(!date || !amount) return;
    toAdd.push({date, desc, category, amount, mode:"Imported"});
  });
  Store.addTransactions(toAdd);
  document.getElementById("modalBackdrop").classList.remove("open");
  populateMonthFilter(); populateModes(); renderTransactions();
  setStatus(`Added ${toAdd.length} imported entr${toAdd.length===1?'y':'ies'} to the ledger.`, "ok");
};

document.getElementById("importFile").addEventListener("change", async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  setStatus("Reading "+file.name+" …");
  try{
    if(/\.csv$/i.test(file.name)){
      const text = await file.text();
      const rows = parseGenericCSV(text);
      if(!rows.length) throw new Error("No usable date/amount rows detected — check the file has date and amount columns.");
      openPreview(rows, file.name);
      setStatus(`Parsed ${rows.length} row(s) — review before adding.`, "ok");
    } else if(/\.pdf$/i.test(file.name)){
      const buf = await file.arrayBuffer();
      const rows = await parsePDFStatement(buf);
      if(!rows.length) throw new Error("Couldn't confidently extract entries from this PDF — its layout may not match a simple date+amount pattern.");
      openPreview(rows, file.name + " (PDF, best-effort)");
      setStatus(`Extracted ${rows.length} candidate row(s) — please check carefully.`, "ok");
    } else {
      throw new Error("Please upload a .csv or .pdf statement.");
    }
  }catch(err){
    console.error(err);
    setStatus("Import failed: "+err.message, "err");
  }
  e.target.value = "";
});

document.getElementById("fetchSheetBtn").addEventListener("click", async ()=>{
  const url = document.getElementById("sheetUrl").value.trim();
  if(!url){ setStatus("Paste a published CSV link first.", "err"); return; }
  setStatus("Fetching from link …");
  try{
    const rows = await fetchCSVFromUrl(url);
    if(!rows.length) throw new Error("No usable rows found at that link.");
    openPreview(rows, "the published sheet link");
    setStatus(`Fetched ${rows.length} row(s) from the link — review before adding.`, "ok");
  }catch(err){
    console.error(err);
    setStatus("Fetch failed: "+err.message+" — the sheet must be published to the web (File → Share → Publish to web → CSV).", "err");
  }
});

document.getElementById("resetBtn").addEventListener("click", ()=>{
  if(!confirm("Reset the ledger back to the original sample data? This clears everything you've added or edited in this browser.")) return;
  Store.resetToDefaults();
  populateMonthFilter(); populateModes(); renderCategories(); renderTransactions();
  setStatus("Ledger reset to sample data.", "ok");
});

/* ================= init ================= */
Store.load();
populateMonthFilter();
populateModes();
renderCategories();
renderTransactions();
