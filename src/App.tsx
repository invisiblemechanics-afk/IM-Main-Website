import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CursorProvider } from './context/CursorContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import DashboardV2 from './pages/DashboardV2';
import { Diagnostic } from './pages/Diagnostic';
import { ManualBuilder } from './pages/ManualBuilder';
import { Course } from './pages/Course';
import { Breakdowns } from './pages/Breakdowns';
import { Practice } from './pages/Practice';
import InteractiveCursor from './components/cursor/InteractiveCursor';
import NavigationDock from './components/NavigationDock';
import { LoaderOne } from './components/ui/loader';

// Lazy load mock tests pages
const MockTestsHome = lazy(() => import('./features/mock-tests/pages/MockTestsHome'));
const MockCreate = lazy(() => import('./features/mock-tests/pages/MockCreate'));
const MockLibrary = lazy(() => import('./features/mock-tests/pages/MockLibrary'));
const MockHistory = lazy(() => import('./features/mock-tests/pages/MockHistory'));
const MockAttempt = lazy(() => import('./features/mock-tests/pages/MockAttempt'));
const MockInstructions = lazy(() => import('./features/mock-tests/pages/MockInstructions'));
const MockResult = lazy(() => import('./features/mock-tests/pages/MockResult'));

// Lazy load community pages
const CommunityHome = lazy(() => import('./pages/community/CommunityHome').then(module => ({ default: module.CommunityHome })));
const ThreadComposer = lazy(() => import('./pages/community/ThreadComposer').then(module => ({ default: module.ThreadComposer })));
const ThreadDetail = lazy(() => import('./pages/community/ThreadDetail').then(module => ({ default: module.ThreadDetail })));

// Component to conditionally show NavigationDock
function AppContent() {
  const location = useLocation();
  
  // Don't show dock on landing, auth pages, onboarding, or during mock test flow
  const hideNavDock = ['/', '/auth/signin', '/auth/signup', '/onboarding'].includes(location.pathname) ||
                      location.pathname.startsWith('/mock-tests/attempt/') ||
                      location.pathname.startsWith('/mock-tests/instructions/');
  
  return (
    <>
              <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-v2" 
              element={
                <ProtectedRoute>
                  <DashboardV2 />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/diagnostic" 
              element={
                <ProtectedRoute>
                  <Diagnostic />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/builder/manual" 
              element={
                <ProtectedRoute>
                  <ManualBuilder />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/course" 
              element={
                <ProtectedRoute>
                  <Course />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/breakdowns" 
              element={
                <ProtectedRoute>
                  <Breakdowns />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/practice" 
              element={
                <ProtectedRoute>
                  <Practice />
                </ProtectedRoute>
              } 
            />
            {/* Community Routes */}
            <Route 
              path="/community" 
              element={
                <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoaderOne /></div>}>
                  <CommunityHome />
                </Suspense>
              } 
            />
            <Route 
              path="/community/new" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoaderOne /></div>}>
                    <ThreadComposer />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/community/t/:threadId" 
              element={
                <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoaderOne /></div>}>
                  <ThreadDetail />
                </Suspense>
              } 
            />
            {/* Mock Tests Routes */}
            <Route 
              path="/mock-tests" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoaderOne /></div>}>
                    <MockTestsHome />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mock-tests/create" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoaderOne /></div>}>
                    <MockCreate />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mock-tests/library" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoaderOne /></div>}>
                    <MockLibrary />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mock-tests/history" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoaderOne /></div>}>
                    <MockHistory />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mock-tests/attempt/:testId" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoaderOne /></div>}>
                    <MockAttempt />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mock-tests/instructions/:testId" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoaderOne /></div>}>
                    <MockInstructions />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mock-tests/result/:attemptId" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoaderOne /></div>}>
                    <MockResult />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          {/* Show NavigationDock only on protected pages */}
          {!hideNavDock && <NavigationDock />}
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
            }}
          />
          <InteractiveCursor />
        </>
      );
    }

function App() {
  // Initialize clean white theme
  useEffect(() => {
    // Remove any dark mode classes and ensure clean white theme
    document.body.classList.remove('dark');
    document.body.className = 'bg-gray-50';
  }, []);

  return (
    <AuthProvider>
      <CursorProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppContent />
          </div>
        </Router>
      </CursorProvider>
    </AuthProvider>
  );
}

export default App;