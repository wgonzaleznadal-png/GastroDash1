import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Reseteando contraseña del admin...\n');

  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Buscar el usuario primero
  const usuarioExistente = await prisma.usuario.findFirst({
    where: {
      email: 'admin@demo.com',
    },
  });

  if (!usuarioExistente) {
    console.log('❌ Usuario no encontrado');
    return;
  }

  // Actualizar la contraseña
  const usuario = await prisma.usuario.update({
    where: {
      id: usuarioExistente.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  console.log('✅ Contraseña actualizada!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:    admin@demo.com');
  console.log('🔑 Password: admin123');
  console.log('👤 Rol:      ADMIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔗 Login: http://localhost:3000/auth/login\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
