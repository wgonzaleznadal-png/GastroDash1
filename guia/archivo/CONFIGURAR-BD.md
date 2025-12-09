# 🗄️ Configuración de Base de Datos

## Opción 1: PostgreSQL Local (Recomendado para Producción)

### Instalar PostgreSQL en macOS

```bash
# Con Homebrew
brew install postgresql@15
brew services start postgresql@15

# Crear base de datos
createdb gastrodash_dev
```

### Configurar .env

```bash
cd backend
# Editar .env con la URL de PostgreSQL
DATABASE_URL="postgresql://tu_usuario@localhost:5432/gastrodash_dev"
```

## Opción 2: SQLite (Más Fácil para Desarrollo)

### Configurar Prisma para SQLite

```bash
cd backend
```

Editar `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

Editar `.env`:

```bash
DATABASE_URL="file:./dev.db"
```

## Opción 3: PostgreSQL en la Nube (Gratis)

### Supabase (Recomendado)

1. Ir a https://supabase.com
2. Crear cuenta gratis
3. Crear nuevo proyecto
4. Copiar la URL de conexión
5. Pegar en `backend/.env`:

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

### Railway

1. Ir a https://railway.app
2. Crear cuenta con GitHub
3. New Project → Provision PostgreSQL
4. Copiar DATABASE_URL
5. Pegar en `backend/.env`

## Ejecutar Migraciones

```bash
cd backend

# Generar cliente Prisma
npm run prisma:generate

# Crear y ejecutar migración
npm run prisma:migrate

# Ejecutar seed (datos de prueba)
npm run prisma:seed
```

## Verificar

```bash
# Abrir Prisma Studio
npm run prisma:studio
```

Esto abrirá una interfaz web en http://localhost:5555 donde podrás ver tus datos.

## Credenciales de Prueba

Después de ejecutar el seed:

- **Email**: admin@demo.com
- **Password**: admin123
- **Tenant**: Restaurante Demo

## Troubleshooting

### Error: "Can't reach database server"

- Verifica que PostgreSQL esté corriendo
- Verifica la URL de conexión en `.env`
- Prueba la conexión: `psql -h localhost -U tu_usuario -d gastrodash_dev`

### Error: "Migration failed"

```bash
# Resetear base de datos (⚠️ BORRA TODOS LOS DATOS)
npm run prisma:migrate reset

# O crear nueva migración
npm run prisma:migrate dev --name init
```
