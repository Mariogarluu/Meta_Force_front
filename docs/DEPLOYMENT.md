# Guía de Despliegue - Meta Force Frontend

## 📋 Tabla de Contenidos

- [Variables de Entorno](#variables-de-entorno)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [Despliegue Manual](#despliegue-manual)
- [Docker (Opcional)](#docker-opcional)
- [Configuración de Dominios](#configuración-de-dominios)
- [CI/CD](#cicd)
- [Monitoreo](#monitoreo)
- [Troubleshooting](#troubleshooting)

## 🔧 Variables de Entorno

El proyecto utiliza archivos de entorno para configurar diferentes despliegues.

### Archivos de Configuración

```
src/environments/
├── environment.ts               # Producción
└── environment.development.ts   # Desarrollo
```

### environment.ts (Producción)

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://meta-force-back.vercel.app/api'
};
```

### environment.development.ts (Desarrollo)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'  // Backend local
  // o apiUrl: 'https://meta-force-back-dev.vercel.app/api'
};
```

### Cambiar URL de API

Para conectarse a diferentes backends:

1. **Backend Local**:
```typescript
apiUrl: 'http://localhost:3000/api'
```

2. **Backend de Desarrollo**:
```typescript
apiUrl: 'https://meta-force-back-dev.vercel.app/api'
```

3. **Backend de Producción**:
```typescript
apiUrl: 'https://meta-force-back.vercel.app/api'
```

## 🚀 Despliegue en Vercel (Recomendado)

Vercel es la plataforma recomendada para desplegar aplicaciones Angular debido a su:
- ✅ Zero-config deployment
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Automatic previews para PRs
- ✅ Instant rollbacks

### Configuración Inicial

El proyecto ya incluye `vercel.json` configurado:

```json
{
  "buildCommand": "npm run build -- --configuration production",
  "outputDirectory": "dist/credentials/browser",
  "devCommand": "npm run start",
  "installCommand": "npm install",
  "framework": "angular",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Despliegue Manual desde CLI

#### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login en Vercel

```bash
vercel login
```

#### 3. Desplegar

```bash
# Primera vez (configuración interactiva)
vercel

# Producción
vercel --prod
```

### Despliegue Automático con GitHub

#### Opción 1: Desde Vercel Dashboard

1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New Project"
3. Importa el repositorio desde GitHub
4. Vercel detectará automáticamente que es Angular
5. Verifica la configuración:
   - **Build Command**: `npm run build -- --configuration production`
   - **Output Directory**: `dist/credentials/browser`
   - **Install Command**: `npm install`
6. Click en "Deploy"

#### Opción 2: GitHub Integration

Una vez conectado, cada push a las ramas configuradas desplegará automáticamente:

- **Push a `main`** → Despliega a Producción
- **Push a `develop`** → Despliega a Preview
- **Pull Request** → Crea Preview único

### Variables de Entorno en Vercel

Si necesitas variables de entorno adicionales:

1. Ve a Project Settings → Environment Variables
2. Añade variables:
   ```
   ANGULAR_API_URL=https://meta-force-back.vercel.app/api
   NODE_ENV=production
   ```

**Nota**: Angular usa archivos de entorno en build time, no runtime. Las variables deben estar en `environment.ts`.

### Dominios Personalizados en Vercel

1. Ve a Project Settings → Domains
2. Añade tu dominio: `www.metaforce.com`
3. Configura DNS según las instrucciones
4. Vercel genera automáticamente certificado SSL

## 🔨 Despliegue Manual

### Build para Producción

```bash
# Instalar dependencias
npm install

# Build optimizado
npm run build -- --configuration production

# Los archivos estarán en dist/credentials/browser/
```

### Servidor Local para Testing

```bash
# Instalar servidor HTTP simple
npm install -g http-server

# Servir archivos de build
cd dist/credentials/browser
http-server -p 8080

# Visita http://localhost:8080
```

### Despliegue en Servidor Propio (Nginx)

#### 1. Preparar Build

```bash
npm run build -- --configuration production
```

#### 2. Configurar Nginx

```nginx
# /etc/nginx/sites-available/metaforce

server {
    listen 80;
    server_name metaforce.com www.metaforce.com;
    
    root /var/www/metaforce/dist/credentials/browser;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}

# SSL configuration (if using Let's Encrypt)
server {
    listen 443 ssl http2;
    server_name metaforce.com www.metaforce.com;
    
    ssl_certificate /etc/letsencrypt/live/metaforce.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/metaforce.com/privkey.pem;
    
    # ... resto de la configuración ...
}
```

#### 3. Activar Configuración

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/metaforce /etc/nginx/sites-enabled/

# Test configuración
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 4. Copiar Archivos

```bash
# Crear directorio
sudo mkdir -p /var/www/metaforce

# Copiar build
sudo cp -r dist/credentials/browser/* /var/www/metaforce/

# Permisos
sudo chown -R www-data:www-data /var/www/metaforce
```

## 🐳 Docker (Opcional)

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist/credentials/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf para Docker

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### Comandos Docker

```bash
# Build imagen
docker build -t metaforce-frontend .

# Run container
docker run -d -p 80:80 --name metaforce-frontend metaforce-frontend

# Con docker-compose
docker-compose up -d

# Ver logs
docker logs metaforce-frontend

# Stop
docker stop metaforce-frontend
```

## 🌐 Configuración de Dominios

### DNS Records

Para conectar tu dominio:

**Para Vercel**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.21.21
```

**Para Servidor Propio**:
```
Type: A
Name: @
Value: <IP_DEL_SERVIDOR>

Type: A
Name: www
Value: <IP_DEL_SERVIDOR>
```

### SSL/TLS

**Vercel**: SSL automático

**Let's Encrypt (manual)**:
```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d metaforce.com -d www.metaforce.com

# Auto-renewal
sudo certbot renew --dry-run
```

## 🔄 CI/CD

### GitHub Actions

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --watch=false --browsers=ChromeHeadless
      
      - name: Build
        run: npm run build -- --configuration production
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### GitLab CI

`.gitlab-ci.yml`:

```yaml
image: node:18

stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - npm ci
    - npm test -- --watch=false --browsers=ChromeHeadless
  only:
    - merge_requests
    - develop
    - main

build:
  stage: build
  script:
    - npm ci
    - npm run build -- --configuration production
  artifacts:
    paths:
      - dist/
    expire_in: 1 day
  only:
    - main

deploy:
  stage: deploy
  script:
    - npm install -g vercel
    - vercel --token $VERCEL_TOKEN --prod
  only:
    - main
```

## 📊 Monitoreo

### Vercel Analytics

Activar en Vercel Dashboard:
1. Project Settings → Analytics
2. Enable Web Analytics

### Google Analytics

Añadir en `src/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Sentry (Error Tracking)

```bash
npm install @sentry/angular
```

```typescript
// main.ts
import * as Sentry from "@sentry/angular";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: environment.production ? 'production' : 'development'
});
```

## 🐛 Troubleshooting

### Build Falla

**Error**: `JavaScript heap out of memory`

```bash
# Solución: Aumentar memoria
export NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

### Rutas No Funcionan (404)

**Problema**: Las rutas Angular devuelven 404.

**Solución**: Verificar que el servidor esté configurado para SPA:
- Vercel: `vercel.json` con rewrites
- Nginx: `try_files $uri $uri/ /index.html`

### API No Se Conecta

**Problema**: CORS errors o conexión rechazada.

**Solución**: 
1. Verificar `environment.ts` tiene la URL correcta
2. Verificar que el backend acepta peticiones desde el frontend
3. Verificar CORS en el backend

### Estilos No Cargan

**Problema**: Página sin estilos después del deploy.

**Solución**:
1. Verificar que Tailwind esté configurado correctamente
2. Limpiar y rebuildar: `rm -rf dist && npm run build`
3. Verificar `styles.scss` esté en `angular.json`

## 📋 Checklist de Despliegue

Antes de desplegar a producción:

- [ ] Tests pasan: `npm test`
- [ ] Build exitoso: `npm run build -- --configuration production`
- [ ] Sin errores de lint
- [ ] Variables de entorno correctas
- [ ] API URL apunta a producción
- [ ] SSL/TLS configurado
- [ ] Dominio configurado
- [ ] Analytics configurado (opcional)
- [ ] Error tracking configurado (opcional)
- [ ] Backup de la versión anterior
- [ ] Plan de rollback preparado

## 🔄 Rollback

### En Vercel

1. Ve a Deployments
2. Encuentra el deployment anterior estable
3. Click en los tres puntos → "Promote to Production"

### Manual

```bash
# Mantener backups de builds
cp -r dist/credentials/browser dist/credentials/browser.backup-$(date +%Y%m%d)

# Restaurar
rm -rf /var/www/metaforce/*
cp -r dist/credentials/browser.backup-YYYYMMDD/* /var/www/metaforce/
```

## 📚 Recursos

- [Vercel Documentation](https://vercel.com/docs)
- [Angular Deployment Guide](https://angular.dev/tools/cli/deployment)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

**Última actualización**: Diciembre 2024
