/**
 * Location utility exports
 * Re-exports geolocation functions for backward compatibility
 */

export {
  calculateDistance,
  calculateOverlapPercentage,
  isValidCoordinate,
  generateSessionId,
  getCurrentLocation,
  EARTH_RADIUS
} from './geolocation';

export type { Coordinates } from '../types';
