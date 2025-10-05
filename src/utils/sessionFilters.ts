/**
 * Session filtering and status utilities
 */

import { Session } from '../types';

/**
 * Check if a session is currently active
 */
export const isSessionActive = (session: Session): boolean => {
  const now = new Date();
  return session.status === 'active' && session.expiresAt > now;
};

/**
 * Filter sessions by active status
 */
export const filterActiveSessions = (sessions: Session[]): Session[] => {
  return sessions.filter(isSessionActive);
};

/**
 * Filter sessions by inactive status
 */
export const filterInactiveSessions = (sessions: Session[]): Session[] => {
  return sessions.filter(session => !isSessionActive(session));
};

/**
 * Filter sessions created by a specific faculty
 */
export const filterSessionsByFaculty = (
  sessions: Session[],
  facultyId: string
): Session[] => {
  return sessions.filter(session => session.facultyId === facultyId);
};

/**
 * Get session statistics
 */
export const getSessionStats = (sessions: Session[]) => {
  const active = filterActiveSessions(sessions);
  const inactive = filterInactiveSessions(sessions);

  return {
    total: sessions.length,
    active: active.length,
    inactive: inactive.length,
  };
};
