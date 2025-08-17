import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { PhoneAuthWidget } from './PhoneAuthWidget';

interface PhoneGuardProps {
  user: User;
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: () => void;
}

export const PhoneGuard: React.FC<PhoneGuardProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const handlePhoneVerified = async (user: User) => {
    
    // Show success message
    toast.success('Phone verified successfully!', {
      duration: 3000,
      icon: '✅',
    });

    // Close modal and call success callback
    onSuccess();
  };

  const handleError = (error: string) => {
    setIsVerifying(false);
    toast.error(error);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Verify your phone to continue
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                We need to verify your phone number for security
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-medium text-sm">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Phone Auth Widget */}
            <PhoneAuthWidget
              mode="link"
              onSuccess={handlePhoneVerified}
              onError={handleError}
              existingUser={user}
            />

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Why verify your phone?
                  </h4>
                  <p className="text-sm text-blue-700">
                    Phone verification adds an extra layer of security to your account and helps us protect against unauthorized access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

