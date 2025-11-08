import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/common/Layout';
import { SignIn } from './components/auth/SignIn';
import { SignUp } from './components/auth/SignUp';
import { CreateSession } from './components/faculty/CreateSession';
import { FacultyDashboard } from './components/faculty/FacultyDashboard';
import { MarkAttendance } from './components/student/MarkAttendance';
import { Loader, Shield, Users, BookOpen, Smartphone } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <Loader className="h-8 w-8 text-white animate-spin" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Smart Attendance</h2>
          <p className="text-blue-100 text-sm">Preparing your experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'signin' ? (
      <SignIn onToggleMode={() => setAuthMode('signup')} />
    ) : (
      <SignUp onToggleMode={() => setAuthMode('signin')} />
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          {user.role === 'faculty' ? (
            <>
              <Route path="/" element={<FacultyDashboard />} />
              <Route path="/create-session" element={<CreateSession />} />
              <Route path="/dashboard" element={<FacultyDashboard />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<MarkAttendance />} />
              <Route path="/attendance" element={<MarkAttendance />} />
              <Route path="*" element={<Navigate to="/attendance" replace />} />
            </>
          )}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;