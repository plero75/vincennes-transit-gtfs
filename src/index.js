/**
 * 📊 Dashboard Vincennes Transit - GTFS-Realtime
 */

import { fetchTripUpdates, fetchAlerts, filterByStopId, formatTimestamp, getWaitingTime } from './gtfs-client.js';
import { GTFS_STOPS, STOPS_BY_LOCATION, TRANSPORT_COLORS } from './config/stops.js';

/**
 * 🚍 Récupère les horaires pour un arrêt spécifique
 */
export async function getStopSchedule(stopKey) {
  const stopConfig = GTFS_STOPS[stopKey];
  if (!stopConfig) {
    console.error(`❌ Stop key inconnue: ${stopKey}`);
    return null;
  }

  const { timestamp, entities } = await fetchTripUpdates();
  const filtered = filterByStopId(entities, stopConfig.stopId);

  return {
    stop: stopConfig,
    timestamp,
    arrivals: filtered.map(trip => ({
      routeId: trip.routeId,
      tripId: trip.tripId,
      vehicleId: trip.vehicleId,
      nextArrival: trip.arrivals[0],
      formattedTime: formatTimestamp(trip.arrivals[0]?.arrivalTime),
      waitingMinutes: getWaitingTime(trip.arrivals[0]?.arrivalTime)
    })).sort((a, b) => (a.waitingMinutes || 999) - (b.waitingMinutes || 999))
  };
}

/**
 * 📍 Récupère tous les horaires pour une localisation
 */
export async function getLocationSchedules(location) {
  const stopKeys = STOPS_BY_LOCATION[location];
  if (!stopKeys) {
    console.error(`❌ Location inconnue: ${location}`);
    return [];
  }

  const schedules = await Promise.all(
    stopKeys.map(key => getStopSchedule(key))
  );

  return schedules.filter(s => s !== null);
}

/**
 * ⚠️ Récupère les alertes pour une localisation
 */
export async function getLocationAlerts(location) {
  const { alerts } = await fetchAlerts();
  const stopKeys = STOPS_BY_LOCATION[location];
  
  if (!stopKeys) return [];

  const stopIds = stopKeys.map(key => GTFS_STOPS[key].stopId);

  return alerts.filter(alert => {
    const informedEntities = alert.alert?.informedEntity || [];
    return informedEntities.some(entity => 
      stopIds.includes(entity.stopId)
    );
  });
}

/**
 * 🔄 Rafraîchissement automatique
 */
export function startAutoRefresh(callback, intervalMs = 30000) {
  callback(); // Exécution immédiate
  return setInterval(callback, intervalMs);
}
