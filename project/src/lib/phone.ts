// Phone utilities and country options
// Provides: COUNTRY_OPTIONS, DEFAULT_COUNTRY, validatePhoneNumber, formatToE164, formatForDisplay, CountryOption

import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js'

export type CountryOption = {
  code: string
  name: string
  dialCode: string
  flag: string
}

// Minimal, sensible list of common countries. Add more as needed.
export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
]

export const DEFAULT_COUNTRY: CountryOption = COUNTRY_OPTIONS[0]

export function validatePhoneNumber(input: string, countryCode: string): boolean {
  const trimmed = (input || '').trim()
  if (!trimmed) return false

  const parsed = trimmed.startsWith('+')
    ? parsePhoneNumberFromString(trimmed)
    : parsePhoneNumberFromString(trimmed, countryCode as any)

  return parsed?.isValid() ?? false
}

export function formatToE164(input: string, countryCode: string): string | null {
  const trimmed = (input || '').replace(/\s+/g, '').trim()
  const parsed = trimmed.startsWith('+')
    ? parsePhoneNumberFromString(trimmed)
    : parsePhoneNumberFromString(trimmed, countryCode as any)

  return parsed?.number ?? null
}

export function formatForDisplay(digitsOnly: string, countryCode: string): string {
  try {
    const formatter = new AsYouType(countryCode as any)
    return formatter.input(digitsOnly)
  } catch {
    return digitsOnly
  }
}




