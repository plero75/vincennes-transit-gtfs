/**
 * 🚍 Client GTFS-Realtime pour IDFM
 * Utilise l'API publique de Jouca: http://gtfsidfm.clarifygdps.com
 */

import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

// 🎯 API Endpoints
const GTFS_RT_API = {
  trips: 'http://gtfsidfm.clarifygdps.com/gtfs-rt-trips-idfm',
  alerts: 'http://gtfsidfm.clarifygdps.com/gtfs-rt-alerts-idfm'
};

/**
 * 🔄 Récupère les données temps réel (Trip Updates)
 */
export async function fetchTripUpdates() {
  try {
    const response = await fetch(GTFS_RT_API.trips);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const FeedMessage = GtfsRealtimeBindings.transit_realtime.FeedMessage;
    const feed = FeedMessage.decode(new Uint8Array(buffer));

    return {
      timestamp: feed.header.timestamp,
      entities: feed.entity
    };
  } catch (error) {
    console.error('❌ Erreur fetchTripUpdates:', error);
    return { timestamp: null, entities: [] };
  }
}

/**
 * ⚠️ Récupère les alertes (Service Alerts)
 */
export async function fetchAlerts() {
  try {
    const response = await fetch(GTFS_RT_API.alerts);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const FeedMessage = GtfsRealtimeBindings.transit_realtime.FeedMessage;
    const feed = FeedMessage.decode(new Uint8Array(buffer));

    return {
      timestamp: feed.header.timestamp,
      alerts: feed.entity.filter(e => e.alert)
    };
  } catch (error) {
    console.error('❌ Erreur fetchAlerts:', error);
    return { timestamp: null, alerts: [] };
  }
}

/**
 * 🔍 Filtre les trip updates par stop_id
 */
export function filterByStopId(entities, stopId) {
  return entities
    .filter(entity => {
      if (!entity.tripUpdate) return false;
      return entity.tripUpdate.stopTimeUpdate?.some(u => u.stopId === stopId);
    })
    .map(entity => {
      const trip = entity.tripUpdate;
      const stopUpdates = trip.stopTimeUpdate.filter(u => u.stopId === stopId);

      return {
        tripId: trip.trip?.tripId,
        routeId: trip.trip?.routeId,
        vehicleId: trip.vehicle?.id,
        arrivals: stopUpdates.map(u => ({
          arrivalTime: u.arrival?.time,
          arrivalDelay: u.arrival?.delay,
          departureTime: u.departure?.time,
          departureDelay: u.departure?.delay,
          stopSequence: u.stopSequence
        }))
      };
    });
}

/**
 * 🕒 Convertit timestamp GTFS en Date lisible
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * ⏱️ Calcule le temps d'attente en minutes
 */
export function getWaitingTime(timestamp) {
  if (!timestamp) return null;
  const now = Date.now();
  const targetTime = timestamp * 1000;
  const diffMinutes = Math.round((targetTime - now) / 60000);
  return diffMinutes;
}
