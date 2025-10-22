import { Router } from 'express';
import { authRequired, roleRequired } from '../middlewares/auth.js';

import { getVentasPorDiaCtrl } from '../controllers/metricas.series.controller.js';
import { getResumenCtrl } from '../controllers/metricas.resumen.controller.js';
import * as ctrl from '../controllers/metricas.controller.js';
import { getTopProductosCtrl } from '../controllers/metricas.top.controller.js';

// NUEVO: exportaciones
import {
  exportVentasPorDiaCSV,
  exportVentasPorDiaXLSX,
  exportTopProductosCSV,
  exportTopProductosXLSX
} from '../controllers/export.controller.js';

const router = Router();

// Tus rutas existentes (se mantienen)
router.get('/resumen-general', authRequired, roleRequired('ADMIN'), ctrl.getResumenGeneral);
router.get('/ventas-por-dia', authRequired, getVentasPorDiaCtrl);
router.get('/empleado/:id/resumen', authRequired, ctrl.getResumenEmpleado);
router.get('/resumen', authRequired, getResumenCtrl);
router.get('/top-productos', authRequired, getTopProductosCtrl);

// NUEVO: rutas de export sin romper lo anterior
router.get('/ventas-por-dia.csv', authRequired, exportVentasPorDiaCSV);
router.get('/ventas-por-dia.xlsx', authRequired, exportVentasPorDiaXLSX);
router.get('/top-productos.csv', authRequired, exportTopProductosCSV);
router.get('/top-productos.xlsx', authRequired, exportTopProductosXLSX);

export default router;
