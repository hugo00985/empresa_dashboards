import pool from '../db/pool.js';

const toISO = d => d.toISOString().slice(0,10);

function cfgBySource(sourceRaw) {
  const s = (sourceRaw || 'ventas').toLowerCase();
  if (s !== 'ventas' && s !== 'venta') throw new Error('Fuente inválida');
  if (s === 'ventas') {
    return { table:'ventas', idCol:'id', dateCol:'fecha', totalCol:'total', empleadoCol:'empleado_id' };
  }
  return { table:'venta', idCol:'id_venta', dateCol:'fecha_venta', totalCol:'total_neto', empleadoCol:'id_empleado' };
}

function sendCSV(res, rows, filename) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  if (!rows.length) return res.send('');
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => (r[h] ?? '')).join(','))
  ];
  res.send(lines.join('\n'));
}

async function sendXLSX(res, rows, filename, sheetName='Hoja 1') {
  // Import dinámico para que el server no crashee si falta exceljs
  let ExcelJS;
  try {
    ({ default: ExcelJS } = await import('exceljs'));
  } catch (e) {
    res.status(501).json({
      message: 'Exportación a Excel no disponible: instala "exceljs" (npm i exceljs).'
    });
    return;
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  if (rows.length) {
    ws.columns = Object.keys(rows[0]).map(k => ({ header:k, key:k }));
    rows.forEach(r => ws.addRow(r));
    ws.columns.forEach(c => { c.width = Math.min(Math.max(12, String(c.header).length + 2), 28); });
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

/* ---------- Ventas por día ---------- */
export async function exportVentasPorDiaCSV(req, res) {
  try {
    const { source, desde, hasta, empleado_id } = req.query;
    const { table, dateCol, totalCol, empleadoCol } = cfgBySource(source);
    const hoy = new Date(), inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const _desde = desde || toISO(inicioMes), _hasta = hasta || toISO(hoy);

    const where = [`DATE(${dateCol}) BETWEEN ? AND ?`];
    const params = [_desde, _hasta];
    if (empleado_id) { where.push(`${empleadoCol} = ?`); params.push(Number(empleado_id)); }

    const [rows] = await pool.query(
      `SELECT DATE(${dateCol}) AS dia, COALESCE(SUM(${totalCol}),0) AS total
       FROM ${table}
       WHERE ${where.join(' AND ')}
       GROUP BY DATE(${dateCol})
       ORDER BY DATE(${dateCol}) ASC`, params);

    sendCSV(res, rows, `ventas_por_dia_${table}_${_desde}_a_${_hasta}.csv`);
  } catch (e) {
    console.error('exportVentasPorDiaCSV', e);
    res.status(500).json({ message: 'Error al exportar CSV' });
  }
}

export async function exportVentasPorDiaXLSX(req, res) {
  try {
    const { source, desde, hasta, empleado_id } = req.query;
    const { table, dateCol, totalCol, empleadoCol } = cfgBySource(source);
    const hoy = new Date(), inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const _desde = desde || toISO(inicioMes), _hasta = hasta || toISO(hoy);

    const where = [`DATE(${dateCol}) BETWEEN ? AND ?`];
    const params = [_desde, _hasta];
    if (empleado_id) { where.push(`${empleadoCol} = ?`); params.push(Number(empleado_id)); }

    const [rows] = await pool.query(
      `SELECT DATE(${dateCol}) AS dia, COALESCE(SUM(${totalCol}),0) AS total
       FROM ${table}
       WHERE ${where.join(' AND ')}
       GROUP BY DATE(${dateCol})
       ORDER BY DATE(${dateCol}) ASC`, params);

    await sendXLSX(res, rows, `ventas_por_dia_${table}_${_desde}_a_${_hasta}.xlsx`, 'Ventas por día');
  } catch (e) {
    console.error('exportVentasPorDiaXLSX', e);
    res.status(500).json({ message: 'Error al exportar XLSX' });
  }
}

/* ---------- Top productos ---------- */
export async function exportTopProductosCSV(req, res) {
  try {
    const { source, desde, hasta, empleado_id, limit = 5 } = req.query;
    const s = (source || 'ventas').toLowerCase();
    const head = s === 'ventas'
      ? { table:'ventas', idCol:'id', dateCol:'fecha', empleadoCol:'empleado_id' }
      : { table:'venta',  idCol:'id_venta', dateCol:'fecha_venta', empleadoCol:'id_empleado' };
    const detail = { table:'venta_detalle', headIdCol:'id_venta', qtyCol:'cantidad', prodIdCol:'id_producto' };

    const hoy = new Date(), inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const _desde = desde || toISO(inicioMes), _hasta = hasta || toISO(hoy);

    const where = [`DATE(h.${head.dateCol}) BETWEEN ? AND ?`];
    const params = [_desde, _hasta];
    if (empleado_id) { where.push(`h.${head.empleadoCol} = ?`); params.push(Number(empleado_id)); }

    const [rows] = await pool.query(
      `SELECT p.nombre AS producto, COALESCE(SUM(d.${detail.qtyCol}),0) AS cantidad
       FROM ${detail.table} d
       JOIN ${head.table} h ON h.${head.idCol} = d.${detail.headIdCol}
       JOIN producto p ON p.id_producto = d.${detail.prodIdCol}
       WHERE ${where.join(' AND ')}
       GROUP BY p.id_producto, p.nombre
       ORDER BY cantidad DESC
       LIMIT ${Number(limit)}`, params);

    sendCSV(res, rows, `top_productos_${head.table}_${_desde}_a_${_hasta}.csv`);
  } catch (e) {
    console.error('exportTopProductosCSV', e);
    res.status(500).json({ message: 'Error al exportar CSV' });
  }
}

export async function exportTopProductosXLSX(req, res) {
  try {
    const { source, desde, hasta, empleado_id, limit = 5 } = req.query;
    const s = (source || 'ventas').toLowerCase();
    const head = s === 'ventas'
      ? { table:'ventas', idCol:'id', dateCol:'fecha', empleadoCol:'empleado_id' }
      : { table:'venta',  idCol:'id_venta', dateCol:'fecha_venta', empleadoCol:'id_empleado' };
    const detail = { table:'venta_detalle', headIdCol:'id_venta', qtyCol:'cantidad', prodIdCol:'id_producto' };

    const hoy = new Date(), inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const _desde = desde || toISO(inicioMes), _hasta = hasta || toISO(hoy);

    const where = [`DATE(h.${head.dateCol}) BETWEEN ? AND ?`];
    const params = [_desde, _hasta];
    if (empleado_id) { where.push(`h.${head.empleadoCol} = ?`); params.push(Number(empleado_id)); }

    const [rows] = await pool.query(
      `SELECT p.nombre AS producto, COALESCE(SUM(d.${detail.qtyCol}),0) AS cantidad
       FROM ${detail.table} d
       JOIN ${head.table} h ON h.${head.idCol} = d.${detail.headIdCol}
       JOIN producto p ON p.id_producto = d.${detail.prodIdCol}
       WHERE ${where.join(' AND ')}
       GROUP BY p.id_producto, p.nombre
       ORDER BY cantidad DESC
       LIMIT ${Number(limit)}`, params);

    await sendXLSX(res, rows, `top_productos_${head.table}_${_desde}_a_${_hasta}.xlsx`, 'Top productos');
  } catch (e) {
    console.error('exportTopProductosXLSX', e);
    res.status(500).json({ message: 'Error al exportar XLSX' });
  }
}
