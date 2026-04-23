/**
 * =============================================================================
 * SERVICIO DE GESTIÓN DE ERRORES (ERROR SERVICE)
 * =============================================================================
 * Este servicio centraliza la captura, procesamiento y visualización de errores
 * en toda la aplicación. Proporciona una interfaz reactiva para notificar al
 * usuario sobre problemas de red, autenticación o lógica de negocio.
 * 
 * Responsabilidades:
 * 1. Transformar errores técnicos (HTTP, excepciones) en mensajes amigables.
 * 2. Gestionar el estado reactivo de los errores activos mediante Signals.
 * 3. Proporcionar un sistema de registro dinámico de mensajes de error.
 * 4. Automatizar la limpieza de errores tras un tiempo determinado.
 */
import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AppError, ErrorType } from '../models/app-error';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  /** Señal interna para el error activo actualmente */
  private currentError = signal<AppError | null>(null);
  
  /** Señal de solo lectura expuesta para los componentes */
  error = this.currentError.asReadonly();
  
  /** Mapa de códigos de error y sus mensajes descriptivos en español */
  private errorMap = new Map<string, string>([
    ['ERR_NETWORK', 'Error de conexión'],
    ['ERR_AUTH_INVALID', 'Credenciales incorrectas'],
    ['ERR_AUTH_EXPIRED', 'Sesión expirada'],
    ['ERR_PERMISSION', 'No tienes permisos'],
    ['ERR_NOT_FOUND', 'Recurso no encontrado'],
    ['ERR_SERVER', 'Error del servidor'],
    ['ERR_VALIDATION', 'Datos inválidos']
  ]);
  
  /**
   * Procesa cualquier tipo de error capturado.
   * Detecta automáticamente el tipo y lo convierte en un objeto AppError.
   * 
   * @param error - Objeto de error (HttpErrorResponse, Error nativo, etc.).
   * @param duration - Tiempo en ms que el error permanecerá visible (0 = permanente).
   */
  handleError(error: any, duration: number = 5000) {
    const appError = this.parseError(error);
    this.currentError.set(appError);
    
    if (duration > 0) {
      setTimeout(() => this.clearError(), duration);
    }
  }
  
  /**
   * Establece manualmente un error con un mensaje y tipo específicos.
   * Útil para validaciones de lógica de negocio o estados controlados.
   * 
   * @param message - Mensaje legible para el usuario.
   * @param type - Categoría del error (Auth, Validation, etc.).
   * @param duration - Tiempo de visibilidad en ms.
   */
  setError(message: string, type: ErrorType = ErrorType.UNKNOWN, duration: number = 5000) {
    const appError: AppError = {
      type,
      message,
      timestamp: new Date()
    };
    this.currentError.set(appError);
    
    if (duration > 0) {
      setTimeout(() => this.clearError(), duration);
    }
  }
  
  /**
   * Convierte un objeto de error desconocido en una estructura AppError válida.
   * 
   * @param error - El error original a parsear.
   * @returns Un objeto estructurado AppError.
   */
  private parseError(error: any): AppError {
    if (error instanceof HttpErrorResponse) {
      return this.parseHttpError(error);
    }
    
    if (error?.code) {
      return {
        type: this.getErrorType(error.code),
        message: this.errorMap.get(error.code) || error.message,
        code: error.code,
        originalError: error,
        timestamp: new Date()
      };
    }
    
    return {
      type: ErrorType.UNKNOWN,
      message: error?.message || 'Error desconocido',
      originalError: error,
      timestamp: new Date()
    };
  }
  
  /**
   * Mapea códigos de estado HTTP a tipos de error y mensajes específicos.
   * 
   * @param error - El objeto HttpErrorResponse de Angular.
   * @returns AppError configurado según el estado HTTP.
   */
  private parseHttpError(error: HttpErrorResponse): AppError {
    const statusMap: Record<number, { type: ErrorType; message: string }> = {
      400: { type: ErrorType.VALIDATION, message: 'Datos inválidos' },
      401: { type: ErrorType.AUTH, message: 'Credenciales incorrectas' },
      403: { type: ErrorType.AUTH, message: 'No tienes permisos' },
      404: { type: ErrorType.NETWORK, message: 'Recurso no encontrado' },
      500: { type: ErrorType.SERVER, message: 'Error del servidor' },
      0: { type: ErrorType.NETWORK, message: 'Error de conexión' }
    };
    
    const errorInfo = statusMap[error.status] || {
      type: ErrorType.UNKNOWN,
      message: 'Error inesperado'
    };
    
    return {
      ...errorInfo,
      code: `HTTP_${error.status}`,
      originalError: error,
      timestamp: new Date()
    };
  }
  
  /**
   * Determina la categoría del error basándose en el prefijo del código.
   * 
   * @param code - Código de error interno.
   * @returns El valor del enum ErrorType correspondiente.
   */
  private getErrorType(code: string): ErrorType {
    if (code.startsWith('ERR_AUTH')) return ErrorType.AUTH;
    if (code.startsWith('ERR_NETWORK')) return ErrorType.NETWORK;
    if (code.startsWith('ERR_VALIDATION')) return ErrorType.VALIDATION;
    if (code.startsWith('ERR_SERVER')) return ErrorType.SERVER;
    return ErrorType.UNKNOWN;
  }
  
  /**
   * Limpia el error activo actual, eliminándolo de la interfaz.
   */
  clearError() {
    this.currentError.set(null);
  }
  
  /**
   * Registra dinámicamente un nuevo mapeo de código y mensaje de error.
   * 
   * @param code - Código único del error.
   * @param message - Mensaje descriptivo en español.
   */
  registerErrorMessage(code: string, message: string) {
    this.errorMap.set(code, message);
  }
}


