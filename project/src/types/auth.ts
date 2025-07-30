export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export type AuthMode = 'signin' | 'signup';

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}