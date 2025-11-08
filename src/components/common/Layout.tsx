// Main layout component - ENHANCED
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { logOut } from '../../services/auth';
import { LogOut, Users, BookOpen, Menu, X, Home, Settings, Bell, Shield } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return <div>{children}</div>;
  }

  const isFaculty = user.role === 'faculty';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl ${
                isFaculty 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-br from-green-500 to-green-600'
              } shadow-lg`}>
                {isFaculty ? (
                  <BookOpen className="h-6 w-6 text-white" />
                ) : (
                  <Users className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Smart Attendance
                </h1>
                <p className="text-xs text-gray-500 font-medium capitalize">
                  {user.role} Portal
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {/* User Info */}
              <div className="flex items-center space-x-3 bg-gray-100/80 px-4 py-2 rounded-2xl border border-gray-200/60">
                <div className="flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                    isFaculty
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : 'bg-gradient-to-br from-green-500 to-green-600'
                  }`}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">
                    {user.registrationNumber}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300 hover:shadow-sm group"
              >
                <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/60">
            <div className="px-4 py-4 space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  isFaculty
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : 'bg-gradient-to-br from-green-500 to-green-600'
                }`}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.registrationNumber}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>

              {/* Mobile Menu Items */}
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Home className="h-4 w-4" />
                  <span className="text-sm font-medium">Dashboard</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Settings</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm font-medium">Notifications</span>
                </button>
              </div>

              {/* Mobile Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200 mt-4"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-semibold">Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-gray-200/60 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <p className="text-sm text-gray-600">
                Secure Attendance System • {new Date().getFullYear()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                {isFaculty ? 'Faculty Access' : 'Student Access'}
              </span>
              <div className="text-xs text-gray-500">
                Logged in as <span className="font-semibold text-gray-700">{user.name}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};