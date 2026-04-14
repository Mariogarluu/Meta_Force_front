import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AppError, ErrorType } from '../models/app-error';

/**
 * Servicio de gestión centralizada de errores de la aplicación.
 * 
 * Proporciona una forma unificada de manejar errores desde cualquier parte
 * de la aplicación, convirtiéndolos en mensajes legibles para el usuario
 * y mostrándolos mediante un toast global.
 * 
 * Características:
 * - Conversión automática de HttpErrorResponse a mensajes legibles
 * - Soporte para códigos de error personalizados
 * - Auto-limpieza de errores después de un tiempo configurable
 * - Señales reactivas para integración con componentes
 */
/**
 * Service for centralized application error management.
 * Provides a unified way to handle errors from any part of the application,
 * converting them into user-friendly messages displayed via a global toast.
 */
/**
 * Service for centralized application error management.
 * Provides a unified way to handle errors from any part of the application,
 * converting them into user-friendly messages displayed via a global toast.
 * Features automatic HTTP error parsing, custom error codes, and auto-cleanup.
 */
@Injectable({ providedIn: 'root' })
export class ErrorService {
  /** Internal signal for the currently active application error */
  private currentError = signal<AppError | null>(null);
  
  /** Public read-only signal of the current error */
  error = this.currentError.asReadonly();
  
  /** Map of error codes to user-friendly Spanish messages */
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
   * Handles any type of application error.
   * Automatically detects error type and converts it into a displayable AppError.
   * @param error - Any error object (HttpErrorResponse, Error, custom, etc.)
   * @param duration - Time in ms to display the error (0 for permanent)
   */
  handleError(error: any, duration: number = 5000) {
    const appError = this.parseError(error);
    this.currentError.set(appError);
    
    if (duration > 0) {
      setTimeout(() => this.clearError(), duration);
    }
  }
  
  /**
   * Manually sets an error with a specific message and type.
   * Useful for business logic errors not originating from HTTP calls.
   * @param message - User-friendly error message
   * @param type - The category of the error
   * @param duration - Time in ms to display the error
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
   * Parses an unknown error object into a structured AppError.
   * @param error - The error object to parse
   * @returns A structured AppError object
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
   * Maps HTTP status codes to application error types and messages.
   * @param error - The Angular HttpErrorResponse object
   * @returns A structured AppError based on HTTP status
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
   * Determines the ErrorType based on the error code prefix.
   * @param code - The internal error code string
   * @returns The corresponding ErrorType enum value
   */
  private getErrorType(code: string): ErrorType {
    if (code.startsWith('ERR_AUTH')) return ErrorType.AUTH;
    if (code.startsWith('ERR_NETWORK')) return ErrorType.NETWORK;
    if (code.startsWith('ERR_VALIDATION')) return ErrorType.VALIDATION;
    if (code.startsWith('ERR_SERVER')) return ErrorType.SERVER;
    return ErrorType.UNKNOWN;
  }
  
  /**
   * Clears the currently active error, removing it from the UI.
   */
  clearError() {
    this.currentError.set(null);
  }
  
  /**
   * Registers a new error code and message mapping dynamically.
   * @param code - Unique error code string
   * @param message - User-friendly Spanish message for this code
   */
  registerErrorMessage(code: string, message: string) {
    this.errorMap.set(code, message);
  }
}


