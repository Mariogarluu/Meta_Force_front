# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Mejoras Futuras
- Implementación de PWA (Progressive Web App)
- Lazy loading de módulos
- Notificaciones push
- Modo offline con Service Workers
- Export de datos a PDF/Excel
- Integración con calendario (Google Calendar, Outlook)
- Chat en tiempo real
- Sistema de reservas avanzado

---

## [1.0.0] - 2024-12-17

### 🎉 Release Inicial

Primera versión estable del sistema Meta Force Frontend.

### ✨ Características Principales

#### Autenticación y Autorización
- Sistema de autenticación JWT
- Tres niveles de roles: SUPERADMIN, ADMIN_CENTER, CLIENT
- Guards de protección de rutas (auth, guest, role)
- HTTP Interceptor para tokens automáticos
- Sesión persistente con localStorage

#### Gestión de Usuarios
- CRUD completo de usuarios
- Filtrado por rol, estado y centro
- Paginación de resultados
- Búsqueda en tiempo real
- Gestión de imágenes de perfil
- Actualización de estado (ACTIVE/INACTIVE)

#### Gestión de Centros
- CRUD completo de centros deportivos
- Información de contacto y ubicación
- Gestión de horarios por día
- Gestión de capacidad
- Amenidades y servicios

#### Gestión de Máquinas
- CRUD completo de equipamiento
- Categorización por tipo (CARDIO, STRENGTH, FUNCTIONAL, OTHER)
- Control de estados (OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE)
- Tracking de mantenimiento
- Asignación por centro

#### Gestión de Clases
- CRUD completo de clases
- Programación de horarios
- Asignación de entrenadores
- Control de capacidad y cupos
- Inscripción de usuarios
- Estados de clase (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)

#### Gestión de Entrenadores
- CRUD completo de entrenadores
- Asignación a centros
- Vinculación con clases

#### Dashboard
- Vista general del sistema
- Estadísticas en tiempo real
- Acceso rápido a funciones principales
- Información personalizada por rol

#### Sistema QR
- Generación de códigos QR personales
- Escáner QR para control de acceso
- Validación en tiempo real
- Restricción por roles (SUPERADMIN, ADMIN_CENTER)

#### Internacionalización (i18n)
- Soporte para 3 idiomas:
  - 🇪🇸 Español (por defecto)
  - 🇬🇧 Inglés
  - 🇫🇷 Francés
- Traducción dinámica de toda la interfaz
- Persistencia de preferencia de idioma
- Selector de idioma en navbar

#### Sistema de Temas
- Modo claro y oscuro
- Toggle en todas las páginas
- Persistencia de preferencia
- Transiciones suaves
- Integración con Tailwind CSS

#### Componentes Compartidos
- Navbar responsive con navegación
- Footer con información
- Theme Toggle component
- Language Selector component
- Error Toast para notificaciones
- Profile Image Manager

### 🔧 Tecnologías Implementadas

#### Core
- Angular 19.2 con Standalone Components
- TypeScript 5.7
- RxJS 7.8 para programación reactiva
- Angular Signals para estado reactivo

#### UI/UX
- Tailwind CSS 3.4 para estilos
- SCSS como preprocesador
- Responsive design (mobile-first)
- Dark mode support

#### Utilidades
- @ngx-translate/core 17.0 para i18n
- html5-qrcode 2.3 para QR
- jsonwebtoken para manejo de JWT

#### Testing
- Jasmine 5.6
- Karma 6.4

#### Build & Deploy
- Angular CLI 19.2
- Vercel para hosting
- Configuración para producción optimizada

### 🏗️ Arquitectura

- Arquitectura modular con separación de concerns
- Core module para funcionalidad esencial (services, guards, models)
- Feature modules para páginas
- Shared module para componentes reutilizables
- Dependency Injection con inject() function
- Guards funcionales para protección de rutas
- HTTP Interceptors para manejo de tokens

### 🔐 Seguridad

- Autenticación basada en JWT
- Control de acceso basado en roles (RBAC)
- HTTP Interceptors para seguridad
- Guards de protección en todas las rutas sensibles
- Validación de tokens
- Sanitización automática de Angular contra XSS
- Headers de seguridad configurados

### 📚 Documentación

- README.md completo con guía de inicio
- ARCHITECTURE.md con documentación técnica detallada
- CONTRIBUTING.md con guías de contribución
- API.md con documentación de endpoints
- DEPLOYMENT.md con guías de despliegue
- SECURITY.md con prácticas de seguridad
- docs/README.md como índice de documentación

### 🐛 Correcciones

No aplica (release inicial)

### 🗑️ Deprecaciones

No aplica (release inicial)

---

## Tipos de Cambios

- `Added` - para nuevas características
- `Changed` - para cambios en funcionalidad existente
- `Deprecated` - para características que serán removidas
- `Removed` - para características removidas
- `Fixed` - para corrección de bugs
- `Security` - para correcciones de seguridad

## Cómo Contribuir al Changelog

Al crear un PR, añade una entrada bajo `[Unreleased]` en la sección apropiada:

```markdown
### Added
- Nueva funcionalidad de reservas (#123)

### Fixed
- Corrección en validación de formularios (#124)
```

Cuando se hace un release, el mantenedor moverá los cambios a una nueva versión con fecha.

---

**Leyenda de Emojis**:
- 🎉 Release importante
- ✨ Nueva característica
- 🐛 Bug fix
- 🔒 Seguridad
- 📚 Documentación
- ♻️ Refactorización
- 🚀 Performance
- 💄 UI/Estilos
- 🌐 Internacionalización
- 🔧 Configuración
- 🗑️ Deprecación/Remoción

[Unreleased]: https://github.com/Mariogarluu/Meta_Force_front/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Mariogarluu/Meta_Force_front/releases/tag/v1.0.0
