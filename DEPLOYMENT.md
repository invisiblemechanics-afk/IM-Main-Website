# 🚀 Deployment Guide - IMWEB Learning Platform

This guide will help you deploy your IMWEB learning platform to a free domain using Vercel.

## 📋 Prerequisites

1. **GitHub Account** - Create one at [github.com](https://github.com)
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier)
3. **Firebase Project** - Your existing Firebase configuration

## 🔧 Setup Instructions

### Step 1: Prepare Your Firebase Configuration

Before deployment, you'll need these Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_USE_EMULATOR=false
```

**🔍 How to get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ (Settings) → Project Settings
4. Scroll down to "Your apps" section
5. Copy the config values from your web app

### Step 2: Create GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Name it `imweb-learning-platform` (or any name you prefer)
3. Make it **Public** (required for Vercel free tier)
4. Don't initialize with README (we'll upload existing code)

### Step 3: Upload Your Code to GitHub

**Option A: Using GitHub Web Interface**
1. Download your project as a ZIP file
2. Extract it
3. Go to your new GitHub repository
4. Click "uploading an existing file"
5. Drag and drop all your project files
6. Commit the changes

**Option B: Using Git Commands** (if you have Git installed)
```bash
cd project
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Vite project
5. **Important:** Add your environment variables:
   - Click "Environment Variables"
   - Add each `VITE_FIREBASE_*` variable with its value
   - Make sure to set `VITE_USE_EMULATOR=false`

6. Click "Deploy"

### Step 5: Configure Firebase for Production

1. In Firebase Console → Authentication → Settings → Authorized domains
2. Add your Vercel domain (e.g., `your-app-name.vercel.app`)
3. This allows authentication to work on your deployed site

## 🎉 Your App is Live!

After deployment, Vercel will provide you with:
- **Production URL**: `https://your-app-name.vercel.app`
- **Custom Domain**: You can add your own domain later
- **Automatic Deployments**: Every push to GitHub auto-deploys

## 📱 Sharing with Friends

Your friends can now access your learning platform at:
`https://your-app-name.vercel.app`

## 🔧 Troubleshooting

**Common Issues:**

1. **Firebase errors**: Make sure all environment variables are set correctly
2. **Build fails**: Check that all dependencies are in package.json
3. **Authentication not working**: Add your Vercel domain to Firebase authorized domains
4. **404 on refresh**: Already handled with vercel.json configuration

## 🚀 Next Steps

- **Custom Domain**: Add your own domain in Vercel dashboard
- **Analytics**: Monitor usage with Vercel Analytics
- **Performance**: Use Vercel's built-in performance monitoring

---

Need help? Check [Vercel Documentation](https://vercel.com/docs) or [Firebase Documentation](https://firebase.google.com/docs) 