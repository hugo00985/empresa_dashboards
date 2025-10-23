const API_BASE = location.origin + '/api';
let chart;
const fmtMoney = n => new Intl.NumberFormat('es-GT',{style:'currency',currency:'GTQ'}).format(n||0);

async function fetchData(){
  const anio = Number(document.getElementById('cmpAnio').value) || (new Date()).getFullYear();
  const r = await fetch(`${API_BASE}/comparativa/ventas-vs-stock?anio=${anio}`, { credentials:'include' });
  if(!r.ok) throw new Error('Comparativa');
  return r.json();
}

function draw(labels, ventas, stockVal){
  const ctx=document.getElementById('cmpChart');
  if(chart) chart.destroy();
  // eslint-disable-next-line no-undef
  chart = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[
      { label:'Ventas', data:ventas, yAxisID:'y' },
      { label:'Stock valorizado (línea ref.)', data:labels.map(()=>stockVal), type:'line', yAxisID:'y' }
    ]},
    options:{ responsive:true, maintainAspectRatio:false }
  });
}

function fillTable(labels, ventas, stockVal){
  const tb=document.querySelector('#cmpTable tbody'); tb.innerHTML='';
  labels.forEach((m,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${m}</td><td>${fmtMoney(ventas[i]||0)}</td><td>${fmtMoney(stockVal||0)}</td>`;
    tb.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  document.getElementById('cmpAnio').value = (new Date()).getFullYear();
  document.getElementById('btnCmpReload').addEventListener('click', async ()=>{
    const data = await fetchData().catch(console.error);
    if(!data) return;
    const labels = data.ventasMensuales.map(x=>x.mes);
    const ventas  = data.ventasMensuales.map(x=>x.ventas);
    draw(labels, ventas, data.stock_valorizado||0);
    fillTable(labels, ventas, data.stock_valorizado||0);
  });
  document.getElementById('btnCmpReload').click();
});
