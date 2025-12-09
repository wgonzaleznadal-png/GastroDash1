import { PrismaClient, Turno, EstadoTurno } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface AbrirTurnoDTO {
  montoInicial: number;
}

interface CerrarTurnoDTO {
  montoFinal: number;
  notas?: string;
}

export class TurnoService {
  
  async abrirTurno(tenantId: string, usuarioId: string, data: AbrirTurnoDTO) {
    // Verificar que no haya un turno abierto para este usuario
    const turnoAbierto = await prisma.turno.findFirst({
      where: {
        tenantId,
        usuarioId,
        estado: EstadoTurno.ABIERTO,
      },
    });

    if (turnoAbierto) {
      throw new AppError('Ya existe un turno abierto para este usuario', 400);
    }

    // Obtener el siguiente número de turno
    const ultimoTurno = await prisma.turno.findFirst({
      where: { tenantId },
      orderBy: { numero: 'desc' },
    });
    const numero = (ultimoTurno?.numero || 0) + 1;

    // Crear el turno
    const turno = await prisma.turno.create({
      data: {
        tenantId,
        usuarioId,
        numero,
        estado: EstadoTurno.ABIERTO,
        montoInicial: data.montoInicial,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return turno;
  }

  async getTurnoActivo(tenantId: string, usuarioId: string) {
    const turno = await prisma.turno.findFirst({
      where: {
        tenantId,
        usuarioId,
        estado: EstadoTurno.ABIERTO,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        pagos: {
          include: {
            venta: {
              select: {
                id: true,
                numero: true,
                total: true,
              },
            },
          },
        },
      },
    });

    return turno;
  }

  async cerrarTurno(tenantId: string, turnoId: string, data: CerrarTurnoDTO) {
    const turno = await prisma.turno.findFirst({
      where: {
        id: turnoId,
        tenantId,
      },
      include: {
        pagos: true,
      },
    });

    if (!turno) {
      throw new AppError('Turno no encontrado', 404);
    }

    if (turno.estado === EstadoTurno.CERRADO) {
      throw new AppError('El turno ya está cerrado', 400);
    }

    // Calcular totales por método de pago
    const totalEfectivo = turno.pagos
      .filter(p => p.metodo === 'EFECTIVO')
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const totalTarjeta = turno.pagos
      .filter(p => ['TARJETA_DEBITO', 'TARJETA_CREDITO'].includes(p.metodo))
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const totalOtros = turno.pagos
      .filter(p => !['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO'].includes(p.metodo))
      .reduce((sum, p) => sum + Number(p.monto), 0);

    // Calcular diferencia
    const diferencia = data.montoFinal - (Number(turno.montoInicial) + totalEfectivo);

    // Cerrar el turno
    const turnoCerrado = await prisma.turno.update({
      where: { id: turnoId },
      data: {
        estado: EstadoTurno.CERRADO,
        montoFinal: data.montoFinal,
        totalEfectivo,
        totalTarjeta,
        totalOtros,
        diferencia,
        notas: data.notas,
        cierre: new Date(),
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        pagos: {
          include: {
            venta: {
              select: {
                id: true,
                numero: true,
                total: true,
              },
            },
          },
        },
      },
    });

    return turnoCerrado;
  }

  async getTurnos(tenantId: string, filters?: {
    usuarioId?: string;
    estado?: EstadoTurno;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }) {
    const where: any = { tenantId };

    if (filters?.usuarioId) {
      where.usuarioId = filters.usuarioId;
    }

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.fechaDesde || filters?.fechaHasta) {
      where.apertura = {};
      if (filters.fechaDesde) {
        where.apertura.gte = filters.fechaDesde;
      }
      if (filters.fechaHasta) {
        where.apertura.lte = filters.fechaHasta;
      }
    }

    return await prisma.turno.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: {
        apertura: 'desc',
      },
    });
  }

  async getTurnoById(tenantId: string, id: string) {
    const turno = await prisma.turno.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        pagos: {
          include: {
            venta: {
              select: {
                id: true,
                numero: true,
                total: true,
                tipo: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!turno) {
      throw new AppError('Turno no encontrado', 404);
    }

    return turno;
  }

  async getEstadisticasTurno(tenantId: string, turnoId: string) {
    const turno = await this.getTurnoById(tenantId, turnoId);

    const totalVentas = turno.pagos.length;
    const montoTotal = turno.pagos.reduce((sum, p) => sum + Number(p.monto), 0);

    // Agrupar por método de pago
    const porMetodo = turno.pagos.reduce((acc: any, pago) => {
      const metodo = pago.metodo;
      if (!acc[metodo]) {
        acc[metodo] = { cantidad: 0, monto: 0 };
      }
      acc[metodo].cantidad++;
      acc[metodo].monto += Number(pago.monto);
      return acc;
    }, {});

    return {
      turno: {
        id: turno.id,
        numero: turno.numero,
        estado: turno.estado,
        apertura: turno.apertura,
        cierre: turno.cierre,
        montoInicial: turno.montoInicial,
        montoFinal: turno.montoFinal,
        diferencia: turno.diferencia,
      },
      estadisticas: {
        totalVentas,
        montoTotal,
        porMetodo,
        totalEfectivo: turno.totalEfectivo,
        totalTarjeta: turno.totalTarjeta,
        totalOtros: turno.totalOtros,
      },
    };
  }
}

export const turnoService = new TurnoService();
