import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from './error.middleware';
import { AuthRequest } from './auth.middleware';

const prisma = new PrismaClient();

export interface TenantRequest extends AuthRequest {
  tenantId: string;
  tenant?: any;
}

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthRequest;
    
    if (!authReq.user) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const tenantId = authReq.user.tenantId;

    if (!tenantId) {
      throw new AppError('Tenant no identificado', 401);
    }

    // Verificar que el tenant existe y está activo
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new AppError('Tenant no encontrado', 404);
    }

    if (!tenant.activo) {
      throw new AppError('Tenant inactivo', 403);
    }

    // Inyectar tenantId en el request
    (req as TenantRequest).tenantId = tenantId;
    (req as TenantRequest).tenant = tenant;

    next();
  } catch (error) {
    next(error);
  }
}
