// client/js/external-tareas.js
const API = "/api/external/tareas";

// Elementos
const TBL = document.querySelector("#tblTareas tbody");
const BTN = document.querySelector("#btnRefrescarTareas");
const FRM = document.querySelector("#frmTarea");

// ---- helpers de fecha ----
function toSqlDateTime(dtLocalValue){
  if (!dtLocalValue) return "";
  const [d,t="00:00"] = String(dtLocalValue).split("T");
  const hhmm = t.length === 5 ? `${t}:00` : t;
  return `${d} ${hhmm}`;
}
function toLocalInputValue(sql){
  if (!sql) return "";
  const [d,t="00:00:00"] = String(sql).split(" ");
  return `${d}T${t.slice(0,5)}`;
}

// ---- API ----
async function listar() {
  const res = await fetch(API, { credentials: "include" });
  if (!res.ok) throw new Error("No se pudo listar tareas");
  return res.json();
}
async function eliminar(id) {
  const res = await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("No se pudo eliminar");
}
async function guardar(payload) {
  const method = payload.id ? "PUT" : "POST";
  const url = payload.id ? `${API}/${payload.id}` : API;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
}

// ---- render ----
function render(rows = []) {
  const arr = Array.isArray(rows) ? rows : (rows?.data ?? []);
  const offline = arr._external_error ? true : false;

  const badge = document.querySelector("#tareas-badge");
  if (badge){
    badge.textContent = offline ? "API externa: offline" : "API externa: ok";
    badge.classList.toggle("off", offline);
  }

  const list = Array.isArray(arr) ? arr : [];
  // tabla
  TBL.innerHTML = list.map(t => `
    <tr>
      <td>${t.id ?? ""}</td>
      <td>${t.titulo ?? ""}</td>
      <td>${t.estado ?? ""}</td>
      <td>${t.prioridad ?? ""}</td>
      <td>${t.fecha_limite ?? ""}</td>
      <td>${t.asignado_a ?? ""}</td>
      <td>
        <button class="btn btn-warning btn-edit" data-id="${t.id}">Editar</button>
        <button class="btn btn-warning btn-del" data-id="${t.id}">Eliminar</button>
      </td>
    </tr>
  `).join("");

  // cache + evento (para gráficas)
  window.__extTasksCache = list;
  document.dispatchEvent(new CustomEvent("externalTasks:loaded", { detail: list }));
}

// ---- eventos UI ----
BTN?.addEventListener("click", async () => {
  BTN.disabled = true;
  try { render(await listar()); }
  catch (e) { console.warn("API externa no disponible", e); render([]); }
  finally { BTN.disabled = false; }
});

document.addEventListener("click", async (e) => {
  const del = e.target.closest(".btn-del");
  const edit = e.target.closest(".btn-edit");
  if (del) {
    const id = del.dataset.id;
    if (id && confirm(`¿Eliminar tarea ${id}?`)) {
      try { await eliminar(id); render(await listar()); }
      catch (e2) { console.error(e2); alert("No se pudo eliminar"); }
    }
  }
  if (edit && FRM) {
    const row = edit.closest("tr").children;
    FRM.elements.id.value = edit.dataset.id;
    FRM.elements.titulo.value = row[1].textContent.trim();
    FRM.elements.estado.value = row[2].textContent.trim();
    FRM.elements.prioridad.value = row[3].textContent.trim();
    FRM.elements.fecha_limite.value = toLocalInputValue(row[4].textContent.trim());
    FRM.elements.asignado_a.value = row[5].textContent.trim();
    FRM.scrollIntoView({ behavior: "smooth" });
  }
});

FRM?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(FRM);
  const payload = Object.fromEntries(fd.entries());
  payload.fecha_limite = toSqlDateTime(payload.fecha_limite);
  try { await guardar(payload); FRM.reset(); render(await listar()); }
  catch (e2) { console.error(e2); alert(`Error guardando: ${e2.message}`); }
});

// Carga inicial: dispara el listado una vez
BTN?.click();
