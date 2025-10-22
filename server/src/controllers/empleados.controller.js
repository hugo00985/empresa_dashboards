import pool from '../db/pool.js';

export async function listEmpleadosOptions(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id_empleado AS id, nombre 
       FROM empleado
       WHERE activo = 1
       ORDER BY nombre ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error('listEmpleadosOptions', e);
    res.status(500).json({ message: 'Error al listar empleados' });
  }
}

// NUEVO: devuelve el empleado asociado al usuario logueado
export async function meEmpleado(req, res) {
  try {
    // el middleware de auth coloca el usuario en req.user
    const user = req.user || {};
    const userId = user.id_usuario || user.id; // soporta ambos nombres

    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    const [rows] = await pool.query(
      `SELECT e.id_empleado, e.nombre, e.email, e.id_usuario
       FROM empleado e
       WHERE e.id_usuario = ? LIMIT 1`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Empleado no vinculado' });
    res.json(rows[0]);
  } catch (e) {
    console.error('meEmpleado', e);
    res.status(500).json({ message: 'Error al obtener el empleado actual' });
  }
}
