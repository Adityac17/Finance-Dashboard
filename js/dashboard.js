const inr = n => "₹" + Math.round(n||0).toLocaleString("en-IN");
const pct = n => ((n||0)*100).toFixed(1) + "%";
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const CAT_COLORS = ["#1F2E4D","#2F6E4F","#A6402E","#B98A2E","#5B6B85","#7C8FAE","#8A5A3C","#3E5A7A","#6E8F5C","#9C7A2E","#4A3B6B","#7A4A5C"];
const catColor = i => CAT_COLORS[i % CAT_COLORS.length];

let currentMonth = null;

function renderTabs(){
  const months = Store.months();
  if(!currentMonth || !months.includes(currentMonth)) currentMonth = months[months.length-1];
  const el = document.getElementById("tabs");
  el.innerHTML = "";
  months.forEach(m=>{
    const b = document.createElement("button");
    b.className = "tab" + (m===currentMonth ? " active":"");
    b.textContent = Store.monthLabel(m);
    b.onclick = ()=>{ currentMonth = m; renderAll(); };
    el.appendChild(b);
  });
}

function renderKPIs(){
  const d = Store.monthTotals(currentMonth);
  const ytd = Store.ytdTotals();
  document.getElementById("kpiRow").innerHTML = `
    <div class="kpi"><p class="kpi-label">Total income</p><p class="kpi-value credit">${inr(d.income)}</p><p class="kpi-ytd">YTD ${inr(ytd.income)}</p></div>
    <div class="kpi"><p class="kpi-label">Total expenses</p><p class="kpi-value debit">${inr(d.expenses)}</p><p class="kpi-ytd">YTD ${inr(ytd.expenses)}</p></div>
    <div class="kpi"><p class="kpi-label">Net savings</p><p class="kpi-value">${inr(d.savings)}</p><p class="kpi-ytd">YTD ${inr(ytd.savings)}</p></div>
    <div class="kpi"><p class="kpi-label">Savings rate</p><p class="kpi-value gold">${pct(d.rate)}</p><p class="kpi-ytd">YTD ${pct(ytd.rate)}</p></div>`;
}

function renderBarChart(){
  const months = Store.months();
  const w=460,h=260, padL=48, padB=30, padT=16;
  const totals = months.map(m=>Store.monthTotals(m));
  const maxV = Math.max(1, ...totals.map(t=>t.income)) * 1.1;
  const groupW = (w-padL-20)/Math.max(1,months.length);
  const barW = groupW*0.32;
  let svg = "";
  for(let i=0;i<=4;i++){
    const y = padT + (h-padT-padB)*(1-i/4);
    svg += `<line x1="${padL}" y1="${y}" x2="${w-10}" y2="${y}" stroke="#C9BEA3" stroke-width="1"/>`;
    svg += `<text x="${padL-8}" y="${y+3}" text-anchor="end" font-size="9" font-family="IBM Plex Mono" fill="#5B6B85">${Math.round(maxV*i/4/1000)}k</text>`;
  }
  months.forEach((m,i)=>{
    const cx = padL + groupW*i + groupW/2;
    const d = totals[i];
    const hIncome = (h-padT-padB) * (d.income/maxV);
    const hExp = (h-padT-padB) * (d.expenses/maxV);
    const isActive = m===currentMonth;
    const opacity = isActive ? 1 : 0.45;
    svg += `<rect x="${cx-barW-2}" y="${h-padB-hIncome}" width="${barW}" height="${hIncome}" fill="#2F6E4F" opacity="${opacity}"/>`;
    svg += `<rect x="${cx+2}" y="${h-padB-hExp}" width="${barW}" height="${hExp}" fill="#A6402E" opacity="${opacity}"/>`;
    svg += `<text x="${cx}" y="${h-padB+16}" text-anchor="middle" font-size="11" font-family="IBM Plex Mono" font-weight="${isActive?600:400}" fill="${isActive?'#1F2E4D':'#5B6B85'}">${Store.monthLabel(m).slice(0,3)}</text>`;
  });
  svg += `<line x1="${padL}" y1="${h-padB}" x2="${w-10}" y2="${h-padB}" stroke="#1F2E4D" stroke-width="1.2"/>`;
  document.getElementById("barChart").innerHTML = svg;
}

function renderDonut(){
  const s = Store.load();
  const cx=110, cy=130, r=90, r0=54;
  const catTotals = Store.categoryTotalsForMonth(currentMonth);
  const total = Object.values(catTotals).reduce((a,b)=>a+b,0) || 1;
  let angle = -Math.PI/2, svg="", legend="";
  s.categories.forEach((c,i)=>{
    const val = catTotals[c.name]||0;
    const frac = val/total;
    if(frac<=0) return;
    const a1=angle, a2=angle+frac*Math.PI*2;
    const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
    const x2=cx+r*Math.cos(a2), y2=cy+r*Math.sin(a2);
    const x1i=cx+r0*Math.cos(a1), y1i=cy+r0*Math.sin(a1);
    const x2i=cx+r0*Math.cos(a2), y2i=cy+r0*Math.sin(a2);
    const large=(a2-a1)>Math.PI?1:0;
    svg += `<path d="M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${x2i},${y2i} A${r0},${r0} 0 ${large} 0 ${x1i},${y1i} Z" fill="${catColor(i)}" stroke="#F6F1E4" stroke-width="1.5"/>`;
    legend += `<span><span class="swatch" style="background:${catColor(i)}"></span>${esc(c.name)} · ${pct(frac)}</span>`;
    angle = a2;
  });
  svg += `<text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="13" font-family="IBM Plex Mono" font-weight="600" fill="#1F2E4D">${inr(total)}</text>`;
  svg += `<text x="${cx}" y="${cy+13}" text-anchor="middle" font-size="9.5" font-family="Inter" fill="#5B6B85">total spend</text>`;
  document.getElementById("donutChart").innerHTML = svg;
  document.getElementById("donutLegend").innerHTML = legend;
}

