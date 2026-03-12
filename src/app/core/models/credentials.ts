/**
 * Legacy interface for successful login responses.
 */
export interface LoginResponse{
    
}
/**
 * Detailed information required for a full registration process.
 */
export interface RegisterInfo{
    name:string,
    surname:string,
    email:string,
    password:string,
    confirmPassword:string
}

export interface Credentials{
    email:string;
    password:string;
}