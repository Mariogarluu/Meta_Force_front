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
/**
 * Standard structure for application-level error tracking.
 */
export interface AppError {
  /** Categorization of the error (e.g., AUTH, NETWORK) */
  type: ErrorType;
  /** Human-readable error message */
  message: string;
  /** Optional error code for programmatic handling */
  code?: string;
  /** The original error object or cause, if available */
  originalError?: any;
  /** When the error occurred */
  timestamp: Date;
}


