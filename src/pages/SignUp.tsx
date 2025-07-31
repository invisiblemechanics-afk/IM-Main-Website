import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { GoogleButton } from '../components/GoogleButton';
import { Divider } from '../components/Divider';
import { AuthInput } from '../components/AuthInput';
import { CircularCheckbox } from '../components/CircularCheckbox';
import { useAuthForm } from '../hooks/useAuthForm';

import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const SignUp: React.FC = () => {
  const { user, loading } = useAuth();
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
  } = useAuthForm('signup');

  // Set page title
  useEffect(() => {
    document.title = 'Sign Up - AuthFlow';
  }, []);

  // Redirect authenticated users to dashboard
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        <div className="flex flex-col md:flex-row">
          {/* Brand Panel */}
          <div className="md:w-1/2 bg-gradient-to-br from-secondary-600 to-primary-600 p-8 md:p-12 flex flex-col justify-center items-center text-white">
            <div className="w-full max-w-sm">
              <div className="mb-8">
                <Logo />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Join us today
              </h1>
              <p className="text-secondary-100 text-lg leading-relaxed">
                Create your account and unlock a world of possibilities.
              </p>
              
              {/* Illustration */}
              <div className="mt-12 relative">
                <div className="w-full h-40 md:h-48 bg-white/10 rounded-xl backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-24 h-24 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="md:w-1/2 p-8 md:p-12 md:border-l border-gray-200">
            <div className="w-full max-w-sm mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Create your account
                </h2>
                <p className="text-gray-600">
                  Sign up to get started with your new account
                </p>
              </div>

              <GoogleButton />
              <Divider />

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  testId="signup-email"
                  autoFocus
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
                  showStrengthMeter
                  testId="signup-password"
                />

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

                <div className="text-sm text-gray-600">
                  <p className="mb-2">Password must contain:</p>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      At least 8 characters
                    </li>
                    <li className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      One uppercase letter
                    </li>
                    <li className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      One lowercase letter
                    </li>
                    <li className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      One number
                    </li>
                  </ul>
                </div>

                <div className="text-sm">
                  <label className="flex items-start">
                    <div className="mt-0.5">
                      <CircularCheckbox
                        checked={agreedToTerms}
                        onChange={() => setAgreedToTerms(!agreedToTerms)}
                      />
                    </div>
                    <span className="ml-2 text-gray-600">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary-600 hover:text-primary-700 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-primary-600 hover:text-primary-700 hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || !agreedToTerms || isLoading}
                  data-testid="signup-submit"
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/auth/signin"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Sign in →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};