import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  constructor(
    protected prisma: PrismaClient,
    protected modelName: string
  ) {}

  async findAll(tenantId: string, filters?: any): Promise<T[]> {
    return (this.prisma as any)[this.modelName].findMany({
      where: {
        tenantId,
        ...filters,
      },
    });
  }

  async findById(tenantId: string, id: string): Promise<T | null> {
    return (this.prisma as any)[this.modelName].findFirst({
      where: { 
        id, 
        tenantId 
      },
    });
  }

  async create(tenantId: string, data: any): Promise<T> {
    return (this.prisma as any)[this.modelName].create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async update(tenantId: string, id: string, data: any): Promise<T | null> {
    // Verificar que el registro pertenece al tenant
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      throw new Error('Registro no encontrado o no pertenece al tenant');
    }

    return (this.prisma as any)[this.modelName].update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      return false;
    }

    await (this.prisma as any)[this.modelName].delete({
      where: { id },
    });

    return true;
  }

  async count(tenantId: string, filters?: any): Promise<number> {
    return (this.prisma as any)[this.modelName].count({
      where: {
        tenantId,
        ...filters,
      },
    });
  }
}
