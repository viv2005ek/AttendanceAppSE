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
import { Calendar, Download, Plus, Users, Clock, Activity, BarChart3, RefreshCw } from 'lucide-react';

type TabType = 'active' | 'inactive';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const loadSessions = async (showRefresh = false) => {
    if (!user) return;
    
    if (showRefresh) {
      setRefreshing(true);
    }

    try {
      const facultySessions = await getFacultySessions(user.uid);
      setSessions(facultySessions);

      if (facultySessions.length > 0 && !selectedSession) {
        const activeSessions = filterActiveSessions(facultySessions);
        setSelectedSession(activeSessions[0] || facultySessions[0]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
      if (showRefresh) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
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
    }
  };

  const handleCreateSession = () => {
    setShowCreateSession(false);
    loadSessions(true);
  };

  const activeSessions = filterActiveSessions(sessions);
  const inactiveSessions = filterInactiveSessions(sessions);
  const displayedSessions = activeTab === 'active' ? activeSessions : inactiveSessions;

  // Calculate stats
  const totalStudents = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.finalStatus === 'present').length;
  const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (showCreateSession) {
    return <CreateSession onClose={() => setShowCreateSession(false)} onSuccess={handleCreateSession} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                    Faculty Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage your attendance sessions and track student presence
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="bg-blue-50 rounded-2xl p-4 min-w-[140px] border border-blue-100">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                      <p className="text-sm text-gray-600">Total Sessions</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 min-w-[140px] border border-green-100">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{activeSessions.length}</p>
                      <p className="text-sm text-gray-600">Active Now</p>
                    </div>
                  </div>
                </div>
                {selectedSession && (
                  <div className="bg-purple-50 rounded-2xl p-4 min-w-[140px] border border-purple-100">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                        <p className="text-sm text-gray-600">Current Session</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => loadSessions(true)}
                disabled={refreshing}
                className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => setShowCreateSession(true)}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                <Plus className="h-5 w-5" />
                <span>New Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Sessions Panel */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Panel Header */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 px-6 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">Your Sessions</h2>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {sessions.length} total
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100/80 p-1 rounded-2xl">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      activeTab === 'active'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>Active ({activeSessions.length})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('inactive')}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      activeTab === 'inactive'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>History ({inactiveSessions.length})</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sessions List */}
              <div className="p-4 max-h-[600px] overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <div className="bg-gray-100 p-4 rounded-2xl inline-flex mb-4">
                      <Calendar className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No sessions yet
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                      Create your first session to start tracking attendance with location-based verification
                    </p>
                    <button
                      onClick={() => setShowCreateSession(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg"
                    >
                      <Plus className="h-5 w-5" />
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
            </div>
          </div>

          {/* Attendance Details */}
          <div className="xl:col-span-2">
            {selectedSession ? (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden h-full">
                {/* Attendance Header */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 px-6 py-6 border-b border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Users className="h-6 w-6 text-blue-600" />
                        <h3 className="text-xl font-bold text-gray-900">
                          Session {selectedSession.sessionId}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedSession.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedSession.status === 'active' ? 'Live' : 'Ended'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            Created: {selectedSession.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {selectedSession.studentList.length} students enrolled
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Attendance Rate */}
                      {totalStudents > 0 && (
                        <div className="bg-blue-50 rounded-2xl px-4 py-2 border border-blue-100">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-700">
                              {attendanceRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-blue-600">Present Rate</div>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={handleExportAttendance}
                        disabled={attendanceRecords.length === 0}
                        className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export Excel</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attendance Table */}
                <div className="p-4">
                  <AttendanceTable 
                    records={attendanceRecords} 
                    onStatusUpdate={handleStatusUpdate} 
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center h-full flex items-center justify-center">
                <div className="max-w-md">
                  <div className="bg-gray-100 p-4 rounded-2xl inline-flex mb-6">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No Session Selected
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Select a session from the list to view and manage attendance records. 
                    Live updates will appear automatically for active sessions.
                  </p>
                  {sessions.length === 0 && (
                    <button
                      onClick={() => setShowCreateSession(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create Your First Session</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};