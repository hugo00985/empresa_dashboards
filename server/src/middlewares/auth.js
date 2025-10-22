import jwt from "jsonwebtoken";

export const authRequired = (req, res, next) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;
  const token = req.cookies?.token || bearer;
  if (!token) return res.status(401).json({ message: "No autenticado" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload: { id, rol, nombre, correo }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// ✅ compara sin sensibilidad a mayúsculas y soporta "rol"/"role"
export const roleRequired = (rolEsperado) => (req, res, next) => {
  const actual = String(req.user?.rol ?? req.user?.role ?? "").toUpperCase();
  const esperado = String(rolEsperado).toUpperCase();
  if (actual !== esperado) return res.status(403).json({ message: "Prohibido" });
  next();
};
