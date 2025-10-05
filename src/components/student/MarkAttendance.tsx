// Student attendance marking component - UPDATED
import React, { useState } from 'react';
import { getSessionBySessionId, markAttendance } from '../../services/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { calculateOverlapPercentage, isValidCoordinate } from '../../utils/geolocation';
import { determineAttendanceStatus, isStudentInList } from '../../utils/attendanceStatus';
import { STUDENT_BASE_RADIUS } from '../../utils/constants';
import { Session } from '../../types';
import { CheckCircle, Hash, MapPin, Clock, AlertCircle, Loader } from 'lucide-react';

export const MarkAttendance: React.FC = () => {
  const { user } = useAuth();
  const { location, error: locationError, loading: locationLoading, refetchLocation } = useLocation();
  
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

    setLoading(true);
    setError('');

    try {
      console.log('Student location:', location);
      console.log('Faculty location:', session.coordinates);
      console.log('Faculty radius:', session.radius);

      // Calculate overlap percentage
      // Student radius = base 2m + device accuracy (default to 5m if not available)
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mark Attendance</h2>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Location Status */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">Location Status</h3>
              </div>
              {!location && !locationLoading && (
                <button
                  onClick={refetchLocation}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Retry
                </button>
              )}
            </div>
            {locationLoading ? (
              <p className="text-sm text-gray-600 mt-2">Getting your location...</p>
            ) : locationError ? (
              <p className="text-sm text-red-600 mt-2">{locationError}</p>
            ) : location ? (
              <div className="text-sm text-green-600 mt-2">
                <p>✓ Location acquired successfully</p>
                <p className="text-xs text-gray-600 mt-1">
                  Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
            ) : null}
          </div>

          {/* Session ID Input */}
          <div>
            <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700 mb-2">
              Session ID
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="sessionId"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit session ID"
                  className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                />
              </div>
              <button
                onClick={handleSessionLookup}
                disabled={loading || sessionId.length !== 6}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Finding...</span>
                  </>
                ) : (
                  <span>Find Session</span>
                )}
              </button>
            </div>
          </div>

          {/* Session Information */}
          {session && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-medium text-blue-900 mb-3">Session Found</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Faculty:</span>
                  <p className="text-blue-800">{session.facultyName}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Room Size:</span>
                  <p className="text-blue-800 capitalize">{session.roomSize}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Duration:</span>
                  <p className="text-blue-800">{session.activeDuration} minutes</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Expires:</span>
                  <p className="text-blue-800">
                    {session.expiresAt.toLocaleTimeString()}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-blue-700 font-medium">Location Range:</span>
                  <p className="text-blue-800">{session.radius} meters radius</p>
                </div>
              </div>
            </div>
          )}

          {/* Mark Attendance Button */}
          <button
            onClick={handleMarkAttendance}
            disabled={!session || !location || loading}
            className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Marking Attendance...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Mark Attendance</span>
              </>
            )}
          </button>

          {!location && (
            <p className="text-sm text-gray-600 text-center">
              Location access is required to mark attendance. Please allow location permissions and try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};