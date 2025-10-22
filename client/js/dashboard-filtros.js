async function api(path) {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function todayISO(d = new Date()) { return d.toISOString().slice(0, 10); }

function initDefaultDates() {
  const desde = document.getElementById('f_desde');
  const hasta = document.getElementById('f_hasta');
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  if (desde && !desde.value) desde.value = todayISO(start);
  if (hasta && !hasta.value) hasta.value = todayISO(now);
}

async function cargarEmpleados() {
  const sel = document.getElementById('f_empleado');
  if (!sel) return;
  try {
    const items = await api('/api/empleados/options');
    for (const it of items) {
      const opt = document.createElement('option');
      opt.value = it.id;
      opt.textContent = it.nombre;
      sel.appendChild(opt);
    }
  } catch (e) {
    console.error('cargarEmpleados', e);
  }
}

async function aplicarFiltros() {
  const source = document.getElementById('f_source')?.value || 'ventas';
  const desde = document.getElementById('f_desde')?.value;
  const hasta = document.getElementById('f_hasta')?.value;
  const empleado_id = document.getElementById('f_empleado')?.value;

  const params = new URLSearchParams();
  if (source) params.set('source', source);
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  if (empleado_id) params.set('empleado_id', empleado_id);

  try {
    const data = await api(`/api/metricas/resumen?${params.toString()}`);

    setText('kpi-num-ventas', data.kpis.numVentas);
    setText('kpi-monto-total', Number(data.kpis.montoTotal).toFixed(2));
    setText('kpi-ticket-prom', Number(data.kpis.ticketPromedio).toFixed(2));
  } catch (e) {
    console.error('aplicarFiltros', e);
    alert('No se pudieron cargar los KPIs con los filtros seleccionados.');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initDefaultDates();
  await cargarEmpleados();
  document.getElementById('f_aplicar')?.addEventListener('click', aplicarFiltros);
  // Primera carga automática
  aplicarFiltros();
});
