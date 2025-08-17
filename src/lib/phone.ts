export interface CountryOption {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'Belgium', code: 'BE', dialCode: '+32', flag: '🇧🇪' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { name: 'Austria', code: 'AT', dialCode: '+43', flag: '🇦🇹' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { name: 'Denmark', code: 'DK', dialCode: '+45', flag: '🇩🇰' },
  { name: 'Finland', code: 'FI', dialCode: '+358', flag: '🇫🇮' },
  { name: 'Poland', code: 'PL', dialCode: '+48', flag: '🇵🇱' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420', flag: '🇨🇿' },
  { name: 'Hungary', code: 'HU', dialCode: '+36', flag: '🇭🇺' },
  { name: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { name: 'Greece', code: 'GR', dialCode: '+30', flag: '🇬🇷' },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { name: 'Russia', code: 'RU', dialCode: '+7', flag: '🇷🇺' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷' },
  { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱' },
  { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴' },
  { name: 'Peru', code: 'PE', dialCode: '+51', flag: '🇵🇪' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪' },
  { name: 'Morocco', code: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { name: 'Israel', code: 'IL', dialCode: '+972', flag: '🇮🇱' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Jordan', code: 'JO', dialCode: '+962', flag: '🇯🇴' },
  { name: 'Lebanon', code: 'LB', dialCode: '+961', flag: '🇱🇧' },
];

export const DEFAULT_COUNTRY: CountryOption = COUNTRY_OPTIONS[0]; // United States

/**
 * Validates a phone number for a given country
 */
export function validatePhoneNumber(phoneNumber: string, countryCode: string): boolean {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Basic validation - at least 7 digits, at most 15 digits
  if (digits.length < 7 || digits.length > 15) {
    return false;
  }

  // Country-specific validation
  switch (countryCode) {
    case 'US':
    case 'CA':
      // North American Numbering Plan: 10 digits
      return digits.length === 10;
    case 'GB':
      // UK: 10-11 digits
      return digits.length >= 10 && digits.length <= 11;
    case 'DE':
      // Germany: 11-12 digits
      return digits.length >= 11 && digits.length <= 12;
    case 'FR':
      // France: 10 digits
      return digits.length === 10;
    case 'IN':
      // India: 10 digits
      return digits.length === 10;
    case 'AU':
      // Australia: 9 digits
      return digits.length === 9;
    case 'JP':
      // Japan: 10-11 digits
      return digits.length >= 10 && digits.length <= 11;
    case 'CN':
      // China: 11 digits
      return digits.length === 11;
    case 'BR':
      // Brazil: 10-11 digits
      return digits.length >= 10 && digits.length <= 11;
    default:
      // Generic validation for other countries
      return digits.length >= 7 && digits.length <= 15;
  }
}

/**
 * Formats a phone number to E.164 format for Firebase Auth
 */
export function formatToE164(phoneNumber: string, countryCode: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  const country = COUNTRY_OPTIONS.find(c => c.code === countryCode);
  
  if (!country) {
    throw new Error(`Unsupported country code: ${countryCode}`);
  }

  return `${country.dialCode}${digits}`;
}

/**
 * Formats a phone number for display purposes
 */
export function formatForDisplay(phoneNumber: string, countryCode: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (!digits) return '';

  // Country-specific formatting
  switch (countryCode) {
    case 'US':
    case 'CA':
      // Format as (XXX) XXX-XXXX
      if (digits.length >= 6) {
        const areaCode = digits.slice(0, 3);
        const exchange = digits.slice(3, 6);
        const number = digits.slice(6, 10);
        return `(${areaCode}) ${exchange}-${number}`;
      } else if (digits.length >= 3) {
        const areaCode = digits.slice(0, 3);
        const rest = digits.slice(3);
        return `(${areaCode}) ${rest}`;
      }
      return digits;
    
    case 'GB':
      // Format as XXXX XXX XXXX
      if (digits.length >= 7) {
        const area = digits.slice(0, 4);
        const middle = digits.slice(4, 7);
        const end = digits.slice(7);
        return `${area} ${middle} ${end}`;
      }
      return digits;
    
    case 'DE':
      // Format as XXX XXXXXXXX
      if (digits.length >= 4) {
        const area = digits.slice(0, 3);
        const rest = digits.slice(3);
        return `${area} ${rest}`;
      }
      return digits;
    
    case 'FR':
      // Format as XX XX XX XX XX
      if (digits.length >= 2) {
        return digits.match(/.{1,2}/g)?.join(' ') || digits;
      }
      return digits;
    
    case 'IN':
      // Format as XXXXX XXXXX
      if (digits.length >= 5) {
        const first = digits.slice(0, 5);
        const second = digits.slice(5);
        return `${first} ${second}`;
      }
      return digits;
    
    default:
      // Generic formatting - add spaces every 3-4 digits
      if (digits.length >= 4) {
        return digits.match(/.{1,3}/g)?.join(' ') || digits;
      }
      return digits;
  }
}

/**
 * Removes formatting from a phone number, keeping only digits
 */
export function stripFormatting(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

/**
 * Gets country option by country code
 */
export function getCountryByCode(countryCode: string): CountryOption | undefined {
  return COUNTRY_OPTIONS.find(country => country.code === countryCode);
}

/**
 * Gets country option by dial code
 */
export function getCountryByDialCode(dialCode: string): CountryOption | undefined {
  return COUNTRY_OPTIONS.find(country => country.dialCode === dialCode);
}

