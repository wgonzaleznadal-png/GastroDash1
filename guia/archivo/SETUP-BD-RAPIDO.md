# 🚀 Setup Rápido de Base de Datos PostgreSQL

## Opción Más Rápida: Neon (Gratis, 0.5GB)

### Paso 1: Crear cuenta en Neon

1. Ve a https://neon.tech
2. Click en "Sign Up" (puedes usar GitHub)
3. Click en "Create a project"
4. Nombre: `gastrodash`
5. Click en "Create project"

### Paso 2: Copiar la URL de conexión

Neon te mostrará algo como:

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### Paso 3: Configurar en el proyecto

```bash
cd /Volumes/Wizarding/Proyectos/gastrodash1/backend

# Editar .env y reemplazar DATABASE_URL con la URL de Neon
nano .env
```

Pega la URL que copiaste de Neon:

```bash
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
```

### Paso 4: Ejecutar migraciones

```bash
# Generar cliente Prisma
npm run prisma:generate

# Crear tablas
npm run prisma:migrate dev --name init

# Cargar datos de prueba
npm run prisma:seed
```

### Paso 5: ¡Listo!

Ahora puedes:

```bash
# Ver la base de datos
npm run prisma:studio

# Iniciar el backend
npm run dev
```

## Credenciales de Prueba

Después del seed:

- **Email**: admin@demo.com  
- **Password**: admin123

## Alternativa: Supabase (También Gratis)

1. Ve a https://supabase.com
2. Sign up con GitHub
3. New Project → Nombre: `gastrodash`
4. Espera 2 minutos a que se cree
5. Settings → Database → Connection String → URI
6. Copia la URL y pégala en `.env`

## Verificar que funciona

```bash
# Test de conexión
cd backend
npx prisma db push

# Si funciona, verás:
# ✔ Generated Prisma Client
# ✔ Database synchronized
```

## Troubleshooting

### Error: "Can't reach database"

- Verifica que copiaste la URL completa
- Verifica que incluye `?sslmode=require` al final
- Verifica que no hay espacios en la URL

### Error: "SSL required"

Agrega al final de la URL: `?sslmode=require`

```bash
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```
