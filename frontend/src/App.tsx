import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import RoleSelect from './pages/RoleSelect';
import InterviewSession from './pages/InterviewSession';
import FeedbackReport from './pages/FeedbackReport';
import RecruiterPanel from './pages/RecruiterPanel';

// Protected Route Guard Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'candidate' | 'recruiter' }> = ({
  children,
  allowedRole,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0b0c10]">
        <div className="w-10 h-10 border-4 border-cyber-light border-t-transparent rounded-full animate-spin shadow-neon-cyan" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Home Route Dispatcher (conditional rendering based on role)
const HomeDispatcher: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'recruiter') {
    return <RecruiterPanel />;
  }
  return <Dashboard />;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen flex flex-col justify-between">

        {/* Render Navbar only if user is logged in */}
        {user && <Navbar />}

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomeDispatcher />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload-resume"
              element={
                <ProtectedRoute allowedRole="candidate">
                  <ResumeUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/role-select"
              element={
                <ProtectedRoute allowedRole="candidate">
                  <RoleSelect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:id"
              element={
                <ProtectedRoute allowedRole="candidate">
                  <InterviewSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:id"
              element={
                <ProtectedRoute>
                  <FeedbackReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter"
              element={
                <ProtectedRoute allowedRole="recruiter">
                  <RecruiterPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Wildcard Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="py-6 border-t border-white/5 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} InterviewAI Mock Interview System. Practicing future-proof careers.
        </footer>
      </div>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
