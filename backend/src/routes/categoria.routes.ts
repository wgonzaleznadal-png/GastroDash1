import { Router } from 'express';
import { CategoriaController } from '../controllers/categoria.controller';
import { CategoriaService } from '../services/categoria.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();
const categoriaService = new CategoriaService();
const categoriaController = new CategoriaController(categoriaService);

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', categoriaController.getAll.bind(categoriaController));
router.post('/', categoriaController.create.bind(categoriaController));
router.put('/:id', categoriaController.update.bind(categoriaController));
router.delete('/:id', categoriaController.delete.bind(categoriaController));

export { router as categoriaRoutes };
