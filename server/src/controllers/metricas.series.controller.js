import { getSerieVentasPorDia } from '../services/metricas.series.service.js';

export async function getVentasPorDiaCtrl(req, res) {
  try {
    const { source, desde, hasta, empleado_id } = req.query;
    const data = await getSerieVentasPorDia({ source, desde, hasta, empleado_id });
    res.json(data);
  } catch (e) {
    console.error('getVentasPorDiaCtrl', e.message);
    res.status(400).json({ message: e.message || 'Error al obtener ventas por día' });
  }
}
