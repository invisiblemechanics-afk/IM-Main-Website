# Phone Authentication Setup Guide

## Overview
Phone number authentication and verification has been successfully implemented in this project using Firebase Auth and Google reCAPTCHA.

## Configuration

### reCAPTCHA Keys
The following reCAPTCHA keys have been configured:
- **Site Key**: `6LdjegrAAAACZMntyZP5AnlnYYLSd89Zj-9KOw`
- **Secret Key**: `6LdjegrAAAAG_Us7oGbvzZCvf5rUKRaf0aS7hY`

### Firebase Setup Required
To enable phone authentication, ensure the following is configured in your Firebase Console:

1. **Enable Phone Authentication**:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Phone" as a sign-in provider

2. **Configure reCAPTCHA**:
   - The reCAPTCHA is automatically configured with the provided keys
   - Invisible reCAPTCHA is used for better user experience

## How It Works

### Authentication Flow
1. **Phone Number Input**: User enters their phone number with country selection
2. **reCAPTCHA Verification**: Invisible reCAPTCHA validates the request
3. **SMS Sending**: Firebase sends a 6-digit OTP to the phone number
4. **OTP Verification**: User enters the OTP code
5. **Account Creation/Sign-in**: User profile is created or updated with phone number

### Components Used
- `PhoneAuthWidget`: Main component handling phone authentication
- `OTPInput`: Specialized input component for OTP codes
- `PhoneGuard`: Modal for phone verification after other auth methods
- `useRecaptcha`: Hook managing reCAPTCHA initialization and state

### Integration Points
- **Sign In/Sign Up Pages**: Phone auth is the primary authentication method
- **Google Auth**: After Google sign-in, users are prompted to verify phone
- **User Profiles**: Phone numbers are stored in Firestore user profiles

## Features

### Phone Number Validation
- Country-specific validation rules
- Support for 60+ countries with proper formatting
- E.164 format conversion for Firebase compatibility

### Security Features
- Invisible reCAPTCHA prevents abuse
- Rate limiting through Firebase
- Phone number uniqueness validation
- Secure OTP delivery via SMS

### User Experience
- Real-time phone number formatting
- Intuitive country selection dropdown
- Paste support for OTP codes
- Keyboard navigation for OTP inputs
- Loading states and error handling
- Resend OTP functionality with countdown

## Testing

### Development Testing
- Use Firebase test phone numbers for development
- Configure test numbers in Firebase Console → Authentication → Settings

### Production Considerations
- Ensure your domain is added to Firebase authorized domains
- Monitor SMS usage and costs
- Set up proper error tracking
- Consider implementing phone number verification limits

## Error Handling

The system handles various error scenarios:
- Invalid phone numbers
- reCAPTCHA failures
- SMS delivery issues
- Invalid OTP codes
- Network connectivity problems
- Rate limiting and quota exceeded

## Files Modified/Created

### Core Implementation
- `src/hooks/useRecaptcha.ts` - reCAPTCHA management
- `src/components/auth/PhoneAuthWidget.tsx` - Main phone auth component
- `src/components/auth/OTPInput.tsx` - OTP input component
- `src/lib/phone.ts` - Phone number utilities
- `src/utils/auth.ts` - Authentication utilities

### Configuration
- `index.html` - reCAPTCHA script inclusion
- `src/lib/auth/userProfile.ts` - User profile management

### Integration
- `src/components/auth/AuthMethodStack.tsx` - Auth method selection
- `src/components/auth/PhoneGuard.tsx` - Phone verification modal

## Usage Examples

### Basic Phone Authentication
```typescript
<PhoneAuthWidget
  mode="signin"
  onSuccess={(user) => {
    // Handle successful authentication
    console.log('User signed in:', user);
  }}
/>
```

### Phone Number Linking
```typescript
<PhoneAuthWidget
  mode="link"
  existingUser={currentUser}
  onSuccess={(user) => {
    // Handle successful phone linking
    console.log('Phone linked:', user);
  }}
/>
```

## Support

The phone authentication system is fully integrated with the existing authentication flow and maintains compatibility with all existing features including:
- Email/password authentication
- Google OAuth
- User profiles and onboarding
- Protected routes
- Session management

For any issues or questions, refer to the Firebase Authentication documentation or check the browser console for detailed error messages.
