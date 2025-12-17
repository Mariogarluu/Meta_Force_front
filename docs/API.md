# Documentación de API - Meta Force Frontend

> **Versión de API**: v1.0  
> **Última actualización**: Diciembre 2024

## 📡 Información General

La aplicación frontend se conecta a un backend REST API construido con Node.js/Express y MongoDB.

### Base URL

- **Producción**: `https://meta-force-back.vercel.app/api`
- **Desarrollo**: Configurado en `src/environments/environment.development.ts`

### Autenticación

Todos los endpoints (excepto login y register) requieren autenticación mediante JWT.

**Header requerido**:
```http
Authorization: Bearer <jwt_token>
```

El token se obtiene al hacer login y se almacena en `localStorage` con la key `jwt_token`.

## 🔐 Endpoints de Autenticación

### POST /auth/register
Registro de nuevo usuario.

**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "CLIENT" | "ADMIN_CENTER" | "SUPERADMIN",
  "center": "string (optional, ObjectId del centro)",
  "image": "string (optional, URL o base64)"
}
```

**Response** (201 Created):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "CLIENT",
    "center": "507f1f77bcf86cd799439012",
    "image": "https://...",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errores**:
- `400` - Email ya existe
- `400` - Datos inválidos

---

### POST /auth/login
Autenticación de usuario.

**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "CLIENT",
    "center": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Centro Madrid Norte",
      "address": "Calle Principal 123"
    },
    "status": "ACTIVE"
  }
}
```

**Errores**:
- `401` - Credenciales inválidas
- `404` - Usuario no encontrado

---

### GET /auth/profile
Obtiene el perfil del usuario autenticado.

**Headers**:
```http
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "CLIENT",
  "center": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Centro Madrid Norte"
  },
  "status": "ACTIVE",
  "image": "https://...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Errores**:
- `401` - Token inválido o expirado

---

## 👥 Endpoints de Usuarios

### GET /users
Obtiene lista de usuarios. Requiere rol SUPERADMIN o ADMIN_CENTER.

**Query Parameters**:
- `role` (optional): Filtrar por rol
- `status` (optional): Filtrar por estado
- `center` (optional): Filtrar por centro (ObjectId)
- `page` (optional): Número de página (default: 1)
- `limit` (optional): Elementos por página (default: 10)

**Response** (200 OK):
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "CLIENT",
      "status": "ACTIVE",
      "center": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Centro Madrid Norte"
      },
      "image": "https://...",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 5
}
```

---

### GET /users/:id
Obtiene un usuario específico por ID.

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "CLIENT",
  "status": "ACTIVE",
  "center": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Centro Madrid Norte",
    "address": "Calle Principal 123"
  },
  "image": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T15:45:00Z"
}
```

**Errores**:
- `404` - Usuario no encontrado

---

### POST /users
Crea un nuevo usuario. Requiere rol SUPERADMIN o ADMIN_CENTER.

**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "CLIENT" | "ADMIN_CENTER" | "SUPERADMIN",
  "center": "string (ObjectId)",
  "status": "ACTIVE" | "INACTIVE",
  "image": "string (optional)"
}
```

**Response** (201 Created):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "CLIENT",
  "status": "ACTIVE",
  "center": "507f1f77bcf86cd799439012"
}
```

---

### PUT /users/:id
Actualiza un usuario existente.

**Request Body** (todos los campos son opcionales):
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "CLIENT" | "ADMIN_CENTER" | "SUPERADMIN",
  "center": "string (ObjectId)",
  "status": "ACTIVE" | "INACTIVE",
  "image": "string"
}
```

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Juan Pérez Actualizado",
  "email": "juan.nuevo@example.com",
  "role": "CLIENT",
  "status": "ACTIVE"
}
```

---

### DELETE /users/:id
Elimina un usuario. Requiere rol SUPERADMIN.

**Response** (200 OK):
```json
{
  "message": "Usuario eliminado correctamente"
}
```

---

## 🏢 Endpoints de Centros

### GET /centers
Obtiene lista de centros.

**Query Parameters**:
- `status` (optional): Filtrar por estado
- `page` (optional): Número de página
- `limit` (optional): Elementos por página

**Response** (200 OK):
```json
{
  "centers": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Centro Madrid Norte",
      "address": "Calle Principal 123",
      "city": "Madrid",
      "postalCode": "28001",
      "phone": "+34 912 345 678",
      "email": "madrid@metaforce.com",
      "status": "ACTIVE",
      "capacity": 200,
      "schedule": {
        "monday": { "open": "06:00", "close": "23:00" },
        "tuesday": { "open": "06:00", "close": "23:00" }
      },
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "totalPages": 1
}
```

---

### GET /centers/:id
Obtiene un centro específico.

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Centro Madrid Norte",
  "address": "Calle Principal 123",
  "city": "Madrid",
  "postalCode": "28001",
  "phone": "+34 912 345 678",
  "email": "madrid@metaforce.com",
  "status": "ACTIVE",
  "capacity": 200,
  "image": "https://...",
  "schedule": { /* horarios */ },
  "amenities": ["Parking", "Vestuarios", "WiFi"],
  "createdAt": "2024-01-10T08:00:00Z"
}
```

