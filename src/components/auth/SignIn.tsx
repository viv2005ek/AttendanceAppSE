// User login component - ENHANCED
import React, { useState } from 'react';
import { signIn } from '../../services/auth';
import { LogIn, Mail, Lock, Eye, EyeOff, Shield, User, ArrowRight } from 'lucide-react';

interface SignInProps {
  onToggleMode: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Card Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 p-8 text-center border-b border-white/10">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <LogIn className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-blue-100 text-sm">
              Sign in to access your attendance portal
            </p>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Email Input */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-blue-300 transition-colors" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-12 pr-4 w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300/30 transition-all duration-200 backdrop-blur-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-blue-300 transition-colors" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-12 pr-12 w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300/30 transition-all duration-200 backdrop-blur-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center space-x-3 py-4 px-6 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>Sign In</span>
                    <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </button>

              {/* Toggle Mode */}
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-white/70 text-sm mb-3">
                  Don't have an account?
                </p>
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="inline-flex items-center space-x-2 text-white hover:text-blue-200 font-medium transition-colors group"
                >
                  <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Create New Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 text-white/60 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Secure Authentication</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Role-based Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};