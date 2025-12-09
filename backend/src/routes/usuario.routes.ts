import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { UsuarioService } from '../services/usuario.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();
const usuarioService = new UsuarioService();
const usuarioController = new UsuarioController(usuarioService);

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', usuarioController.getAll.bind(usuarioController));
router.get('/:id', usuarioController.getById.bind(usuarioController));
router.post('/', usuarioController.create.bind(usuarioController));
router.put('/:id', usuarioController.update.bind(usuarioController));
router.delete('/:id', usuarioController.delete.bind(usuarioController));

export { router as usuarioRoutes };
