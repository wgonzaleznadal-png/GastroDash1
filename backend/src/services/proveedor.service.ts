import { PrismaClient, Proveedor } from '@prisma/client';
import { BaseRepository } from '../repositories/base.repository';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface CreateProveedorDTO {
  nombre: string;
  razonSocial?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto?: string;
}

export class ProveedorService extends BaseRepository<Proveedor> {
  constructor() {
    super(prisma, 'proveedor');
  }

  async createProveedor(tenantId: string, data: CreateProveedorDTO) {
    // Verificar que no exista un proveedor con el mismo nombre
    const existente = await prisma.proveedor.findFirst({
      where: {
        tenantId,
        nombre: data.nombre,
      },
    });

    if (existente) {
      throw new AppError('Ya existe un proveedor con ese nombre', 400);
    }

    return await prisma.proveedor.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async getProveedores(tenantId: string, filters?: {
    activo?: boolean;
    search?: string;
  }) {
    const where: any = { tenantId };

    if (filters?.activo !== undefined) {
      where.activo = filters.activo;
    }

    if (filters?.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { razonSocial: { contains: filters.search, mode: 'insensitive' } },
        { cuit: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.proveedor.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
  }

  async getProveedorById(tenantId: string, id: string) {
    const proveedor = await prisma.proveedor.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        compras: {
          orderBy: { fechaCompra: 'desc' },
          take: 10,
        },
      },
    });

    if (!proveedor) {
      throw new AppError('Proveedor no encontrado', 404);
    }

    return proveedor;
  }

  async updateProveedor(tenantId: string, id: string, data: Partial<CreateProveedorDTO>) {
    await this.getProveedorById(tenantId, id);

    // Si se cambia el nombre, verificar que no exista otro con ese nombre
    if (data.nombre) {
      const existente = await prisma.proveedor.findFirst({
        where: {
          tenantId,
          nombre: data.nombre,
          id: { not: id },
        },
      });

      if (existente) {
        throw new AppError('Ya existe un proveedor con ese nombre', 400);
      }
    }

    return await prisma.proveedor.update({
      where: { id },
      data,
    });
  }

  async deleteProveedor(tenantId: string, id: string) {
    await this.getProveedorById(tenantId, id);

    // Soft delete
    return await prisma.proveedor.update({
      where: { id },
      data: { activo: false },
    });
  }
}
