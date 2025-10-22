import { Router } from "express";
import axios from "axios";

const r = Router();

const BASE = (process.env.EXTERNAL_API_BASE || "").replace(/\/+$/,"");
const RESOURCE = process.env.EXTERNAL_API_RESOURCE || "tareas";

r.get("/_diag", async (_req, res) => {
  const urls = [
    `${BASE}/${RESOURCE}`,       // sin slash
    `${BASE}/${RESOURCE}/`,      // con slash
    `${BASE}`,                   // base sola
    `${BASE}/health`,            // típico health
    `${BASE}/status`,            // típico status
  ];

  const results = [];
  for (const u of urls) {
    try {
      const r = await axios.get(u, { validateStatus: () => true, timeout: 8000 });
      results.push({ url: u, status: r.status, bodyType: typeof r.data, sample: String(r.data).slice(0,120) });
    } catch (e) {
      results.push({ url: u, error: e.message });
    }
  }

  res.json({ base: BASE, resource: RESOURCE, results });
});

export default r;
