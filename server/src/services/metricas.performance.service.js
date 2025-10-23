import pool from '../db/pool.js';

const toISO = d => d.toISOString().slice(0,10);

function cfgBySource(sourceRaw) {
  const s = (sourceRaw || 'ventas').toLowerCase();
  if (s !== 'ventas' && s !== 'venta') throw new Error('Fuente inválida');
  if (s === 'ventas') {
    return { table:'ventas', dateCol:'fecha', totalCol:'total', empleadoCol:'empleado_id' };
  }
  return { table:'venta', dateCol:'fecha_venta', totalCol:'total_neto', empleadoCol:'id_empleado' };
}

// Umbrales (puedes ajustarlos): >=120% del promedio => Alto; <=80% => Bajo
const HI = 1.20;
const LO = 0.80;

export async function getDesempeno({ source, desde, hasta, empleado_id }) {
  const { table, dateCol, totalCol, empleadoCol } = cfgBySource(source);

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const _desde = desde || toISO(inicioMes);
  const _hasta = hasta || toISO(hoy);

  // Suma por empleado en el rango
  const [rows] = await pool.query(
    `SELECT ${empleadoCol} AS empleado_id, COALESCE(SUM(${totalCol}),0) AS monto
     FROM ${table}
     WHERE DATE(${dateCol}) BETWEEN ? AND ?
     GROUP BY ${empleadoCol}`,
    [_desde, _hasta]
  );

  // Si no hay datos, devolver neutro
  if (!rows.length) {
    return {
      rango: { desde:_desde, hasta:_hasta },
      comparacion: 'sin_datos',
      promedioPares: 0,
      montoEvaluado: 0,
      ratio: 0,
      clasificacion: 'Medio'
    };
  }

  // Si viene empleado_id: evaluar contra el promedio de pares (excluyéndolo del promedio si hay otros)
  if (empleado_id) {
    const montoEvaluado = Number(rows.find(r => String(r.empleado_id) === String(empleado_id))?.monto || 0);
    const pares = rows.filter(r => String(r.empleado_id) !== String(empleado_id));
    const promedioPares = pares.length ? (pares.reduce((a,b)=>a+Number(b.monto||0),0) / pares.length) : 0;

    const ratio = promedioPares > 0 ? (montoEvaluado / promedioPares) : (montoEvaluado > 0 ? 1.0 : 0);
    let clasificacion = 'Medio';
    if (ratio >= HI) clasificacion = 'Alto';
    else if (ratio <= LO) clasificacion = 'Bajo';

    return {
      rango: { desde:_desde, hasta:_hasta },
      comparacion: 'vs_pares',
      promedioPares: Number(promedioPares.toFixed(2)),
      montoEvaluado: Number(montoEvaluado.toFixed(2)),
      ratio: Number(ratio.toFixed(2)),
      clasificacion
    };
  }

  // Si NO viene empleado_id: devolver líderes y rezagados (útil en Admin sin empleado seleccionado)
  const totalPorEmp = rows.map(r => ({ empleado_id: r.empleado_id, monto: Number(r.monto||0) }));
  const promedioTodos = totalPorEmp.reduce((a,b)=>a+b.monto,0) / totalPorEmp.length;
  const top = [...totalPorEmp].sort((a,b)=>b.monto-a.monto).slice(0,3);
  const bottom = [...totalPorEmp].sort((a,b)=>a.monto-b.monto).slice(0,3);

  return {
    rango: { desde:_desde, hasta:_hasta },
    comparacion: 'panorama',
    promedioTodos: Number(promedioTodos.toFixed(2)),
    top,       // [{empleado_id, monto}]
    bottom     // [{empleado_id, monto}]
  };
}
