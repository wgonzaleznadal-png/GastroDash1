# 🚀 Setup Guide - GastroDash Pro

## Paso 1: Instalar Dependencias

```bash
# En la raíz del proyecto
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Paso 2: Configurar Variables de Entorno

### Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus configuraciones
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
```

## Paso 3: Iniciar Base de Datos

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Verificar que estén corriendo
docker-compose ps
```

## Paso 4: Configurar Prisma

```bash
cd backend

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio
npm run prisma:studio
```

## Paso 5: Iniciar Aplicación

```bash
# Desde la raíz del proyecto
npm run dev
```

Esto iniciará:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

## Verificación

### Health Check del Backend
```bash
curl http://localhost:3001/health
```

Debería retornar:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "environment": "development"
}
```

### Acceder al Frontend
Abre http://localhost:3000 en tu navegador

## Próximos Pasos

1. Crear tu primer tenant usando el endpoint `/api/auth/register`
2. Iniciar sesión con `/api/auth/login`
3. Explorar el dashboard

## Troubleshooting

### Puerto ocupado
```bash
# Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9

# Matar proceso en puerto 3001
lsof -ti:3001 | xargs kill -9
```

### PostgreSQL no conecta
```bash
docker-compose restart postgres
```

### Prisma no genera cliente
```bash
cd backend
rm -rf node_modules/.prisma
npm run prisma:generate
```
