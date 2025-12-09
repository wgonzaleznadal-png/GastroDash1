import { Router } from 'express';
import { CocinaController } from '../controllers/cocina.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();
const cocinaController = new CocinaController();

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// Órdenes de Cocina
router.post('/', cocinaController.create.bind(cocinaController));
router.get('/', cocinaController.getAll.bind(cocinaController));
router.get('/estadisticas', cocinaController.getEstadisticas.bind(cocinaController));
router.get('/:id', cocinaController.getById.bind(cocinaController));
router.patch('/:id/estado', cocinaController.updateEstado.bind(cocinaController));
router.patch('/:id/prioridad', cocinaController.updatePrioridad.bind(cocinaController));
router.patch('/:id/impreso', cocinaController.marcarImpreso.bind(cocinaController));
router.patch('/:id/notificado', cocinaController.marcarNotificado.bind(cocinaController));

// Estaciones de Cocina
router.post('/estaciones', cocinaController.createEstacion.bind(cocinaController));
router.get('/estaciones/list', cocinaController.getEstaciones.bind(cocinaController));
router.patch('/estaciones/:id', cocinaController.updateEstacion.bind(cocinaController));
router.delete('/estaciones/:id', cocinaController.deleteEstacion.bind(cocinaController));

export default router;
