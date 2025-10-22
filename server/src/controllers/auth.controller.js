// server/src/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { pool } from "../db/pool.js";

dotenv.config();

export const login = async (req, res) => {
  try {
    const { correo, password } = req.body || {};
    if (!correo || !password) {
      return res.status(400).json({ ok: false, message: "Faltan credenciales" });
    }

    const [rows] = await pool.query(
      "SELECT id, nombre, correo, password, rol FROM usuarios WHERE correo = ? LIMIT 1",
      [correo.toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ ok: false, message: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ ok: false, message: "Credenciales inválidas" });

    // ▶️ Generar JWT y dejarlo en cookie (lo que espera tu middleware)
    const token = jwt.sign(
      { id: user.id, rol: user.rol, nombre: user.nombre, correo: user.correo },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,          // ponlo true si usas HTTPS
      maxAge: 1000 * 60 * 60 * 8,
    });

    // ▶️ Respuesta CONSISTENTE para el front
    return res.json({
      ok: true,
      user: {
        id: user.id,
        correo: user.correo,
        nombre: user.nombre,
        rol: user.rol,       // "ADMIN" | "EMPLEADO"
      },
      token,                 // opcional: lo dejamos por compatibilidad
      message: "Login exitoso",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};
