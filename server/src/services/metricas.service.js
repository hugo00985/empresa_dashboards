import pool from '../db/pool.js';

function getRole(u) {
  return String(u?.rol ?? u?.role ?? '').toUpperCase();
}
function same(a,b){ return String(a) === String(b); }

export const resumenGeneral = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN DATE(fecha)=CURDATE() THEN total END),0) AS ventas_hoy,
        COALESCE(SUM(CASE WHEN YEAR(fecha)=YEAR(CURDATE()) AND MONTH(fecha)=MONTH(CURDATE()) THEN total END),0) AS ventas_mes,
        COALESCE(AVG(total),0) AS ticket_promedio,
        (SELECT COUNT(*) FROM clientes WHERE activo=1) AS clientes_activos
      FROM ventas;
    `);
    const r = rows[0] || {};
    return {
      ventas_hoy: Number(r.ventas_hoy || 0),
      ventas_mes: Number(r.ventas_mes || 0),
      ticket_promedio: Number(r.ticket_promedio || 0),
      clientes_activos: Number(r.clientes_activos || 0),
    };
  } catch (e) {
    if (e?.code === 'ER_NO_SUCH_TABLE') {
      console.warn('⚠️ Tabla "ventas" no existe. Devuelvo KPIs en 0.');
      return { ventas_hoy:0, ventas_mes:0, ticket_promedio:0, clientes_activos:0 };
    }
    throw e;
  }
};

export const ventasPorDia = async ({ from, to, user }) => {
  const filtroRango = `
    WHERE fecha >= COALESCE(?, DATE_SUB(CURDATE(), INTERVAL 13 DAY))
      AND fecha <  DATE_ADD(COALESCE(?, CURDATE()), INTERVAL 1 DAY)
  `;
  // Si es EMPLEADO, filtra por su empleado_id si viene en el token
  const role = getRole(user);
  const empleadoId = user?.empleado_id ?? user?.id ?? null; // fallback si no llevas empleado_id
  const filtroEmpleado = (role === 'EMPLEADO' && empleadoId != null)
    ? ` AND v.empleado_id = ${Number(empleadoId)} `
    : '';

  const sql = `
    SELECT DATE(v.fecha) AS dia, COALESCE(SUM(v.total), 0) AS total
    FROM ventas v
    ${filtroRango} ${filtroEmpleado}
    GROUP BY DATE(v.fecha)
    ORDER BY DATE(v.fecha);
  `;

  try {
    const [rows] = await pool.query(sql, [from || null, to || null]);
    return rows.map(r => ({ dia: r.dia, total: Number(r.total || 0) }));
  } catch (e) {
    if (e?.code === 'ER_NO_SUCH_TABLE') {
      console.warn('⚠️ Tabla "ventas" no existe. Devuelvo serie vacía.');
      return [];
    }
    throw e;
  }
};

export const resumenEmpleado = async ({ empleadoId, requester }) => {
  const role = getRole(requester);
  const requesterEmpleadoId = requester?.empleado_id ?? requester?.id;

  // Admin puede ver cualquiera; empleado solo el suyo
  if (!(role === 'ADMIN' || (role === 'EMPLEADO' && same(requesterEmpleadoId, empleadoId)))) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  try {
    const [rows] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN DATE(fecha)=CURDATE() THEN total END),0) AS ventas_hoy,
        COALESCE(SUM(CASE WHEN YEAR(fecha)=YEAR(CURDATE()) AND MONTH(fecha)=MONTH(CURDATE()) THEN total END),0) AS ventas_mes,
        COALESCE(COUNT(*),0) AS pedidos_atendidos
      FROM ventas
      WHERE empleado_id = ?;
    `, [empleadoId]);

    const r = rows[0] || {};
    return {
      empleado_id: Number(empleadoId),
      ventas_hoy: Number(r.ventas_hoy || 0),
      ventas_mes: Number(r.ventas_mes || 0),
      pedidos_atendidos: Number(r.pedidos_atendidos || 0),
    };
  } catch (e) {
    if (e?.code === 'ER_NO_SUCH_TABLE') {
      console.warn('⚠️ Tabla "ventas" no existe. Devuelvo resumen 0.');
      return { empleado_id:Number(empleadoId), ventas_hoy:0, ventas_mes:0, pedidos_atendidos:0 };
    }
    throw e;
  }
};
