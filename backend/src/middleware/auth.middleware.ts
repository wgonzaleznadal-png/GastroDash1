import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  rol: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token no proporcionado', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError('JWT_SECRET no configurado', 500);
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    (req as AuthRequest).user = decoded;
    
    // Asignar tenantId y userId al request para fácil acceso
    (req as any).tenantId = decoded.tenantId;
    (req as any).userId = decoded.userId;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Token inválido', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expirado', 401));
    }
    next(error);
  }
}
