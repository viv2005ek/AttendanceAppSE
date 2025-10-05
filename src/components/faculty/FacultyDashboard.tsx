import React, { useState, useEffect } from 'react';
import {
  getFacultySessions,
  subscribeToSessionAttendance,
  updateAttendanceStatus
} from '../../services/firestore';
import { useAuth } from '../../hooks/useAuth';
import { Session, AttendanceRecord } from '../../types';
import { exportAttendanceToExcel } from '../../utils/excel';
import { filterActiveSessions, filterInactiveSessions } from '../../utils/sessionFilters';
import { SessionList } from './SessionList';
import { AttendanceTable } from './AttendanceTable';
import { CreateSession } from './CreateSession';
import { Calendar, Download, Plus } from 'lucide-react';

type TabType = 'active' | 'inactive';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;

      try {
        const facultySessions = await getFacultySessions(user.uid);
        setSessions(facultySessions);

        if (facultySessions.length > 0 && !selectedSession) {
          const activeSessions = filterActiveSessions(facultySessions);
          setSelectedSession(activeSessions[0] || facultySessions[0]);
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

    const unsubscribe = subscribeToSessionAttendance(
      selectedSession.sessionId,
      (attendance) => {
        setAttendanceRecords(attendance);
      }
    );

    return unsubscribe;
  }, [selectedSession]);

  const handleStatusUpdate = async (attendanceId: string, newStatus: string) => {
    try {
      await updateAttendanceStatus(attendanceId, newStatus);
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

  const handleCreateSession = () => {
    setShowCreateSession(false);
    if (user) {
      getFacultySessions(user.uid).then(setSessions);
    }
  };

  const activeSessions = filterActiveSessions(sessions);
  const inactiveSessions = filterInactiveSessions(sessions);
  const displayedSessions = activeTab === 'active' ? activeSessions : inactiveSessions;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showCreateSession) {
    return <CreateSession onClose={() => setShowCreateSession(false)} onSuccess={handleCreateSession} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
        <button
          onClick={() => setShowCreateSession(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Session</span>
        </button>
      </div>

      {/* Sessions Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Your Sessions</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                {sessions.length}
              </span>
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Active ({activeSessions.length})
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'inactive'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Inactive ({inactiveSessions.length})
            </button>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg mb-2">No sessions created yet</p>
            <p className="text-sm mb-4">Create your first session to start tracking attendance</p>
            <button
              onClick={() => setShowCreateSession(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Session</span>
            </button>
          </div>
        ) : (
          <SessionList
            sessions={displayedSessions}
            selectedSession={selectedSession}
            onSelectSession={setSelectedSession}
          />
        )}
      </div>

      {/* Attendance Details */}
      {selectedSession && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Attendance for Session {selectedSession.sessionId}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSession.status === 'active' ? 'Live updates active' : 'Session ended'}
                </p>
              </div>
              <button
                onClick={handleExportAttendance}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <AttendanceTable records={attendanceRecords} onStatusUpdate={handleStatusUpdate} />
        </div>
      )}
    </div>
  );
};
