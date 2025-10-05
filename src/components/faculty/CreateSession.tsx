import React, { useState } from 'react';
import { createSession } from '../../services/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { generateSessionId } from '../../utils/geolocation';
import { ROOM_SIZES, ACTIVE_DURATIONS } from '../../utils/constants';
import { StudentData, Session } from '../../types';
import { importStudentsFromExcel, downloadSampleTemplate } from '../../utils/excel';
import { MapPin, Clock, Users, Upload, Download, AlertCircle, CheckCircle, Loader, X } from 'lucide-react';

interface CreateSessionProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateSession: React.FC<CreateSessionProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const { location, error: locationError, loading: locationLoading, refetchLocation } = useLocation();

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
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
                <p className="text-xs text-gray-600">
                  Device accuracy: ±{location.accuracy.toFixed(1)}m
                </p>
              </div>
            ) : null}
          </div>

          {/* Student List Import */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import Student List
            </label>

            <div className="mb-3">
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Download sample template</span>
              </button>
            </div>

            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Upload Excel file</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  Excel files with studentName and registrationNumber columns
                </p>
              </div>
            </div>
            {studentList.length > 0 && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {studentList.length} students loaded
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Room Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Size
            </label>
            <select
              value={formData.roomSize}
              onChange={(e) => setFormData({ ...formData, roomSize: e.target.value as 'small' | 'mid' | 'large' })}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="small">Small ({ROOM_SIZES.small}m base radius)</option>
              <option value="mid">Medium ({ROOM_SIZES.mid}m base radius)</option>
              <option value="large">Large ({ROOM_SIZES.large}m base radius)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Final radius = Room size + Device accuracy + Additional buffer
            </p>
          </div>

          {/* Accuracy Buffer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Accuracy Buffer
            </label>
            <select
              value={formData.accuracyBuffer}
              onChange={(e) => setFormData({ ...formData, accuracyBuffer: Number(e.target.value) })}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={2}>+2 meters</option>
              <option value={3}>+3 meters</option>
              <option value={5}>+5 meters</option>
              <option value={7}>+7 meters</option>
            </select>
            {location && (
              <p className="text-xs text-gray-500 mt-1">
                Total radius: {ROOM_SIZES[formData.roomSize]} + {location.accuracy.toFixed(1)} + {formData.accuracyBuffer} = {(ROOM_SIZES[formData.roomSize] + location.accuracy + formData.accuracyBuffer).toFixed(1)}m
              </p>
            )}
          </div>

          {/* Active Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Duration
            </label>
            <select
              value={formData.activeDuration}
              onChange={(e) => setFormData({ ...formData, activeDuration: parseInt(e.target.value) })}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ACTIVE_DURATIONS.map(duration => (
                <option key={duration} value={duration}>
                  {duration} minutes
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSession}
              disabled={loading || !location || studentList.length === 0}
              className="flex-1 flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Creating Session...</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Create Session</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
