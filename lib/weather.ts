import * as Location from 'expo-location';

export type WeatherBand = 'hot' | 'warm' | 'mild' | 'cool' | 'cold';

export type WeatherSnapshot = {
  tempC: number;
  feelsLikeC: number;
  precipMm: number;
  weatherCode: number;
  label: string;
  band: WeatherBand;
  isRainy: boolean;
  city?: string;
  source: 'live' | 'fallback';
};

const FALLBACK: WeatherSnapshot = {
  tempC: 21,
  feelsLikeC: 21,
  precipMm: 0,
  weatherCode: 1,
  label: 'Mild',
  band: 'mild',
  isRainy: false,
  city: 'Your area',
  source: 'fallback',
};

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Mixed';
}

function bandForTemp(tempC: number): WeatherBand {
  if (tempC >= 28) return 'hot';
  if (tempC >= 22) return 'warm';
  if (tempC >= 16) return 'mild';
  if (tempC >= 10) return 'cool';
  return 'cold';
}

async function reverseGeocodeCity(
  latitude: number,
  longitude: number,
): Promise<string | undefined> {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0];
    if (!place) return undefined;
    return place.city || place.subregion || place.region || undefined;
  } catch {
    return undefined;
  }
}

async function fetchOpenMeteo(
  latitude: number,
  longitude: number,
): Promise<Omit<WeatherSnapshot, 'city' | 'source'>> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}` +
    '&current=temperature_2m,apparent_temperature,precipitation,weather_code' +
    '&temperature_unit=celsius&timezone=auto';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }
  const data = await response.json();
  const current = data.current;
  const tempC = Number(current?.temperature_2m ?? 21);
  const feelsLikeC = Number(current?.apparent_temperature ?? tempC);
  const precipMm = Number(current?.precipitation ?? 0);
  const weatherCode = Number(current?.weather_code ?? 1);
  const label = weatherLabel(weatherCode);
  const isRainy = precipMm >= 0.2 || (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82) ||
    weatherCode >= 95;

  return {
    tempC,
    feelsLikeC,
    precipMm,
    weatherCode,
    label,
    band: bandForTemp(feelsLikeC),
    isRainy,
  };
}

/**
 * Live weather via device location + Open-Meteo (no API key).
 * Falls back to a mild default if permission or network fails.
 */
export async function loadWeatherForToday(): Promise<WeatherSnapshot> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return { ...FALLBACK, city: 'Location off' };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = position.coords;
    const [weather, city] = await Promise.all([
      fetchOpenMeteo(latitude, longitude),
      reverseGeocodeCity(latitude, longitude),
    ]);

    return {
      ...weather,
      city: city || 'Nearby',
      source: 'live',
    };
  } catch (error) {
    console.warn('Weather load failed', error);
    return FALLBACK;
  }
}

export function formatWeatherSummary(weather: WeatherSnapshot): string {
  const rain = weather.isRainy ? ' · rain likely' : '';
  return `${Math.round(weather.feelsLikeC)}°C · ${weather.label}${rain}`;
}
