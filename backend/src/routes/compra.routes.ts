import { Router } from 'express';
import { CompraController } from '../controllers/compra.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();
const compraController = new CompraController();

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

router.post('/', compraController.create.bind(compraController));
router.get('/', compraController.getAll.bind(compraController));
router.get('/estadisticas', compraController.getEstadisticas.bind(compraController));
router.get('/:id', compraController.getById.bind(compraController));
router.patch('/:id', compraController.update.bind(compraController));
router.post('/:id/recibir', compraController.receive.bind(compraController));
router.post('/:id/cancelar', compraController.cancel.bind(compraController));

export default router;
