# 🍽️ GastroDash Pro

Sistema gastronómico integral **multitenant** de nivel enterprise.

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Iniciar base de datos
docker-compose up -d

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Iniciar en desarrollo
npm run dev
```

## 📁 Estructura del Proyecto

```
gastrodash-pro/
├── frontend/          # Next.js + React + MUI
├── backend/           # Node.js + Express + Prisma
├── shared/            # Código compartido
├── docs/              # Documentación
├── guia/              # Guía de desarrollo
└── infrastructure/    # Docker, K8s, CI/CD
```

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, React 18, TypeScript, MUI
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Base de datos**: PostgreSQL 15, Redis 7
- **Infraestructura**: Docker, Kubernetes

## 📚 Documentación

Ver la carpeta `/guia` para documentación completa:
- [Arquitectura General](guia/01-ARQUITECTURA-GENERAL.md)
- [Stack Tecnológico](guia/02-STACK-TECNOLOGICO.md)
- [Estrategia Multitenant](guia/04-MULTITENANT.md)
- [Roadmap Completo](guia/38-ROADMAP.md)

## 🎯 Principios de Desarrollo

1. ✅ **Multitenant 100%** - Aislamiento total de datos
2. ✅ **Estilos globales** - Sistema de diseño unificado con MUI
3. ✅ **Buenas prácticas** - Clean Code, SOLID, DRY
4. ✅ **Zero deuda técnica** - Refactoring continuo
5. ✅ **Testing completo** - Unit, Integration, E2E

## 📄 Licencia

Propietario - Todos los derechos reservados
# GastroDash1
