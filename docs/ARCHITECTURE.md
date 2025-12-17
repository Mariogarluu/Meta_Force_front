# Arquitectura Técnica - Meta Force Frontend

## 📐 Visión General

Meta Force Frontend es una **Single Page Application (SPA)** construida con Angular 19 que sigue una arquitectura modular y escalable basada en componentes standalone.

## 🏛️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentación (UI)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │  Shared  │  │  Layout  │  │  Routing │   │
│  │Components│  │Components│  │Components│  │  Guards  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Capa de Servicios                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │  Users   │  │ Centers  │  │ Machines │   │
│  │ Services │  │ Services │  │ Services │  │ Services │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Theme   │  │Translation│ │Notification│                │
│  │ Service  │  │  Service  │ │  Service  │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Interceptores & Middleware                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth Interceptor (JWT Token Injection)             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Capa de Comunicación                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           HttpClient (Angular)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                 Backend REST API
         (https://meta-force-back.vercel.app/api)
```

## 🧩 Patrones de Diseño

### 1. **Standalone Components**
Todos los componentes son standalone (Angular 19+), eliminando la necesidad de NgModules.

```typescript
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent { }
```

### 2. **Dependency Injection**
Uso intensivo del sistema DI de Angular con `inject()` function.

```typescript
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
}
```

### 3. **Reactive State Management**
Uso de **Angular Signals** para gestión de estado reactivo.

```typescript
private _currentUser = signal<User | null>(null);
public readonly currentUser = this._currentUser.asReadonly();
```

### 4. **Observer Pattern**
RxJS para operaciones asíncronas y streams de datos.

```typescript
loadUserProfile(): Observable<User> {
  return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
    tap(user => this._currentUser.set(user)),
    catchError(this.handleError)
  );
}
```

### 5. **Guard Pattern**
Protección de rutas mediante guards funcionales.

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
```

### 6. **Interceptor Pattern**
Interceptores HTTP para añadir tokens automáticamente.

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};
```

## 📂 Estructura Modular

### Core Module (Virtual)
Funcionalidad esencial de la aplicación:

```
core/
├── guards/          # Protección de rutas
│   ├── auth.guard.ts      # Verificación de autenticación
│   ├── guest.guard.ts     # Solo usuarios no autenticados
│   └── role.guard.ts      # Verificación de roles
├── interceptors/    # HTTP interceptors
│   └── auth.interceptor.ts
├── models/          # Tipos e interfaces TypeScript
│   ├── user.ts
│   ├── center.ts
│   ├── machine.ts
│   ├── class.ts
│   └── auth.ts
└── services/        # Servicios core
    ├── auth.service.ts
    ├── users.service.ts
    ├── centers.service.ts
    ├── machines.service.ts
    ├── classes.service.ts
    ├── theme.service.ts
    ├── translation.service.ts
    ├── notification.service.ts
    └── error.service.ts
```

### Feature Modules (Pages)
Cada página es un módulo de funcionalidad:

```
pages/
├── home/           # Landing page
├── login/          # Autenticación
├── register/       # Registro
├── dashboard/      # Panel principal
├── users/          # CRUD usuarios
├── centers/        # CRUD centros
├── machines/       # CRUD máquinas
├── clases/         # CRUD clases
├── trainers/       # CRUD entrenadores
├── qr/             # Generador QR
└── qr-scanner/     # Escáner QR
```

### Shared Module (Virtual)
Componentes reutilizables:

```
shared/
└── components/
    ├── navbar/                # Barra de navegación
    ├── footer/                # Pie de página
    ├── theme-toggle/          # Selector de tema
    ├── language-selector/     # Selector de idioma
    ├── error-toast/           # Notificaciones de error
    └── profile-image-manager/ # Gestión de imágenes
```

## 🔄 Flujo de Datos

### Autenticación y Estado del Usuario

```
┌──────────┐     login()      ┌──────────────┐
│  Login   │─────────────────>│ AuthService  │
│Component │                   │              │
└──────────┘                   │ - Envía POST │
                               │ - Guarda JWT │
                               │ - Set Signal │
                               └──────┬───────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │ localStorage │
                               │  jwt_token   │
                               └──────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
            ┌───────────────┐                   ┌──────────────┐
            │ HTTP Request  │                   │   Guards     │
            │ + Bearer Token│                   │  Verifican   │
            └───────────────┘                   │  el estado   │
                                                └──────────────┘
