import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear tenant de prueba
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      nombre: 'Restaurante Demo',
      slug: 'demo',
      plan: 'premium',
      activo: true,
      maxUsuarios: 50,
      maxSucursales: 5,
      configuracion: {
        moneda: 'ARS',
        timezone: 'America/Argentina/Buenos_Aires',
        idioma: 'es',
      },
    },
  });

  console.log('✅ Tenant creado:', tenant.nombre);

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.usuario.upsert({
    where: { 
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@demo.com',
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      password: hashedPassword,
      nombre: 'Admin',
      apellido: 'Demo',
      rol: 'ADMIN',
      activo: true,
    },
  });

  console.log('✅ Usuario admin creado:', adminUser.email);

  // Crear usuario demo (cajero)
  const hashedPasswordDemo = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.usuario.upsert({
    where: { 
      tenantId_email: {
        tenantId: tenant.id,
        email: 'demo@gastrodash.com',
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'demo@gastrodash.com',
      password: hashedPasswordDemo,
      nombre: 'Usuario',
      apellido: 'Demo',
      rol: 'CAJERO',
      activo: true,
    },
  });

  console.log('✅ Usuario demo creado:', demoUser.email);

  // Crear categorías de ejemplo
  const categorias = await Promise.all([
    prisma.categoria.create({
      data: {
        tenantId: tenant.id,
        nombre: 'Entradas',
        orden: 1,
        activo: true,
      },
    }),
    prisma.categoria.create({
      data: {
        tenantId: tenant.id,
        nombre: 'Platos Principales',
        orden: 2,
        activo: true,
      },
    }),
    prisma.categoria.create({
      data: {
        tenantId: tenant.id,
        nombre: 'Postres',
        orden: 3,
        activo: true,
      },
    }),
    prisma.categoria.create({
      data: {
        tenantId: tenant.id,
        nombre: 'Bebidas',
        orden: 4,
        activo: true,
      },
    }),
  ]);

  console.log('✅ Categorías creadas:', categorias.length);

  // Crear productos de ejemplo
  const productos = await Promise.all([
    prisma.producto.create({
      data: {
        tenantId: tenant.id,
        categoriaId: categorias[0].id,
        nombre: 'Empanadas de Carne',
        descripcion: 'Empanadas caseras de carne cortada a cuchillo',
        precio: 1500,
        costo: 800,
        stock: 50,
        stockMinimo: 10,
        disponible: true,
      },
    }),
    prisma.producto.create({
      data: {
        tenantId: tenant.id,
        categoriaId: categorias[1].id,
        nombre: 'Milanesa con Papas Fritas',
        descripcion: 'Milanesa de ternera con guarnición de papas fritas',
        precio: 5500,
        costo: 2800,
        stock: 30,
        stockMinimo: 5,
        disponible: true,
      },
    }),
    prisma.producto.create({
      data: {
        tenantId: tenant.id,
        categoriaId: categorias[2].id,
        nombre: 'Flan Casero',
        descripcion: 'Flan casero con dulce de leche y crema',
        precio: 2000,
        costo: 900,
        stock: 20,
        stockMinimo: 5,
        disponible: true,
      },
    }),
    prisma.producto.create({
      data: {
        tenantId: tenant.id,
        categoriaId: categorias[3].id,
        nombre: 'Coca Cola 500ml',
        descripcion: 'Gaseosa Coca Cola 500ml',
        precio: 1200,
        costo: 600,
        stock: 100,
        stockMinimo: 20,
        disponible: true,
      },
    }),
  ]);

  console.log('✅ Productos creados:', productos.length);

  // Crear mesas de ejemplo
  const mesas = await Promise.all([
    ...Array.from({ length: 10 }, (_, i) => 
      prisma.mesa.create({
        data: {
          tenantId: tenant.id,
          numero: i + 1,
          capacidad: i < 5 ? 4 : 6,
          estado: 'LIBRE',
          sala: i < 5 ? 'Salon Principal' : 'Terraza',
        },
      })
    ),
  ]);

  console.log('✅ Mesas creadas:', mesas.length);

  // Crear clientes de ejemplo
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        telefono: '+54 11 1234-5678',
        direccion: 'Av. Corrientes 1234, CABA',
        puntos: 150,
        nivel: 'plata',
      },
    }),
    prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        nombre: 'María',
        apellido: 'González',
        email: 'maria.gonzalez@example.com',
        telefono: '+54 11 8765-4321',
        direccion: 'Av. Santa Fe 5678, CABA',
        puntos: 300,
        nivel: 'oro',
      },
    }),
  ]);

  console.log('✅ Clientes creados:', clientes.length);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📝 Credenciales de prueba:');
  console.log('\n👤 Usuario Admin:');
  console.log('   Email: admin@demo.com');
  console.log('   Password: admin123');
  console.log('   Rol: ADMIN');
  console.log('\n👤 Usuario Demo:');
  console.log('   Email: demo@gastrodash.com');
  console.log('   Password: demo123');
  console.log('   Rol: CAJERO');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
