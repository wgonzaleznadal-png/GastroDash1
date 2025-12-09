import { PrismaClient, Usuario } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BaseRepository } from '../repositories/base.repository';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface CreateUsuarioDTO {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: string;
  activo?: boolean;
}

interface UpdateUsuarioDTO {
  email?: string;
  password?: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
  activo?: boolean;
}

export class UsuarioService extends BaseRepository<Usuario> {
  constructor() {
    super(prisma, 'usuario');
  }

  async createUsuario(tenantId: string, data: CreateUsuarioDTO): Promise<Omit<Usuario, 'password'>> {
    const existingUsuario = await prisma.usuario.findFirst({
      where: {
        tenantId,
        email: data.email,
      },
    });

    if (existingUsuario) {
      throw new AppError('Ya existe un usuario con ese email', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const usuario = await this.create(tenantId, {
      ...data,
      password: hashedPassword,
      activo: data.activo ?? true,
    });

    const { password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
  }

  async getUsuarios(tenantId: string, activo?: boolean) {
    const where: any = { tenantId };
    
    if (activo !== undefined) {
      where.activo = activo;
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        tenantId: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return usuarios;
  }

  async getUsuarioById(tenantId: string, id: string) {
    const usuario = await prisma.usuario.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        tenantId: true,
      },
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return usuario;
  }

  async updateUsuario(tenantId: string, id: string, data: UpdateUsuarioDTO): Promise<Omit<Usuario, 'password'>> {
    if (data.email) {
      const existingUsuario = await prisma.usuario.findFirst({
        where: {
          tenantId,
          email: data.email,
          id: { not: id },
        },
      });

      if (existingUsuario) {
        throw new AppError('Ya existe un usuario con ese email', 400);
      }
    }

    const updateData: any = { ...data };
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const usuario = await this.update(tenantId, id, updateData);
    const { password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
  }

  async deleteUsuario(tenantId: string, id: string): Promise<void> {
    // No permitir eliminar si es el único admin
    const usuario = await this.getUsuarioById(tenantId, id);
    
    if (usuario.rol === 'ADMIN') {
      const adminCount = await prisma.usuario.count({
        where: {
          tenantId,
          rol: 'ADMIN',
          activo: true,
        },
      });

      if (adminCount <= 1) {
        throw new AppError('No se puede eliminar el único administrador activo', 400);
      }
    }

    await this.delete(tenantId, id);
  }
}
