# Meta_Force_front

Proyecto frontend desarrollado con Angular para Meta Force.

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- npm (viene incluido con Node.js)
- Git

## 🚀 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/Mariogarluu/Meta_Force_front.git
cd Meta_Force_front
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200/`

## 📝 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Compila el proyecto para producción
- `npm run watch` - Compila el proyecto en modo desarrollo con watch
- `npm test` - Ejecuta las pruebas unitarias

## 🎨 Temas

La aplicación soporta modo claro y oscuro:

- **Toggle de tema**: Disponible en todas las páginas principales
- **Persistencia**: La preferencia de tema se guarda en localStorage
- **Adaptación automática**: Los componentes se adaptan automáticamente al tema seleccionado

## 🔄 Flujo de Trabajo con Git (Workflow)

### Proceso para Subir Cambios desde tu Rama Personal

Sigue estos pasos para integrar tus cambios a la rama `develop`:

#### 1. **Commit en tu rama personal**
Primero, asegúrate de estar en tu rama y realiza los commits de tus cambios:

```bash
# Verifica que estés en tu rama
git branch

# Añade los archivos modificados
git add .

# Realiza el commit con un mensaje descriptivo
git commit -m "Descripción clara de los cambios realizados"
```

#### 2. **Pull de develop**
Antes de hacer el merge, actualiza tu rama local de `develop` con los últimos cambios del repositorio remoto:

```bash
# Cambia a la rama develop
git checkout develop

# Actualiza develop con los cambios remotos
git pull origin develop
```

#### 3. **Merge en tu rama**
Vuelve a tu rama personal e integra los cambios de `develop`:

```bash
# Regresa a tu rama personal
git checkout tu-rama-personal

# Realiza el merge de develop en tu rama
git merge develop
```

**Importante:** Si hay conflictos durante el merge, resuélvelos manualmente:
- Abre los archivos con conflictos
- Busca las marcas de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`)
- Edita el archivo para mantener los cambios correctos
- Guarda los archivos
- Añade los archivos resueltos: `git add .`
- Completa el merge: `git commit`

#### 4. **Cuando el merge esté completado**
Una vez que hayas resuelto todos los conflictos y probado que todo funciona correctamente:

```bash
# Cambia a la rama develop
git checkout develop

# Realiza el merge de tu rama en develop
git merge tu-rama-personal

# Sube los cambios a develop en el repositorio remoto
git push origin develop
```

### 📌 Resumen del Flujo

```
1. git checkout tu-rama-personal
2. git add .
3. git commit -m "tu mensaje"
4. git checkout develop
5. git pull origin develop
6. git checkout tu-rama-personal
7. git merge develop
8. [Resolver conflictos si existen]
9. git checkout develop
10. git merge tu-rama-personal
11. git push origin develop
```

### ⚠️ Buenas Prácticas

- **Commits frecuentes**: Realiza commits pequeños y con mensajes descriptivos
- **Pull antes de push**: Siempre actualiza `develop` antes de mergear tus cambios
- **Prueba antes de mergear**: Asegúrate de que tu código funcione correctamente antes de mergear a `develop`
- **Resuelve conflictos con cuidado**: Revisa detenidamente los conflictos antes de resolverlos
- **Mantén tu rama actualizada**: Haz merge de `develop` en tu rama personal regularmente para evitar conflictos grandes

## 🌐 Internacionalización (i18n)

La aplicación soporta múltiples idiomas mediante `ngx-translate`. Los idiomas disponibles son:

- **Español (es)** - Idioma por defecto
- **Inglés (en)**
- **Francés (fr)**

### Características de Traducción

- **Selector de idioma**: Disponible en todas las páginas principales
- **Traducción dinámica**: Todos los textos de interfaz se traducen automáticamente
- **Persistencia**: El idioma seleccionado se guarda en localStorage
- **Filtros traducidos**: Los filtros de búsqueda se adaptan al idioma seleccionado
- **Estados y roles**: Los estados de usuarios, roles y tipos de máquinas se traducen dinámicamente

### Archivos de Traducción

Los archivos de traducción se encuentran en:
```
public/assets/i18n/
├── es.json  # Español
├── en.json  # Inglés
└── fr.json  # Francés
```

### Uso en Componentes

Para usar traducciones en un componente:

1. Importa `TranslateModule`:
```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [CommonModule, TranslateModule, ...],
  ...
})
```

2. Usa el pipe `translate` en el template:
```html
<h1>{{ 'users.title' | translate }}</h1>
<button>{{ 'common.save' | translate }}</button>
```

3. Para traducciones en TypeScript:
```typescript
import { TranslateService } from '@ngx-translate/core';

constructor(private translate: TranslateService) {}

getMessage() {
  return this.translate.instant('users.title');
}
```

### Componentes Traducidos

- ✅ Login
- ✅ Register
- ✅ Dashboard
- ✅ Home
- ✅ Navbar
- ✅ QR Code
- ✅ QR Scanner
- ✅ Users Management
- ✅ Centers Management
- ✅ Machines Management
- ✅ Theme Toggle
- ✅ Language Selector

## 🏗️ Estructura del Proyecto

```
Meta_Force_front/
├── src/
│   ├── app/
│   │   ├── core/              # Servicios core (auth, theme, translation)
│   │   ├── pages/              # Páginas de la aplicación
│   │   │   ├── home/           # Página principal
│   │   │   ├── login/          # Login
│   │   │   ├── register/       # Registro
│   │   │   ├── dashboard/      # Dashboard
│   │   │   ├── users/          # Gestión de usuarios
│   │   │   ├── centers/        # Gestión de centros
│   │   │   ├── machines/        # Gestión de máquinas
│   │   │   ├── qr/             # Código QR
│   │   │   └── qr-scanner/     # Escáner QR
│   │   └── shared/             # Componentes compartidos
│   │       └── components/
│   │           ├── navbar/     # Barra de navegación
│   │           ├── footer/      # Pie de página
│   │           ├── theme-toggle/    # Toggle de tema
│   │           └── language-selector/ # Selector de idioma
│   ├── assets/                 # Recursos estáticos
│   └── index.html              # Archivo HTML principal
├── public/
│   ├── assets/
│   │   └── i18n/               # Archivos de traducción
│   └── Logo.png                # Logo de la aplicación
├── angular.json                 # Configuración de Angular
├── package.json                 # Dependencias del proyecto
└── tsconfig.json                # Configuración de TypeScript
```

## 🔧 Tecnologías Principales

- **Angular 18+** - Framework principal
- **TypeScript** - Lenguaje de programación
- **Tailwind CSS** - Framework de estilos
- **ngx-translate** - Sistema de internacionalización
- **RxJS** - Programación reactiva
- **Angular Signals** - Gestión de estado reactivo

## 🤝 Contribuir

Si deseas contribuir al proyecto, por favor sigue el flujo de trabajo descrito arriba y asegúrate de:

1. Crear una rama con un nombre descriptivo
2. Escribir código limpio y comentado cuando sea necesario
3. Probar tus cambios antes de hacer el merge
4. Seguir las convenciones de código del proyecto
5. Agregar traducciones para nuevos textos en los 3 idiomas (es, en, fr)
6. Mantener la consistencia en el uso de traducciones (no hardcodear textos)

## 📄 Licencia

Este proyecto es privado y pertenece a Meta Force.
