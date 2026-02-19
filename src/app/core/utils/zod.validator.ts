import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ZodType } from 'zod'; // Usamos ZodType que es la base más compatible

/**
 * Convierte un Schema de Zod en un Validador de Angular.
 * Sincroniza la validación del Frontend con la del Backend.
 */
export function zodValidator(schema: ZodType<any, any>): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Si el campo está vacío, Angular debe manejarlo con Validators.required
    // Zod solo valida el formato si hay valor.
    if (!control.value) {
      return null;
    }

    const result = schema.safeParse(control.value);

    if (result.success) {
      return null; // Válido
    }

    // CORRECCIÓN AQUÍ: Usamos .issues en lugar de .errors
    const firstIssue = result.error.issues[0];

    return { 
      zodError: { 
        message: firstIssue.message, 
        code: firstIssue.code 
      } 
    };
  };
}