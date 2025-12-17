# Guía de Contribución - Meta Force Frontend

¡Gracias por tu interés en contribuir a Meta Force Frontend! Esta guía te ayudará a comenzar.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Configuración del Entorno](#configuración-del-entorno)
- [Flujo de Trabajo con Git](#flujo-de-trabajo-con-git)
- [Estándares de Código](#estándares-de-código)
- [Convenciones de Naming](#convenciones-de-naming)
- [Commits y Mensajes](#commits-y-mensajes)
- [Pull Requests](#pull-requests)
- [Testing](#testing)
- [Documentación](#documentación)

## 🤝 Código de Conducta

- Sé respetuoso con todos los miembros del equipo
- Acepta críticas constructivas de manera positiva
- Mantén un ambiente de colaboración
- Comunica claramente tus ideas y cambios

## 🛠️ Configuración del Entorno

### Requisitos Previos

```bash
# Verificar versiones instaladas
node --version  # v18.0.0 o superior
npm --version   # 9.0.0 o superior
git --version   # 2.30.0 o superior
```

### Setup Inicial

```bash
# 1. Clonar el repositorio
git clone https://github.com/Mariogarluu/Meta_Force_front.git
cd Meta_Force_front

# 2. Instalar dependencias
npm install

# 3. Copiar configuración de entorno (si es necesario)
# Normalmente no es necesario para desarrollo

# 4. Iniciar servidor de desarrollo
npm start

# 5. Verificar que funcione
# Abre http://localhost:4200 en tu navegador
```

### Configuración del Editor

Recomendamos usar **Visual Studio Code** con las siguientes extensiones:

```json
{
  "recommendations": [
    "angular.ng-template",           // Angular Language Service
    "esbenp.prettier-vscode",        // Prettier
    "dbaeumer.vscode-eslint",        // ESLint
    "bradlc.vscode-tailwindcss",     // Tailwind CSS IntelliSense
    "editorconfig.editorconfig"      // EditorConfig
  ]
}
```

El proyecto incluye `.editorconfig` que se aplicará automáticamente:
- Indentación: 2 espacios
- Charset: UTF-8
- Final de línea: LF
- TypeScript: Single quotes

## 🔄 Flujo de Trabajo con Git

### Ramas

El proyecto utiliza el siguiente esquema de ramas:

```
main (o master)     # Producción (protegida)
├── develop         # Desarrollo principal
    ├── feature/nombre-feature    # Nuevas funcionalidades
    ├── bugfix/nombre-bug        # Corrección de bugs
    ├── hotfix/nombre-hotfix     # Correcciones urgentes
    └── tu-rama-personal         # Desarrollo personal
```

### Proceso de Contribución

#### 1. Crear una Rama Personal

```bash
# Desde develop
git checkout develop
git pull origin develop

# Crear tu rama (usa tu nombre o el de la feature)
git checkout -b feature/nombre-descriptivo
# o
git checkout -b tu-nombre
```

#### 2. Desarrollar y Hacer Commits

```bash
# Ver archivos modificados
git status

# Añadir archivos al stage
git add .
# o archivos específicos
git add src/app/pages/users/users.component.ts

# Hacer commit con mensaje descriptivo
git commit -m "feat: añadir filtro de búsqueda en usuarios"

# Push a tu rama remota
git push origin feature/nombre-descriptivo
```

#### 3. Actualizar con Develop

```bash
# Antes de mergear, actualiza tu rama con develop
git checkout develop
git pull origin develop

git checkout feature/nombre-descriptivo
git merge develop

# Si hay conflictos, resuélvelos manualmente
# Luego:
git add .
git commit -m "merge: resolve conflicts with develop"
```

#### 4. Mergear a Develop

```bash
# Una vez todo funcione correctamente
git checkout develop
git merge feature/nombre-descriptivo

# Revisar que todo esté bien
npm start  # Probar la aplicación
npm test   # Ejecutar tests

# Push a develop
git push origin develop
```

### Resolución de Conflictos

Cuando encuentres conflictos durante un merge:

```bash
# 1. Git te mostrará los archivos con conflictos
git status

# 2. Abre cada archivo y busca las marcas:
# <<<<<<< HEAD
# Código de tu rama
# =======
# Código de la otra rama
# >>>>>>> develop

# 3. Edita manualmente para mantener el código correcto

# 4. Una vez resueltos todos los conflictos
git add .
git commit -m "merge: resolve conflicts"
```

**Tip**: Usa herramientas como VSCode que facilitan la resolución de conflictos.

## 📝 Estándares de Código

### TypeScript

```typescript
// ✅ CORRECTO
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;
  
  constructor(private http: HttpClient) {}
  
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error occurred:', error);
    return throwError(() => new Error('Something went wrong'));
  }
}

// ❌ INCORRECTO
export class UserService {
  apiUrl = environment.apiUrl + '/users';  // No usar concatenación
  
  constructor(private http: HttpClient) {}
  
  getUsers() {  // Falta tipo de retorno
    return this.http.get(this.apiUrl);  // Falta tipo genérico
  }
}
```

### Componentes

```typescript
// ✅ CORRECTO - Standalone Component
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {
  private userService = inject(UserService);
  users = signal<User[]>([]);

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (error) => console.error('Error loading users:', error)
    });
  }
}
```

### Templates

```html
<!-- ✅ CORRECTO -->
<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">
    {{ 'users.title' | translate }}
  </h1>
  
  @if (users().length > 0) {
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (user of users(); track user.id) {
        <app-user-card [user]="user" />
      }
    </div>
  } @else {
    <p class="text-gray-500">{{ 'users.no_users' | translate }}</p>
  }
</div>

<!-- ❌ INCORRECTO -->
<div class="container">
  <h1>Users</h1>  <!-- Texto hardcodeado, sin traducción -->
  
  <div *ngIf="users.length > 0">  <!-- Usar @if en lugar de *ngIf -->
    <div *ngFor="let user of users">  <!-- Usar @for -->
      <!-- contenido -->
    </div>
  </div>
</div>
```

### Estilos (SCSS + Tailwind)

```scss
// ✅ CORRECTO - Usar principalmente Tailwind en template
// Solo SCSS para casos específicos

// user-card.component.scss
.user-card {
  &:hover {
    @apply transform scale-105 transition-transform duration-200;
  }
  
  &__avatar {
    @apply w-16 h-16 rounded-full object-cover;
  }
}

// ❌ INCORRECTO - No reinventar lo que Tailwind ya provee
.button {
  padding: 8px 16px;
  background-color: #3b82f6;
  border-radius: 4px;
  // Mejor usar: class="px-4 py-2 bg-blue-500 rounded"
}
```

## 🏷️ Convenciones de Naming

### Archivos y Carpetas

```
✅ CORRECTO
user-list.component.ts
user-list.component.html
user-list.component.scss
user.service.ts
auth.guard.ts
app.routes.ts

❌ INCORRECTO
UserList.component.ts
userList.component.ts
user_list.component.ts
```

### Variables y Funciones

```typescript
// ✅ CORRECTO
const currentUser = signal<User | null>(null);
const isAuthenticated = computed(() => !!currentUser());

function loadUserProfile(): void { }
function handleLoginSuccess(user: User): void { }

// ❌ INCORRECTO
const current_user = signal<User | null>(null);  // No snake_case
const IsAuthenticated = computed(() => ...);      // No PascalCase para variables
function LoadUserProfile(): void { }              // No PascalCase para funciones
```

### Clases e Interfaces

```typescript
// ✅ CORRECTO
export class AuthService { }
export interface User { }
export interface AuthResponse { }
export type UserRole = 'SUPERADMIN' | 'ADMIN_CENTER' | 'CLIENT';

// ❌ INCORRECTO
export class authService { }      // Usar PascalCase
export interface IUser { }        // No prefijo I para interfaces
export interface user { }         // Usar PascalCase
```

### Constantes

```typescript
// ✅ CORRECTO
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// ❌ INCORRECTO
const apiBaseUrl = 'https://api.example.com';  // No camelCase para constantes globales
```

## 💬 Commits y Mensajes

### Conventional Commits

Usamos el estándar de [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato
<tipo>(<scope>): <descripción>

# Tipos permitidos:
feat:     # Nueva funcionalidad
fix:      # Corrección de bug
docs:     # Cambios en documentación
style:    # Cambios de formato (sin afectar código)
refactor: # Refactorización de código
test:     # Añadir o modificar tests
chore:    # Cambios en build, dependencias, etc.
perf:     # Mejoras de rendimiento
```

### Ejemplos de Buenos Commits

```bash
# Feature
git commit -m "feat(users): add search filter functionality"
git commit -m "feat(auth): implement role-based access control"

# Fix
git commit -m "fix(login): resolve token expiration issue"
git commit -m "fix(dashboard): correct data loading race condition"

# Docs
git commit -m "docs: update API integration guide"
git commit -m "docs(readme): add troubleshooting section"

# Refactor
git commit -m "refactor(services): migrate to signals for state management"

# Style
git commit -m "style(components): apply consistent formatting"

# Chore
git commit -m "chore(deps): update Angular to version 19.2"
```

### Commits Multi-línea

Para cambios más complejos:

```bash
git commit -m "feat(users): add advanced filtering system

- Add filter by role
- Add filter by status
- Add date range filter
- Implement filter persistence in localStorage

Closes #123"
```

## 🔍 Pull Requests

### Antes de Crear un PR

1. ✅ Todos los tests pasan: `npm test`
2. ✅ Build exitoso: `npm run build`
3. ✅ Sin errores de lint
4. ✅ Código revisado personalmente
5. ✅ Rama actualizada con develop
6. ✅ Conflictos resueltos

### Template de PR

```markdown
## Descripción
Breve descripción de los cambios realizados.

## Tipo de Cambio
- [ ] 🐛 Bug fix
- [ ] ✨ Nueva funcionalidad
- [ ] 💥 Breaking change
- [ ] 📝 Documentación
- [ ] ♻️ Refactorización

## ¿Cómo se ha probado?
Describe las pruebas realizadas.

## Checklist
- [ ] Mi código sigue las convenciones del proyecto
- [ ] He revisado mi propio código
- [ ] He comentado código complejo si es necesario
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan nuevas advertencias
- [ ] He añadido tests que prueban mi corrección/funcionalidad
- [ ] Todos los tests pasan localmente
- [ ] He añadido traducciones (es, en, fr)

## Screenshots (si aplica)
Añade capturas de pantalla si hay cambios visuales.
```

## 🧪 Testing

### Escribir Tests

```typescript
// user.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch users successfully', () => {
    const mockUsers = [
      { id: '1', name: 'User 1', email: 'user1@example.com' },
      { id: '2', name: 'User 2', email: 'user2@example.com' }
    ];

    service.getUsers().subscribe(users => {
      expect(users.length).toBe(2);
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests con cobertura
ng test --code-coverage

# Tests en modo watch
ng test --watch

# Tests específicos
ng test --include='**/user.service.spec.ts'
```

## 📚 Documentación

### Documentar Código

```typescript
/**
 * Servicio para la gestión de usuarios.
 * Proporciona operaciones CRUD sobre usuarios del sistema.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  /**
   * Obtiene todos los usuarios del sistema.
   * @returns Observable con array de usuarios
   * @throws Error si la petición falla
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  /**
   * Actualiza un usuario existente.
   * @param id - ID del usuario a actualizar
   * @param user - Datos actualizados del usuario
   * @returns Observable con el usuario actualizado
   */
  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }
}
```

### Mantener Documentación Actualizada

Al añadir funcionalidades:
1. Actualiza README.md si es funcionalidad principal
2. Añade a la documentación técnica si es arquitectónico
3. Documenta APIs nuevas en API.md
4. Añade ejemplos de uso si es complejo

## ✅ Checklist Final

Antes de considerar completada tu contribución:

- [ ] Código funciona correctamente
- [ ] Tests pasan exitosamente
- [ ] Build de producción exitoso
- [ ] Sin errores de lint
- [ ] Código documentado apropiadamente
- [ ] Traducciones añadidas (es, en, fr)
- [ ] README actualizado (si aplica)
- [ ] Commits siguen convenciones
- [ ] Branch actualizado con develop
- [ ] Sin conflictos
- [ ] Revisión personal del código

## 🆘 ¿Necesitas Ayuda?

Si tienes dudas o problemas:

1. Revisa la documentación en `/docs`
2. Busca en issues existentes
3. Pregunta al equipo en el canal de desarrollo
4. Crea un issue con el tag `question`

## 📖 Recursos Adicionales

- [Angular Style Guide](https://angular.dev/style-guide)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [RxJS Documentation](https://rxjs.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

¡Gracias por contribuir a Meta Force! 🎉
