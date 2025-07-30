# 🎓 IMWEB Learning Platform

A modern, interactive learning platform built with React, TypeScript, and Firebase. Features custom video players, diagnostic tests, and personalized course building.

![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.0.0-orange)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.1-blue)

## ✨ Features

### 🎯 **Diagnostic Assessment**
- 15-question adaptive diagnostic test
- Automatic topic pre-selection based on incorrect answers
- Seamless handoff to course builder

### 🎬 **Custom Video Player**
- Branded control bar with purple accents
- Keyboard controls (spacebar, arrow keys)
- Full-screen support with custom styling
- Responsive design for all devices

### 📚 **Course Builder**
- Manual topic selection with search functionality
- Pre-selected topics from diagnostic results
- Prerequisite tracking and display
- Efficient, compact UI design

### 🎵 **Course Playback**
- Full-screen video experience
- Minimizable sidebar with smooth animations
- Progress tracking and topic completion
- Topic descriptions and metadata

### 🔐 **Authentication**
- Firebase Authentication integration
- Google Sign-In support
- Protected routes and user management

## 🚀 Live Demo

**🌐 Deployed Version:** [Your Vercel URL will be here]

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Firebase Firestore, Firebase Storage
- **Authentication:** Firebase Auth
- **Deployment:** Vercel
- **Build Tool:** Vite
- **Routing:** React Router v6

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/imweb-learning-platform.git
   cd imweb-learning-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_USE_EMULATOR=false
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

This project is configured for easy deployment to Vercel:

1. **Push to GitHub** (already done!)
2. **Connect to Vercel** at [vercel.com](https://vercel.com)
3. **Add environment variables** in Vercel dashboard
4. **Deploy automatically** on every push

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📱 Key Components

### 🎮 Video Players
- `CustomVideoPlayer.tsx` - Full-featured player for course content
- `VideoPlayer.tsx` - Firebase Storage integration player

### 🧪 Assessment System
- `Diagnostic.tsx` - Interactive diagnostic test with results
- `ManualBuilder.tsx` - Course builder with search and pre-selection

### 🎬 Course Experience
- `Course.tsx` - Full-screen course playback experience
- Minimizable sidebar with topic navigation

## 🎨 Design Features

- **Dark Theme** with purple accents (#7C3AED)
- **Responsive Design** for mobile, tablet, and desktop
- **Smooth Animations** and transitions
- **Accessible Controls** with keyboard support
- **Modern UI** with Tailwind CSS

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with modern React and TypeScript
- Styled with Tailwind CSS
- Icons from Lucide React
- Hosted on Vercel
- Database and auth via Firebase

---

**Made with ❤️ for interactive learning** 