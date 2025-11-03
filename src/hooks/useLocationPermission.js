import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export function useLocationPermission() {
  const [granted, setGranted] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    (async () => {
      const { status: s } = await Location.requestForegroundPermissionsAsync();
      setStatus(s);
      setGranted(s === 'granted');
    })();
  }, []);

  return { granted, status };
}


