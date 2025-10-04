// utils/location.ts
/**
 * Location utility functions for attendance system
 * Handles geolocation, distance calculations, and overlap detection
 */

// Types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationResult {
  coords: Coordinates;
  accuracy: number;
  timestamp: number;
}

export interface OverlapResult {
  overlapPercentage: number;
  distance: number;
  isWithinRadius: boolean;
  status: 'present' | 'check' | 'proxy' | 'not_in_list';
}

// Constants
export const EARTH_RADIUS = 6371e3; // Earth's radius in meters
export const DEFAULT_STUDENT_RADIUS = 2; // Default accuracy radius for student location in meters
export const MINIMUM_ACCURACY = 10; // Minimum acceptable location accuracy in meters
export const MAX_LOCATION_AGE = 30000; // Maximum age of location data in milliseconds (30 seconds)

// Thresholds for attendance status
export const OVERLAP_THRESHOLDS = {
  PRESENT: 70,    // >= 70% overlap = Present
  CHECK_MIN: 40,  // 40-70% overlap = Please Check
  PROXY: 0,       // < 40% overlap = Proxy
} as const;

/**
 * Calculate the distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  try {
    // Convert degrees to radians
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    // Haversine formula
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS * c; // Distance in meters
  } catch (error) {
    console.error('Error calculating distance:', error);
    throw new Error('Failed to calculate distance between coordinates');
  }
};

/**
 * Calculate the overlap percentage between two circles
 * @param facultyCoords - Faculty location coordinates
 * @param studentCoords - Student location coordinates
 * @param facultyRadius - Faculty circle radius in meters
 * @param studentRadius - Student circle radius in meters
 * @returns Overlap percentage (0-100)
 */
// ALTERNATIVE SIMPLER METHOD - More reliable for attendance
// utils/location.ts - SIMPLE & RELIABLE METHOD
export const calculateOverlapPercentage = (
  facultyCoords: Coordinates,
  studentCoords: Coordinates,
  facultyRadius: number,
  studentRadius: number
): number => {
  const distance = calculateDistance(
    facultyCoords.latitude,
    facultyCoords.longitude,
    studentCoords.latitude,
    studentCoords.longitude
  );

  console.log(`📍 Distance: ${distance.toFixed(6)}m, Faculty Radius: ${facultyRadius}m`);

  // If coordinates are exactly the same or very close
  if (distance < 0.1) { // Within 10cm
    console.log(`   ✅ Same/Very close coordinates - 100% overlap`);
    return 100;
  }

  // If student is within faculty circle
  if (distance <= facultyRadius) {
    // Calculate percentage based on how close to center
    // Linear scale: at center=100%, at edge=70%
    const percentage = 100 - ((distance / facultyRadius) * 30);
    console.log(`   📍 Within faculty circle - ${percentage.toFixed(1)}% overlap`);
    return Math.max(70, Math.min(100, percentage));
  }

  // If student is slightly outside but within accuracy buffer
  if (distance <= facultyRadius + studentRadius) {
    const outsideBy = distance - facultyRadius;
    const percentage = 70 - ((outsideBy / studentRadius) * 70); // Scale down from 70% to 0%
    console.log(`   ⚠️  Outside but within buffer - ${percentage.toFixed(1)}% overlap`);
    return Math.max(0, Math.min(70, percentage));
  }

  // Completely outside
  console.log(`   ❌ Completely outside - 0% overlap`);
  return 0;
};