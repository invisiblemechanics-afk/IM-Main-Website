import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { AuthMethodStack } from '../components/auth/AuthMethodStack';
import { StarsBackground } from '../components/ui/stars-background-new';

import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { LoaderOne } from '../components/ui/loader';

export const SignUp: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Set page title
  useEffect(() => {
    document.title = 'Sign Up - Invisible Mechanics';
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
    // New sign-up always goes to onboarding
    navigate('/onboarding');
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
                    Join us today
                  </h1>
                  <p className="text-purple-200 text-lg leading-relaxed">
                    Create your account and unlock a world of possibilities.
                  </p>
                  
                  <div className="mt-12 p-6 bg-black/20 backdrop-blur-sm rounded-xl border border-purple-500/30">
                    <h3 className="text-lg font-semibold mb-2 text-purple-300">✨ Interactive Background</h3>
                    <p className="text-sm text-purple-200/80">
                      Experience our interactive hexagonal background. Hover over the pattern to see beautiful 
                      purple glow effects that match our modern platform design.
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
                  Create your account
                </h2>
                <p className="text-gray-600">
                  Sign up to get started with your new account
                </p>
              </div>

              <AuthMethodStack 
                mode="sign-up"
                onSuccess={handleAuthSuccess}
              />

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