import { Router } from 'express';
import { configController } from '../controllers/config.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// OpenAI API Key
router.get('/openai-status', configController.getOpenAIStatus);
router.post('/openai-key', configController.setOpenAIKey);
router.delete('/openai-key', configController.deleteOpenAIKey);

export default router;
