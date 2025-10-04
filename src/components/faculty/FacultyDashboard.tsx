// FacultyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  getFacultySessions, 
  subscribeToSessionAttendance, 
  updateAttendanceStatus,
  createSession 
} from '../../services/firestore';
import { useAuth } from '../../hooks/useAuth';
import { Session, AttendanceRecord, StudentData } from '../../types';
import { exportAttendanceToExcel, importStudentsFromExcel, downloadSampleTemplate } from '../../utils/excel';
import { STATUS_COLORS, ATTENDANCE_STATUS_LABELS } from '../../utils/constants';
import { 
  Calendar, 
  Download, 
  CreditCard as Edit2, 
  Users, 
  Clock, 
  MapPin, 
  Plus,
  Upload,
  X,
  Loader
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [importedStudents, setImportedStudents] = useState<StudentData[]>([]);

  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;
      
      try {
        console.log('Loading sessions for user:', user.uid);
        const facultySessions = await getFacultySessions(user.uid);
        console.log('Loaded sessions:', facultySessions);
        setSessions(facultySessions);
        
        // Auto-select first session if available
        if (facultySessions.length > 0 && !selectedSession) {
          setSelectedSession(facultySessions[0]);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        alert('Failed to load sessions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [user]);

  useEffect(() => {
    if (!selectedSession) return;

    console.log('Subscribing to attendance for session:', selectedSession.sessionId);
    const unsubscribe = subscribeToSessionAttendance(
      selectedSession.sessionId,
      (attendance) => {
        console.log('Received attendance update:', attendance);
        setAttendanceRecords(attendance);
      }
    );

    return unsubscribe;
  }, [selectedSession]);

  const handleStatusUpdate = async (attendanceId: string, newStatus: string) => {
    try {
      await updateAttendanceStatus(attendanceId, newStatus);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleExportAttendance = () => {
    if (!selectedSession) return;

    try {
      exportAttendanceToExcel(attendanceRecords, {
        sessionId: selectedSession.sessionId,
        facultyName: selectedSession.facultyName,
        date: selectedSession.createdAt,
      });
    } catch (error) {
      console.error('Error exporting attendance:', error);
      alert('Failed to export attendance data. Please try again.');
    }
  };

  const handleCreateSession = async (sessionData: any) => {
    if (!user) return;
    
    try {
      const newSession = await createSession({
        ...sessionData,
        facultyId: user.uid,
        facultyName: user.name
      });
      
      setSessions(prev => [newSession, ...prev]);
      setSelectedSession(newSession);
      setShowCreateSession(false);
      setImportedStudents([]); // Clear imported students after session creation
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    }
  };

  const handleImportStudents = (students: StudentData[]) => {
    setImportedStudents(students);
  };

  const handleClearImportedStudents = () => {
    setImportedStudents([]);
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    return ATTENDANCE_STATUS_LABELS[status as keyof typeof ATTENDANCE_STATUS_LABELS] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Session Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
        <button
          onClick={() => setShowCreateSession(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Session</span>
        </button>
      </div>

      {/* Create Session Modal */}
      {showCreateSession && (
        <CreateSessionModal
          onClose={() => {
            setShowCreateSession(false);
            setImportedStudents([]);
          }}
          onCreate={handleCreateSession}
          onImportStudents={handleImportStudents}
          importedStudents={importedStudents}
          onClearImportedStudents={handleClearImportedStudents}
        />
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Your Sessions</span>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {sessions.length}
            </span>
          </h2>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg mb-2">No sessions created yet</p>
            <p className="text-sm mb-4">Create your first session to start tracking attendance</p>
            <button
              onClick={() => setShowCreateSession(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Session</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-6 cursor-pointer transition-colors ${
                  selectedSession?.id === session.id
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-semibold text-gray-900">
                        Session ID: {session.sessionId}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{session.activeDuration}min • {session.roomSize} room</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>Radius: {session.radius}m</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{session.studentList.length} students</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      Created: {session.createdAt.toLocaleString()}
                      {session.expiresAt && (
                        <span className="ml-4">
                          Expires: {session.expiresAt.toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {/* Quick actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                      }}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      View Attendance
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Details */}
      {selectedSession && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Attendance for Session {selectedSession.sessionId}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedSession.status === 'active' ? 'Live updates active' : 'Session ended'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleExportAttendance}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
          
          {attendanceRecords.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No attendance records yet.</p>
              <p className="text-sm">Students will appear here as they mark attendance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overlap %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.studentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.registrationNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === record.id ? (
                          <select
                            value={record.finalStatus}
                            onChange={(e) => handleStatusUpdate(record.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          >
                            <option value="present">Present</option>
                            <option value="check">Please Check</option>
                            <option value="proxy">Proxy</option>
                            <option value="not_in_list">Not in List</option>
                          </select>
                        ) : (
                          <span
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white cursor-pointer"
                            style={{ backgroundColor: getStatusColor(record.finalStatus) }}
                            onClick={() => setEditingId(record.id)}
                            title="Click to edit status"
                          >
                            {getStatusLabel(record.finalStatus)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.overlapPercentage?.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.timestamp?.toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => setEditingId(record.id)}
                          className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                          title="Edit status"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Create Session Modal Component
const CreateSessionModal: React.FC<{
  onClose: () => void;
  onCreate: (sessionData: any) => void;
  onImportStudents: (students: StudentData[]) => void;
  importedStudents: StudentData[];
  onClearImportedStudents: () => void;
}> = ({ onClose, onCreate, onImportStudents, importedStudents, onClearImportedStudents }) => {
  const [formData, setFormData] = useState({
    roomSize: 'mid' as 'small' | 'mid' | 'large',
    activeDuration: 10,
    correctnessRange: 2,
  });
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const roomSizes = {
    small: { label: 'Small Room', radius: 5 },
    mid: { label: 'Medium Room', radius: 10 },
    large: { label: 'Large Room', radius: 15 }
  };

  const durations = [5, 10, 15];

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError(null);

    try {
      const students = await importStudentsFromExcel(file);
      onImportStudents(students);
      console.log(`Successfully imported ${students.length} students`);
    } catch (error: any) {
      console.error('Error importing file:', error);
      setImportError(error.message || 'Failed to import file. Please check the format.');
    } finally {
      setImportLoading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const getCurrentLocation = () => {
    setLoadingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Failed to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please ensure location permissions are granted.';
        }
        
        alert(errorMessage);
        setLoadingLocation(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentLocation) {
      alert('Please get your current location first');
      return;
    }

    if (importedStudents.length === 0) {
      alert('Please import student list first');
      return;
    }

    const selectedRoom = roomSizes[formData.roomSize];
    const totalRadius = selectedRoom.radius + formData.correctnessRange;

    const sessionData = {
      coordinates: currentLocation,
      roomSize: formData.roomSize,
      activeDuration: formData.activeDuration,
      correctnessRange: formData.correctnessRange,
      radius: totalRadius,
      studentList: importedStudents
    };

    onCreate(sessionData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Session</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Location Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Location
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={loadingLocation}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {loadingLocation ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  {loadingLocation ? 'Getting Location...' : 'Get Current Location'}
                </button>
              </div>
              {currentLocation && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Location captured: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
              )}
            </div>

            {/* Room Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Size
              </label>
              <select
                value={formData.roomSize}
                onChange={(e) => setFormData(prev => ({ ...prev, roomSize: e.target.value as 'small' | 'mid' | 'large' }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(roomSizes).map(([key, room]) => (
                  <option key={key} value={key}>
                    {room.label} ({room.radius}m base radius)
                  </option>
                ))}
              </select>
            </div>

            {/* Correctness Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Range Buffer
              </label>
              <select
                value={formData.correctnessRange}
                onChange={(e) => setFormData(prev => ({ ...prev, correctnessRange: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>+1 meter</option>
                <option value={2}>+2 meters</option>
                <option value={3}>+3 meters</option>
                <option value={5}>+5 meters</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Total radius: {roomSizes[formData.roomSize].radius + formData.correctnessRange}m
              </p>
            </div>

            {/* Session Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {durations.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, activeDuration: duration }))}
                    className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      formData.activeDuration === duration
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {duration} min
                  </button>
                ))}
              </div>
            </div>

            {/* Student Import */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student List
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

              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                {importLoading ? (
                  <div className="flex flex-col items-center">
                    <Loader className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                    <p className="text-sm text-gray-600">Importing students...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileImport}
                      className="hidden"
                      id="student-file"
                    />
                    <label htmlFor="student-file" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500 font-medium">
                        Click to upload
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Excel (.xlsx, .xls) or CSV files supported
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Required columns: Student Name, Registration Number
                    </p>
                  </>
                )}
              </div>
              
              {importError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{importError}</p>
                </div>
              )}
              
              {importedStudents.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-green-700 font-medium">
                      ✓ {importedStudents.length} students imported successfully
                    </p>
                    <button
                      type="button"
                      onClick={onClearImportedStudents}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {importedStudents.slice(0, 5).map((student, index) => (
                      <p key={index} className="text-xs text-green-600 truncate">
                        {student.name} - {student.registrationNumber}
                      </p>
                    ))}
                    {importedStudents.length > 5 && (
                      <p className="text-xs text-green-600">
                        ... and {importedStudents.length - 5} more students
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!currentLocation || importedStudents.length === 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Session
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};