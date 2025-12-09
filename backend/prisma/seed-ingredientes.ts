import { PrismaClient, UnidadMedida } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ingredientes...');

  // Obtener el primer tenant
  const tenant = await prisma.tenant.findFirst();
  
  if (!tenant) {
    console.error('❌ No se encontró ningún tenant');
    return;
  }

  console.log(`✅ Usando tenant: ${tenant.nombre}`);

  // Crear ingredientes de ejemplo
  const ingredientes = [
    {
      nombre: 'Harina',
      descripcion: 'Harina 000 para panificación',
      costo: 500,
      unidad: 'KILOGRAMO' as UnidadMedida,
      stockActual: 50,
      stockMinimo: 10,
      activo: true,
      tenantId: tenant.id,
    },
    {
      nombre: 'Queso Muzzarella',
      descripcion: 'Queso muzzarella para pizza',
      costo: 2000,
      unidad: 'KILOGRAMO' as UnidadMedida,
      stockActual: 20,
      stockMinimo: 5,
      activo: true,
      tenantId: tenant.id,
    },
    {
      nombre: 'Salsa de Tomate',
      descripcion: 'Salsa de tomate casera',
      costo: 800,
      unidad: 'KILOGRAMO' as UnidadMedida,
      stockActual: 15,
      stockMinimo: 3,
      activo: true,
      tenantId: tenant.id,
    },
    {
      nombre: 'Aceitunas',
      descripcion: 'Aceitunas verdes en rodajas',
      costo: 3000,
      unidad: 'KILOGRAMO' as UnidadMedida,
      stockActual: 10,
      stockMinimo: 2,
      activo: true,
      tenantId: tenant.id,
    },
    {
      nombre: 'Carne Molida',
      descripcion: 'Carne molida especial',
      costo: 5000,
      unidad: 'KILOGRAMO' as UnidadMedida,
      stockActual: 25,
      stockMinimo: 5,
      activo: true,
      tenantId: tenant.id,
    },
    {
      nombre: 'Lechuga',
      descripcion: 'Lechuga fresca',
      costo: 500,
      unidad: 'KILOGRAMO' as UnidadMedida,
      stockActual: 8,
      stockMinimo: 2,
      activo: true,
      tenantId: tenant.id,
    },
    {
      nombre: 'Tomate',
      descripcion: 'Tomate fresco',
      costo: 600,
      unidad: 'KILOGRAMO' as UnidadMedida,
      stockActual: 12,
      stockMinimo: 3,
      activo: true,
      tenantId: tenant.id,
    },
    {
      nombre: 'Pan',
      descripcion: 'Pan para hamburguesa',
      costo: 200,
      unidad: 'UNIDAD' as UnidadMedida,
      stockActual: 100,
      stockMinimo: 20,
      activo: true,
      tenantId: tenant.id,
    },
    {
      nombre: 'Café Molido',
      descripcion: 'Café arábica premium',
      costo: 12000,
      unidad: 'KILOGRAMO' as UnidadMedida,
      stockActual: 5,
      stockMinimo: 1,
      activo: true,
      tenantId: tenant.id,
    },
    {
      nombre: 'Leche',
      descripcion: 'Leche entera',
      costo: 1500,
      unidad: 'LITRO' as UnidadMedida,
      stockActual: 30,
      stockMinimo: 10,
      activo: true,
      tenantId: tenant.id,
    },
  ];

  for (const ingrediente of ingredientes) {
    const existing = await prisma.ingrediente.findFirst({
      where: {
        nombre: ingrediente.nombre,
        tenantId: tenant.id,
      },
    });

    if (existing) {
      console.log(`⏭️  Ingrediente "${ingrediente.nombre}" ya existe`);
      continue;
    }

    await prisma.ingrediente.create({
      data: ingrediente,
    });

    console.log(`✅ Creado: ${ingrediente.nombre} - $${ingrediente.costo}/${ingrediente.unidad}`);
  }

  console.log('\n🎉 Seed completado!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
