import { Router } from "express";
import pool from "../db/pool.js";
import { authRequired } from "../middlewares/auth.js";

const router = Router();
router.use(authRequired);

router.get("/lista", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id_producto, nombre, stock_actual, stock_minimo,
             precio_unitario, (stock_actual * precio_unitario) AS valor
      FROM producto
      ORDER BY nombre
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar inventario" });
  }
});

router.get("/resumen", async (req, res) => {
  try {
    const [[{ valor_inventario }]] = await pool.query(`
      SELECT SUM(stock_actual * precio_unitario) AS valor_inventario FROM producto
    `);
    const [[{ bajo_stock }]] = await pool.query(`
      SELECT COUNT(*) AS bajo_stock FROM producto WHERE stock_actual <= stock_minimo
    `);
    const [topCriticos] = await pool.query(`
      SELECT id_producto, nombre, stock_actual, stock_minimo, precio_unitario
      FROM producto
      ORDER BY (stock_actual <= stock_minimo) DESC, (stock_actual/NULLIF(stock_minimo,0)) ASC
      LIMIT 5
    `);
    res.json({ valor_inventario, bajo_stock, topCriticos });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener resumen de inventario" });
  }
});

export default router;
