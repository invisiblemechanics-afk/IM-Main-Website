import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  signInWithPhoneNumber, 
  ConfirmationResult, 
  linkWithPhoneNumber,
  User
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc, getDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { createOrUpdateUserProfile } from '@/lib/auth/userProfile';
import { ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { auth, firestore } from '@/lib/firebase';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { 
  COUNTRY_OPTIONS, 
  DEFAULT_COUNTRY, 
  validatePhoneNumber, 
  formatToE164,
  formatForDisplay,
  CountryOption 
} from '@/lib/phone';
import '../../styles/auth-phone.css';
import { LoaderOne } from '../ui/loader';

type AuthState = 'idle' | 'codeSent' | 'verifying' | 'success' | 'error';

interface PhoneAuthWidgetProps {
  mode: 'signin' | 'signup' | 'link';
  onSuccess: (user: any) => void;
  onError?: (error: string) => void;
  existingUser?: User | null;
  className?: string;
}

export const PhoneAuthWidget: React.FC<PhoneAuthWidgetProps> = ({
  mode,
  onSuccess,
  onError,
  existingUser,
  className = '',
}) => {
  const [state, setState] = useState<AuthState>('idle');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRY_OPTIONS[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { recaptchaVerifier, isReady: recaptchaReady, error: recaptchaError, reset: resetRecaptcha } = useRecaptcha();

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Remove non-digits and format
    const digits = value.replace(/\D/g, '');
    const formatted = formatForDisplay(digits, selectedCountry.code);
    setPhoneNumber(formatted);
    setError(null);
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber, selectedCountry.code)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!recaptchaVerifier || !recaptchaReady) {
      setError('reCAPTCHA not ready. Please try again.');
      return;
    }

    const e164Phone = formatToE164(phoneNumber, selectedCountry.code);
    if (!e164Phone) {
      setError('Invalid phone number format');
      return;
    }

    setState('codeSent');
    setError(null);

    try {
      let confirmation: ConfirmationResult;

      if (mode === 'link' && existingUser) {
        // Link phone number to existing user
        confirmation = await linkWithPhoneNumber(existingUser, e164Phone, recaptchaVerifier);
      } else {
        // Sign in with phone number
        confirmation = await signInWithPhoneNumber(auth, e164Phone, recaptchaVerifier);
      }

      setConfirmationResult(confirmation);
      setResendCountdown(30);
      toast.success('OTP sent successfully!');
    } catch (err) {
      console.error('Error sending OTP:', err);
      setState('idle');
      
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/too-many-requests':
            setError('Too many attempts. Please try again later.');
            break;
          case 'auth/quota-exceeded':
            setError('SMS quota exceeded. Please try again later.');
            break;
          case 'auth/credential-already-in-use':
            setError('This phone number is already linked to another account. Sign in with phone instead.');
            break;
          case 'auth/invalid-phone-number':
            setError('Please enter a valid phone number.');
            break;
          default:
            setError(err.message || 'Failed to send OTP. Please try again.');
        }
      } else {
        setError('Failed to send OTP. Please try again.');
      }
      
      onError?.(error || 'Failed to send OTP');
      resetRecaptcha();
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!confirmationResult) {
      setError('No confirmation result available. Please resend OTP.');
      return;
    }

    setState('verifying');
    setError(null);

    try {
      const userCredential = await confirmationResult.confirm(otpCode);
      const user = userCredential.user;
      const e164Phone = formatToE164(phoneNumber, selectedCountry.code);

      if (!e164Phone) {
        throw new Error('Invalid phone number format');
      }

      // Handle user profile creation/update with phone number
      try {
        await createOrUpdateUserProfile(user, {
          phoneNumber: e164Phone
        });
      } catch (err) {
        if (err instanceof Error && err.message.includes('already registered')) {
          throw new Error('Phone number already linked to another account');
        }
        throw err;
      }

      setState('success');
      toast.success(mode === 'link' ? 'Phone verified successfully!' : 'Signed in successfully!');
      onSuccess(user);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setState('codeSent');
      
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/invalid-verification-code':
            setError('Invalid verification code. Please try again.');
            break;
          case 'auth/code-expired':
            setError('Verification code has expired. Please request a new one.');
            break;
          default:
            setError(err.message || 'Failed to verify OTP. Please try again.');
        }
      } else if (err instanceof Error) {
        if (err.message === 'Phone number already linked to another account') {
          setError('This phone number is already linked to another account. Sign in with phone instead.');
        } else {
          setError(err.message || 'Failed to verify OTP. Please try again.');
        }
      } else {
        setError('Failed to verify OTP. Please try again.');
      }
      
      onError?.(error || 'Failed to verify OTP');
    }
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;
    
    setOtpCode('');
    setState('idle');
    setConfirmationResult(null);
    resetRecaptcha();
    
    // Wait a moment for recaptcha to reset
    setTimeout(handleSendOTP, 500);
  };

  const isPhoneValid = phoneNumber.trim() && validatePhoneNumber(phoneNumber, selectedCountry.code);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* reCAPTCHA container - invisible */}
      <div id="recaptcha-container" className="hidden"></div>
      
      {/* Phone Number Input */}
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              
              {/* Country Selector + Phone Input */}
              <div className="flex">
                {/* Country Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex items-center gap-2 px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <span className="text-lg">{selectedCountry.flag}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedCountry.dialCode}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {/* Country Dropdown */}
                  <AnimatePresence>
                    {showCountryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                      >
                        {COUNTRY_OPTIONS.map((country) => (
                          <button
                            key={country.code}
                            onClick={() => {
                              setSelectedCountry(country);
                              setShowCountryDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-primary-50"
                          >
                            <span className="text-lg">{country.flag}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {country.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {country.dialCode}
                              </div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Phone Number Input */}
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Enter your phone number"
                  data-native-cursor
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Send OTP Button */}
            <button
              onClick={handleSendOTP}
              disabled={!isPhoneValid || !recaptchaReady}
              data-cursor="button"
              className="w-full px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mode === 'link' ? 'Send Verification Code' : 'Send OTP'}
            </button>

            {/* reCAPTCHA Error */}
            {recaptchaError && (
              <p className="text-sm text-red-600 text-center">{recaptchaError}</p>
            )}
          </motion.div>
        )}

        {/* OTP Verification */}
        {(state === 'codeSent' || state === 'verifying') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 md:mt-5"
          >
{/* OTP section */}
            <section className="mt-4 md:mt-5" aria-label="Enter OTP">
              <h4 className="text-center text-lg md:text-xl font-semibold">Verify Your Phone</h4>
              <p className="mt-1 text-center text-sm text-gray-600">
                We've sent a 6-digit code to <span className="font-semibold">{selectedCountry.dialCode} {phoneNumber}</span>
              </p>

              {/* Width cap + horizontal padding to stay away from borders */}
              <div className="mx-auto mt-4 md:mt-5 max-w-[360px] sm:max-w-[420px] px-2 sm:px-0">
                {/* Exactly 6 cells, even spacing. Do NOT wrap in extra cards. */}
                <div className="grid grid-cols-6 gap-2 sm:gap-3 md:gap-4 place-items-center">
                  {Array.from({ length: 6 }, (_, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        if (!inputRefs.current) inputRefs.current = [];
                        inputRefs.current[i] = el;
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="\d*"
                      maxLength={1}
                      className="otp-cell box-border im-input shrink-0 w-10 h-12 sm:w-11 sm:h-12 md:w-12 md:h-12 rounded-xl text-center text-base sm:text-lg font-semibold leading-none tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 border-2 bg-white border-gray-300 hover:border-gray-400 transition-colors"
                      value={otpCode[i] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(-1);
                        const newOtp = otpCode.split('');
                        newOtp[i] = value;
                        const newValue = newOtp.join('').slice(0, 6);
                        setOtpCode(newValue);
                        
                        // Move to next input if digit was entered
                        if (value && i < 5 && inputRefs.current[i + 1]) {
                          inputRefs.current[i + 1]?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
                        if (pastedData) {
                          const newValue = pastedData.slice(0, 6);
                          setOtpCode(newValue);
                          // Focus the last filled input or the next empty one
                          const focusIndex = Math.min(newValue.length, 5);
                          setTimeout(() => {
                            inputRefs.current[focusIndex]?.focus();
                          }, 0);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          e.preventDefault();
                          const newOtp = otpCode.split('');
                          
                          if (newOtp[i]) {
                            // Clear current input
                            newOtp[i] = '';
                            setOtpCode(newOtp.join(''));
                          } else if (i > 0) {
                            // Move to previous input and clear it
                            newOtp[i - 1] = '';
                            setOtpCode(newOtp.join(''));
                            inputRefs.current[i - 1]?.focus();
                          }
                        } else if (e.key === 'ArrowLeft' && i > 0) {
                          inputRefs.current[i - 1]?.focus();
                        } else if (e.key === 'ArrowRight' && i < 5) {
                          inputRefs.current[i + 1]?.focus();
                        }
                      }}
                      disabled={state === 'verifying'}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="im-cta w-full mt-5 h-11 md:h-12 rounded-full bg-primary-600 text-white font-semibold disabled:opacity-50 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                data-cursor="button"
                onClick={handleVerifyOTP}
                disabled={otpCode.length !== 6 || state === 'verifying'}
              >
                {state === 'verifying' && (
                  <LoaderOne />
                )}
                {state === 'verifying' ? "Verifying…" : "Verify Code"}
              </button>

              <p className="mt-3 text-center text-xs text-gray-600">
                {resendCountdown <= 0 ? "You can resend now." : `Resend code in ${resendCountdown}s`}
              </p>
              {resendCountdown <= 0 && (
                <button
                  type="button"
                  className="mt-2 mx-auto block text-sm text-primary-600 hover:text-primary-700 font-medium focus:outline-none"
                  onClick={handleResendOTP}
                  data-cursor="button"
                >
                  Resend OTP
                </button>
              )}
              <button
                type="button"
                className="mt-2 mx-auto block text-sm text-primary-600 hover:text-primary-700 focus:outline-none"
                onClick={() => {
                  setState('idle');
                  setOtpCode('');
                  setConfirmationResult(null);
                  setError(null);
                }}
                data-cursor="button"
              >
                Change phone number
              </button>
            </section>
          </motion.div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {mode === 'link' ? 'Phone Verified!' : 'Welcome!'}
              </h3>
              <p className="text-sm text-gray-600">
                {mode === 'link' 
                  ? 'Your phone number has been verified successfully.'
                  : 'You have been signed in successfully.'
                }
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <p className="text-sm text-red-600 text-center">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdown */}
      {showCountryDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowCountryDropdown(false)}
        />
      )}
    </div>
  );
};