---

### POST /centers
Crea un nuevo centro. Requiere rol SUPERADMIN.

**Request Body**:
```json
{
  "name": "string",
  "address": "string",
  "city": "string",
  "postalCode": "string",
  "phone": "string",
  "email": "string",
  "capacity": "number",
  "status": "ACTIVE" | "INACTIVE",
  "schedule": "object",
  "amenities": ["string"],
  "image": "string (optional)"
}
```

---

### PUT /centers/:id
Actualiza un centro existente. Requiere rol SUPERADMIN.

---

### DELETE /centers/:id
Elimina un centro. Requiere rol SUPERADMIN.

---

## 💪 Endpoints de Máquinas

### GET /machines
Obtiene lista de máquinas.

**Query Parameters**:
- `center` (optional): Filtrar por centro (ObjectId)
- `type` (optional): Filtrar por tipo
- `status` (optional): Filtrar por estado
- `page` (optional): Número de página
- `limit` (optional): Elementos por página

**Response** (200 OK):
```json
{
  "machines": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Cinta de Correr 01",
      "type": "CARDIO",
      "brand": "TechnoGym",
      "model": "Run 700",
      "serialNumber": "TG-RUN-2024-001",
      "center": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Centro Madrid Norte"
      },
      "status": "OPERATIONAL",
      "purchaseDate": "2024-01-05T00:00:00Z",
      "lastMaintenance": "2024-03-15T10:00:00Z",
      "nextMaintenance": "2024-06-15T10:00:00Z",
      "image": "https://...",
      "createdAt": "2024-01-05T12:00:00Z"
    }
  ],
  "total": 30,
  "page": 1,
  "totalPages": 3
}
```

**Tipos de Máquina**:
- `CARDIO` - Máquinas cardiovasculares
- `STRENGTH` - Máquinas de fuerza
- `FUNCTIONAL` - Entrenamiento funcional
- `OTHER` - Otros

**Estados**:
- `OPERATIONAL` - Operativa
- `MAINTENANCE` - En mantenimiento
- `OUT_OF_SERVICE` - Fuera de servicio

---

### GET /machines/:id
Obtiene una máquina específica.

---

### POST /machines
Crea una nueva máquina. Requiere rol SUPERADMIN o ADMIN_CENTER.

**Request Body**:
```json
{
  "name": "string",
  "type": "CARDIO" | "STRENGTH" | "FUNCTIONAL" | "OTHER",
  "brand": "string",
  "model": "string",
  "serialNumber": "string",
  "center": "string (ObjectId)",
  "status": "OPERATIONAL" | "MAINTENANCE" | "OUT_OF_SERVICE",
  "purchaseDate": "date",
  "lastMaintenance": "date (optional)",
  "nextMaintenance": "date (optional)",
  "image": "string (optional)"
}
```

---

### PUT /machines/:id
Actualiza una máquina existente.

---

### DELETE /machines/:id
Elimina una máquina.

---

## 📅 Endpoints de Clases

### GET /classes
Obtiene lista de clases.

**Query Parameters**:
- `center` (optional): Filtrar por centro
- `trainer` (optional): Filtrar por entrenador
- `date` (optional): Filtrar por fecha
- `status` (optional): Filtrar por estado

