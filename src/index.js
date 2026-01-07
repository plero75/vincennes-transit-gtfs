import { fetchTripUpdates, fetchAlerts, formatTimestamp, getWaitingTime } from './gtfs-client.js';
import { GTFS_STOPS, STOPS_BY_LOCATION } from './config/stops.js';

/**
 * 🚍 Récupère les horaires pour un arrêt spécifique
 * AVEC fallback horaires théoriques si aucun passage temps réel
 */
export async function getStopSchedule(stopKey) {
  const stopConfig = GTFS_STOPS[stopKey];
  if (!stopConfig) {
    console.error(`❌ Stop key inconnue: ${stopKey}`);
    return null;
  }

  const { timestamp, entities } = await fetchTripUpdates();
  
  // Filtrer tous les trips qui passent par cet arrêt
  const allTripsForStop = entities
    .filter(entity => entity.tripUpdate)
    .map(entity => {
      const trip = entity.tripUpdate;
      const stopUpdates = trip.stopTimeUpdate?.filter(u => u.stopId === stopConfig.stopId) || [];
      
      if (stopUpdates.length === 0) return null;
      
      return {
        tripId: trip.trip?.tripId,
        routeId: trip.trip?.routeId,
        vehicleId: trip.vehicle?.id,
        arrivals: stopUpdates.map(u => ({
          arrivalTime: u.arrival?.time || u.departure?.time,
          arrivalDelay: u.arrival?.delay || 0,
          departureTime: u.departure?.time,
          departureDelay: u.departure?.delay,
          stopSequence: u.stopSequence,
          scheduleRelationship: u.scheduleRelationship
        }))
      };
    })
    .filter(Boolean);

  // Filtrer par lignes configurées
  const filtered = allTripsForStop.filter(trip => 
    stopConfig.lines.some(line => trip.routeId?.includes(line))
  );

  console.log(`🔍 ${stopConfig.name}:`, filtered.length, 'passages trouvés');

  // Calculer le prochain horaire de reprise si aucun passage
  let nextServiceTime = null;
  if (filtered.length === 0) {
    nextServiceTime = calculateNextService(stopConfig.lines);
    console.log(`⏰ Prochain service: ${nextServiceTime}`);
  }

  // Trier par temps d'attente
  const arrivals = filtered
    .flatMap(trip => 
      trip.arrivals.map(arrival => ({
        routeId: trip.routeId,
        tripId: trip.tripId,
        vehicleId: trip.vehicleId,
        arrivalTime: arrival.arrivalTime,
        arrivalDelay: arrival.arrivalDelay,
        formattedTime: formatTimestamp(arrival.arrivalTime),
        waitingMinutes: getWaitingTime(arrival.arrivalTime),
        isCancelled: arrival.scheduleRelationship === 'SKIPPED'
      }))
    )
    .filter(a => a.waitingMinutes > 0) // Seulement les futurs
    .sort((a, b) => a.waitingMinutes - b.waitingMinutes);

  return {
    stop: { ...stopConfig, nextServiceTime },
    timestamp,
    arrivals,
    nextDeparture: arrivals[0] || null // ✅ Prochain départ
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
 * ⚠️ Récupère les alertes pour un arrêt spécifique
 */
export async function getStopAlerts(stopId) {
  const { alerts } = await fetchAlerts();
  const relevantAlerts = [];

  alerts.forEach(alert => {
    const informedEntities = alert.alert?.informedEntity || [];
    const affectsStop = informedEntities.some(entity => 
      entity.stopId === stopId
    );

    if (affectsStop) {
      relevantAlerts.push({
        id: alert.id,
        header: alert.alert.headerText?.translation?.[0]?.text || 'Alerte trafic',
        description: alert.alert.descriptionText?.translation?.[0]?.text || '',
        severity: alert.alert.severityLevel || 'UNKNOWN',
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

/**
 * 🕐 Calcule le prochain horaire de reprise
 */
function calculateNextService(lines) {
  const SERVICE_RESUME_TIMES = {
    // RER
    'RER A': { start: '5:00', end: '1:15' },
    
    // Noctiliens
    'N31': { start: '0:30', end: '5:30', isNight: true },
    'N33': { start: '0:30', end: '5:30', isNight: true },
    'N71': { start: '0:30', end: '5:30', isNight: true },
    
    // Bus de jour
    '77': { start: '5:30', end: '0:45' },
    '108': { start: '5:45', end: '0:30' },
    '110': { start: '5:45', end: '0:30' },
    '101': { start: '6:00', end: '0:15' },
    '112': { start: '6:00', end: '0:15' },
    '201': { start: '6:00', end: '0:30' },
    '281': { start: '6:15', end: '0:00' },
    '520': { start: '7:00', end: '20:00' }
  };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  let nextService = null;
  let minDiff = Infinity;
  
  for (const line of lines) {
    const schedule = SERVICE_RESUME_TIMES[line];
    if (!schedule) continue;
    
    const [startH, startM] = schedule.start.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    
    let diff;
    let resumeTime;
    let tomorrow = false;
    
    if (schedule.isNight) {
      if (currentMinutes < startMinutes) {
        diff = startMinutes - currentMinutes;
        resumeTime = schedule.start;
      } else {
        diff = (1440 - currentMinutes) + startMinutes;
        resumeTime = schedule.start;
        tomorrow = true;
      }
    } else {
      if (currentMinutes < startMinutes) {
        diff = startMinutes - currentMinutes;
        resumeTime = schedule.start;
      } else {
        diff = (1440 - currentMinutes) + startMinutes;
        resumeTime = schedule.start;
        tomorrow = true;
      }
    }
    
    if (diff < minDiff) {
      minDiff = diff;
      nextService = {
        time: resumeTime,
        tomorrow,
        line
      };
    }
  }
  
  if (!nextService) return null;
  
  const prefix = nextService.tomorrow ? 'demain à ' : 'à ';
  return prefix + nextService.time;
}
