import { PrismaClient, Tenant, Usuario } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from '../middleware/error.middleware';

interface RegisterTenantDTO {
  // Datos del tenant
  tenantNombre: string;
  tenantSlug: string;
  
  // Datos del usuario admin
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}

interface LoginDTO {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
  };
  tenant: {
    id: string;
    nombre: string;
    slug: string;
  };
  token: string;
  refreshToken: string;
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async registerTenant(data: RegisterTenantDTO): Promise<AuthResponse> {
    // Verificar que el slug no exista
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: data.tenantSlug },
    });

    if (existingTenant) {
      throw new AppError('El slug del tenant ya existe', 400);
    }

    // Verificar que el email no exista
    const existingUser = await this.prisma.usuario.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crear tenant y usuario en una transacción
    const result = await this.prisma.$transaction(async (tx) => {
      // Crear tenant
      const tenant = await tx.tenant.create({
        data: {
          nombre: data.tenantNombre,
          slug: data.tenantSlug,
          plan: 'free',
          activo: true,
        },
      });

      // Crear usuario admin
      const usuario = await tx.usuario.create({
        data: {
          tenantId: tenant.id,
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          password: hashedPassword,
          rol: 'ADMIN',
          activo: true,
        },
      });

      return { tenant, usuario };
    });

    // Generar tokens
    const token = this.generateToken(result.usuario, result.tenant);
    const refreshToken = await this.generateRefreshToken(result.usuario.id);

    return {
      user: {
        id: result.usuario.id,
        nombre: result.usuario.nombre,
        apellido: result.usuario.apellido,
        email: result.usuario.email,
        rol: result.usuario.rol,
      },
      tenant: {
        id: result.tenant.id,
        nombre: result.tenant.nombre,
        slug: result.tenant.slug,
      },
      token,
      refreshToken,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    // Buscar usuario por email
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        email: data.email,
        activo: true,
      },
      include: {
        tenant: true,
      },
    });

    if (!usuario) {
      throw new AppError('Email o contraseña incorrectos', 401);
    }

    // Verificar que el tenant esté activo
    if (!usuario.tenant.activo) {
      throw new AppError('Tu cuenta está inactiva. Contacta al administrador.', 403);
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(data.password, usuario.password);
    if (!isPasswordValid) {
      throw new AppError('Email o contraseña incorrectos', 401);
    }

    // Generar tokens
    const token = this.generateToken(usuario, usuario.tenant);
    const refreshToken = await this.generateRefreshToken(usuario.id);

    return {
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
      },
      tenant: {
        id: usuario.tenant.id,
        nombre: usuario.tenant.nombre,
        slug: usuario.tenant.slug,
      },
      token,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    // Buscar refresh token
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new AppError('Refresh token inválido', 401);
    }

    // Verificar si expiró
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      throw new AppError('Refresh token expirado', 401);
    }

    // Verificar que el usuario esté activo
    if (!tokenRecord.user.activo || !tokenRecord.user.tenant.activo) {
      throw new AppError('Usuario o tenant inactivo', 403);
    }

    // Eliminar el refresh token usado
    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    // Generar nuevos tokens
    const newToken = this.generateToken(tokenRecord.user, tokenRecord.user.tenant);
    const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id);

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { email, activo: true },
    });

    if (!usuario) {
      // No revelar si el email existe o no por seguridad
      return;
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Enviar email con el token
    // Por ahora solo guardamos el token en la BD
    console.log(`Reset token para ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!usuario) {
      throw new AppError('Token inválido o expirado', 400);
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña y limpiar token
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Eliminar todos los refresh tokens del usuario
    await this.prisma.refreshToken.deleteMany({
      where: { userId: usuario.id },
    });
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Eliminar el refresh token específico
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Eliminar todos los refresh tokens del usuario
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  private generateToken(usuario: Usuario, tenant: Tenant): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('JWT_SECRET no configurado', 500);
    }

    const payload = {
      userId: usuario.id,
      tenantId: tenant.id,
      email: usuario.email,
      rol: usuario.rol,
    };

    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
  }
}