**Response** (200 OK):
```json
{
  "classes": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Spinning Matutino",
      "description": "Clase de spinning de alta intensidad",
      "type": "SPINNING",
      "center": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Centro Madrid Norte"
      },
      "trainer": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "María García"
      },
      "schedule": {
        "date": "2024-03-20",
        "startTime": "08:00",
        "endTime": "09:00"
      },
      "capacity": 20,
      "enrolled": 15,
      "status": "SCHEDULED",
      "createdAt": "2024-03-01T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 5
}
```

**Tipos de Clase**:
- `SPINNING`
- `YOGA`
- `PILATES`
- `ZUMBA`
- `CROSSFIT`
- `BOXING`
- `OTHER`

**Estados**:
- `SCHEDULED` - Programada
- `IN_PROGRESS` - En curso
- `COMPLETED` - Completada
- `CANCELLED` - Cancelada

---

### POST /classes
Crea una nueva clase. Requiere rol SUPERADMIN o ADMIN_CENTER.

---

### PUT /classes/:id
Actualiza una clase existente.

---

### DELETE /classes/:id
Elimina una clase.

---

### POST /classes/:id/enroll
Inscribe al usuario autenticado en una clase.

**Response** (200 OK):
```json
{
  "message": "Inscripción exitosa",
  "class": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Spinning Matutino",
    "enrolled": 16
  }
}
```

---

## 🔔 Códigos de Estado HTTP

| Código | Significado | Descripción |
|--------|-------------|-------------|
| 200 | OK | Solicitud exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Datos inválidos o faltantes |
| 401 | Unauthorized | No autenticado o token inválido |
| 403 | Forbidden | Sin permisos para esta acción |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: email duplicado) |
| 500 | Server Error | Error interno del servidor |

## 🔧 Manejo de Errores

Todos los errores siguen el siguiente formato:

```json
{
  "error": {
    "message": "Descripción del error",
    "code": "ERROR_CODE",
    "details": {
      "field": "nombre del campo con error",
      "reason": "motivo específico"
    }
  }
}
```

### Ejemplos:

**400 - Validación**:
```json
{
  "error": {
    "message": "Datos de entrada inválidos",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "email",
      "reason": "Email inválido"
    }
  }
}
```

**401 - No autenticado**:
```json
{
  "error": {
    "message": "Token inválido o expirado",
    "code": "UNAUTHORIZED"
  }
}
```

**403 - Sin permisos**:
```json
{
  "error": {
    "message": "No tienes permisos para realizar esta acción",
    "code": "FORBIDDEN",
    "details": {
      "requiredRole": "SUPERADMIN",
      "currentRole": "CLIENT"
    }
  }
}
```

## 📝 Uso en el Frontend

### Configuración del Servicio

```typescript
// src/app/core/services/users.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user';

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

  update(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### Interceptor de Autenticación

El token JWT se añade automáticamente a todas las peticiones:

```typescript
// src/app/core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt_token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};
```

## 🔒 Seguridad

### Headers de Seguridad

Todas las respuestas incluyen headers de seguridad:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Rate Limiting

- **Login**: 5 intentos por minuto por IP
- **Register**: 3 registros por hora por IP
- **API General**: 100 requests por minuto por token

### Token JWT

- **Algoritmo**: HS256
- **Expiración**: 24 horas
- **Payload**: `{ userId, email, role }`

## 🧪 Testing de API

### Usando cURL

```bash
# Login
curl -X POST https://meta-force-back.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Users (con token)
curl -X GET https://meta-force-back.vercel.app/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Usando Postman

Importa la colección de Postman (si está disponible) o configura:

1. Create Environment con variable `baseUrl` = `https://meta-force-back.vercel.app/api`
2. Añade token en Authorization → Bearer Token
3. Usa `{{baseUrl}}/users` en las requests

## 📚 Recursos Adicionales

- [Documentación de Backend](https://github.com/Mariogarluu/Meta_Force_back)
- [Postman Collection](#) (si disponible)
- [API Changelog](#) (si disponible)

---

**Nota**: Esta documentación refleja la versión actual de la API. Puede estar sujeta a cambios.
