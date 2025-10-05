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
 * Calculate overlap percentage between two circles
 * Faculty circle = roomSize + accuracy
 * Student circle = 2m + accuracy from device
 *
 * @param facultyCoords Faculty location (center of circle1)
 * @param studentCoords Student location (center of circle2)
 * @param facultyRadius Faculty circle radius (roomSize + accuracy)
 * @param studentRadius Student circle radius (accuracy + 2m)
 * @returns Overlap percentage (0-100)
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

  // If circles don't overlap at all
  if (distance >= facultyRadius + studentRadius) {
    console.log('→ No overlap: 0%');
    return 0;
  }

  // If student circle is completely inside faculty circle
  if (distance + studentRadius <= facultyRadius) {
    console.log('→ Student circle completely inside faculty circle: 100%');
    return 100;
  }

  // Calculate actual circle overlap using geometric formula
  const r1 = facultyRadius;
  const r2 = studentRadius;
  const d = distance;

  // Area of circle 2 (student)
  const area2 = Math.PI * r2 * r2;

  // Calculate intersection area using formula for two overlapping circles
  const part1 = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
  const part2 = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
  const part3 = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));

  const intersectionArea = part1 + part2 - part3;

  // Overlap percentage = (intersection area / student circle area) * 100
  const overlapPercentage = (intersectionArea / area2) * 100;
  const result = Math.round(Math.max(0, Math.min(100, overlapPercentage)));

  console.log(`→ Geometric overlap: ${result}%`);
  return result;
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
