import { Router } from 'express';
import { MesaController } from '../controllers/mesa.controller';
import { MesaService } from '../services/mesa.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const mesaService = new MesaService();
const mesaController = new MesaController(mesaService);

router.use(authMiddleware);

router.get('/', (req, res, next) => mesaController.getAll(req, res, next));
router.get('/:id', (req, res, next) => mesaController.getById(req, res, next));
router.post('/', (req, res, next) => mesaController.create(req, res, next));
router.put('/:id', (req, res, next) => mesaController.update(req, res, next));
router.delete('/:id', (req, res, next) => mesaController.delete(req, res, next));

export { router as mesaRoutes };
