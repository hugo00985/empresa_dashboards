import axios from "axios";

const ENABLED = String(process.env.EXTERNAL_API_ENABLED || "true").toLowerCase() === "true";
const BASE = (process.env.EXTERNAL_API_BASE || "").replace(/\/+$/,"");
const RESOURCE = process.env.EXTERNAL_API_RESOURCE || "tareas";
const TIMEOUT = Number(process.env.EXTERNAL_API_TIMEOUT_MS || 10000);

// Mock mínimo por si está apagado
const mock = () => ([
  { id: 1, titulo: "Demo offline", estado: "Pendiente", prioridad: "Media", fecha_limite: "2025-12-31 12:00:00", asignado_a: "1" }
]);

let http;
if (ENABLED) {
  if (!BASE) throw new Error("EXTERNAL_API_BASE no definido en .env");
  http = axios.create({
    baseURL: `${BASE}/${RESOURCE}`, // sin barra final
    timeout: TIMEOUT,
    headers: { "Content-Type": "application/json" },
  });
  http.interceptors.request.use(cfg => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[external] →", (cfg.baseURL || "") + (cfg.url || ""));
    }
    return cfg;
  });
}

const safe = async (fn, fallback=[]) => {
  if (!ENABLED) return fallback;
  try { return await fn(); }
  catch (e) {
    // devolvemos arreglo vacío con bandera, en vez de 500
    return Object.assign([], { _external_error: e.message });
  }
};

export const listTasks = async () =>
  safe(async () => (await http.get("")).data, mock());

export const getTask = async (idOrReq) => {
  const id = (typeof idOrReq === "string" || typeof idOrReq === "number")
    ? idOrReq
    : (idOrReq?.params?.id ?? idOrReq?.query?.id ?? idOrReq?.body?.id);
  return safe(async () => {
    if (id) return (await http.get(`/${id}`)).data;
    return (await http.get("")).data;
  }, mock());
};

export const createTask = async (payload) =>
  safe(async () => (await http.post("", payload)).data);

export const updateTask = async (payload) => {
  const id = payload?.id;
  return safe(async () => {
    if (id) return (await http.put(`/${id}`, payload)).data;
    return (await http.put("", payload)).data;
  });
};

export const removeTask = async (id) =>
  safe(async () => {
    if (id) return (await http.delete(`/${id}`)).data;
    return (await http.delete("")).data;
  });
