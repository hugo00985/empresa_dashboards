import { Router } from "express";
import { authRequired } from "../middlewares/auth.js";

const router = Router();

router.get("/me", authRequired, (req, res) => {
  res.json({ id: req.user.id, nombre: req.user.nombre, rol: req.user.rol });
});

router.post("/logout", authRequired, (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Sesión cerrada" });
});

export default router;
