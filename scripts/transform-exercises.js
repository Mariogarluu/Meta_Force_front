/**
 * Script para transformar ejercicios desde formato personalizado al formato esperado por la API
 * 
 * Uso:
 * node scripts/transform-exercises.js < archivo-entrada.json > archivo-salida.json
 * 
 * O desde Node.js:
 * const transform = require('./scripts/transform-exercises.js');
 * const transformed = transform(exercisesArray);
 */

/**
 * Transforma un array de ejercicios desde el formato personalizado al formato de la API
 * @param {Array} exercises - Array de ejercicios en formato personalizado
 * @returns {Array} Array de ejercicios en formato de la API
 */
function transformExercises(exercises) {
  return exercises.map(exercise => {
    const transformed = {
      name: exercise.nombre || exercise.name,
    };

    // Mapear campos opcionales
    if (exercise.tipo) {
      transformed.description = `Tipo: ${exercise.tipo}${exercise.dificultad ? ` | Dificultad: ${exercise.dificultad}` : ''}${exercise.equipo ? ` | Equipo: ${exercise.equipo}` : ''}`;
    }

    // Construir instrucciones desde los músculos y métricas
    const instructions = [];
    
    if (exercise.musculos) {
      if (exercise.musculos.primarios && exercise.musculos.primarios.length > 0) {
        instructions.push(`Músculos primarios: ${exercise.musculos.primarios.join(', ')}`);
      }
      if (exercise.musculos.secundarios && exercise.musculos.secundarios.length > 0) {
        instructions.push(`Músculos secundarios: ${exercise.musculos.secundarios.join(', ')}`);
      }
    }

    if (exercise.metricas_sugeridas) {
      const metricas = [];
      if (exercise.metricas_sugeridas.series_recomendadas) {
        metricas.push(`${exercise.metricas_sugeridas.series_recomendadas} series`);
      }
      if (exercise.metricas_sugeridas.repeticiones_objetivo) {
        metricas.push(`${exercise.metricas_sugeridas.repeticiones_objetivo} repeticiones`);
      }
      if (exercise.metricas_sugeridas.descanso_segundos) {
        metricas.push(`${exercise.metricas_sugeridas.descanso_segundos}s de descanso`);
      }
      if (metricas.length > 0) {
        instructions.push(`Métricas sugeridas: ${metricas.join(', ')}`);
      }
    }

    if (instructions.length > 0) {
      transformed.instructions = instructions.join('\n');
    }

    // Campos adicionales si existen
    if (exercise.description) transformed.description = exercise.description;
    if (exercise.instructions) transformed.instructions = exercise.instructions;
    if (exercise.imageUrl) transformed.imageUrl = exercise.imageUrl;
    if (exercise.videoUrl) transformed.videoUrl = exercise.videoUrl;
    if (exercise.machineTypeId) transformed.machineTypeId = exercise.machineTypeId;

    return transformed;
  });
}

/**
 * Transforma un ejercicio individual
 * @param {Object} exercise - Ejercicio en formato personalizado
 * @returns {Object} Ejercicio en formato de la API
 */
function transformExercise(exercise) {
  return transformExercises([exercise])[0];
}

// Si se ejecuta directamente desde la línea de comandos
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');

  // Leer desde stdin o archivo
  let inputData;
  
  if (process.argv[2]) {
    // Si se proporciona un archivo como argumento
    const filePath = path.resolve(process.argv[2]);
    inputData = fs.readFileSync(filePath, 'utf8');
  } else {
    // Leer desde stdin
    inputData = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      inputData += chunk;
    });
    process.stdin.on('end', () => {
      try {
        const exercises = JSON.parse(inputData);
        const transformed = transformExercises(exercises);
        // Generar directamente un array
        console.log(JSON.stringify(transformed, null, 2));
      } catch (error) {
        console.error('Error al procesar JSON:', error.message);
        process.exit(1);
      }
    });
    return;
  }

  try {
    const exercises = JSON.parse(inputData);
    const transformed = transformExercises(exercises);
    
    // Escribir resultado como array directo
    const output = JSON.stringify(transformed, null, 2);
    console.log(output);
  } catch (error) {
    console.error('Error al procesar JSON:', error.message);
    process.exit(1);
  }
}

// Exportar para uso como módulo
module.exports = { transformExercises, transformExercise };

