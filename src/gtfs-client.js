/**
 * 🚍 Client GTFS-Realtime pour IDFM
 * Utilise le proxy HTTPS Cloudflare ratp-proxy pour éviter Mixed Content
 */

// 🎯 Configuration du proxy
const USE_PROXY = true; // Mettre à false pour dev local
const PROXY_BASE = 'https://ratp-proxy.hippodrome-proxy42.workers.dev';
const DIRECT_API_BASE = 'http://gtfsidfm.clarifygdps.com';

const API_BASE = USE_PROXY ? PROXY_BASE : DIRECT_API_BASE;

const GTFS_RT_API = {
  trips: `${API_BASE}/gtfs-rt-trips-idfm`,
  alerts: `${API_BASE}/gtfs-rt-alerts-idfm`
};

// 📦 Import dynamique de gtfs-realtime-bindings via CDN
let GtfsRealtimeBindings;

async function loadGtfsBindings() {
  if (GtfsRealtimeBindings) return GtfsRealtimeBindings;
  
  // Utiliser le CDN jsDelivr pour charger gtfs-realtime-bindings
  const module = await import('https://cdn.jsdelivr.net/npm/gtfs-realtime-bindings@1.2.0/+esm');
  GtfsRealtimeBindings = module.default || module;
  return GtfsRealtimeBindings;
}

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
    const bindings = await loadGtfsBindings();
    const FeedMessage = bindings.transit_realtime.FeedMessage;
    const feed = FeedMessage.decode(new Uint8Array(buffer));

    console.log('✅ Trip updates loaded:', feed.entity.length, 'entities');

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
    const bindings = await loadGtfsBindings();
    const FeedMessage = bindings.transit_realtime.FeedMessage;
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
