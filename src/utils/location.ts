// Location utilities and overlap calculations
import { Coordinates } from '../types';

export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
};

export const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const calculateOverlapPercentage = (
  facultyCoords: Coordinates,
  studentCoords: Coordinates,
  facultyRadius: number,
  studentRadius: number
): number => {
  const distance = calculateDistance(facultyCoords, studentCoords);
  
  if (distance >= facultyRadius + studentRadius) {
    return 0; // No overlap
  }
  
  if (distance <= Math.abs(facultyRadius - studentRadius)) {
    return 100; // Complete overlap
  }
  
  // Calculate intersection area using geometric formulas
  const r1 = facultyRadius;
  const r2 = studentRadius;
  const d = distance;
  
  const area1 = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1)) -
    0.25 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
  
  const area2 = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2)) -
    0.25 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
  
  const intersectionArea = area1 + area2;
  const studentCircleArea = Math.PI * r2 * r2;
  
  return Math.min(100, (intersectionArea / studentCircleArea) * 100);
};

export const generateSessionId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};