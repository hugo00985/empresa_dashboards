const API_BASE = 'http://localhost:3000/api';
const fmtMoney = n => new Intl.NumberFormat('es-GT',{style:'currency',currency:'GTQ'}).format(n||0);
const setText = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };

async function loadResumen(){
  const r = await fetch(`${API_BASE}/inventario/resumen`, { credentials:'include' });
  if(!r.ok) throw new Error('Inventario resumen');
  const { valor_inventario, bajo_stock, topCriticos } = await r.json();
  setText('kpiValorInventario', fmtMoney(valor_inventario||0));
  setText('kpiBajoStock', bajo_stock ?? 0);

  const tb = document.querySelector('#tblCriticos tbody'); tb.innerHTML='';
  (topCriticos||[]).forEach(x=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${x.nombre}</td>
      <td>${x.stock_actual}</td>
      <td>${x.stock_minimo}</td>
      <td>${fmtMoney(x.precio_unitario)}</td>`;
    tb.appendChild(tr);
  });
}

async function loadLista(){
  const r = await fetch(`${API_BASE}/inventario/lista`, { credentials:'include' });
  if(!r.ok) throw new Error('Inventario lista');
  const rows = await r.json();
  const tb = document.querySelector('#tblInventario tbody'); tb.innerHTML='';
  rows.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${p.nombre}</td>
      <td>${p.stock_actual}</td>
      <td>${p.stock_minimo}</td>
      <td>${fmtMoney(p.precio_unitario)}</td>
      <td>${fmtMoney(p.valor)}</td>`;
    tb.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadResumen().catch(console.error);
  loadLista().catch(console.error);
});
