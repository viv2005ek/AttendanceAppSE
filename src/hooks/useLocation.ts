// hooks/useLocation.ts
import { useState, useEffect } from 'react';
import { Coordinates } from '../types';

export interface LocationWithAccuracy extends Coordinates {
  accuracy: number;
}

interface LocationOptions {
  maxAttempts?: number;
  requiredAccuracy?: number;
}

export const useLocation = (options: LocationOptions = {}) => {
  const {
    maxAttempts = 10,
    requiredAccuracy = 10
  } = options;

  const [location, setLocation] = useState<LocationWithAccuracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [bestAccuracy, setBestAccuracy] = useState<number>(Number.MAX_SAFE_INTEGER);
  const [bestLocation, setBestLocation] = useState<LocationWithAccuracy | null>(null);

  const getCurrentLocation = (options?: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        ...options
      });
    });
  };

  const getLocation = async (currentAttempt: number = 1): Promise<void> => {
    console.log(`Location attempt ${currentAttempt} of ${maxAttempts}`);
    setAttempts(currentAttempt);

    try {
      const position = await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 10000 + (currentAttempt * 1000),
      });

      const currentAccuracy = position.coords.accuracy;
      const currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: currentAccuracy
      };

      console.log(`Attempt ${currentAttempt}: Accuracy ${currentAccuracy}m`);

      // Update best accuracy and location
      if (currentAccuracy < bestAccuracy) {
        setBestAccuracy(currentAccuracy);
        setBestLocation(currentLocation);
      }

      // If accuracy meets requirements, use this location immediately
      if (currentAccuracy <= requiredAccuracy) {
        setLocation(currentLocation);
        setLoading(false);
        console.log(`Target accuracy achieved: ${currentAccuracy}m`);
        return;
      }

      // If we have more attempts, try again after a delay
      if (currentAttempt < maxAttempts) {
        const delay = Math.min(2000 * currentAttempt, 10000);
        console.log(`Retrying in ${delay}ms for better accuracy...`);
        
        setTimeout(() => {
          getLocation(currentAttempt + 1);
        }, delay);
      } else {
        // Final attempt completed - use the best location we found
        console.log(`All attempts completed. Best accuracy: ${bestAccuracy}m`);
        
        if (bestLocation) {
          setLocation(bestLocation); // Always set the best location found
          if (bestAccuracy > requiredAccuracy) {
            setError(
              `Best accuracy achieved: ${bestAccuracy.toFixed(1)}m (required: ${requiredAccuracy}m). ` +
              `Using the most accurate location available. You can proceed or retry for better accuracy.`
            );
          }
        } else {
          setError('Could not retrieve location after maximum attempts');
        }
        setLoading(false);
      }

    } catch (err: any) {
      console.error(`Location attempt ${currentAttempt} failed:`, err);
      
      if (currentAttempt < maxAttempts) {
        const delay = Math.min(2000 * currentAttempt, 10000);
        setTimeout(() => {
          getLocation(currentAttempt + 1);
        }, delay);
      } else {
        // Even after errors, if we have a best location, use it
        if (bestLocation) {
          setLocation(bestLocation);
          setError(
            `Location issues encountered. Using best available accuracy: ${bestAccuracy.toFixed(1)}m. ` +
            `You can proceed or retry for better accuracy.`
          );
        } else {
          setError(err.message || 'Failed to get location after maximum attempts');
        }
        setLoading(false);
      }
    }
  };

  const refetchLocation = () => {
    setBestAccuracy(Number.MAX_SAFE_INTEGER);
    setBestLocation(null);
    setLocation(null);
    setError(null);
    setLoading(true);
    getLocation(1);
  };

  useEffect(() => {
    getLocation(1);
  }, []);

  return {
    location, // This will always contain the best location found (even if not meeting required accuracy)
    loading,
    error,
    attempts,
    bestAccuracy,
    requiredAccuracy,
    refetchLocation
  };
};