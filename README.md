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

## 🏗️ Estructura del Proyecto

```
Meta_Force_front/
├── src/
│   ├── app/           # Componentes y módulos de la aplicación
│   ├── assets/        # Recursos estáticos
│   └── index.html     # Archivo HTML principal
├── public/            # Archivos públicos
├── angular.json       # Configuración de Angular
├── package.json       # Dependencias del proyecto
└── tsconfig.json      # Configuración de TypeScript
```

## 🤝 Contribuir

Si deseas contribuir al proyecto, por favor sigue el flujo de trabajo descrito arriba y asegúrate de:

1. Crear una rama con un nombre descriptivo
2. Escribir código limpio y comentado cuando sea necesario
3. Probar tus cambios antes de hacer el merge
4. Seguir las convenciones de código del proyecto

## 📄 Licencia

Este proyecto es privado y pertenece a Meta Force.
