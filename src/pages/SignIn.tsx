import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { GoogleButton } from '../components/GoogleButton';
import { Divider } from '../components/Divider';
import { AuthInput } from '../components/AuthInput';
import { useAuthForm } from '../hooks/useAuthForm';

import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const SignIn: React.FC = () => {
  const { user, loading } = useAuth();
  const {
    formData,
    errors,
    authError,
    isLoading,
    showPassword,
    updateField,
    handleSubmit,
    isFormValid,
    setShowPassword,
  } = useAuthForm('signin');

  // Set page title
  useEffect(() => {
    document.title = 'Sign In - AuthFlow';
  }, []);

  // Redirect authenticated users to dashboard
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        <div className="flex flex-col md:flex-row">
          {/* Brand Panel */}
          <div className="md:w-1/2 bg-gradient-to-br from-indigo-500 to-purple-600 p-8 md:p-12 flex flex-col justify-center items-center text-white">
            <div className="w-full max-w-sm">
              <div className="mb-8">
                <Logo />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Welcome back
              </h1>
              <p className="text-indigo-100 text-lg leading-relaxed">
                Sign in to your account to continue your journey with us.
              </p>
              
              {/* Illustration */}
              <div className="mt-12 relative">
                <div className="w-full h-40 md:h-48 bg-white/10 rounded-xl backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-24 h-24 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="md:w-1/2 p-8 md:p-12 md:border-l border-gray-200 dark:border-gray-700">
            <div className="w-full max-w-sm mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Sign in to your account
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your credentials to access your account
                </p>
              </div>

              <GoogleButton />
              <Divider />

              <form onSubmit={handleSubmit} className="space-y-4">
                {(errors.general || authError) && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm"
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
                  testId="signin-email"
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
                  testId="signin-password"
                />

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  data-testid="signin-submit"
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/auth/signup"
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                >
                  Sign up →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};