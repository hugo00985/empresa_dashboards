import * as svc from '../services/metricas.service.js';

// GET /api/metricas/resumen-general
export const getResumenGeneral = async (req, res) => {
  try {
    const data = await svc.resumenGeneral();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error obteniendo resumen general' });
  }
};

// GET /api/metricas/ventas-por-dia?from=YYYY-MM-DD&to=YYYY-MM-DD
export const getVentasPorDia = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await svc.ventasPorDia({ from, to, user: req.user });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error obteniendo ventas por día' });
  }
};

// GET /api/metricas/empleado/:id/resumen
export const getResumenEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await svc.resumenEmpleado({ empleadoId: Number(id), requester: req.user });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error obteniendo resumen del empleado' });
  }
};
