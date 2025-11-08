import React, { memo, useCallback } from 'react';
import { Session } from '../../types';
import { Clock, MapPin, Users, Calendar, ChevronRight, Zap, Building2, Target } from 'lucide-react';

interface SessionListProps {
  sessions: Session[];
  selectedSession: Session | null;
  onSelectSession: (session: Session) => void;
}

// Memoize the session item to prevent unnecessary re-renders
const SessionItem = memo(({ 
  session, 
  isSelected, 
  onSelect 
}: { 
  session: Session;
  isSelected: boolean;
  onSelect: (session: Session) => void;
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-700',
          dot: 'bg-green-500'
        };
      case 'expired':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-700',
          dot: 'bg-red-500'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-700',
          dot: 'bg-gray-500'
        };
    }
  };

  const getRoomSizeConfig = (roomSize: string) => {
    switch (roomSize) {
      case 'small':
        return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Small' };
      case 'mid':
        return { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Medium' };
      case 'large':
        return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Large' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: roomSize };
    }
  };

  const statusConfig = getStatusConfig(session.status);
  const roomConfig = getRoomSizeConfig(session.roomSize);

  return (
    <div
      className={`relative cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'transform border-2 border-blue-500 bg-blue-50'
          : 'border border-gray-200 bg-white hover:border-gray-300'
      } rounded-lg overflow-hidden group active:scale-[0.98]`}
      onClick={() => onSelect(session)}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {session.sessionId}
              </h3>
            </div>
            <p className="text-xs text-gray-500 truncate">
              {session.facultyName}
            </p>
          </div>
          
          {/* Status Badge - Simplified */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} flex-shrink-0 ml-2`}>
            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            <span className="capitalize">{session.status}</span>
          </div>
        </div>

        {/* Session Details - Simplified layout */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{session.activeDuration}m</span>
            </div>
            <div className="flex items-center space-x-1">
              <Building2 className="h-3.5 w-3.5" />
              <span className="capitalize">{roomConfig.label}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-3.5 w-3.5" />
              <span>{session.studentList.length}</span>
            </div>
          </div>
          
          <div className={`flex items-center space-x-1 text-xs ${
            isSelected ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
          } transition-colors flex-shrink-0`}>
            <span>View</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{session.createdAt.toLocaleDateString()}</span>
          <span>•</span>
          <span>{session.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
});

SessionItem.displayName = 'SessionItem';

export const SessionList: React.FC<SessionListProps> = memo(({
  sessions,
  selectedSession,
  onSelectSession
}) => {
  // Memoize the selection handler
  const handleSelectSession = useCallback((session: Session) => {
    onSelectSession(session);
  }, [onSelectSession]);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="bg-gray-100 p-3 rounded-lg mb-3">
          <Calendar className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-600">No sessions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          isSelected={selectedSession?.id === session.id}
          onSelect={handleSelectSession}
        />
      ))}
    </div>
  );
});

SessionList.displayName = 'SessionList';