import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { AuthMethodStack } from '../components/auth/AuthMethodStack';
import { StarsBackground } from '../components/ui/stars-background-new';

import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { LoaderOne } from '../components/ui/loader';

export const SignIn: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Set page title
  useEffect(() => {
    document.title = 'Sign In - Invisible Mechanics';
  }, []);

  // Redirect authenticated users to dashboard
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoaderOne />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAuthSuccess = (signedInUser: any) => {
    // Check if user needs onboarding
    if (signedInUser.metadata?.creationTime === signedInUser.metadata?.lastSignInTime) {
      // New user - redirect to onboarding
      navigate('/onboarding');
    } else {
      // Existing user - redirect to dashboard
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        <div className="flex flex-col md:flex-row">
          {/* Stars Background Panel */}
          <div className="md:w-1/2 relative overflow-hidden">
            <StarsBackground 
              className="absolute inset-0"
              factor={0.03}
              speed={60}
              starColor="#8b5cf6"
            >
              <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center items-center text-white h-full">
                <div className="w-full max-w-sm">
                  <div className="mb-8">
                    <Logo />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    Welcome back
                  </h1>
                  <p className="text-purple-200 text-lg leading-relaxed">
                    Sign in to your account to continue your journey with us.
                  </p>
                  
                  <div className="mt-12 p-6 bg-black/20 backdrop-blur-sm rounded-xl border border-purple-500/30">
                    <h3 className="text-lg font-semibold mb-2 text-purple-300">✨ Interactive Background</h3>
                    <p className="text-sm text-purple-200/80">
                      Hover over the hexagonal pattern to see the beautiful interactive effects. 
                      This modern animation matches our advanced learning platform.
                    </p>
                  </div>
                </div>
              </div>
            </StarsBackground>
          </div>

          {/* Form Panel */}
          <div className="md:w-1/2 p-8 md:p-12 md:border-l border-gray-200">
            <div className="w-full max-w-sm mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sign in to your account
                </h2>
                <p className="text-gray-600">
                  Enter your credentials to access your account
                </p>
              </div>

              <AuthMethodStack 
                mode="sign-in"
                onSuccess={handleAuthSuccess}
              />

              <p className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/auth/signup"
                  className="font-medium text-primary-600 hover:text-primary-700"
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