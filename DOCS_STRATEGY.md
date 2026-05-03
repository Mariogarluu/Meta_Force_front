# 📖 Documentación del Proyecto: Meta-Force Frontend

Aquí explicamos qué hemos construido en el cliente para dar vida a la plataforma.

## 🏗️ Arquitectura Angular
*   **`src/app/app.routes.ts`**: Aquí hemos diseñado todo el sistema de navegación. Hemos definido rutas protegidas para que solo los usuarios logueados puedan ver su progreso y el dashboard.
*   **`src/app/core/`**: Aquí hemos centralizado el cerebro de la App. Hemos puesto los servicios globales (autenticación, gestión de datos) para que cualquier componente pueda acceder a la información de forma limpia.
*   **`src/environments/`**: Aquí hemos configurado las variables de entorno para el despliegue. Hemos separado los datos de desarrollo de los de producción para evitar errores de conexión.

## 📊 Módulos de Rendimiento (Performance)
*   **`src/app/pages/performance/`**: Aquí hemos construido la joya de la corona. Hemos implementado gráficas interactivas y el nuevo widget de inactividad que motiva al usuario cuando lleva tiempo sin entrenar.
*   **`src/app/pages/performance/performance.service.ts`**: Aquí hemos programado la comunicación con las Edge Functions de Supabase. Hemos añadido lógica de resiliencia para que la App siga funcionando aunque la IA tarde en responder.

## 🎨 Diseño y UI (Glassmorphism)
*   **`src/styles.css`**: Aquí hemos definido el sistema visual. Hemos usado variables CSS para colores vibrantes y efectos de desenfoque (blur) para lograr esa estética premium de "cristal" (glassmorphism) que recorre toda la App.
*   **`src/app/shared/components/`**: Aquí hemos creado componentes reutilizables como la barra de navegación y los botones, asegurando que la experiencia de usuario sea consistente en todas las pantallas.

## 🤖 Integración de IA
*   **`src/app/pages/ai-coach/`**: Aquí hemos integrado el Chat de IA. Hemos conectado el chat directamente con los datos de rendimiento para que el Coach pueda dar consejos personalizados basados en los pesos reales que levanta el usuario.
