import { getTopProductos } from '../services/metricas.top.service.js';

export async function getTopProductosCtrl(req, res) {
  try {
    const { source, desde, hasta, empleado_id, limit } = req.query;
    const data = await getTopProductos({ source, desde, hasta, empleado_id, limit });
    res.json(data);
  } catch (e) {
    console.error('getTopProductosCtrl', e.message);
    res.status(400).json({ message: e.message || 'Error al obtener top productos' });
  }
}
