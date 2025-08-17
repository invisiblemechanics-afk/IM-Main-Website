# 🔥 Firebase Setup Required

## ❌ Current Issue
The error "Firebase: Error (auth/invalid-app-credential)" indicates that phone authentication is not properly configured in your Firebase project.

## ✅ Required Setup Steps

### 1. Enable Phone Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **invisible-mechanics---2**
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Phone** in the list of providers
5. Click **Enable**
6. Save the changes

### 2. Configure reCAPTCHA (Already Done)
✅ reCAPTCHA keys are already configured in the code:
- Site Key: `6LdjegrAAAACZMntyZP5AnlnYYLSd89Zj-9KOw`
- Secret Key: `6LdjegrAAAAG_Us7oGbvzZCvf5rUKRaf0aS7hY`

### 3. Add Authorized Domains
1. In Firebase Console → **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Add your development domain: `localhost`
4. If deploying, also add your production domain

### 4. Test Phone Numbers (Optional for Development)
1. In Firebase Console → **Authentication** → **Settings**
2. Scroll to **Phone numbers for testing**
3. Add test phone numbers with verification codes for development

## 🚀 After Setup
Once phone authentication is enabled in Firebase Console:

1. Refresh your browser
2. Try the phone authentication again
3. You should be able to:
   - Enter a phone number
   - Receive an OTP via SMS
   - Complete the verification process

## 🔧 Alternative: Use Email Authentication
If you prefer not to set up phone authentication right now, you can:

1. Click "Use email instead" on the sign-up page
2. Use the email/password authentication which is already working
3. Or use Google authentication

## 📞 Support
If you continue to have issues after enabling phone authentication:

1. Check the browser console for detailed error messages
2. Verify that your Firebase project has the correct configuration
3. Ensure your Firebase project has billing enabled (required for SMS)

---

**Note**: Phone authentication requires a Firebase project with billing enabled because SMS messages cost money. Make sure your Firebase project is on the Blaze (pay-as-you-go) plan.
