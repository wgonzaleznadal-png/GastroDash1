# 🚀 Inicio Rápido - GastroDash Pro

## ✅ Checklist Completo para Comenzar

### 📚 Fase 1: Lectura (2-3 horas)

- [ ] **Leer RESUMEN-EJECUTIVO.md** (15 min)
- [ ] **Leer 01-ARQUITECTURA-GENERAL.md** (45 min)
- [ ] **Leer 02-STACK-TECNOLOGICO.md** (30 min)
- [ ] **Leer 04-MULTITENANT.md** (45 min)
- [ ] **Revisar 38-ROADMAP.md** (30 min)

### 🛠️ Fase 2: Setup del Entorno (1-2 horas)

#### Requisitos Previos
- [ ] Node.js 20+ instalado
- [ ] PostgreSQL 15+ instalado
- [ ] Redis 7+ instalado
- [ ] Docker instalado (opcional pero recomendado)
- [ ] Git configurado
- [ ] Editor de código (VS Code recomendado)

#### Verificar Versiones
```bash
node --version    # v20.x o superior
npm --version     # v10.x o superior
psql --version    # 15.x o superior
redis-cli --version  # 7.x o superior
docker --version  # 24.x o superior
```

### 📁 Fase 3: Crear Estructura (30 min)

```bash
# 1. Crear carpeta raíz
mkdir gastrodash-pro
cd gastrodash-pro

# 2. Inicializar Git
git init
git branch -M main

# 3. Crear estructura de carpetas
mkdir -p frontend/src/{app,components,hooks,services,store,theme,types,utils}
mkdir -p frontend/public
mkdir -p backend/src/{controllers,services,repositories,middleware,routes,utils}
mkdir -p backend/prisma
mkdir -p shared/{types,schemas,utils}
mkdir -p infrastructure/{docker,k8s,scripts}
mkdir -p docs

# 4. Crear .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Production
build/
dist/
.next/
out/

# Misc
.DS_Store
*.pem
.env
.env.local
.env.*.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# Prisma
prisma/migrations/
EOF
```

### 📦 Fase 4: Configurar Package.json (30 min)

#### Root package.json
```bash
cat > package.json << 'EOF'
{
  "name": "gastrodash-pro",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "build:shared": "cd shared && npm run build",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm test",
    "test:backend": "cd backend && npm test",
    "lint": "npm run lint:frontend && npm run lint:backend",
    "lint:frontend": "cd frontend && npm run lint",
    "lint:backend": "cd backend && npm run lint",
    "prisma:studio": "cd backend && npm run prisma:studio",
    "prisma:migrate": "cd backend && npm run prisma:migrate"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
EOF
```

#### Frontend package.json
```bash
cat > frontend/package.json << 'EOF'
{
  "name": "@gastrodash/frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@mui/x-data-grid": "^6.19.0",
    "@mui/x-date-pickers": "^6.19.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.20.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.6.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.11.0",
    "typescript": "^5.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.2.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/jest-dom": "^6.2.0"
  }
}
EOF
```

#### Backend package.json
```bash
cat > backend/package.json << 'EOF'
{
  "name": "@gastrodash/backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "tsx prisma/seed.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "express": "^4.18.0",
    "@prisma/client": "^5.10.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.0",
    "zod": "^3.22.0",
    "winston": "^3.11.0",
    "dotenv": "^16.4.0",
    "ioredis": "^5.3.0",
    "bull": "^4.12.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.11.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/cors": "^2.8.0",
    "typescript": "^5.4.0",
    "tsx": "^4.7.0",
    "prisma": "^5.10.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^6.0.0"
  }
}
EOF
```

### 🗄️ Fase 5: Configurar Base de Datos (45 min)

#### Docker Compose
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: gastrodash-postgres
    environment:
      POSTGRES_USER: gastrodash
      POSTGRES_PASSWORD: gastrodash123
      POSTGRES_DB: gastrodash_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - gastrodash-network

  redis:
    image: redis:7-alpine
    container_name: gastrodash-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - gastrodash-network

volumes:
  postgres_data:
  redis_data:

networks:
  gastrodash-network:
    driver: bridge
EOF
```

#### Iniciar Base de Datos
```bash
# Iniciar PostgreSQL y Redis
docker-compose up -d

