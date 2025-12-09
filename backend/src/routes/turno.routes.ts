import { Router } from 'express';
import { TurnoController } from '../controllers/turno.controller';
import { TurnoService } from '../services/turno.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();
const turnoService = new TurnoService();
const turnoController = new TurnoController(turnoService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// Rutas de turnos
router.post('/abrir', turnoController.abrirTurno.bind(turnoController));
router.get('/activo', turnoController.getTurnoActivo.bind(turnoController));
router.post('/:id/cerrar', turnoController.cerrarTurno.bind(turnoController));
router.get('/:id/estadisticas', turnoController.getEstadisticas.bind(turnoController));
router.get('/:id', turnoController.getById.bind(turnoController));
router.get('/', turnoController.getAll.bind(turnoController));

export { router as turnoRoutes };
