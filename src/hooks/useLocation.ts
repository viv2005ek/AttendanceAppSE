// Custom location hook
import { useState, useEffect } from 'react';
import { getCurrentLocation } from '../utils/location';
import { Coordinates } from '../types';

export const useLocation = () => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return { location, error, loading, refetchLocation: getLocation };
};