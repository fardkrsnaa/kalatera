export interface GeoPosition {
  lat: number;
  lon: number;
  address: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const TIMEOUT_MS = 5000;

export async function getCurrentPosition(): Promise<GeoPosition> {
  if (!navigator.geolocation) {
    return { lat: 0, lon: 0, address: '-' };
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        maximumAge: 0,
        enableHighAccuracy: true,
      });
    });

    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const address = await reverseGeocode(lat, lon);

    return { lat, lon, address };
  } catch (error) {
    console.warn('Geolocation error:', error);
    return { lat: 0, lon: 0, address: '-' };
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${NOMINATIM_URL}?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Kalatera/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }

    const data = await response.json();
    const addr = data.address;
    
    if (!addr) {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }

    const parts = [
      addr.road || addr.suburb || addr.village,
      addr.city || addr.county,
      addr.state,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  } catch (error) {
    clearTimeout(timeoutId);
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }
}
