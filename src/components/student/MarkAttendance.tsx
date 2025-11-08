// Student attendance marking component - ENHANCED
import React, { useState } from 'react';
import { getSessionBySessionId, markAttendance } from '../../services/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { calculateOverlapPercentage, isValidCoordinate } from '../../utils/geolocation';
import { determineAttendanceStatus, isStudentInList } from '../../utils/attendanceStatus';
import { STUDENT_BASE_RADIUS } from '../../utils/constants';
import { Session } from '../../types';
import { CheckCircle, Hash, MapPin, Clock, AlertCircle, Loader, X, User, Target, Navigation, Wifi, Zap } from 'lucide-react';

export const MarkAttendance: React.FC = () => {
  const { user } = useAuth();
  const { 
    location, 
    error: locationError, 
    loading: locationLoading, 
    attempts,
    bestAccuracy,
    requiredAccuracy,
    refetchLocation 
  } = useLocation({
    maxAttempts: 10,
    requiredAccuracy: 20
  });
  
  const [sessionId, setSessionId] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSessionLookup = async () => {
    if (!sessionId || sessionId.length !== 6) {
      setError('Please enter a valid 6-digit session ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sessionData = await getSessionBySessionId(sessionId);
      
      if (!sessionData) {
        setError('Session not found or has expired');
        setSession(null);
        return;
      }

      // Check if session is still active
      if (new Date() > sessionData.expiresAt) {
        setError('This session has expired');
        setSession(null);
        return;
      }

      setSession(sessionData);
      setError('');
    } catch (err: any) {
      setError(err.message);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!session || !user) {
      setError('Missing session or user information');
      return;
    }

    if (!location || !isValidCoordinate(location)) {
      setError('Valid location is required. Please ensure location services are enabled.');
      return;
    }

    // Warn if accuracy is poor but allow proceeding
    if (location.accuracy > requiredAccuracy) {
      const proceed = window.confirm(
        `Warning: Location accuracy is ${location.accuracy.toFixed(1)}m (required: ${requiredAccuracy}m). ` +
        `This may affect attendance accuracy. Do you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Student location:', location);
      console.log('Faculty location:', session.coordinates);
      console.log('Faculty radius:', session.radius);

      // Calculate overlap percentage
      // Student radius = base 2m + device accuracy
      const deviceAccuracy = location.accuracy || 5;
      const studentRadius = STUDENT_BASE_RADIUS + deviceAccuracy;

      console.log(`Device accuracy: ${deviceAccuracy}m, Student radius: ${studentRadius}m`);
      const overlapPercentage = calculateOverlapPercentage(
        session.coordinates,
        location,
        session.radius,
        studentRadius
      );

      console.log('Calculated overlap percentage:', overlapPercentage);

      // Check if student is in the session's student list
      const studentInList = isStudentInList(
        user.registrationNumber,
        session.studentList
      );

      // Determine status based on overlap percentage and student list
      const status = determineAttendanceStatus(overlapPercentage, studentInList);

      // Prepare attendance data with validated coordinates
      const attendanceData = {
        sessionId: session.sessionId,
        studentId: user.uid,
        studentName: user.name,
        registrationNumber: user.registrationNumber,
        studentCoords: {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude)
        },
        overlapPercentage: overlapPercentage,
        status,
        facultyOverride: false,
        finalStatus: status,
        locationAccuracy: location.accuracy,
      };

      console.log('Submitting attendance data:', attendanceData);

      await markAttendance(attendanceData);
      
      setSuccess(`Attendance marked successfully! Status: ${status.replace(/_/g, ' ')}`);
      setSession(null);
      setSessionId('');
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyStatus = () => {
    if (!location) return 'waiting';
    if (location.accuracy <= requiredAccuracy) return 'excellent';
    if (location.accuracy <= requiredAccuracy * 2) return 'good';
    if (location.accuracy <= requiredAccuracy * 3) return 'fair';
    return 'poor';
  };

  const accuracyStatus = getAccuracyStatus();
  const accuracyColors = {
    waiting: { text: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300' },
    excellent: { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
    good: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    fair: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    poor: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
  };

  const accuracyIcons = {
    waiting: <Loader className="h-4 w-4 animate-spin" />,
    excellent: <CheckCircle className="h-4 w-4" />,
    good: <CheckCircle className="h-4 w-4" />,
    fair: <AlertCircle className="h-4 w-4" />,
    poor: <AlertCircle className="h-4 w-4" />
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mark Attendance</h1>
                <p className="text-green-100 text-sm sm:text-base">
                  Enter your session ID and verify location to mark attendance
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Status Messages */}
            {error && (
              <div className={`p-4 rounded-2xl border-2 ${accuracyColors.poor.border} ${accuracyColors.poor.bg} animate-pulse`}>
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className={`p-4 rounded-2xl border-2 ${accuracyColors.excellent.border} ${accuracyColors.excellent.bg} animate-pulse`}>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Location Status Card */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Location Status</h3>
                    <p className="text-sm text-gray-600">Real-time GPS accuracy monitoring</p>
                  </div>
                </div>
                {!locationLoading && location && (
                  <div className="flex items-center space-x-2">
                    {accuracyStatus !== 'excellent' && (
                      <button
                        onClick={refetchLocation}
                        className="text-sm bg-white text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 transition-all shadow-sm"
                      >
                        Retry
                      </button>
                    )}
                    <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${accuracyColors[accuracyStatus].bg} ${accuracyColors[accuracyStatus].text}`}>
                      {accuracyStatus.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {locationLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Loader className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Acquiring precise location...
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">Attempt {attempts}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${(attempts / 10) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Wifi className="h-3 w-3" />
                      <span>Scanning networks...</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-3 w-3" />
                      <span>Calibrating GPS...</span>
                    </div>
                  </div>
                </div>
              ) : locationError && !location ? (
                <div className="text-center py-4">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <p className="text-red-600 font-medium mb-2">{locationError}</p>
                  <button
                    onClick={refetchLocation}
                    className="text-blue-600 hover:text-blue-800 font-medium underline text-sm"
                  >
                    Try again with better settings
                  </button>
                </div>
              ) : locationError && location ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 text-amber-800">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{locationError}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      {accuracyIcons[accuracyStatus]}
                      <span className={`text-sm font-semibold ${accuracyColors[accuracyStatus].text}`}>
                        Using available location with {accuracyStatus} accuracy
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="font-semibold text-gray-900">Coordinates</span>
                        <div className="text-xs font-mono mt-1">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="font-semibold text-gray-900">Accuracy</span>
                        <div className="text-xs mt-1">
                          ±{location.accuracy.toFixed(1)}m
                          <span className="text-amber-600 ml-1">(target: ≤{requiredAccuracy}m)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : location ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {accuracyIcons[accuracyStatus]}
                    <div>
                      <p className={`font-semibold ${accuracyColors[accuracyStatus].text}`}>
                        {accuracyStatus === 'excellent' ? 'Perfect location acquired! 🎯' :
                         accuracyStatus === 'good' ? 'Good location accuracy ✓' :
                         accuracyStatus === 'fair' ? 'Fair location accuracy ⚠️' :
                         'Poor location accuracy ❗'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Ready for attendance marking
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <span className="font-semibold text-gray-900">Coordinates</span>
                      <div className="text-xs font-mono text-gray-600 mt-1">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <span className="font-semibold text-gray-900">Accuracy</span>
                      <div className="text-xs text-gray-600 mt-1">
                        ±{location.accuracy.toFixed(1)}m
                        {location.accuracy > requiredAccuracy && (
                          <span className="text-amber-600 ml-1">(target: ≤{requiredAccuracy}m)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {accuracyStatus !== 'excellent' && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-amber-800 mb-2">
                        💡 Improve Location Accuracy
                      </p>
                      <ul className="text-xs text-amber-700 space-y-1">
                        <li>• Enable high-accuracy GPS mode</li>
                        <li>• Move near windows or open areas</li>
                        <li>• Grant Chrome location permissions</li>
                        <li>• Wait for all 10 attempts to complete</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Session ID Input */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-xl">
                  <Hash className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Session Details</h3>
                  <p className="text-sm text-gray-600">Enter your 6-digit session ID</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit session ID"
                    className="pl-12 pr-4 w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={handleSessionLookup}
                  disabled={loading || sessionId.length !== 6}
                  className="sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 min-w-[140px]"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Finding...</span>
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4" />
                      <span>Find Session</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Session Information */}
            {session && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900">Session Found</h3>
                    <p className="text-sm text-blue-700">Ready to mark attendance</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                    <span className="text-blue-700 font-semibold">Faculty</span>
                    <p className="text-blue-900 font-medium">{session.facultyName}</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                    <span className="text-blue-700 font-semibold">Room Size</span>
                    <p className="text-blue-900 font-medium capitalize">{session.roomSize}</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                    <span className="text-blue-700 font-semibold">Duration</span>
                    <p className="text-blue-900 font-medium">{session.activeDuration} minutes</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                    <span className="text-blue-700 font-semibold">Expires</span>
                    <p className="text-blue-900 font-medium">
                      {session.expiresAt.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="sm:col-span-2 bg-white/80 p-3 rounded-xl border border-blue-100">
                    <span className="text-blue-700 font-semibold">Location Range</span>
                    <p className="text-blue-900 font-medium">{session.radius} meters radius</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mark Attendance Button */}
            <button
              onClick={handleMarkAttendance}
              disabled={!session || !location || loading}
              className="w-full flex justify-center items-center space-x-3 py-4 px-6 border border-transparent rounded-2xl text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Marking Attendance...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Mark Attendance</span>
                </>
              )}
            </button>

            {!location && (
              <div className="text-center p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-600 mx-auto mb-2" />
                <p className="text-sm text-amber-800">
                  Location access is required to mark attendance. Please allow location permissions and try again.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};