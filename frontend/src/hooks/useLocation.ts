import { useState, useEffect } from 'react';
import { Coordinate } from '@/types/services';

export const useLocation = () => {
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const getLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setError(error.message);
        }
      );
    };

    getLocation();
  }, []);

  return { location, error };
}; 