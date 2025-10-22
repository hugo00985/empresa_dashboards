import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db/pool.js"; // 🔹 usamos export default, no { pool }
import authRoutes from "./routes/authRoutes.js";
import { authRequired, roleRequired } from "./middlewares/auth.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import metricasRoutes from "./routes/metricas.js";
import empleadosRoutes from './routes/empleados.js';
import externalTasksRoutes from "./routes/externalTasks.js";


dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/metricas", metricasRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use("/api/external", externalTasksRoutes);

// Healthcheck y prueba de BD
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ ok: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 🔹 Servir frontend estático (client/)
app.use(express.static(path.join(__dirname, "../../client")));

// 🔹 Rutas protegidas (ya no apuntan a archivos raíz, sino dentro de carpetas)
app.get("/admin/dashboard.html", authRequired, roleRequired("Admin"), (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/admin/dashboard.html"));
});

app.get("/empleado/dashboard.html", authRequired, roleRequired("Empleado"), (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/empleado/dashboard.html"));
});

// 🔹 Arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server listo en http://localhost:${PORT}`);
});
