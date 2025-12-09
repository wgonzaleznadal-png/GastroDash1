import { PrismaClient, Mesa } from '@prisma/client';
import { BaseRepository } from '../repositories/base.repository';

const prisma = new PrismaClient();

export class MesaService extends BaseRepository<Mesa> {
  constructor() {
    super(prisma, 'mesa');
  }

  async getMesas(tenantId: string) {
    return await prisma.mesa.findMany({
      where: { tenantId },
      orderBy: { numero: 'asc' },
    });
  }

  async getMesaById(tenantId: string, id: string) {
    return await prisma.mesa.findFirst({
      where: {
        id,
        tenantId,
      },
    });
  }

  async createMesa(tenantId: string, data: {
    numero: number;
    capacidad: number;
    sala?: string;
  }) {
    return await prisma.mesa.create({
      data: {
        tenantId,
        numero: data.numero,
        capacidad: data.capacidad,
        sala: data.sala,
        estado: 'LIBRE',
      },
    });
  }

  async updateMesa(tenantId: string, id: string, data: Partial<Mesa>) {
    return await prisma.mesa.update({
      where: { id },
      data,
    });
  }

  async deleteMesa(tenantId: string, id: string) {
    return await prisma.mesa.delete({
      where: { id },
    });
  }
}
