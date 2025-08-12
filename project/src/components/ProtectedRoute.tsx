import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PhoneGuard } from './auth/PhoneGuard';
import { LoaderOne } from './ui/loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [showPhoneGuard, setShowPhoneGuard] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoaderOne />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Check if user needs phone verification (skip for onboarding page)
  const needsPhoneVerification = !user.phoneNumber && !window.location.pathname.includes('/onboarding');
  
  if (needsPhoneVerification) {
    return (
      <>
        {children}
        <PhoneGuard
          user={user}
          isOpen={!showPhoneGuard}
          onSuccess={() => {
            setShowPhoneGuard(true);
            // Refresh the page to update auth state
            window.location.reload();
          }}
        />
      </>
    );
  }

  return <>{children}</>;
};