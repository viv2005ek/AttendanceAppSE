// User registration component - ENHANCED
import React, { useState } from 'react';
import { signUp } from '../../services/auth';
import { User } from '../../types';
import { UserPlus, Mail, Lock, User as UserIcon, Phone, Hash, Users, Eye, EyeOff, BookOpen, GraduationCap, ArrowRight, Shield } from 'lucide-react';

interface SignUpProps {
  onToggleMode: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    registrationNumber: '',
    phoneNumber: '',
    role: 'student' as 'faculty' | 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const userData: Omit<User, 'uid' | 'createdAt'> = {
        email: formData.email,
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
      };

      await signUp(formData.email, formData.password, userData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-700 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Main Card Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-8 text-center border-b border-white/10">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Join Smart Attendance
            </h2>
            <p className="text-blue-100 text-sm">
              Create your account to get started with location-based attendance
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

              {/* Grid Layout for Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information Column */}
                <div className="space-y-5">
                  {/* Full Name */}
                  <div className="group">
                    <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-purple-300 transition-colors" />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-12 pr-4 w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300/30 transition-all duration-200 backdrop-blur-sm"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  {/* Registration Number */}
                  <div className="group">
                    <label htmlFor="registrationNumber" className="block text-sm font-medium text-white/80 mb-2">
                      Registration Number
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-purple-300 transition-colors" />
                      <input
                        id="registrationNumber"
                        name="registrationNumber"
                        type="text"
                        required
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        className="pl-12 pr-4 w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300/30 transition-all duration-200 backdrop-blur-sm"
                        placeholder="Enter registration number"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="group">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-white/80 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-purple-300 transition-colors" />
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        required
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="pl-12 pr-4 w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300/30 transition-all duration-200 backdrop-blur-sm"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Information Column */}
                <div className="space-y-5">
                  {/* Email */}
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
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  {/* Password */}
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
                        placeholder="Enter password"
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

                  {/* Role Selection */}
                  <div className="group">
                    <label htmlFor="role" className="block text-sm font-medium text-white/80 mb-2">
                      Account Type
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-blue-300 transition-colors z-10" />
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="pl-12 pr-4 w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300/30 transition-all duration-200 backdrop-blur-sm appearance-none cursor-pointer"
                      >
                        <option value="student" className="bg-gray-800 text-white">Student</option>
                        <option value="faculty" className="bg-gray-800 text-white">Faculty</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Users className="h-4 w-4 text-white/60" />
                      </div>
                    </div>
                    
                    {/* Role Description */}
                    <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center space-x-2 text-xs text-white/70">
                        {formData.role === 'student' ? (
                          <>
                            <GraduationCap className="h-3 w-3" />
                            <span>Student: Mark attendance for classes</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-3 w-3" />
                            <span>Faculty: Create sessions and manage attendance</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center space-x-3 py-4 px-6 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-300/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>Create Account</span>
                    <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </button>

              {/* Toggle Mode */}
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-white/70 text-sm mb-3">
                  Already have an account?
                </p>
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="inline-flex items-center space-x-2 text-white hover:text-blue-200 font-medium transition-colors group"
                >
                  <UserIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Sign In to Existing Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-8 text-white/60 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Secure & Encrypted</span>
            </div>
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>College Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Location-based</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};