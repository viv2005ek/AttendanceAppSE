import React, { useState } from 'react';
import { AttendanceRecord } from '../../types';
import { STATUS_COLORS, ATTENDANCE_STATUS_LABELS } from '../../utils/constants';
import { Edit2, Users, Clock, UserCheck, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onStatusUpdate: (attendanceId: string, newStatus: string) => Promise<void>;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  onStatusUpdate
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    return ATTENDANCE_STATUS_LABELS[status as keyof typeof ATTENDANCE_STATUS_LABELS] || status;
  };

  const getStatusIcon = (status: string) => {
    const iconProps = { className: "h-3 w-3" };
    switch (status) {
      case 'present':
        return <CheckCircle2 {...iconProps} />;
      case 'check':
        return <AlertCircle {...iconProps} />;
      case 'proxy':
        return <UserCheck {...iconProps} />;
      case 'not_in_list':
        return <XCircle {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  const handleStatusChange = async (recordId: string, newStatus: string) => {
    await onStatusUpdate(recordId, newStatus);
    setEditingId(null);
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="bg-blue-50 p-4 rounded-full mb-4">
          <Users className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No attendance records</h3>
        <p className="text-gray-500 max-w-sm">
          Students will appear here as they mark their attendance through the system.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with stats */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Attendance Records</h2>
            <p className="text-sm text-gray-600 mt-1">
              {records.length} student{records.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <div className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
              Live Updates
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                Reg Number
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                Overlap %
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((record, index) => (
              <tr 
                key={record.id} 
                className="group hover:bg-blue-50/30 transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      {record.studentName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {record.studentName}
                      </div>
                      <div className="text-xs text-gray-500 sm:hidden">
                        {record.registrationNumber}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                  {record.registrationNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === record.id ? (
                    <select
                      value={record.finalStatus}
                      onChange={(e) => handleStatusChange(record.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                      autoFocus
                    >
                      <option value="present">Present</option>
                      <option value="check">Please Check</option>
                      <option value="proxy">Proxy</option>
                      <option value="not_in_list">Not in List</option>
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white cursor-pointer transition-all hover:scale-105 shadow-sm"
                        style={{ backgroundColor: getStatusColor(record.finalStatus) }}
                        onClick={() => setEditingId(record.id)}
                        title="Click to edit status"
                      >
                        {getStatusIcon(record.finalStatus)}
                        <span className="ml-1.5">{getStatusLabel(record.finalStatus)}</span>
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(record.overlapPercentage || 0, 100)}%`,
                          backgroundColor: getStatusColor(record.finalStatus)
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-900">
                      {record.overlapPercentage?.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-3 w-3 mr-1.5" />
                    {record.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <button
                    onClick={() => setEditingId(record.id)}
                    className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group-hover:bg-white group-hover:shadow-sm"
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

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5"></div>
              <span>Needs Check</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></div>
              <span>Proxy/Issue</span>
            </div>
          </div>
          <div className="mt-2 sm:mt-0">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};