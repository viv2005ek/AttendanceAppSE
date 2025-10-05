import React, { useState } from 'react';
import { AttendanceRecord } from '../../types';
import { STATUS_COLORS, ATTENDANCE_STATUS_LABELS } from '../../utils/constants';
import { CreditCard as Edit2, Users } from 'lucide-react';

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

  const handleStatusChange = async (recordId: string, newStatus: string) => {
    await onStatusUpdate(recordId, newStatus);
    setEditingId(null);
  };

  if (records.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p>No attendance records yet.</p>
        <p className="text-sm">Students will appear here as they mark attendance.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reg Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Overlap %
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {record.studentName}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {record.registrationNumber}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === record.id ? (
                  <select
                    value={record.finalStatus}
                    onChange={(e) => handleStatusChange(record.id, e.target.value)}
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
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {record.overlapPercentage?.toFixed(1)}%
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {record.timestamp?.toLocaleTimeString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
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
  );
};
