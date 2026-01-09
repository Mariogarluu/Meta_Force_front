# Scripts de Transformación

Esta carpeta contiene scripts útiles para transformar datos entre diferentes formatos.

## transform-exercises.js

Script para transformar ejercicios desde formatos personalizados al formato esperado por la API.

### Uso Rápido

```bash
# Transformar un archivo
node scripts/transform-exercises.js archivo-entrada.json > archivo-salida.json

# Ver el resultado en consola
node scripts/transform-exercises.js archivo-entrada.json
```

### Ejemplo

```bash
# Transformar el archivo de ejemplo
node scripts/transform-exercises.js ejemplo-ejercicios-original.json > ejemplo-ejercicios-transformado.json
```

### Formato de Entrada

El script acepta un array de ejercicios con la siguiente estructura:

```json
[
  {
    "nombre": "Press de Banca",
    "tipo": "Fuerza",
    "equipo": "Barra",
    "dificultad": "Intermedio",
    "musculos": {
      "primarios": ["Pectoral mayor"],
      "secundarios": ["Tríceps", "Deltoides anterior"]
    },
    "metricas_sugeridas": {
      "series_recomendadas": 4,
      "repeticiones_objetivo": "8-12",
      "descanso_segundos": 90
    }
  }
]
```

### Formato de Salida

El script genera directamente un array de ejercicios:

```json
[
  {
    "name": "Press de Banca",
    "description": "Tipo: Fuerza | Dificultad: Intermedio | Equipo: Barra",
    "instructions": "Músculos primarios: Pectoral mayor\nMúsculos secundarios: Tríceps, Deltoides anterior\nMétricas sugeridas: 4 series, 8-12 repeticiones, 90s de descanso"
  }
]
```

**Nota:** El servicio de Angular (`ExercisesService.importExercises()`) automáticamente envuelve el array en el objeto `{ exercises: [...] }` que espera el backend.

### Uso Programático

```javascript
const { transformExercises } = require('./transform-exercises.js');

const ejercicios = [
  {
    nombre: "Press de Banca",
    tipo: "Fuerza",
    // ... más campos
  }
];

const transformados = transformExercises(ejercicios);
// Usar transformados con el servicio de importación
```

### Archivos de Ejemplo

- `ejemplo-ejercicios-original.json` - Formato original de ejemplo
- `ejemplo-ejercicios-transformado.json` - Resultado de la transformación

