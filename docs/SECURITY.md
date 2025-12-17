# Documentación de Seguridad - Meta Force Frontend

## 🛡️ Visión General de Seguridad

Meta Force Frontend implementa múltiples capas de seguridad para proteger los datos de los usuarios y prevenir vulnerabilidades comunes.

## 📋 Tabla de Contenidos

- [Autenticación y Autorización](#autenticación-y-autorización)
- [Protección de Rutas](#protección-de-rutas)
- [Seguridad HTTP](#seguridad-http)
- [Almacenamiento de Datos](#almacenamiento-de-datos)
- [Prevención de Vulnerabilidades](#prevención-de-vulnerabilidades)
- [Mejores Prácticas](#mejores-prácticas)
- [Auditoría y Monitoreo](#auditoría-y-monitoreo)
- [Reporte de Vulnerabilidades](#reporte-de-vulnerabilidades)

## 🔐 Autenticación y Autorización

### JWT (JSON Web Tokens)

El sistema utiliza JWT para autenticación stateless:

```typescript
// Estructura del Token
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "CLIENT",
  "iat": 1640000000,  // Issued at
  "exp": 1640086400   // Expiration (24h después)
}
```

### Flujo de Autenticación

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│  User    │                 │ Frontend │                 │ Backend  │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │  1. Login Credentials      │                            │
     │──────────────────────────> │                            │
     │                            │  2. POST /auth/login       │
     │                            │──────────────────────────> │
     │                            │                            │
     │                            │  3. JWT Token + User Data  │
     │                            │<────────────────────────── │
     │                            │                            │
     │                            │  4. Store JWT in           │
     │                            │     localStorage           │
     │                            │                            │
     │  5. Access Granted         │                            │
     │<────────────────────────── │                            │
     │                            │                            │
     │  6. Subsequent Requests    │                            │
     │──────────────────────────> │  7. Add Bearer Token       │
     │                            │──────────────────────────> │
     │                            │  8. Validate Token         │
     │                            │<────────────────────────── │
```

### Implementación en el Código

```typescript
// auth.service.ts
export class AuthService {
  private readonly TOKEN_KEY = 'jwt_token';
  
  /**
   * Almacena el token de forma segura en localStorage.
   * Nota: Para mayor seguridad, considerar HttpOnly cookies en el futuro.
   */
  private setSession(authResult: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.token);
    this._currentUser.set(authResult.user);
  }
  
  /**
   * Obtiene el token almacenado.
   * Valida que no esté expirado antes de usar.
   */
  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token && this.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    return token;
  }
  
  /**
   * Verifica si el token JWT ha expirado.
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      const expirationDate = payload.exp * 1000;
      return Date.now() > expirationDate;
    } catch {
      return true;
    }
  }
  
  /**
   * Cierra sesión de forma segura.
   * Limpia todos los datos sensibles del almacenamiento.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
```

### Roles y Permisos

El sistema implementa Control de Acceso Basado en Roles (RBAC):

| Rol | Permisos | Acceso |
|-----|----------|--------|
| **SUPERADMIN** | Todos los permisos | • Gestión completa de usuarios<br>• Gestión de centros<br>• Gestión de máquinas<br>• Gestión de clases<br>• Gestión de entrenadores<br>• Acceso al escáner QR |
| **ADMIN_CENTER** | Permisos de su centro | • Gestión de usuarios de su centro<br>• Gestión de máquinas de su centro<br>• Gestión de clases<br>• Acceso al escáner QR<br>• Dashboard y estadísticas |
| **CLIENT** | Permisos limitados | • Ver su perfil<br>• Editar su perfil<br>• Ver clases<br>• Inscribirse en clases<br>• Generar QR personal<br>• Dashboard básico |

## 🚧 Protección de Rutas

### Guards

El sistema utiliza tres tipos de guards:

#### 1. Auth Guard

Protege rutas que requieren autenticación:

```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.currentUser();
  
  if (!user) {
    // Redirigir al login y recordar la ruta destino
    router.navigate(['/login'], { 
      state: { navigateTo: state.url } 
    });
    return false;
  }
  
  return true;
};
```

#### 2. Guest Guard

Evita que usuarios autenticados accedan a login/register:

```typescript
// guest.guard.ts
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.currentUser()) {
    router.navigate(['/dashboard']);
    return false;
  }
  
  return true;
};
```

#### 3. Role Guard

Protege rutas basadas en roles específicos:

```typescript
// role.guard.ts
export const roleGuard = (...allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    
    const user = auth.currentUser();
    
    if (!user) {
      router.navigate(['/login'], { state: { navigateTo: state.url } });
      return false;
    }

    if (!allowedRoles.includes(user.role)) {
      // Usuario autenticado pero sin permisos
      router.navigate(['/dashboard']);
      return false;
    }
    
    return true;
  };
};
```

### Uso en Rutas

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]  // Solo usuarios no autenticados
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]  // Requiere autenticación
  },
  {
    path: 'qr-scanner',
    component: QrScannerComponent,
    canActivate: [
      authGuard,
      roleGuard('SUPERADMIN', 'ADMIN_CENTER')  // Roles específicos
    ]
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [
      authGuard,
      roleGuard('SUPERADMIN', 'ADMIN_CENTER')
    ]
  }
];
```

## 🔒 Seguridad HTTP

### HTTP Interceptor

Interceptor que añade automáticamente el token JWT:

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt_token');
  
  // No añadir token a peticiones externas
  if (!req.url.includes(environment.apiUrl)) {
    return next(req);
  }
  
  if (token) {
    // Clonar petición y añadir header de autorización
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token inválido o expirado
        const authService = inject(AuthService);
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
```

### CORS (Cross-Origin Resource Sharing)

El backend debe configurar CORS apropiadamente:

```typescript
// Backend configuration (reference)
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://meta-force-front.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### HTTPS

**Producción**: Todo el tráfico debe usar HTTPS.

```nginx
# Nginx - Forzar HTTPS
server {
    listen 80;
    server_name metaforce.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name metaforce.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # ... resto de configuración
}
```

## 💾 Almacenamiento de Datos

### LocalStorage

**Datos Almacenados**:
```typescript
// Datos sensibles
localStorage.setItem('jwt_token', token);  // ⚠️ Token JWT

// Preferencias de usuario (no sensibles)
localStorage.setItem('preferred_language', 'es');  // ✅ Seguro
localStorage.setItem('theme_preference', 'dark');  // ✅ Seguro
```

**⚠️ Consideraciones de Seguridad**:

1. **localStorage es vulnerable a XSS**: Si un atacante puede ejecutar JavaScript en tu sitio, puede acceder a localStorage.

2. **Tokens en localStorage**: Para mayor seguridad, se recomienda usar **HttpOnly cookies** en el futuro:

```typescript
// Futura mejora: Usar HttpOnly cookies
// El backend envía la cookie:
res.cookie('token', jwt, {
  httpOnly: true,  // No accesible desde JavaScript
  secure: true,    // Solo HTTPS
  sameSite: 'strict'  // Protección CSRF
});
```

3. **No almacenar datos sensibles**: Nunca almacenar contraseñas, números de tarjetas, etc.

### SessionStorage

Para datos temporales que deben limpiarse al cerrar la pestaña:

```typescript
// Guardar estado temporal
sessionStorage.setItem('temp_form_data', JSON.stringify(formData));
```

## 🔓 Prevención de Vulnerabilidades

### XSS (Cross-Site Scripting)

Angular protege automáticamente contra XSS mediante:

1. **Sanitización Automática**: Angular sanitiza valores en templates.

```html
<!-- Angular sanitiza automáticamente -->
<div>{{ userInput }}</div>  <!-- ✅ Seguro -->
<div [innerHTML]="userInput"></div>  <!-- ⚠️ Angular sanitiza HTML peligroso -->
```

2. **Bypass explícito (usar con precaución)**:

```typescript
import { DomSanitizer } from '@angular/platform-browser';

constructor(private sanitizer: DomSanitizer) {}

// Solo si confías en el HTML
getSafeHtml(html: string) {
  return this.sanitizer.bypassSecurityTrustHtml(html);
}
```

**✅ Buenas Prácticas**:
```typescript
// ✅ Correcto: Usar interpolación
<p>{{ userName }}</p>

// ✅ Correcto: Property binding
<input [value]="userInput">

// ❌ Evitar: innerHTML sin sanitización
<div [innerHTML]="unsafeHtml"></div>

// ⚠️ Usar con cuidado: Traduciones con HTML
{{ 'message' | translate }}  // ✅ Angular sanitiza
```

### CSRF (Cross-Site Request Forgery)

**Protección**:

1. **SameSite Cookies** (cuando se implementen):
```typescript
sameSite: 'strict'  // La cookie no se envía en peticiones cross-site
```

2. **CORS Apropiado**: El backend solo acepta peticiones del frontend autorizado.

3. **Verificación de Origen**: El backend verifica el header `Origin`.

### Injection Attacks

**SQL Injection**: No aplica (el frontend no hace consultas SQL directamente).

**NoSQL Injection**: El backend debe validar y sanitizar inputs.

**Template Injection**: Angular protege automáticamente.

### Clickjacking

**Protección**: Header `X-Frame-Options`

```nginx
# Nginx
add_header X-Frame-Options "SAMEORIGIN" always;
```

```typescript
// Vercel headers en vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

### Sensitive Data Exposure

**✅ Buenas Prácticas**:

```typescript
// ❌ NO exponer información sensible en código
const API_KEY = 'my-secret-key';  // Malo

// ❌ NO loggear datos sensibles
console.log('Password:', password);  // Malo

// ✅ Usar variables de entorno
const apiUrl = environment.apiUrl;  // Bien

// ✅ Eliminar logs en producción
if (!environment.production) {
  console.log('Debug info');
}
```

## 📋 Mejores Prácticas

### 1. Validación de Entrada

```typescript
// Validar en el frontend (UX)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  this.errorService.showError('Email inválido');
  return;
}

// Backend SIEMPRE debe validar también (seguridad)
```

### 2. Manejo de Errores

```typescript
// ❌ NO exponer detalles del servidor
catchError(error => {
  console.error('API Error:', error);  // Solo en desarrollo
  return throwError(() => new Error('Ocurrió un error'));
})

// ✅ Mensajes genéricos al usuario
catchError(error => {
  if (error.status === 401) {
    return throwError(() => new Error('Sesión expirada'));
  }
  return throwError(() => new Error('Error al procesar la solicitud'));
})
```

### 3. Limpieza de Datos

```typescript
// Limpiar datos al cerrar sesión
logout(): void {
  localStorage.clear();  // Limpia TODO
  // o selectivamente:
  localStorage.removeItem('jwt_token');
  this._currentUser.set(null);
}
```

### 4. Timeouts de Sesión

```typescript
// Implementar timeout de inactividad
private inactivityTimeout: any;
private readonly TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutos

setupInactivityTimer(): void {
  this.resetTimer();
  
  ['click', 'mousemove', 'keypress'].forEach(event => {
    document.addEventListener(event, () => this.resetTimer());
  });
}

resetTimer(): void {
  clearTimeout(this.inactivityTimeout);
  this.inactivityTimeout = setTimeout(() => {
    this.authService.logout();
    this.notificationService.show('Sesión cerrada por inactividad');
  }, this.TIMEOUT_DURATION);
}
```

### 5. Dependencias Seguras

```bash
# Auditar dependencias regularmente
npm audit

# Corregir vulnerabilidades
npm audit fix

# Actualizar dependencias
npm update
```

## 🔍 Auditoría y Monitoreo

### Logs de Seguridad

```typescript
// Registrar eventos importantes
export class SecurityLogger {
  logLoginAttempt(email: string, success: boolean): void {
    if (!success) {
      console.warn('Failed login attempt:', email);
      // Enviar a servicio de monitoreo
    }
  }
  
  logUnauthorizedAccess(route: string, user: User): void {
    console.error('Unauthorized access attempt:', { route, user });
    // Enviar alerta
  }
}
```

### Herramientas de Auditoría

1. **npm audit**: Vulnerabilidades en dependencias
2. **OWASP Dependency-Check**: Análisis de dependencias
3. **Lighthouse**: Auditoría de seguridad en navegador
4. **Snyk**: Monitoreo continuo de vulnerabilidades

## 🚨 Reporte de Vulnerabilidades

Si descubres una vulnerabilidad de seguridad:

### Proceso de Reporte

1. **NO crear un issue público** con detalles de la vulnerabilidad
2. Contactar al equipo de seguridad directamente: `security@metaforce.com`
3. Incluir:
   - Descripción detallada
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de solución (opcional)

### Tiempo de Respuesta

- **Reconocimiento**: 48 horas
- **Evaluación inicial**: 5 días
- **Corrección**: Según severidad
  - Crítica: 24-48 horas
  - Alta: 1 semana
  - Media: 2 semanas
  - Baja: 1 mes

## ✅ Checklist de Seguridad

Antes de desplegar:

- [ ] Todas las rutas protegidas tienen guards apropiados
- [ ] Tokens JWT se validan correctamente
- [ ] HTTPS configurado en producción
- [ ] Headers de seguridad configurados
- [ ] No hay logs de información sensible
- [ ] Dependencias actualizadas (`npm audit`)
- [ ] Variables de entorno correctas
- [ ] CORS configurado correctamente en backend
- [ ] Sanitización de inputs habilitada
- [ ] Error handling apropiado (no expone detalles)
- [ ] Timeout de sesión implementado
- [ ] Validación tanto en frontend como backend

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Angular Security Guide](https://angular.dev/best-practices/security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Web Security Fundamentals](https://web.dev/secure/)

---

**Nota**: La seguridad es un proceso continuo. Mantén este documento actualizado con nuevas amenazas y soluciones.

**Última actualización**: Diciembre 2024
