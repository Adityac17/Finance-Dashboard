/* ============================================================
   parse.js — turns a CSV file, a PDF statement, or a published
   Google Sheets CSV link into rows of {date, desc, amount,
   category, mode}, ready for the import-preview modal.
   Depends on SheetJS (xlsx) and pdf.js, loaded via <script> tags.
   ============================================================ */

const CATEGORY_KEYWORDS = [
  [/rent|apartment|housing/i, "Rent & Housing"],
  [/electric|power|water bill|gas bill|broadband|fiber|wifi|postpaid|mobile bill|dth/i, "Utilities & Bills"],
  [/grocery|groceries|blinkit|zepto|dmart|d-mart|supermarket|milk|vegetable|market/i, "Groceries & Household"],
  [/sip|mutual fund|index fund|ppf|flexi cap|investment/i, "SIPs & Investments"],
  [/emi|loan/i, "EMIs & Loan Repayments"],
  [/fuel|petrol|diesel|uber|ola|metro|toll|hpcl|indian oil/i, "Transportation & Fuel"],
  [/zomato|swiggy|restaurant|dining|starbucks|cafe|coffee/i, "Dining & Food Delivery"],
  [/myntra|amazon|flipkart|shopping|apparel|book|kindle/i, "Shopping & Lifestyle"],
  [/pharmacy|hospital|clinic|doctor|health|insurance|lab test/i, "Healthcare & Insurance"],
  [/salon|spa|repair|plumb|service|misc/i, "Miscellaneous & Personal Care"]
];
function guessCategory(desc){
  const hit = CATEGORY_KEYWORDS.find(([re])=>re.test(desc||""));
  return hit ? hit[1] : "Miscellaneous & Personal Care";
}

function toDateStr(v){
  if(v instanceof Date) return v.toISOString().slice(0,10);
  if(typeof v === "number"){ const d = XLSX.SSF.parse_date_code(v); return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`; }
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString().slice(0,10);
}

function parseGenericCSV(text){
  const wb = XLSX.read(text, {type:"string"});
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, raw:true, defval:null});
  if(rows.length<2) return [];
  const header = rows[0].map(h=>String(h||"").toLowerCase());
  const findCol = re => header.findIndex(h=>re.test(h));
  const dateCol = findCol(/date|time/);
  const amtCol = findCol(/amount|amt|inr|₹|total/);
  const descCol = findCol(/desc|narrat|merchant|payee|to\/from|title|note|name/);
  const modeCol = findCol(/mode|method|bank|wallet|upi|via/);
  const catCol = findCol(/categor/);
  const out = [];
  for(let i=1;i<rows.length;i++){
    const row = rows[i];
    if(!row || row.every(c=>c===null)) continue;
    const rawDate = dateCol>=0 ? row[dateCol] : row[0];
    const dateStr = toDateStr(rawDate);
    let amount = amtCol>=0 ? row[amtCol] : row[row.length-1];
    if(typeof amount === "string") amount = Number(amount.replace(/[^0-9.\-]/g,""));
    amount = Math.abs(Number(amount)||0);
    const desc = String((descCol>=0?row[descCol]:row[1])||"").trim();
    if(!dateStr || !amount) continue;
    out.push({
      date: dateStr,
      desc,
      amount,
      category: catCol>=0 && row[catCol] ? String(row[catCol]) : guessCategory(desc),
      mode: modeCol>=0 ? String(row[modeCol]||"") : "Imported"
    });
  }
  return out;
}

async function parsePDFStatement(arrayBuf){
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const pdf = await pdfjsLib.getDocument({data:arrayBuf}).promise;
  let fullText = "";
  for(let p=1;p<=pdf.numPages;p++){
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    fullText += content.items.map(it=>it.str).join(" ") + "\n";
  }
  const lines = fullText.split(/\n|(?=\d{1,2}[\/\-][A-Za-z0-9]{2,4}[\/\-]\d{2,4})/);
  const dateRe = /(\d{1,2}[\/\-\s](?:[A-Za-z]{3,9}|\d{1,2})[\/\-\s]\d{2,4})/;
  const amtRe = /(?:₹|Rs\.?|INR)?\s?([\d,]+\.\d{2}|[\d,]{3,})/;
  const out = [];
  lines.forEach(line=>{
    const dm = line.match(dateRe);
    const am = line.match(amtRe);
    if(!dm || !am) return;
    const d = new Date(dm[1]);
    const dateStr = toDateStr(d);
    const amount = Number(am[1].replace(/,/g,""));
    if(!dateStr || !amount) return;
    const desc = line.replace(dm[0],"").replace(am[0],"").trim().slice(0,80) || "Statement entry";
    out.push({ date: dateStr, desc, amount, category: guessCategory(desc), mode:"Imported" });
  });
  return out;
}

async function fetchCSVFromUrl(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error("HTTP "+res.status);
  const text = await res.text();
  return parseGenericCSV(text);
}
