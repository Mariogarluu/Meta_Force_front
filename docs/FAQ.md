# Preguntas Frecuentes (FAQ)

## 📋 Tabla de Contenidos

- [General](#general)
- [Instalación y Configuración](#instalación-y-configuración)
- [Desarrollo](#desarrollo)
- [Despliegue](#despliegue)
- [Seguridad](#seguridad)
- [Troubleshooting](#troubleshooting)

---

## 🌟 General

### ¿Qué es Meta Force Frontend?

Meta Force Frontend es una aplicación web desarrollada con Angular 19 para la gestión integral de centros deportivos. Permite administrar usuarios, centros, máquinas, clases y entrenadores con un sistema completo de autenticación y autorización.

### ¿Qué tecnologías utiliza?

- **Frontend Framework**: Angular 19.2
- **Lenguaje**: TypeScript 5.7
- **Estilos**: Tailwind CSS 3.4 + SCSS
- **Estado**: Angular Signals + RxJS
- **Internacionalización**: ngx-translate
- **Backend API**: Node.js/Express (repositorio separado)
- **Despliegue**: Vercel

### ¿Qué navegadores son compatibles?

La aplicación es compatible con:
- ✅ Chrome/Edge (últimas 2 versiones)
- ✅ Firefox (últimas 2 versiones)
- ✅ Safari (últimas 2 versiones)
- ⚠️ Internet Explorer: NO soportado

### ¿Es una aplicación responsive?

Sí, la aplicación está optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1440px+)

---

## ⚙️ Instalación y Configuración

### ¿Cuáles son los requisitos mínimos?

```bash
Node.js: v18.0.0 o superior
npm: 9.0.0 o superior
RAM: 4GB mínimo (8GB recomendado)
Espacio en disco: 500MB para dependencias
```

### ¿Cómo instalo el proyecto?

```bash
git clone https://github.com/Mariogarluu/Meta_Force_front.git
cd Meta_Force_front
npm install
npm start
```

Ver [README.md](../README.md) para más detalles.

### ¿Cómo configuro el backend?

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend-url.com/api'
};
```

### ¿Puedo usar un backend local?

Sí, en `src/environments/environment.development.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

Luego inicia con: `npm start` (usa automáticamente development)

### ¿Cómo cambio el puerto de desarrollo?

```bash
ng serve --port 4300
# o
npm start -- --port 4300
```

---

## 👨‍💻 Desarrollo

### ¿Cómo creo un nuevo componente?

```bash
# Con Angular CLI
ng generate component pages/my-component

# Standalone component (recomendado)
ng generate component pages/my-component --standalone
```

### ¿Cómo añado traducciones?

1. Añade las keys en los archivos de idioma:
   - `public/assets/i18n/es.json`
   - `public/assets/i18n/en.json`
   - `public/assets/i18n/fr.json`

2. Usa en el template:
```html
<h1>{{ 'my_section.title' | translate }}</h1>
```

Ver [README.md - Internacionalización](../README.md#-internacionalización-i18n)

### ¿Cómo protejo una ruta con roles?

```typescript
import { roleGuard } from './core/guards/role.guard';

{
  path: 'admin-only',
  component: AdminComponent,
  canActivate: [authGuard, roleGuard('SUPERADMIN')]
}
```

### ¿Cómo hago una petición HTTP al backend?

```typescript
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export class MyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/my-endpoint`;

  getData() {
    return this.http.get(this.apiUrl);
  }
}
```

El token JWT se añade automáticamente mediante el interceptor.

### ¿Cómo uso Signals?

```typescript
import { signal, computed } from '@angular/core';

export class MyComponent {
  // Signal básico
  count = signal(0);
  
  // Computed signal
  doubled = computed(() => this.count() * 2);
  
  increment() {
    this.count.update(value => value + 1);
  }
}
```

```html
<p>Count: {{ count() }}</p>
<p>Doubled: {{ doubled() }}</p>
<button (click)="increment()">+</button>
```

### ¿Dónde pongo los estilos globales?

- **Estilos globales**: `src/styles.scss`
- **Variables**: `src/styles/_variables.scss`
- **Componente específico**: `component.scss`

Preferir Tailwind classes en templates cuando sea posible.

---

## 🚀 Despliegue

### ¿Cómo hago build para producción?

```bash
npm run build -- --configuration production
```

Los archivos estarán en `dist/credentials/browser/`

### ¿Cómo despliego en Vercel?

**Opción 1 - Automático**:
1. Conecta el repositorio en vercel.com
2. Vercel detecta Angular automáticamente
3. Deploy automático en cada push

**Opción 2 - Manual**:
```bash
npm install -g vercel
vercel login
vercel --prod
```

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para más detalles.

### ¿Puedo desplegar en otro hosting?

Sí, puedes usar:
- Netlify
- Firebase Hosting
- AWS S3 + CloudFront
- Servidor propio con Nginx

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para configuraciones.

### ¿Cómo configuro variables de entorno en producción?

Angular usa archivos de entorno en **build time**, no runtime:

1. Edita `src/environments/environment.ts` antes del build
2. O usa file replacement en `angular.json`

Para Vercel, las variables deben estar en el código fuente, no en Vercel Environment Variables.

---

## 🔐 Seguridad

### ¿Cómo funciona la autenticación?

1. Usuario hace login con email/password
2. Backend valida y devuelve JWT token
3. Frontend guarda token en localStorage
4. HTTP Interceptor añade token en cada petición
5. Backend valida token en cada request

### ¿Por qué se guarda el token en localStorage?

**localStorage** es la opción actual por simplicidad. Para mayor seguridad, se recomienda migrar a **HttpOnly cookies** en el futuro.

**Pros de localStorage**:
- ✅ Fácil de implementar
- ✅ Funciona con APIs CORS

**Contras**:
- ⚠️ Vulnerable a XSS (mitigado por Angular)

Ver [SECURITY.md](./SECURITY.md) para más detalles.

### ¿Qué roles existen y qué pueden hacer?

| Rol | Permisos |
|-----|----------|
| **SUPERADMIN** | Acceso completo al sistema |
| **ADMIN_CENTER** | Gestión de su centro específico |
| **CLIENT** | Ver clases, su perfil, generar QR |

Ver [SECURITY.md - Roles y Permisos](./SECURITY.md#roles-y-permisos)

### ¿Cómo reporto una vulnerabilidad de seguridad?

**NO crear issue público**. Contactar a: `security@metaforce.com`

Ver [SECURITY.md - Reporte de Vulnerabilidades](./SECURITY.md#-reporte-de-vulnerabilidades)

### ¿El sistema es seguro contra XSS?

Sí, Angular sanitiza automáticamente todas las interpolaciones y property bindings. Además:
- ✅ No usamos `innerHTML` sin sanitización
- ✅ Headers de seguridad configurados
- ✅ CORS configurado apropiadamente

---

## 🐛 Troubleshooting

### Error: "Cannot find module @angular/..."

```bash
# Solución: Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: Puerto 4200 ya en uso

```bash
# Opción 1: Matar el proceso
lsof -ti:4200 | xargs kill -9

# Opción 2: Usar otro puerto
ng serve --port 4300
```

### Error: "JavaScript heap out of memory" al hacer build

```bash
# Aumentar memoria de Node.js
export NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

### Las traducciones no funcionan

1. Verifica que existan los archivos en `public/assets/i18n/`
2. Verifica que las keys existan en todos los idiomas
3. Limpia caché del navegador
4. Revisa la consola del navegador para errores

### El tema (dark/light) no persiste

El tema se guarda en localStorage con la key `theme_preference`. Verifica:
1. Que localStorage esté habilitado en el navegador
2. Que no haya extensiones bloqueando localStorage
3. La consola del navegador para errores

### Las rutas no funcionan después del deploy (404)

**Problema**: El servidor no está configurado para SPA.

**Solución**:
- **Vercel**: Verifica `vercel.json` tiene rewrites
- **Nginx**: Añade `try_files $uri $uri/ /index.html;`

Ver [DEPLOYMENT.md - Troubleshooting](./DEPLOYMENT.md#-troubleshooting)

### Error 401 al hacer peticiones a la API

**Causas posibles**:
1. Token expirado → Hacer logout y login nuevamente
2. Token inválido → Revisar localStorage
3. Backend no recibe el token → Verificar interceptor
4. CORS → Verificar configuración del backend

**Debug**:
```typescript
// Verificar token en consola
console.log(localStorage.getItem('jwt_token'));
```

### Error CORS al conectar con el backend

**Solución**: El backend debe configurar CORS para permitir el origen del frontend:

```javascript
// Backend (Node.js/Express)
app.use(cors({
  origin: ['http://localhost:4200', 'https://tu-frontend.vercel.app'],
  credentials: true
}));
```

### Los estilos de Tailwind no se aplican

1. Verifica `tailwind.config.js` incluye los paths correctos
2. Asegúrate de que `@tailwind` directives estén en `styles.scss`
3. Limpia y rebuilda:
```bash
rm -rf .angular dist
npm start
```

### Error al ejecutar tests

```bash
# Error: Chrome no encontrado
# Solución: Instalar Chrome o usar ChromeHeadless

# En angular.json, verifica:
"browsers": "ChromeHeadless"

# O instala Chrome:
# Ubuntu/Debian:
sudo apt-get install chromium-browser

# macOS:
brew install --cask google-chrome
```

---

## 💡 Tips y Trucos

### ¿Cómo mejoro el performance?

1. **Lazy Loading**: Carga módulos bajo demanda
2. **OnPush Change Detection**: Optimiza detección de cambios
3. **TrackBy en *ngFor**: Mejora rendering de listas
4. **Signals**: Usa para estado reactivo eficiente

### ¿Cómo debugging en desarrollo?

```typescript
// Angular DevTools (Chrome Extension)
// Permite inspeccionar componentes y cambios

// Console logs condicionales
if (!environment.production) {
  console.log('Debug info:', data);
}

// Breakpoints en Chrome DevTools
debugger; // Detiene ejecución
```

### ¿Cómo actualizo dependencias?

```bash
# Ver dependencias desactualizadas
npm outdated

# Actualizar a versiones compatibles
npm update

# Actualizar Angular
ng update @angular/core @angular/cli

# Auditar seguridad
npm audit
npm audit fix
```

### ¿Dónde encuentro más información?

- 📚 [Documentación Completa](./README.md)
- 🏗️ [Arquitectura](./ARCHITECTURE.md)
- 🤝 [Contribuir](./CONTRIBUTING.md)
- 🚀 [Despliegue](./DEPLOYMENT.md)
- 🔒 [Seguridad](./SECURITY.md)
- 📡 [API](./API.md)

---

## ❓ ¿No encuentras tu pregunta?

Si tu pregunta no está aquí:

1. **Busca en la documentación**: Usa el [índice de docs](./README.md)
2. **Revisa issues en GitHub**: Puede que alguien ya la haya preguntado
3. **Crea un issue**: Usa el label `question`
4. **Contacta al equipo**: info@metaforce.com

---

**Última actualización**: Diciembre 2024

**¿Encontraste un error en este FAQ?** Contribuye corrigiéndolo: lee [CONTRIBUTING.md](./CONTRIBUTING.md)
