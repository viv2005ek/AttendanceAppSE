import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/common/Layout';
import { SignIn } from './components/auth/SignIn';
import { SignUp } from './components/auth/SignUp';
import { CreateSession } from './components/faculty/CreateSession';
import { FacultyDashboard } from './components/faculty/FacultyDashboard';
import { MarkAttendance } from './components/student/MarkAttendance';

function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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