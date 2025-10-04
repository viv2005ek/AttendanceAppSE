/**
 * Geolocation calculation utilities
 * Handles distance and overlap calculations for attendance system
 */

import { Coordinates } from '../types';

export const EARTH_RADIUS = 6371e3;

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const lat1 = coord1.latitude;
  const lon1 = coord1.longitude;
  const lat2 = coord2.latitude;
  const lon2 = coord2.longitude;

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
};

/**
 * Calculate overlap percentage between two circles (faculty and student locations)
 */
export const calculateOverlapPercentage = (
  facultyCoords: Coordinates,
  studentCoords: Coordinates,
  facultyRadius: number,
  studentRadius: number
): number => {
  const distance = calculateDistance(facultyCoords, studentCoords);

  console.log('Overlap Calculation:', {
    distance: distance.toFixed(6),
    facultyRadius,
    studentRadius,
    facultyCoords,
    studentCoords
  });

  // Same location or extremely close (within 10cm)
  if (distance < 0.1) {
    console.log('→ Exact/Near-exact match: 100%');
    return 100;
  }

  // Student is inside faculty radius
  if (distance <= facultyRadius) {
    const percentage = 100 - ((distance / facultyRadius) * 30);
    const result = Math.round(Math.max(70, Math.min(100, percentage)));
    console.log(`→ Inside faculty radius: ${result}%`);
    return result;
  }

  // Student is outside but within buffer zone
  if (distance <= facultyRadius + studentRadius) {
    const outsideBy = distance - facultyRadius;
    const percentage = 70 - ((outsideBy / studentRadius) * 70);
    const result = Math.round(Math.max(0, Math.min(70, percentage)));
    console.log(`→ In buffer zone: ${result}%`);
    return result;
  }

  console.log('→ Outside range: 0%');
  return 0;
};

/**
 * Validate coordinates
 */
export const isValidCoordinate = (coords: Coordinates | null | undefined): boolean => {
  if (!coords) return false;

  const { latitude, longitude } = coords;

  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Generate a random 6-digit session ID
 */
export const generateSessionId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get current location using browser's geolocation API
 */
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        let errorMessage = 'Unable to retrieve location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};
