import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL = 10 * 60 * 1000; // re-check every 10 minutes
const CACHE_KEY = "sun-times-v2"; // v2: uses local timezone instead of UTC

/** Parse "HH:MM:SS AM/PM" string from the API into a Date for today */
function parseSunTime(timeStr: string): Date {
  const now = new Date();
  const [time, meridiem] = timeStr.trim().split(" ");
  const [hStr, mStr, sStr] = time.split(":");
  let h = Number(hStr);
  const m = Number(mStr);
  const s = Number(sStr || 0);

  if (meridiem?.toUpperCase() === "PM" && h !== 12) h += 12;
  if (meridiem?.toUpperCase() === "AM" && h === 12) h = 0;

  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s);
}

/** Check if it's currently dark outside based on sunrise/sunset */
function isDarkOutside(sunrise: string, sunset: string): boolean {
  const now = new Date();
  return now < parseSunTime(sunrise) || now > parseSunTime(sunset);
}

interface CachedSunTimes {
  sunrise: string;
  sunset: string;
  date: string;
}

export function useSunTheme() {
  const [dark, setDark] = useState(() => {
    // Try cached sun times for an instant answer
    try {
      const cached: CachedSunTimes = JSON.parse(localStorage.getItem(CACHE_KEY) || "");
      const today = new Date().toISOString().slice(0, 10);
      if (cached.date === today) return isDarkOutside(cached.sunrise, cached.sunset);
    } catch { /* no cache */ }
    // Fallback to OS preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const sunTimesRef = useRef<{ sunrise: string; sunset: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchSunTimes = useCallback(async () => {
    // Use cache if available for today
    try {
      const cached: CachedSunTimes = JSON.parse(localStorage.getItem(CACHE_KEY) || "");
      const today = new Date().toISOString().slice(0, 10);
      if (cached.date === today) {
        sunTimesRef.current = cached;
        setDark(isDarkOutside(cached.sunrise, cached.sunset));
        return;
      }
    } catch { /* stale or missing */ }

    // Get geolocation
    let lat: number, lng: number;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      return; // geolocation denied — keep current state
    }

    // Fetch sunrise/sunset
    try {
      const res = await fetch(
        `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}&date=today`
      );
      const data = await res.json();
      if (data.status !== "OK") return;

      const { sunrise, sunset } = data.results;
      sunTimesRef.current = { sunrise, sunset };

      // Cache for today
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ sunrise, sunset, date: today }));

      setDark(isDarkOutside(sunrise, sunset));
    } catch { /* API failed — keep current state */ }
  }, []);

  // Re-evaluate current time against cached sun times
  const recheckTime = useCallback(() => {
    if (sunTimesRef.current) {
      const { sunrise, sunset } = sunTimesRef.current;
      setDark(isDarkOutside(sunrise, sunset));
    }
  }, []);

  // Fetch on mount + poll every 10 min
  useEffect(() => {
    fetchSunTimes();
    intervalRef.current = setInterval(recheckTime, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchSunTimes, recheckTime]);

  // Apply dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Simple toggle — just flips dark/light
  const toggle = useCallback(() => {
    setDark((prev) => !prev);
  }, []);

  return { dark, toggle };
}
