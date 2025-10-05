import React from 'react';
import { Session } from '../../types';
import { Clock, MapPin, Users } from 'lucide-react';

interface SessionListProps {
  sessions: Session[];
  selectedSession: Session | null;
  onSelectSession: (session: Session) => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  selectedSession,
  onSelectSession
}) => {
  if (sessions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="text-sm">No sessions found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`p-4 cursor-pointer transition-colors ${
            selectedSession?.id === session.id
              ? 'bg-blue-50 border-l-4 border-blue-500'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelectSession(session)}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-3">
                <span className="text-base font-semibold text-gray-900">
                  Session ID: {session.sessionId}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    session.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {session.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{session.activeDuration}min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span className="capitalize">{session.roomSize} ({session.radius}m)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{session.studentList.length} students</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Created: {session.createdAt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
