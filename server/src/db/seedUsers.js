import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { pool } from "./pool.js";

dotenv.config();

async function seed() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const empleadoPass = await bcrypt.hash("empleado123", 10);

  // Asegura los dos usuarios (upsert por correo)
  const sql = `
    INSERT INTO usuarios (nombre, correo, password, rol)
    VALUES 
      (?, ?, ?, 'ADMIN'),
      (?, ?, ?, 'EMPLEADO')
    ON DUPLICATE KEY UPDATE 
      password = VALUES(password),
      rol = VALUES(rol),
      nombre = VALUES(nombre);
  `;

  await pool.query(sql, [
    "Administrador General", "admin@empresa.com", adminPass,
    "Empleado Demo", "empleado@empresa.com", empleadoPass
  ]);

  console.log("Usuarios sembrados/actualizados correctamente.");
  process.exit(0);
}

seed().catch(err => {
  console.error("Error al sembrar usuarios:", err);
  process.exit(1);
});
