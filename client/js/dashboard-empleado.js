const API_BASE = location.origin + '/api';

function todayISO(d = new Date()) { return d.toISOString().slice(0,10); }
function setText(id, v){ const el=document.getElementById(id); if(el) el.textContent=v; }

let chartLine, chartBar;

function drawLine(canvasId, labels, data){
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (chartLine) chartLine.destroy();
  // eslint-disable-next-line no-undef
  chartLine = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{ label:'Mis ventas', data }] },
    options:{ responsive:true, maintainAspectRatio:false }
  });
}

function drawBar(canvasId, labels, data){
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (chartBar) chartBar.destroy();
  // eslint-disable-next-line no-undef
  chartBar = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ label:'Cantidad', data }] },
    options:{ responsive:true, maintainAspectRatio:false }
  });
}

async function api(path){
  const r = await fetch(path, { credentials:'include' });
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function initDefaultDates(){
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const desde = document.getElementById('f_desde');
  const hasta = document.getElementById('f_hasta');
  if (desde && !desde.value) desde.value = todayISO(start);
  if (hasta && !hasta.value) hasta.value = todayISO(d);
}

async function me(){
  const r = await api('/api/session/me');
  document.getElementById('userBadge').textContent = `Hola, ${r.nombre || r.correo || 'Empleado'}`;
  return r;
}

async function meEmpleado(){
  // devuelve { id_empleado, nombre, ... }
  return api('/api/empleados/me');
}

async function aplicar(empleadoId){
  const source = document.getElementById('f_source')?.value || 'ventas';
  const desde  = document.getElementById('f_desde')?.value;
  const hasta  = document.getElementById('f_hasta')?.value;

  // KPIs personales
  const q1 = new URLSearchParams({ source, desde, hasta, empleado_id: empleadoId });
  const resumen = await api(`/api/metricas/resumen?${q1.toString()}`);
  setText('kpi-mi-ventas', resumen.kpis.numVentas);
  setText('kpi-mi-monto',  Number(resumen.kpis.montoTotal).toFixed(2));
  setText('kpi-mi-ticket', Number(resumen.kpis.ticketPromedio).toFixed(2));

  // Serie personal
  const q2 = new URLSearchParams({ source, desde, hasta, empleado_id: empleadoId });
  const serie = await api(`/api/metricas/ventas-por-dia?${q2.toString()}`);
  if (serie?.series) drawLine('chart-mi-ventas-dia', serie.series.labels, serie.series.data);

  // Top personal
  const q3 = new URLSearchParams({ source, desde, hasta, empleado_id: empleadoId });
  const top  = await api(`/api/metricas/top-productos?${q3.toString()}`);
  const labels = (top.items || []).map(i => i.producto);
  const data   = (top.items || []).map(i => Number(i.cantidad||0));
  drawBar('chart-mi-top', labels, data);
}

/* ========= AÑADIDOS: KPI DE DESEMPEÑO ========= */

// 1) Carga KPI de desempeño personal (no modifica nada existente)
async function loadMiDesempeno(empleadoId){
  const source = document.getElementById('f_source')?.value || 'ventas';
  const desde  = document.getElementById('f_desde')?.value;
  const hasta  = document.getElementById('f_hasta')?.value;

  const p = new URLSearchParams({ source, desde, hasta, empleado_id: empleadoId });
  try {
    const d = await api(`/api/metricas/desempeno?${p.toString()}`);

    const label  = document.getElementById('kpi-mi-desempeno');
    const detail = document.getElementById('kpi-mi-desempeno-detalle');
    if (!label || !detail) return; // por si el HTML aún no lo tiene

    // Texto principal
    label.textContent = d.clasificacion || (d.comparacion === 'sin_datos' ? 'Sin datos' : '—');
    // Detalle
    if (d.comparacion === 'vs_pares') {
      detail.textContent = `Mi monto: ${d.montoEvaluado} · Prom. pares: ${d.promedioPares} · Ratio: ${d.ratio}x`;
    } else if (d.comparacion === 'sin_datos') {
      detail.textContent = 'No hay ventas en el rango seleccionado';
    } else {
      detail.textContent = `Prom. general: ${d.promedioTodos}`;
    }

    // Color según clasificación
    label.style.color = (d.clasificacion === 'Alto') ? 'green'
                     : (d.clasificacion === 'Bajo') ? 'crimson'
                     : 'inherit';
  } catch (e) {
    console.error('loadMiDesempeno', e);
  }
}

// 2) Envoltorio para no tocar la función aplicar(): llamamos aplicar() y luego el KPI
async function aplicarConDesempeno(empleadoId){
  await aplicar(empleadoId);
  await loadMiDesempeno(empleadoId);
}

/* ========= FIN AÑADIDOS ========= */

document.getElementById('logoutLink')?.addEventListener('click', () => {
  localStorage.removeItem('usuario');
});

document.addEventListener('DOMContentLoaded', async () => {
  initDefaultDates();
  const u = await me();
  // (opcional) validar rol
  const role = (u.rol || u.role || '').toUpperCase();
  if (role !== 'EMPLEADO' && role !== 'EMPLOYEE') {
    // Si no es empleado, reenvía al login
    // location.href = '../index.html';
  }
  const emp = await meEmpleado();

  // ⬇️ Cambiamos SOLO las llamadas para incluir desempeño, sin borrar aplicar()
  document.getElementById('f_aplicar').addEventListener('click', () => aplicarConDesempeno(emp.id_empleado));
  aplicarConDesempeno(emp.id_empleado); // primera carga
});
