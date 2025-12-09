import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Agregando usuario demo...');

  // Buscar el tenant demo
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
  });

  if (!tenant) {
    console.error('❌ Tenant demo no encontrado. Ejecuta primero: npm run prisma:seed');
    process.exit(1);
  }

  // Crear usuario demo
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.usuario.upsert({
    where: { 
      tenantId_email: {
        tenantId: tenant.id,
        email: 'demo@gastrodash.com',
      }
    },
    update: {
      password: hashedPassword,
    },
    create: {
      tenantId: tenant.id,
      email: 'demo@gastrodash.com',
      password: hashedPassword,
      nombre: 'Usuario',
      apellido: 'Demo',
      rol: 'CAJERO',
      activo: true,
    },
  });

  console.log('✅ Usuario demo creado exitosamente!');
  console.log('\n📝 Credenciales:');
  console.log('   Email: demo@gastrodash.com');
  console.log('   Password: demo123');
  console.log('   Rol: CAJERO');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
