import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();
const authService = new AuthService(prisma);
const authController = new AuthController(authService);

// Rutas públicas
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/refresh-token', (req, res, next) => authController.refreshToken(req, res, next));
router.post('/request-password-reset', (req, res, next) => authController.requestPasswordReset(req, res, next));
router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res, next));

// Rutas protegidas
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));

export { router as authRoutes };
