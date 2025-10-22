// server/src/routes/externalTasks.js
import { Router } from "express";
import { authRequired, roleRequired } from "../middlewares/auth.js";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  removeTask,
} from "../services/external.tasks.service.js";

const router = Router();

router.get("/tareas", authRequired, async (_req, res) => {
  try { res.json(await listTasks()); }
  catch (e) { res.status(e.response?.status || 500).json({ error: e.message, upstream: e.response?.data }); }
});

router.get("/tareas/:id?", authRequired, async (req, res) => {
  try { res.json(await getTask(req)); }
  catch (e) { res.status(e.response?.status || 500).json({ error: e.message, upstream: e.response?.data }); }
});

router.post("/tareas", authRequired, roleRequired("ADMIN"), async (req, res) => {
  try { res.status(201).json(await createTask(req.body)); }
  catch (e) { res.status(e.response?.status || 500).json({ error: e.message, upstream: e.response?.data }); }
});

router.put("/tareas/:id?", authRequired, roleRequired("ADMIN"), async (req, res) => {
  try {
    const payload = { ...req.body, id: req.params?.id ?? req.body?.id };
    res.json(await updateTask(payload));
  } catch (e) {
    res.status(e.response?.status || 500).json({ error: e.message, upstream: e.response?.data });
  }
});

router.delete("/tareas/:id?", authRequired, roleRequired("ADMIN"), async (req, res) => {
  try {
    const id = req.params?.id ?? req.query?.id ?? req.body?.id;
    res.json(await removeTask(id));
  } catch (e) {
    res.status(e.response?.status || 500).json({ error: e.message, upstream: e.response?.data });
  }
});

export default router;
