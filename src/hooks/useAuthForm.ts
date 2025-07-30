import { useState, useCallback } from 'react';
import type { AuthFormData, AuthFormErrors, AuthMode } from '../types/auth';
import { signInSchema, signUpSchema } from '../utils/validation';
import { handleEmailPassword } from '../utils/auth';

export const useAuthForm = (mode: AuthMode) => {
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);

  const updateField = useCallback((field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear auth error when user types
    if (authError) {
      setAuthError(null);
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    try {
      const schema = mode === 'signin' ? signInSchema : signUpSchema;
      schema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: AuthFormErrors = {};
      error.errors?.forEach((err: any) => {
        if (err.path?.length > 0) {
          fieldErrors[err.path[0] as keyof AuthFormErrors] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
  }, [formData, mode]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Trigger shake animation
      const formElement = e.currentTarget as HTMLFormElement;
      formElement.classList.add('shake');
      setTimeout(() => formElement.classList.remove('shake'), 500);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setAuthError(null);

    try {
      const error = await handleEmailPassword(mode, formData.email, formData.password);
      if (error) {
        setAuthError(error);
      }
      // Success redirect is handled in handleEmailPassword
    } catch (error) {
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, mode, validateForm]);

  const isFormValid = useCallback(() => {
    const schema = mode === 'signin' ? signInSchema : signUpSchema;
    try {
      schema.parse(formData);
      return true;
    } catch {
      return false;
    }
  }, [formData, mode]);

  return {
    formData,
    errors,
    authError,
    isLoading,
    showPassword,
    showConfirmPassword,
    updateField,
    handleSubmit,
    isFormValid: isFormValid(),
    setShowPassword,
    setShowConfirmPassword,
  };
};