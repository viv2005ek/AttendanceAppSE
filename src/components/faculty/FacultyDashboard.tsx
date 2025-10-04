// Faculty dashboard component
import React, { useState, useEffect } from 'react';
import { getFacultySessions, subscribeToSessionAttendance, updateAttendanceStatus } from '../../services/firestore';
import { useAuth } from '../../hooks/useAuth';
import { Session, AttendanceRecord } from '../../types';
import { exportAttendanceToExcel } from '../../utils/excel';
import { STATUS_COLORS, ATTENDANCE_STATUS_LABELS } from '../../utils/constants';
import { Calendar, Download, CreditCard as Edit2, Users, Clock, MapPin } from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;
      
      try {
        const facultySessions = await getFacultySessions(user.uid);
        setSessions(facultySessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
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
      setEditingId(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleExportAttendance = () => {
    if (!selectedSession) return;

    exportAttendanceToExcel(attendanceRecords, {
      sessionId: selectedSession.sessionId,
      facultyName: selectedSession.facultyName,
      date: selectedSession.createdAt,
    });
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
      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Your Sessions</span>
          </h2>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No sessions created yet. Create your first session to get started.
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
                        <span>{session.activeDuration}min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span className="capitalize">{session.roomSize} room</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{session.studentList.length} students</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      Created: {session.createdAt.toLocaleString()}
                    </p>
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
            <h3 className="text-lg font-semibold text-gray-900">
              Attendance for Session {selectedSession.sessionId}
            </h3>
            <button
              onClick={handleExportAttendance}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export Excel</span>
            </button>
          </div>
          
          {attendanceRecords.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No attendance records yet. Students will appear here as they mark attendance.
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
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            onBlur={() => setEditingId(null)}
                            autoFocus
                          >
                            <option value="present">Present</option>
                            <option value="check">Please Check</option>
                            <option value="proxy">Proxy</option>
                            <option value="not_in_list">Not in List</option>
                          </select>
                        ) : (
                          <span
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                            style={{ backgroundColor: getStatusColor(record.finalStatus) }}
                          >
                            {getStatusLabel(record.finalStatus)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.overlapPercentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.timestamp.toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => setEditingId(record.id)}
                          className="text-blue-600 hover:text-blue-800 p-1"
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