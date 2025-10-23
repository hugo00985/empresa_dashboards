import { Router } from "express";
import pool from "../db/pool.js";
import { authRequired } from "../middlewares/auth.js";

const router = Router();
router.use(authRequired);

router.get("/ventas-vs-stock", async (req, res) => {
  try {
    const anio = Number(req.query.anio) || new Date().getFullYear();
    const [ventasMensuales] = await pool.query(`
      SELECT DATE_FORMAT(v.fecha, '%Y-%m') AS mes,
             SUM(d.cantidad * d.precio_unitario) AS ventas
      FROM venta v
      JOIN venta_detalle d ON d.id_venta = v.id_venta
      WHERE YEAR(v.fecha) = ?
      GROUP BY 1 ORDER BY 1
    `, [anio]);

    const [[{ stock_valorizado }]] = await pool.query(`
      SELECT SUM(stock_actual * precio_unitario) AS stock_valorizado FROM producto
    `);

    res.json({ anio, ventasMensuales, stock_valorizado });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error en comparativa ventas vs stock" });
  }
});

export default router;
