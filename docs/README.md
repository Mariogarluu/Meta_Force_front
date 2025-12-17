# 📚 Documentación de Meta Force Frontend

Bienvenido a la documentación técnica completa del proyecto Meta Force Frontend.

## 📖 Índice de Documentación

### 🚀 Para Empezar

- **[README Principal](../README.md)** - Introducción, instalación y guía rápida
- **[Inicio Rápido](#inicio-rápido)** - Guía de inicio en 5 minutos

### 📘 Documentación Técnica

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura técnica detallada
  - Patrones de diseño
  - Estructura modular
  - Flujo de datos
  - Estado y manejo reactivo

- **[API.md](./API.md)** - Integración con API Backend
  - Endpoints disponibles
  - Autenticación y tokens
  - Formatos de request/response
  - Ejemplos de uso

- **[SECURITY.md](./SECURITY.md)** - Seguridad del sistema
  - Autenticación JWT
  - Control de acceso basado en roles
  - Prevención de vulnerabilidades
  - Mejores prácticas

### 🛠️ Para Desarrolladores

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guía de contribución
  - Setup del entorno
  - Flujo de trabajo Git
  - Estándares de código
  - Convenciones de naming
  - Testing

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guía de despliegue
  - Configuración de entornos
  - Despliegue en Vercel
  - Despliegue manual
  - CI/CD
  - Troubleshooting

## 🎯 Inicio Rápido

### Pre-requisitos

```bash
node --version  # v18.0.0 o superior
npm --version   # 9.0.0 o superior
```

### Instalación (3 pasos)

```bash
# 1. Clonar repositorio
git clone https://github.com/Mariogarluu/Meta_Force_front.git
cd Meta_Force_front

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm start
```

✅ La aplicación estará corriendo en `http://localhost:4200`

### Credenciales de Prueba

Para probar la aplicación en desarrollo, usa estas credenciales:

```
Email: demo@metaforce.com
Password: Demo123!
```

> **Nota**: Estas credenciales son solo para entornos de desarrollo.

## 🗺️ Guía por Rol

### 👨‍💼 Para Project Managers

1. Leer: [README Principal](../README.md) - Visión general del proyecto
2. Revisar: [ARCHITECTURE.md](./ARCHITECTURE.md) - Entender la arquitectura
3. Verificar: [SECURITY.md](./SECURITY.md) - Conocer medidas de seguridad

### 👨‍💻 Para Desarrolladores

1. **Primera vez**:
   - [README Principal](../README.md) - Setup inicial
   - [CONTRIBUTING.md](./CONTRIBUTING.md) - Convenciones y flujo de trabajo
   
2. **Desarrollo**:
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Entender la estructura
   - [API.md](./API.md) - Integración con backend
   
3. **Testing y Deploy**:
   - [CONTRIBUTING.md](./CONTRIBUTING.md) - Guía de testing
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Proceso de despliegue

### 🔐 Para DevOps/SRE

1. [DEPLOYMENT.md](./DEPLOYMENT.md) - Configuración de infraestructura
2. [SECURITY.md](./SECURITY.md) - Configuración de seguridad
3. [README Principal](../README.md) - Scripts y comandos

### 🎨 Para Diseñadores

1. [README Principal](../README.md) - Características visuales (temas, i18n)
2. Ver: `src/styles/` - Archivos de estilos
3. Ver: `tailwind.config.js` - Configuración de Tailwind

## 🔍 Buscar Información

### Quiero saber cómo...

| Tarea | Documento | Sección |
|-------|-----------|---------|
| Instalar el proyecto | [README](../README.md) | Instalación |
| Hacer mi primer commit | [CONTRIBUTING](./CONTRIBUTING.md) | Flujo de Trabajo con Git |
| Entender la arquitectura | [ARCHITECTURE](./ARCHITECTURE.md) | Arquitectura General |
| Integrar con la API | [API](./API.md) | Todo el documento |
| Desplegar en producción | [DEPLOYMENT](./DEPLOYMENT.md) | Despliegue en Vercel |
| Proteger una nueva ruta | [SECURITY](./SECURITY.md) | Protección de Rutas |
| Añadir traducciones | [README](../README.md) | Internacionalización |
| Cambiar el tema | [ARCHITECTURE](./ARCHITECTURE.md) | Gestión de UI/UX |
| Ejecutar tests | [CONTRIBUTING](./CONTRIBUTING.md) | Testing |
| Configurar roles | [SECURITY](./SECURITY.md) | Roles y Permisos |

## 📊 Estructura del Proyecto (Referencia Rápida)

```
Meta_Force_front/
├── src/
│   ├── app/
│   │   ├── core/           # Servicios, guards, models
│   │   ├── pages/          # Páginas/vistas principales
│   │   └── shared/         # Componentes compartidos
│   ├── environments/       # Configuración de entornos
│   └── styles/            # Estilos globales
├── docs/                  # 📚 Documentación (estás aquí)
├── public/
│   └── assets/i18n/       # Archivos de traducción
└── [archivos de config]   # angular.json, tailwind.config.js, etc.
```

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm start                  # Servidor de desarrollo
npm run watch             # Build con watch mode

# Testing
npm test                  # Ejecutar tests
npm test -- --code-coverage  # Tests con cobertura

# Build
npm run build             # Build de desarrollo
npm run build -- --configuration production  # Build de producción

# Code Quality
ng lint                   # Ejecutar linter (si configurado)
```

## 🆘 Obtener Ayuda

### Problemas Técnicos

1. **Buscar en la documentación**: Usa el índice arriba
2. **Errores comunes**: Ver [README](../README.md) - Solución de Problemas
3. **Errores de build**: Ver [DEPLOYMENT](./DEPLOYMENT.md) - Troubleshooting

### Contribuir

1. Lee [CONTRIBUTING.md](./CONTRIBUTING.md) completo
2. Sigue las convenciones de código
3. Crea un PR con descripción clara

### Reportar Bugs o Vulnerabilidades

- **Bugs generales**: Crear issue en GitHub
- **Vulnerabilidades de seguridad**: Seguir el proceso en [SECURITY.md](./SECURITY.md)

## 🔄 Actualizaciones

Esta documentación se actualiza regularmente. Última actualización: **Diciembre 2024**

### Historial de Cambios

| Fecha | Cambios |
|-------|---------|
| 2024-12 | Documentación completa inicial |
| - | Próximas actualizaciones... |

## 🤝 Contribuir a la Documentación

La documentación también acepta contribuciones:

1. Encuentra un error o información faltante
2. Edita el archivo .md correspondiente
3. Sigue el formato Markdown existente
4. Crea un PR con el prefijo `docs:`

```bash
git commit -m "docs: corregir typo en API.md"
```

## 📞 Contacto

Para preguntas sobre la documentación o el proyecto:

- **Equipo de Desarrollo**: [Crear issue en GitHub](https://github.com/Mariogarluu/Meta_Force_front/issues)
- **Seguridad**: security@metaforce.com
- **General**: info@metaforce.com

---

**¡Feliz coding!** 🚀
