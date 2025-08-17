import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { User } from 'firebase/auth';

import { PhoneAuthWidget } from './PhoneAuthWidget';
import { GoogleButton } from '../GoogleButton';
import { useAuthForm } from '../../hooks/useAuthForm';
import { AuthInput } from '../AuthInput';
import { CircularCheckbox } from '../CircularCheckbox';
import { OrDivider } from './Dividers';
import { LoaderOne } from '../ui/loader';

interface AuthMethodStackProps {
  mode: 'sign-in' | 'sign-up';
  onSuccess?: (user: User) => void;
}

const STORAGE_KEY = 'im-auth-email-open';

export const AuthMethodStack: React.FC<AuthMethodStackProps> = ({ mode, onSuccess }) => {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const {
    formData,
    errors,
    authError,
    isLoading,
    showPassword,
    showConfirmPassword,
    updateField,
    handleSubmit,
    isFormValid,
    setShowPassword,
    setShowConfirmPassword,
  } = useAuthForm(mode === 'sign-in' ? 'signin' : 'signup');

  // Load email panel state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') {
      setIsEmailOpen(true);
    }
  }, []);

  // Save email panel state to localStorage
  const toggleEmailPanel = () => {
    const newState = !isEmailOpen;
    setIsEmailOpen(newState);
    localStorage.setItem(STORAGE_KEY, newState.toString());
  };

  const handlePhoneSuccess = (user: User) => {
    onSuccess?.(user);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For sign-up, check terms agreement
    if (mode === 'sign-up' && !agreedToTerms) {
      return;
    }
    
    handleSubmit(e);
  };

  const isEmailFormValid = mode === 'sign-up' 
    ? isFormValid && agreedToTerms 
    : isFormValid;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Phone Authentication - Primary */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="relative"
      >
        <div className="rounded-2xl border border-primary-400/40 bg-white shadow-sm hover:border-primary-400/60 transition-colors p-6 md:p-7 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Continue with phone</h3>
                <p className="text-sm text-gray-600">Quick OTP verification</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-1 text-[11px] font-medium text-primary-600">
              Recommended
            </span>
          </div>
          <PhoneAuthWidget
            mode={mode === 'sign-in' ? 'signin' : 'signup'}
            onSuccess={handlePhoneSuccess}
          />
        </div>
      </motion.div>

      <OrDivider />

      {/* Google Authentication - Secondary */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.1 }}
      >
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-gray-300 transition-colors p-4">
          <GoogleButton />
          <p className="text-xs text-gray-500 text-center mt-2">
            We'll verify your phone after Google sign-in.
          </p>
        </div>
      </motion.div>

      {/* Email Authentication - Collapsible */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.2 }}
      >
        <button
          type="button"
          onClick={toggleEmailPanel}
          aria-expanded={isEmailOpen}
          aria-controls="email-auth-panel"
          className="w-full text-center text-sm text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded transition-colors"
        >
          {isEmailOpen 
            ? `Hide email ${mode === 'sign-in' ? 'sign-in' : 'sign-up'}`
            : 'Use email instead'
          }
          {isEmailOpen ? (
            <ChevronUpIcon className="w-4 h-4 inline ml-1" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 inline ml-1" />
          )}
        </button>

        <AnimatePresence>
          {isEmailOpen && (
            <motion.div
              id="email-auth-panel"
              role="region"
              aria-labelledby="email-toggle-button"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-4"
            >
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {mode === 'sign-in' ? 'Sign in with email' : 'Sign up with email'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {mode === 'sign-in' 
                      ? 'Enter your credentials to access your account'
                      : 'Create a new account with your email address'
                    }
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {(errors.general || authError) && (
                    <div
                      role="alert"
                      className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                    >
                      {errors.general || authError}
                    </div>
                  )}

                  <AuthInput
                    label="Email address"
                    type="email"
                    value={formData.email}
                    onChange={(value) => updateField('email', value)}
                    error={errors.email}
                    testId={`${mode}-email`}
                    autoFocus={false}
                  />

                  <AuthInput
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(value) => updateField('password', value)}
                    error={errors.password}
                    showPasswordToggle
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    testId={`${mode}-password`}
                  />

                  {mode === 'sign-up' && (
                    <AuthInput
                      label="Confirm password"
                      type="password"
                      value={formData.confirmPassword || ''}
                      onChange={(value) => updateField('confirmPassword', value)}
                      error={errors.confirmPassword}
                      showPasswordToggle
                      showPassword={showConfirmPassword}
                      onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                      testId="signup-confirm-password"
                    />
                  )}

                  {mode === 'sign-in' && (
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center">
                        <CircularCheckbox
                          checked={rememberMe}
                          onChange={() => setRememberMe(!rememberMe)}
                        />
                        <span className="ml-2 text-gray-600">Remember me</span>
                      </label>
                      <a
                        href="/forgot-password"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot password?
                      </a>
                    </div>
                  )}

                  {mode === 'sign-up' && (
                    <div className="space-y-4">
                      <div className="text-sm">
                        <p className="text-gray-600 mb-2">Password requirements:</p>
                        <ul className="text-xs text-gray-500 space-y-1 ml-4">
                          <li>• At least 8 characters long</li>
                          <li>• Contains at least one uppercase letter</li>
                          <li>• Contains at least one lowercase letter</li>
                          <li>• Contains at least one number</li>
                        </ul>
                      </div>

                      <label className="flex items-start gap-3">
                        <CircularCheckbox
                          checked={agreedToTerms}
                          onChange={() => setAgreedToTerms(!agreedToTerms)}
                        />
                        <span className="text-sm text-gray-600 leading-5">
                          I agree to the{' '}
                          <a href="/terms" className="text-primary-600 hover:text-primary-700">
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a href="/privacy" className="text-primary-600 hover:text-primary-700">
                            Privacy Policy
                          </a>
                        </span>
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isEmailFormValid || isLoading}
                    data-testid={`${mode}-submit`}
                    data-cursor="button"
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2">
                          <LoaderOne />
                        </div>
                        {mode === 'sign-in' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      mode === 'sign-in' ? 'Sign in' : 'Create account'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
