import { Router } from 'express';
import { authRequired } from '../middlewares/auth.js';
import { listEmpleadosOptions, meEmpleado } from '../controllers/empleados.controller.js';

const router = Router();
router.get('/options', authRequired, listEmpleadosOptions);
router.get('/me', authRequired, meEmpleado);     // <- NUEVO
export default router;