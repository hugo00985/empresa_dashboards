import pool from '../db/pool.js';

const toISO = (d) => d.toISOString().slice(0, 10);

function cfgBySource(sourceRaw) {
  const s = (sourceRaw || 'ventas').toLowerCase();
  if (s !== 'ventas' && s !== 'venta') throw new Error('Fuente inválida');
  if (s === 'ventas') {
    return { table: 'ventas', dateCol: 'fecha', totalCol: 'total', empleadoCol: 'empleado_id' };
  }
  return { table: 'venta', dateCol: 'fecha_venta', totalCol: 'total_neto', empleadoCol: 'id_empleado' };
}

export async function getSerieVentasPorDia({ source, desde, hasta, empleado_id }) {
  const { table, dateCol, totalCol, empleadoCol } = cfgBySource(source);

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const _desde = desde || toISO(inicioMes);
  const _hasta = hasta || toISO(hoy);

  const where = [`DATE(${dateCol}) BETWEEN ? AND ?`];
  const params = [_desde, _hasta];

  if (empleado_id) { where.push(`${empleadoCol} = ?`); params.push(Number(empleado_id)); }

  const sql = `
    SELECT DATE(${dateCol}) AS dia, COALESCE(SUM(${totalCol}),0) AS total
    FROM ${table}
    WHERE ${where.join(' AND ')}
    GROUP BY DATE(${dateCol})
    ORDER BY DATE(${dateCol}) ASC
  `;

  const [rows] = await pool.query(sql, params);
  return {
    source: table,
    rango: { desde: _desde, hasta: _hasta },
    series: {
      labels: rows.map(r => r.dia),
      data: rows.map(r => Number(r.total))
    }
  };
}
