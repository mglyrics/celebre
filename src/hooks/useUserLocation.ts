import { useState, useEffect, useCallback } from "react";
import {
  UserLocationInfo,
  detectLocationAuto,
  detectLocationGPS,
  getSavedLocation,
  saveLocation,
  cleanLocationName
} from "../utils/locationService";

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocationInfo>(() => {
    return getSavedLocation() || {
      locationName: "بني سويف",
      governorate: "بني سويف",
      greeting: "أهلاً.. بأهل بني سويف الكرام 🌹",
      source: "default"
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Auto-detect on first load if not explicitly set by user
  useEffect(() => {
    let isMounted = true;
    const loadAuto = async () => {
      setIsLoading(true);
      try {
        const detected = await detectLocationAuto();
        if (isMounted) {
          setLocation(detected);
        }
      } catch (e) {
        console.error("Auto location error:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadAuto();
    return () => {
      isMounted = false;
    };
  }, []);

  // Request high-precision GPS detection
  const requestGpsLocation = useCallback(async () => {
    setIsGpsLoading(true);
    setGpsError(null);
    try {
      const gpsLoc = await detectLocationGPS();
      setLocation(gpsLoc);
      return gpsLoc;
    } catch (err: any) {
      setGpsError(err?.message || "تعذر تحديد الموقع الجغرافي");
      throw err;
    } finally {
      setIsGpsLoading(false);
    }
  }, []);

  // Manually select governorate/area
  const setManualLocation = useCallback((locationName: string) => {
    const normalized = cleanLocationName(locationName);
    const manualInfo: UserLocationInfo = {
      locationName: normalized.locationName,
      governorate: normalized.governorate,
      greeting: normalized.greeting,
      source: "manual"
    };
    setLocation(manualInfo);
    saveLocation(manualInfo);
  }, []);

  return {
    location,
    greeting: location.greeting,
    locationName: location.locationName,
    governorate: location.governorate,
    isLoading,
    isGpsLoading,
    gpsError,
    requestGpsLocation,
    setManualLocation
  };
}
