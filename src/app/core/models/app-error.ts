/**
 * Categorization of application-level errors.
 */
export enum ErrorType {
  AUTH = 'auth',
  NETWORK = 'network',
  VALIDATION = 'validation',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

/**
 * Standard structure for application-level error tracking.
 */
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  originalError?: any;
  timestamp: Date;
}

