import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { doc, setDoc, addDoc, collection, runTransaction, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { firestore } from '../lib/firebase';
import { Logo } from '../components/Logo';
import { LoaderOne } from '../components/ui/loader';

interface OnboardingFormData {
  fullName: string;
  username: string;
  targetExam: 'JEE Main' | 'JEE Advanced' | '';
  attemptYear: string;
  referralCode: string;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  targetExam?: string;
  attemptYear?: string;
}

const TARGET_EXAM_OPTIONS = [
  { value: 'JEE Main', label: 'JEE Main' },
  { value: 'JEE Advanced', label: 'JEE Advanced' },
];

export const Onboarding: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OnboardingFormData>({
    fullName: '',
    username: '',
    targetExam: '',
    attemptYear: '',
    referralCode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = 'Complete Your Profile - Invisible Mechanics';
  }, []);

  // Redirect if loading or no user
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

  // Check if user already has phone verification
  if (!user.phoneNumber) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateField = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Special handling for username validation
    if (field === 'username') {
      setUsernameAvailable(null);
      if (value.length >= 3) {
        checkUsernameAvailability(value);
      }
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    // Validate username format
    if (!isValidUsername(username)) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    
    try {
      // Check if username exists in users collection
      const usersRef = collection(firestore, 'users');
      const usernameQuery = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(usernameQuery);
      
      setUsernameAvailable(querySnapshot.empty);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const isValidUsername = (username: string): boolean => {
    // 3-20 characters, a-z, 0-9, underscore, dot
    const regex = /^[a-z0-9_.]{3,20}$/;
    return regex.test(username.toLowerCase());
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!isValidUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters (a-z, 0-9, _, .)';
    } else if (usernameAvailable === false) {
      newErrors.username = 'This username is already taken';
    }

    if (!formData.targetExam) {
      newErrors.targetExam = 'Please select your target exam';
    }

    if (!formData.attemptYear.trim()) {
      newErrors.attemptYear = 'Attempt year is required';
    } else {
      const year = parseInt(formData.attemptYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < currentYear || year > currentYear + 5) {
        newErrors.attemptYear = `Please enter a valid year (${currentYear}-${currentYear + 5})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || usernameAvailable !== true) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Double-check username availability before saving
      const usersRef = collection(firestore, 'users');
      const usernameQuery = query(usersRef, where('username', '==', formData.username.toLowerCase()));
      const querySnapshot = await getDocs(usernameQuery);
      
      if (!querySnapshot.empty) {
        throw new Error('Username is no longer available');
      }

      // Update user profile with username and other data
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        fullName: formData.fullName.trim(),
        username: formData.username.toLowerCase(),
        targetExam: formData.targetExam,
        attemptYear: parseInt(formData.attemptYear),
        referralCode: formData.referralCode.trim() || null,
        onboarded: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast.success('Profile completed successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      
      if (error.message === 'Username is no longer available') {
        setErrors({ username: 'This username is no longer available' });
        setUsernameAvailable(false);
      } else {
        toast.error('Failed to save profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    formData.fullName.trim() &&
    formData.username.trim() &&
    formData.targetExam &&
    formData.attemptYear.trim() &&
    usernameAvailable === true &&
    Object.keys(errors).length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Just a few more details to get started
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Step 2 of 2</span>
            <span>100%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full w-full transition-all duration-300"></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="Enter your full name"
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value.toLowerCase())}
                placeholder="Choose a unique username"
                className={`w-full px-3 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                  errors.username ? 'border-red-300 bg-red-50' 
                  : usernameAvailable === true ? 'border-green-300 bg-green-50'
                  : usernameAvailable === false ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {checkingUsername ? (
                  <div className="w-4 h-4 flex items-center justify-center">
                    <LoaderOne />
                  </div>
                ) : usernameAvailable === true ? (
                  <CheckIcon className="w-4 h-4 text-green-600" />
                ) : usernameAvailable === false ? (
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </div>
            </div>
            {errors.username && (
              <p className="text-red-600 text-sm mt-1">{errors.username}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              3-20 characters, lowercase letters, numbers, dots and underscores only
            </p>
          </div>

          {/* Target Exam */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Exam *
            </label>
            <select
              value={formData.targetExam}
              onChange={(e) => updateField('targetExam', e.target.value)}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                errors.targetExam ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select your target exam</option>
              {TARGET_EXAM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.targetExam && (
              <p className="text-red-600 text-sm mt-1">{errors.targetExam}</p>
            )}
          </div>

          {/* Attempt Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attempt Year *
            </label>
            <input
              type="number"
              value={formData.attemptYear}
              onChange={(e) => updateField('attemptYear', e.target.value)}
              placeholder="YYYY"
              min={new Date().getFullYear()}
              max={new Date().getFullYear() + 5}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                errors.attemptYear ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.attemptYear && (
              <p className="text-red-600 text-sm mt-1">{errors.attemptYear}</p>
            )}
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Code <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.referralCode}
              onChange={(e) => updateField('referralCode', e.target.value.toUpperCase())}
              placeholder="Enter referral code if you have one"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <LoaderOne />
            )}
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
};

