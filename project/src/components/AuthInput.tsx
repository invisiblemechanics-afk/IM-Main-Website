import React, { useState, useId } from 'react';
import { PasswordEyeToggle } from './PasswordEyeToggle';
import { getPasswordStrength } from '../utils/validation';

interface AuthInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  showStrengthMeter?: boolean;
  testId?: string;
  autoFocus?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  type,
  value,
  onChange,
  error,
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  showStrengthMeter = false,
  testId,
  autoFocus = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = useId();
  const errorId = useId();
  
  const hasValue = value.length > 0;
  const isFloated = isFocused || hasValue;
  
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
  
  const passwordStrength = showStrengthMeter && type === 'password' ? getPasswordStrength(value) : null;

  // Quantize strength bar fill to fixed steps
  const getQuantizedWidth = (score: number) => {
    const strength = (score / 5) * 100;
    if (strength < 25) return 25;   // Weak
    if (strength < 50) return 50;   // Fair
    if (strength < 75) return 75;   // Good
    return 100;                     // Strong
  };

  const getStrengthColor = (score: number) => {
    const percentage = (score / 5) * 100;
    if (percentage < 25) return { bg: 'bg-red-600', text: 'text-red-600' };      // Weak → Red
    if (percentage < 50) return { bg: 'bg-orange-500', text: 'text-orange-500' }; // Fair → Orange
    if (percentage < 75) return { bg: 'bg-yellow-400', text: 'text-yellow-400' }; // Good → Yellow
    return { bg: 'bg-green-500', text: 'text-green-500' };                       // Strong
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          data-native-cursor
          className={`
            peer w-full px-3 pt-6 pb-2 border rounded-lg bg-transparent text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200
            ${error 
              ? 'border-red-500' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          placeholder={label}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          data-testid={testId}
          autoFocus={autoFocus}
        />
        <label
          htmlFor={inputId}
          className={`
            absolute left-3 transition-all duration-200 pointer-events-none
            ${isFloated 
              ? 'top-2 text-xs text-primary-600' 
              : 'top-4 text-gray-500'
            }
          `}
        >
          {label}
        </label>
        {showPasswordToggle && onTogglePassword && (
          <PasswordEyeToggle show={showPassword} onToggle={onTogglePassword} />
        )}
      </div>
      
      {passwordStrength && hasValue && (
        <div className="mt-3 mb-3 px-3" aria-hidden="true">
          <p className={`text-xs text-center mb-1 ${getStrengthColor(passwordStrength.score).text}`}>
            Password strength: {passwordStrength.label}
          </p>
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score).bg}`}
              style={{
                width: `${getQuantizedWidth(passwordStrength.score)}%`,
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
};