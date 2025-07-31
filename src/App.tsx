import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { Diagnostic } from './pages/Diagnostic';
import { ManualBuilder } from './pages/ManualBuilder';
import { Course } from './pages/Course';
import { Breakdowns } from './pages/Breakdowns';

function App() {
  // Initialize clean white theme
  useEffect(() => {
    // Remove any dark mode classes and ensure clean white theme
    document.body.classList.remove('dark');
    document.body.className = 'bg-gray-50';
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;