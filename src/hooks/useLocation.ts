// Custom location hook
import { useState, useEffect } from 'react';
import { getCurrentLocation } from '../utils/location';
import { Coordinates } from '../types';

export const useLocation = () => {const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const position = await getCurrentLocation();
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (err: any) {
      setError(err.message);
      setLocation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return {
    location,
    loading,
    error,
    refetchLocation: getLocation
  };
};
