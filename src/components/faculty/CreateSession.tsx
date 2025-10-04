// Faculty session creation component
import React, { useState } from 'react';
import { createSession } from '../../services/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { generateSessionId } from '../../utils/location';
import { ROOM_SIZES, CORRECTNESS_RANGE, ACTIVE_DURATIONS } from '../../utils/constants';
import { StudentData, Session } from '../../types';
import { importStudentsFromExcel } from '../../utils/excel';
import { Plus, MapPin, Clock, Users, Upload, AlertCircle, CheckCircle } from 'lucide-react';

export const CreateSession: React.FC = () => {
  const { user } = useAuth();
  const { location, error: locationError, loading: locationLoading } = useLocation();
  
  const [formData, setFormData] = useState({
    roomSize: 'mid' as 'small' | 'mid' | 'large',
    activeDuration: 10,
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
      const radius = ROOM_SIZES[formData.roomSize] + CORRECTNESS_RANGE;
      const expiresAt = new Date(Date.now() + formData.activeDuration * 60 * 1000);

      const sessionData: Omit<Session, 'id'> = {
        sessionId,
        facultyId: user!.uid,
        facultyName: user!.name,
        coordinates: location,
        radius,
        roomSize: formData.roomSize,
        correctnessRange: CORRECTNESS_RANGE,
        activeDuration: formData.activeDuration,
        createdAt: new Date(),
        expiresAt,
        status: 'active',
        studentList,
      };

      await createSession(sessionData);
      setSuccess(`Session created successfully! Session ID: ${sessionId}`);
      
      // Reset form
      setStudentList([]);
      setFormData({ roomSize: 'mid', activeDuration: 10 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Plus className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Create New Session</h2>
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
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">Location Status</h3>
            </div>
            {locationLoading ? (
              <p className="text-sm text-gray-600">Getting your location...</p>
            ) : locationError ? (
              <p className="text-sm text-red-600">{locationError}</p>
            ) : location ? (
              <p className="text-sm text-green-600">
                Location acquired: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            ) : null}
          </div>

          {/* Student List Import */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import Student List
            </label>
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
              onChange={(e) => setFormData({ ...formData, roomSize: e.target.value as any })}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="small">Small (5m radius)</option>
              <option value="mid">Medium (10m radius)</option>
              <option value="large">Large (15m radius)</option>
            </select>
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

          <button
            onClick={handleCreateSession}
            disabled={loading || !location || studentList.length === 0}
            className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
  );
};