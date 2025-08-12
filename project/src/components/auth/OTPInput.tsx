import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0]?.focus();
      setActiveIndex(0);
    }
  }, [autoFocus, disabled]);

  const getOTPValue = (): string[] => {
    return value.split('').concat(Array(length - value.length).fill(''));
  };

  const handleChange = (inputValue: string, index: number) => {
    // Only allow single digit
    const digit = inputValue.replace(/\D/g, '').slice(-1);
    
    const otpArray = getOTPValue();
    otpArray[index] = digit;
    
    const newValue = otpArray.join('').replace(/\s/g, '');
    onChange(newValue);

    // Move to next input if digit was entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const otpArray = getOTPValue();
      
      if (otpArray[index]) {
        // Clear current input
        otpArray[index] = '';
        onChange(otpArray.join('').replace(/\s/g, ''));
      } else if (index > 0) {
        // Move to previous input and clear it
        otpArray[index - 1] = '';
        onChange(otpArray.join('').replace(/\s/g, ''));
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
  };

  const handleBlur = () => {
    setActiveIndex(-1);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData) {
      const newValue = pastedData.slice(0, length);
      onChange(newValue);
      
      // Focus the last filled input or the next empty one
      const focusIndex = Math.min(newValue.length, length - 1);
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus();
        setActiveIndex(focusIndex);
      }, 0);
    }
  };

  const otpValues = getOTPValue();

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={otpValues[index] || ''}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          onPaste={handlePaste}
          disabled={disabled}
          className={`
            w-12 h-12 text-center text-lg font-semibold rounded-lg border-2 
            transition-all duration-200 
            focus:outline-none focus:ring-2 focus:ring-primary-500
            ${error 
              ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500' 
              : activeIndex === index
                ? 'border-primary-500 bg-primary-50 text-primary-900'
                : otpValues[index]
                  ? 'border-green-300 bg-green-50 text-green-900'
                  : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
          `}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