# Verificar que estén corriendo
docker-compose ps
```

#### Prisma Schema Inicial
```bash
cat > backend/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Modelo Tenant
model Tenant {
  id        String   @id @default(uuid())
  nombre    String
  slug      String   @unique
  dominio   String?  @unique
  
  configuracion Json
  plan          String
  activo        Boolean  @default(true)
  
  maxUsuarios   Int      @default(10)
  maxSucursales Int      @default(1)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  usuarios      Usuario[]
  
  @@index([slug])
  @@index([activo])
}

// Modelo Usuario
model Usuario {
  id        String   @id @default(uuid())
  tenantId  String
  
  email     String
  password  String
  nombre    String
  apellido  String
  rol       String
  activo    Boolean  @default(true)
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([tenantId, email])
  @@index([tenantId, activo])
}
EOF
```

#### Variables de Entorno
```bash
cat > backend/.env << 'EOF'
# Database
DATABASE_URL="postgresql://gastrodash:gastrodash123@localhost:5432/gastrodash_dev"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=tu-secret-super-seguro-cambiar-en-produccion
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
EOF

cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF
```

### 🎨 Fase 6: Configurar MUI (30 min)

#### Crear Tema MUI
```bash
mkdir -p frontend/src/theme
cat > frontend/src/theme/theme.ts << 'EOF'
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});
EOF
```

### 🚀 Fase 7: Primer Código (1 hora)

#### Backend: Servidor Básico
```bash
cat > backend/src/index.ts << 'EOF'
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
EOF
```

#### Frontend: Página Inicial
```bash
cat > frontend/src/app/layout.tsx << 'EOF'
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/theme/theme';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
EOF

cat > frontend/src/app/page.tsx << 'EOF'
import { Typography, Container, Box } from '@mui/material';

export default function Home() {
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          GastroDash Pro
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Sistema Gastronómico Integral
        </Typography>
      </Box>
    </Container>
  );
}
EOF
```

### ▶️ Fase 8: Ejecutar (15 min)

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente Prisma
cd backend
npm run prisma:generate
npm run prisma:migrate

# 3. Volver a raíz
cd ..

# 4. Iniciar en desarrollo
npm run dev
```

### ✅ Verificar que Todo Funciona

- [ ] Frontend: http://localhost:3000 ✅
- [ ] Backend: http://localhost:3001/health ✅
- [ ] Prisma Studio: `npm run prisma:studio` ✅
- [ ] PostgreSQL conectado ✅
- [ ] Redis conectado ✅

---

## 🎯 Próximos Pasos

### Semana 1
1. [ ] Implementar autenticación JWT
2. [ ] Crear middleware de tenant
3. [ ] Crear primer endpoint protegido
4. [ ] Crear página de login con MUI
5. [ ] Escribir primeros tests

### Semana 2
6. [ ] Sistema de roles completo
7. [ ] Migrar componentes a MUI
8. [ ] Configurar Zustand
9. [ ] Configurar React Query
10. [ ] Deploy a staging

---

## 📚 Recursos de Ayuda

### Documentación
- [Next.js](https://nextjs.org/docs)
- [MUI](https://mui.com)
- [Prisma](https://www.prisma.io/docs)
- [Zustand](https://zustand-demo.pmnd.rs/)

### Guías del Proyecto
- [Arquitectura](01-ARQUITECTURA-GENERAL.md)
- [Stack](02-STACK-TECNOLOGICO.md)
- [Multitenant](04-MULTITENANT.md)
- [Roadmap](38-ROADMAP.md)

---

## 🆘 Troubleshooting

### Error: Puerto 3000 ocupado
```bash
# Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9
```

### Error: PostgreSQL no conecta
```bash
# Verificar que Docker esté corriendo
docker-compose ps

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Error: Prisma no genera cliente
```bash
# Limpiar y regenerar
cd backend
rm -rf node_modules/.prisma
npm run prisma:generate
```

---

## ✅ Checklist Final

- [ ] Estructura de carpetas creada
- [ ] package.json configurados
- [ ] Docker Compose funcionando
- [ ] PostgreSQL conectado
- [ ] Redis conectado
- [ ] Prisma configurado
- [ ] MUI configurado
- [ ] Backend corriendo en :3001
- [ ] Frontend corriendo en :3000
- [ ] Health check funcionando
- [ ] Página inicial mostrándose

**¡Estás listo para comenzar el desarrollo! 🎉**

---

**Tiempo total estimado**: 4-6 horas  
**Próximo paso**: Implementar autenticación (Semana 1)