```

### CRUD Operations

```
┌──────────┐   Acción     ┌──────────────┐    HTTP     ┌─────────┐
│Component │─────────────>│   Service    │────────────>│   API   │
│          │              │              │             │         │
│          │<─────────────│  Observable  │<────────────│Response │
└──────────┘   Datos      └──────────────┘             └─────────┘
     │
     ▼
┌──────────┐
│Template  │
│Actualiza │
└──────────┘
```

## 🛡️ Seguridad en la Arquitectura

### Capas de Seguridad

1. **Guards de Rutas**
   - `authGuard`: Verifica autenticación
   - `guestGuard`: Solo usuarios no autenticados
   - `roleGuard`: Verifica roles específicos

2. **HTTP Interceptors**
   - Inyección automática de tokens JWT
   - Manejo centralizado de errores 401/403

3. **Servicios de Seguridad**
   - Almacenamiento seguro de tokens
   - Validación de tokens expirados
   - Logout automático en caso de tokens inválidos

4. **Control de Acceso Basado en Roles (RBAC)**
   ```typescript
   {
     path: 'qr-scanner',
     component: QrScannerComponent,
     canActivate: [authGuard, roleGuard('SUPERADMIN', 'ADMIN_CENTER')]
   }
   ```

## 🎨 Gestión de UI/UX

### Sistema de Temas

```typescript
// theme.service.ts
export class ThemeService {
  private _isDarkMode = signal<boolean>(false);
  
  toggleTheme(): void {
    const newMode = !this._isDarkMode();
    this._isDarkMode.set(newMode);
    this.updateDOM(newMode);
    this.savePreference(newMode);
  }
  
  private updateDOM(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
```

### Sistema de Internacionalización

```typescript
// translation.service.ts
export class TranslationService {
  private translate = inject(TranslateService);
  
  setLanguage(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('preferred_language', lang);
  }
}
```

## 🔌 Integración con Backend

### HttpClient Configuration

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    // ... otros providers
  ]
};
```

### Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  create(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  update(id: string, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

## 🧪 Testing Strategy

### Unit Tests
- **Framework**: Jasmine + Karma
- **Cobertura**: Servicios y componentes críticos
- **Mocking**: HttpClientTestingModule para HTTP

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should login successfully', () => {
    const mockResponse = { token: 'mock-token', user: {...} };
    
    service.login({...}).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
```

## 📦 Build y Optimización

### Producción

```json
{
  "configurations": {
    "production": {
      "optimization": true,
      "outputHashing": "all",
      "sourceMap": false,
      "extractCss": true,
      "namedChunks": false,
      "aot": true,
      "extractLicenses": true,
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "2MB",
          "maximumError": "3MB"
        }
      ]
    }
  }
}
```

### Lazy Loading (Futuro)
Aunque actualmente usa eager loading, la arquitectura permite lazy loading:

```typescript
export const routes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users.component')
      .then(m => m.UsersComponent),
    canActivate: [authGuard]
  }
];
```

## 🔮 Consideraciones Futuras

### Posibles Mejoras

1. **State Management Global**
   - Implementar NgRx o Akita para estado global complejo
   - Migración gradual desde Signals

2. **PWA (Progressive Web App)**
   - Service Workers para offline support
   - Cache de datos críticos
   - Push notifications

3. **Lazy Loading**
   - Cargar módulos bajo demanda
   - Reducir el bundle inicial

4. **Server-Side Rendering (SSR)**
   - Mejor SEO
   - Mejor rendimiento inicial

5. **Micro Frontends**
   - Separación de features grandes
   - Equipos independientes

## 📊 Métricas y Performance

### Bundle Size (Actual)
- Initial: ~2MB (objetivo: <2MB)
- Lazy chunks: N/A (eager loading)

### Lighthouse Score Objetivos
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >90

## 🔗 Referencias

- [Angular Architecture Guide](https://angular.dev/guide/architecture)
- [Angular Style Guide](https://angular.dev/style-guide)
- [RxJS Best Practices](https://rxjs.dev/guide/overview)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
