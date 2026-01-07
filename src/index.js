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

  console.log(`🔍 ${stopConfig.name}:`, filtered.length, 'passages trouvés');

  // Calculer le prochain horaire de reprise si aucun passage
  let nextServiceTime = null;
  if (filtered.length === 0) {
    // Chercher le prochain passage pour cet arrêt dans toutes les données GTFS
    const allStopTimes = entities
      .flatMap(entity => {
        if (!entity.tripUpdate?.stopTimeUpdate) return [];
        return entity.tripUpdate.stopTimeUpdate
          .filter(stu => stu.stopId === stopConfig.stopId)
          .map(stu => ({
            time: stu.arrival?.time || stu.departure?.time,
            routeId: entity.tripUpdate.trip?.routeId
          }));
      })
      .filter(st => st.time && st.time > Date.now() / 1000)
      .sort((a, b) => a.time - b.time);

    if (allStopTimes.length > 0) {
      const nextDeparture = new Date(allStopTimes[0].time * 1000);
      const today = new Date();
      const isToday = nextDeparture.toDateString() === today.toDateString();
      
      nextServiceTime = nextDeparture.toLocaleString('fr-FR', {
        weekday: isToday ? undefined : 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      if (!isToday) {
        nextServiceTime = `demain à ${nextServiceTime}`;
      } else {
        nextServiceTime = `à ${nextServiceTime}`;
      }
    }
  }

  return {
    stop: { ...stopConfig, nextServiceTime },
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
  const relevantAlerts = [];

  alerts.forEach(alert => {
    const informedEntities = alert.alert?.informedEntity || [];
    const affectsOurStops = informedEntities.some(entity => 
      stopIds.includes(entity.stopId)
    );

    if (affectsOurStops) {
      relevantAlerts.push({
        id: alert.id,
        header: alert.alert.headerText?.translation?.[0]?.text || 'Alerte trafic',
        description: alert.alert.descriptionText?.translation?.[0]?.text || '',
        affectedRoutes: informedEntities
          .map(e => e.routeId)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i) // Unique
      });
    }
  });

  return relevantAlerts;
}

/**
 * 🔄 Rafraîchissement automatique
 */
export function startAutoRefresh(callback, intervalMs = 30000) {
  callback(); // Exécution immédiate
  return setInterval(callback, intervalMs);
}
