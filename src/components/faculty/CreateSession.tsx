// components/CreateSession.tsx
import React, { useState } from 'react';
import { createSession } from '../../services/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { generateSessionId } from '../../utils/geolocation';
import { ROOM_SIZES, ACTIVE_DURATIONS } from '../../utils/constants';
import { StudentData, Session } from '../../types';
import { importStudentsFromExcel, downloadSampleTemplate } from '../../utils/excel';
import { 
  MapPin, 
  Clock, 
  Users, 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  X, 
  Wifi, 
  Navigation,
  Building,
  Shield,
  Zap,
  FileText
} from 'lucide-react';

interface CreateSessionProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateSession: React.FC<CreateSessionProps> = ({ onClose, onSuccess }) => {
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
    requiredAccuracy: 10,
  });

  const [formData, setFormData] = useState({
    roomSize: 'mid' as 'small' | 'mid' | 'large',
    activeDuration: 10,
    accuracyBuffer: 5,
  });
  const [studentList, setStudentList] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const students = await importStudentsFromExcel(file);
      setStudentList(students);
      setSuccess(`Successfully imported ${students.length} students`);
      setError('');
    } catch (err: any) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleCreateSession = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!location) {
      setError('Location is required to create a session');
      return;
    }

    if (studentList.length === 0) {
      setError('Please import student list before creating session');
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
      const sessionId = generateSessionId();
      const baseRadius = ROOM_SIZES[formData.roomSize];
      const deviceAccuracy = location.accuracy || 5;
      const radius = baseRadius + deviceAccuracy + formData.accuracyBuffer;
      const expiresAt = new Date(Date.now() + formData.activeDuration * 60 * 1000);

      const sessionData: Omit<Session, 'id'> = {
        sessionId,
        facultyId: user.uid,
        facultyName: user.name,
        coordinates: { latitude: location.latitude, longitude: location.longitude },
        radius,
        roomSize: formData.roomSize,
        correctnessRange: formData.accuracyBuffer,
        activeDuration: formData.activeDuration,
        createdAt: new Date(),
        expiresAt,
        status: 'active',
        studentList,
        locationAccuracy: location.accuracy,
      };

      await createSession(sessionData);
      setSuccess(`Session created successfully! Session ID: ${sessionId}`);

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
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

  const totalRadius = location ? 
    ROOM_SIZES[formData.roomSize] + location.accuracy + formData.accuracyBuffer : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Create New Session
                </h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  Set up a new attendance session with location-based verification
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-all duration-200 p-2 hover:bg-white/10 rounded-2xl"
              >
                <X className="h-6 w-6" />
              </button>
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
                        Ready for session creation
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
                        <li>• Connect to <strong>iBUS@MUJ</strong> WiFi network</li>
                        <li>• Enable high-accuracy GPS mode</li>
                        <li>• Move near windows or open areas</li>
                        <li>• Grant Chrome location permissions</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Student List Import */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-100 p-2 rounded-xl">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Student List</h3>
                  <p className="text-sm text-gray-600">Upload your class roster</p>
                </div>
              </div>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Template</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 group-hover:text-blue-500 mx-auto mb-4 transition-colors" />
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                      Upload Excel File
                    </p>
                    <p className="text-sm text-gray-500">
                      Drag & drop or click to browse
                    </p>
                    <p className="text-xs text-gray-400">
                      Supports .xlsx, .xls, .csv formats
                    </p>
                  </div>
                </label>
              </div>

              {studentList.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">
                        {studentList.length} students loaded
                      </span>
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      Ready
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Session Configuration */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-xl">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Session Settings</h3>
                  <p className="text-sm text-gray-600">Configure attendance parameters</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Room Size */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span>Room Size</span>
                  </label>
                  <select
                    value={formData.roomSize}
                    onChange={(e) => setFormData({ ...formData, roomSize: e.target.value as 'small' | 'mid' | 'large' })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300"
                  >
                    <option value="small">Small Classroom ({ROOM_SIZES.small}m)</option>
                    <option value="mid">Medium Hall ({ROOM_SIZES.mid}m)</option>
                    <option value="large">Large Auditorium ({ROOM_SIZES.large}m)</option>
                  </select>
                </div>

                {/* Accuracy Buffer */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span>Safety Buffer</span>
                  </label>
                  <select
                    value={formData.accuracyBuffer}
                    onChange={(e) => setFormData({ ...formData, accuracyBuffer: Number(e.target.value) })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300"
                  >
                    <option value={2}>+2 meters (Strict)</option>
                    <option value={3}>+3 meters (Balanced)</option>
                    <option value={5}>+5 meters (Recommended)</option>
                    <option value={7}>+7 meters (Lenient)</option>
                  </select>
                </div>

                {/* Active Duration */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Duration</span>
                  </label>
                  <select
                    value={formData.activeDuration}
                    onChange={(e) => setFormData({ ...formData, activeDuration: parseInt(e.target.value) })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300"
                  >
                    {ACTIVE_DURATIONS.map(duration => (
                      <option key={duration} value={duration}>
                        {duration} minutes
                      </option>
                    ))}
                  </select>
                </div>

                {/* Radius Summary */}
                {location && (
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span>Total Radius</span>
                    </label>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700 mb-1">
                          {totalRadius.toFixed(1)}m
                        </div>
                        <div className="text-xs text-blue-600">
                          Room {ROOM_SIZES[formData.roomSize]}m + Accuracy {location.accuracy.toFixed(1)}m + Buffer {formData.accuracyBuffer}m
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={loading || !location || studentList.length === 0}
                className="flex-1 flex justify-center items-center space-x-3 py-4 px-6 border border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Creating Session...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>Create Session</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};