/**
 * Legacy interface for successful login responses.
 */
export interface LoginResponse{
    
}
/**
 * Detailed information required for a full registration process.
 */
/**
 * Detailed information required for a full registration process.
 */
export interface RegisterInfo {
  /** User's first name */
  name: string;
  /** User's last name or surname */
  surname: string;
  /** User's email address */
  email: string;
  /** User's chosen password */
  password: string;
  /** Password confirmation for validation */
  confirmPassword: string;
}

/**
 * Basic login credentials.
 */
export interface Credentials {
  /** Registered email address */
  email: string;
  /** Account password */
  password: string;
}