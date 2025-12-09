import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando usuarios existentes...\n');

  // Buscar todos los usuarios
  const usuarios = await prisma.usuario.findMany({
    include: {
      tenant: true,
    },
  });

  if (usuarios.length > 0) {
    console.log('✅ Usuarios encontrados:\n');
    usuarios.forEach((usuario, index) => {
      console.log(`${index + 1}. Email: ${usuario.email}`);
      console.log(`   Nombre: ${usuario.nombre} ${usuario.apellido}`);
      console.log(`   Rol: ${usuario.rol}`);
      console.log(`   Tenant: ${usuario.tenant.nombre}`);
      console.log('');
    });
    console.log('📝 Usa cualquiera de estos emails para hacer login.');
    console.log('⚠️  Si no recuerdas la contraseña, puedo crear un usuario nuevo.\n');
  } else {
    console.log('❌ No hay usuarios en la base de datos.\n');
    console.log('🔧 Creando usuario de prueba...\n');

    // Buscar o crear tenant
    let tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          nombre: 'Restaurante Demo',
          slug: 'demo',
          plan: 'PREMIUM',
          activo: true,
        },
      });
      console.log('✅ Tenant creado: Restaurante Demo\n');
    }

    // Crear usuario admin
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@demo.com',
        password: hashedPassword,
        nombre: 'Admin',
        apellido: 'Demo',
        rol: 'ADMIN',
        activo: true,
      },
    });

    console.log('✅ Usuario creado exitosamente!\n');
    console.log('📧 Email: admin@demo.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Rol: ADMIN');
    console.log('🏢 Tenant: Restaurante Demo\n');
  }

  console.log('🔗 Accede a: http://localhost:3000/auth/login\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
