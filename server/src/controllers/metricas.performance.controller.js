import { getDesempeno } from '../services/metricas.performance.service.js';

export async function getDesempenoCtrl(req, res) {
  try {
    const { source, desde, hasta, empleado_id } = req.query;
    const data = await getDesempeno({ source, desde, hasta, empleado_id });
    res.json(data);
  } catch (e) {
    console.error('getDesempenoCtrl', e.message);
    res.status(400).json({ message: e.message || 'Error al evaluar desempeño' });
  }
}
