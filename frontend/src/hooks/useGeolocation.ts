import { useState, useEffect } from 'react';

interface GeolocationState {
  location: { latitude: number; longitude: number } | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = (): GeolocationState => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false
      }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      position => {
        setState({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          error: null,
          loading: false
        });
      },
      error => {
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return state;
}; 