function renderLineChart(){
  const months = Store.months();
  const totals = months.map(m=>Store.monthTotals(m));
  const w=900,h=260, padL=44, padR=16, padT=20, padB=30;
  const maxV = Math.max(1, ...totals.map(t=>t.income)) * 1.15;
  const stepX = (w-padL-padR)/Math.max(1,(months.length-1));
  const yOf = v => padT + (h-padT-padB)*(1-v/maxV);
  const xOf = i => padL + stepX*i;
  let svg = "";
  for(let i=0;i<=4;i++){
    const y = padT + (h-padT-padB)*(1-i/4);
    svg += `<line x1="${padL}" y1="${y}" x2="${w-padR}" y2="${y}" stroke="#C9BEA3" stroke-width="1"/>`;
    svg += `<text x="${padL-8}" y="${y+3}" text-anchor="end" font-size="9" font-family="IBM Plex Mono" fill="#5B6B85">${Math.round(maxV*i/4/1000)}k</text>`;
  }
  function pathFor(key){
    let d = "";
    totals.forEach((t,i)=>{ const x=xOf(i), y=yOf(t[key]); d += (i===0?"M":"L")+x+","+y+" "; });
    return d;
  }
  svg += `<path d="${pathFor('expenses')}" fill="none" stroke="#A6402E" stroke-width="1.8"/>`;
  svg += `<path d="${pathFor('income')}" fill="none" stroke="#2F6E4F" stroke-width="1.8"/>`;
  months.forEach((m,i)=>{
    const x = xOf(i);
    svg += `<circle cx="${x}" cy="${yOf(totals[i].income)}" r="3.2" fill="#2F6E4F"/>`;
    svg += `<circle cx="${x}" cy="${yOf(totals[i].expenses)}" r="3.2" fill="#A6402E"/>`;
    svg += `<text x="${x}" y="${h-padB+16}" text-anchor="middle" font-size="10" font-family="IBM Plex Mono" fill="#1F2E4D">${Store.monthLabel(m).slice(0,3)}</text>`;
  });
  svg += `<line x1="${padL}" y1="${h-padB}" x2="${w-padR}" y2="${h-padB}" stroke="#1F2E4D" stroke-width="1.2"/>`;
  document.getElementById("lineChart").innerHTML = svg;
}

function renderBudgetTable(){
  const s = Store.load();
  document.getElementById("budgetNote").textContent = `Standing monthly plan against ${Store.monthLabel(currentMonth)}'s actual spend`;
  const catTotals = Store.categoryTotalsForMonth(currentMonth);
  let totalP=0, totalA=0;
  let rows = s.categories.map(c=>{
    const planned = c.planned||0, actual = catTotals[c.name]||0;
    totalP += planned; totalA += actual;
    const variance = planned - actual;
    const usedFrac = planned ? actual/planned : (actual>0?1.5:0);
    let color="#2F6E4F", statusText="On track";
    if(usedFrac>1){ color="#A6402E"; statusText="Over budget"; }
    else if(usedFrac>=0.9){ color="#B98A2E"; statusText="Near limit"; }
    return `<tr>
      <td class="cat">${esc(c.name)}</td>
      <td class="num">${inr(planned)}</td>
      <td class="num">${inr(actual)}</td>
      <td class="num" style="color:${variance>=0?'#2F6E4F':'#A6402E'}">${variance>=0?'+':''}${inr(variance)}</td>
      <td class="progress-cell">
        <div class="progress-track"><div class="progress-fill" style="width:${Math.min(usedFrac,1)*100}%;background:${color}"></div></div>
        <div class="pct-label">${pct(usedFrac)} · ${statusText}</div>
      </td>
    </tr>`;
  }).join("");
  const totalVar = totalP-totalA;
  rows += `<tr style="font-weight:600">
    <td class="cat">Total</td><td class="num">${inr(totalP)}</td><td class="num">${inr(totalA)}</td>
    <td class="num" style="color:${totalVar>=0?'#2F6E4F':'#A6402E'}">${totalVar>=0?'+':''}${inr(totalVar)}</td>
    <td class="progress-cell"><div class="pct-label">${totalP?pct(totalA/totalP):'—'} of plan used</div></td>
  </tr>`;
  document.getElementById("budgetBody").innerHTML = rows;
}

function renderAll(){
  renderTabs();
  renderKPIs();
  renderBarChart();
  renderDonut();
  renderLineChart();
  renderBudgetTable();
}

Store.load();
renderAll();
