import pool from '../db/pool.js';

const toISO = (d) => d.toISOString().slice(0, 10);

function cfgBySource(sourceRaw) {
  const s = (sourceRaw || 'ventas').toLowerCase();
  if (s !== 'ventas' && s !== 'venta') throw new Error('Fuente inválida');
  // Encabezado (tabla de ventas) y columnas
  if (s === 'ventas') {
    return {
      head: { table: 'ventas', idCol: 'id', dateCol: 'fecha', empleadoCol: 'empleado_id' },
      detail: { table: 'venta_detalle', headIdCol: 'id_venta', prodIdCol: 'id_producto', qtyCol: 'cantidad' },
    };
  }
  // Legacy
  return {
    head: { table: 'venta', idCol: 'id_venta', dateCol: 'fecha_venta', empleadoCol: 'id_empleado' },
    detail: { table: 'venta_detalle', headIdCol: 'id_venta', prodIdCol: 'id_producto', qtyCol: 'cantidad' },
  };
}

export async function getTopProductos({ source, desde, hasta, empleado_id, limit = 5 }) {
  const { head, detail } = cfgBySource(source);
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const _desde = desde || toISO(inicioMes);
  const _hasta = hasta || toISO(hoy);

  const where = [`DATE(h.${head.dateCol}) BETWEEN ? AND ?`];
  const params = [_desde, _hasta];

  if (empleado_id) { where.push(`h.${head.empleadoCol} = ?`); params.push(Number(empleado_id)); }

  // Nota: si no hay detalles para la fuente elegida (p. ej. 'ventas' sin detalle),
  // esta consulta devolverá vacío — lo manejamos en el front.
  const sql = `
    SELECT p.nombre AS producto, COALESCE(SUM(d.${detail.qtyCol}), 0) AS cantidad
    FROM ${detail.table} d
    JOIN ${head.table} h ON h.${head.idCol} = d.${detail.headIdCol}
    JOIN producto p ON p.id_producto = d.${detail.prodIdCol}
    WHERE ${where.join(' AND ')}
    GROUP BY p.id_producto, p.nombre
    ORDER BY cantidad DESC
    LIMIT ${Number(limit)}
  `;

  const [rows] = await pool.query(sql, params);
  return {
    source: head.table,
    rango: { desde: _desde, hasta: _hasta },
    items: rows.map(r => ({ producto: r.producto, cantidad: Number(r.cantidad) })),
  };
}
