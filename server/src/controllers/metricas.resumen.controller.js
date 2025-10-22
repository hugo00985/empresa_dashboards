import { getResumen } from '../services/metricas.resumen.service.js';

export async function getResumenCtrl(req, res) {
  try {
    const { source, desde, hasta, empleado_id } = req.query;
    const data = await getResumen({ source, desde, hasta, empleado_id });
    res.json(data);
  } catch (err) {
    console.error('getResumenCtrl', err.message);
    res.status(400).json({ message: err.message || 'Error al obtener resumen' });
  }
}
