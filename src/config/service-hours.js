/**
 * ⏰ Horaires de service réels par ligne
 * Sources: RATP, IDFM, Noctilien
 */

export const SERVICE_HOURS = {
  // 🚆 RER A
  'IDFM:C01742': {
    name: 'RER A',
    weekday: { start: '05:00', end: '00:40' },
    saturday: { start: '05:00', end: '01:40' },
    sunday: { start: '05:30', end: '00:40' }
  },

  // 🚌 Bus 56
  'IDFM:C02360': {
    name: 'Bus 56',
    weekday: { start: '05:30', end: '00:30' },
    saturday: { start: '06:00', end: '00:30' },
    sunday: { start: '07:00', end: '00:00' }
  },

  // 🚌 Bus 111
  'IDFM:C02360': { // ID à confirmer
    name: 'Bus 111',
    weekday: { start: '06:00', end: '00:00' },
    saturday: { start: '06:30', end: '23:30' },
    sunday: { start: '07:00', end: '23:00' }
  },

  // 🌙 Noctilien N34
  'IDFM:C00936': {
    name: 'N34',
    weekday: { start: '00:40', end: '05:30' }, // Circule toute la nuit
    friday: { start: '23:53', end: '05:30' }, // Démarre plus tôt vendredi soir
    saturday: { start: '00:40', end: '05:30' },
    sunday: { start: '00:40', end: '05:00' }
  }
};

/**
 * 🕐 Convertit une heure "HH:MM" en minutes depuis minuit
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * ✅ Vérifie si une ligne est en service maintenant
 */
export function isLineActive(routeId) {
  const schedule = SERVICE_HOURS[routeId];
  if (!schedule) return true; // Si pas d'horaires définis, on suppose actif

  const now = new Date();
  const day = now.getDay(); // 0=dimanche, 6=samedi
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Sélectionner le bon horaire selon le jour
  let todaySchedule;
  if (day === 0) {
    todaySchedule = schedule.sunday || schedule.weekday;
  } else if (day === 6) {
    todaySchedule = schedule.saturday || schedule.weekday;
  } else if (day === 5) {
    todaySchedule = schedule.friday || schedule.weekday;
  } else {
    todaySchedule = schedule.weekday;
  }

  const startMinutes = timeToMinutes(todaySchedule.start);
  const endMinutes = timeToMinutes(todaySchedule.end);

  // Cas normal: service dans la même journée
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  
  // Cas spécial: service traverse minuit (ex: 23h00 - 01h00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

/**
 * ⏰ Retourne l'heure de reprise du service
 */
export function getNextServiceTime(routeId) {
  const schedule = SERVICE_HOURS[routeId];
  if (!schedule) return null;

  const now = new Date();
  const day = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Sélectionner le bon horaire
  let todaySchedule, tomorrowSchedule;
  
  if (day === 0) { // Dimanche
    todaySchedule = schedule.sunday || schedule.weekday;
    tomorrowSchedule = schedule.weekday;
  } else if (day === 6) { // Samedi
    todaySchedule = schedule.saturday || schedule.weekday;
    tomorrowSchedule = schedule.sunday || schedule.weekday;
  } else if (day === 5) { // Vendredi
    todaySchedule = schedule.friday || schedule.weekday;
    tomorrowSchedule = schedule.saturday || schedule.weekday;
  } else {
    todaySchedule = schedule.weekday;
    tomorrowSchedule = schedule.weekday;
  }

  const startMinutes = timeToMinutes(todaySchedule.start);
  const endMinutes = timeToMinutes(todaySchedule.end);

  // Si le service traverse minuit et qu'on est avant la fin
  if (startMinutes > endMinutes && currentMinutes < endMinutes) {
    return null; // Le service est actif (partie de nuit)
  }

  // Si on est avant le début du service aujourd'hui
  if (currentMinutes < startMinutes) {
    return `aujourd'hui à ${todaySchedule.start}`;
  }

  // Sinon, retourner l'heure de demain
  const nextDay = day === 6 ? 'dimanche' : (day === 5 ? 'samedi' : 'demain');
  return `${nextDay} à ${tomorrowSchedule.start}`;
}
