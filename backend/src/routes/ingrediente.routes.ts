import { Router } from 'express';
import { IngredienteController } from '../controllers/ingrediente.controller';
import { IngredienteService } from '../services/ingrediente.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();
const ingredienteService = new IngredienteService();
const ingredienteController = new IngredienteController(ingredienteService);

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', ingredienteController.getAll.bind(ingredienteController));
router.get('/bajo-stock', ingredienteController.getBajoStock.bind(ingredienteController));
router.get('/:id', ingredienteController.getById.bind(ingredienteController));
router.post('/', ingredienteController.create.bind(ingredienteController));
router.put('/:id', ingredienteController.update.bind(ingredienteController));
router.patch('/:id/stock', ingredienteController.updateStock.bind(ingredienteController));
router.delete('/:id', ingredienteController.delete.bind(ingredienteController));

export { router as ingredienteRoutes };
