// client/js/external-tareas-charts.js
if (!window.__extChartsBootstrapped) {
  window.__extChartsBootstrapped = true;

  let chartEstado = null;
  let chartPrioridad = null;

  function countBy(arr, keyFn){
    const m = new Map();
    for (const x of arr) {
      const k = (keyFn(x) ?? "—").toString().trim() || "—";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }
  function toArraysFromMap(m){
    return [Array.from(m.keys()), Array.from(m.values())];
  }

  function upsertChart(canvasId, type, labels, data){
    const el = document.getElementById(canvasId);
    if (!el || typeof Chart === "undefined") return null;

    // ✅ destruye cualquier chart previo en este canvas
    const existing = Chart.getChart(el);
    if (existing) existing.destroy();

    return new Chart(el, {
      type,
      data: { labels, datasets: [{ label: "Tareas", data }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
        scales: type === "bar" ? { y: { beginAtZero: true, ticks: { precision: 0 } } } : undefined
      }
    });
  }

  function handleTasks(rows){
    const arr = Array.isArray(rows) ? rows : [];

    // (re)crear ambas con datos o placeholders
    if (arr._external_error) {
      const labels = ["Sin datos"]; const values = [0];
      chartEstado    = upsertChart("chartTareasEstado",    "doughnut", labels, values);
      chartPrioridad = upsertChart("chartTareasPrioridad", "bar",      labels, values);
      return;
    }

    const byEstado = countBy(arr, r => r.estado);
    const [labelsE, valuesE] = toArraysFromMap(byEstado);
    chartEstado = upsertChart("chartTareasEstado", "doughnut", labelsE, valuesE);

    const byPrioridad = countBy(arr, r => r.prioridad);
    const [labelsP, valuesP] = toArraysFromMap(byPrioridad);
    chartPrioridad = upsertChart("chartTareasPrioridad", "bar", labelsP, valuesP);
  }

  // 1) pinta si ya hay cache (por si el evento ya ocurrió)
  if (window.__extTasksCache) handleTasks(window.__extTasksCache);

  // 2) escucha futuras cargas/refresh
  document.addEventListener("externalTasks:loaded", (ev) => handleTasks(ev.detail));

  // 3) última red: si cambia la tabla (edición/eliminación) y no hay cache, reconstruye desde DOM
  const tbody = document.querySelector("#tblTareas tbody");
  if (tbody) {
    const obs = new MutationObserver(() => {
      if (!window.__extTasksCache || !Array.isArray(window.__extTasksCache)) {
        const rows = Array.from(tbody.querySelectorAll("tr")).map(tr => {
          const c = tr.children;
          return {
            id: c[0]?.textContent.trim(),
            titulo: c[1]?.textContent.trim(),
            estado: c[2]?.textContent.trim(),
            prioridad: c[3]?.textContent.trim(),
            fecha_limite: c[4]?.textContent.trim(),
            asignado_a: c[5]?.textContent.trim(),
          };
        });
        handleTasks(rows);
      }
    });
    obs.observe(tbody, { childList: true });
  }
}
