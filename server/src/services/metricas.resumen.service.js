import pool from '../db/pool.js';

// Normaliza rango
const toISO = (d) => d.toISOString().slice(0, 10);

function getConfigBySource(sourceRaw) {
  const source = (sourceRaw || 'ventas').toLowerCase();
  // Whitelist de fuentes válidas
  if (source !== 'ventas' && source !== 'venta') return { error: 'Fuente inválida' };

  // Mapeo de columnas por tabla
  if (source === 'ventas') {
    // Tabla moderna: ventas(id, fecha, total, empleado_id, cliente_id)
    return {
      table: 'ventas',
      dateCol: 'fecha',
      totalCol: 'total',
      empleadoCol: 'empleado_id',
    };
  }
  // Tabla legacy: venta(id_venta, fecha_venta, total_neto, id_empleado)
  return {
    table: 'venta',
    dateCol: 'fecha_venta',
    totalCol: 'total_neto',
    empleadoCol: 'id_empleado',
  };
}

export async function getResumen({ source, desde, hasta, empleado_id }) {
  const cfg = getConfigBySource(source);
  if (cfg.error) throw new Error(cfg.error);

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const _desde = desde || toISO(inicioMes);
  const _hasta = hasta || toISO(hoy);

  // Construimos WHERE de forma segura
  const wh = [`DATE(${cfg.dateCol}) BETWEEN ? AND ?`];
  const params = [_desde, _hasta];

  if (empleado_id) {
    wh.push(`${cfg.empleadoCol} = ?`);
    params.push(Number(empleado_id));
  }

  // KPIs básicos
  const sql = `
    SELECT 
      COUNT(*)            AS num_ventas,
      COALESCE(SUM(${cfg.totalCol}),0) AS monto_total
    FROM ${cfg.table}
    WHERE ${wh.join(' AND ')}
  `;

  const [rows] = await pool.query(sql, params);
  const numVentas = Number(rows?.[0]?.num_ventas || 0);
  const montoTotal = Number(rows?.[0]?.monto_total || 0);
  const ticketProm = numVentas > 0 ? montoTotal / numVentas : 0;

  return {
    source: cfg.table,
    rango: { desde: _desde, hasta: _hasta },
    kpis: {
      numVentas,
      montoTotal: Number(montoTotal.toFixed(2)),
      ticketPromedio: Number(ticketProm.toFixed(2)),
    },
  };
}
