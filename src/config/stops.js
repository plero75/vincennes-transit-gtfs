/**
 * 📍 Configuration des arrêts GTFS pour Vincennes
 * Mapping PRIM StopPoint → GTFS stop_id
 */

export const GTFS_STOPS = {
  // 🚉 JOINVILLE-LE-PONT RER A
  joinville_rer_paris: {
    stopId: 'IDFM:22452',
    name: 'Joinville-le-Pont RER',
    direction: '→ Paris',
    type: 'rer',
    lines: ['RER A']
  },
  joinville_rer_boissy: {
    stopId: 'IDFM:22453',
    name: 'Joinville-le-Pont RER',
    direction: '→ Boissy-Saint-Léger',
    type: 'rer',
    lines: ['RER A']
  },

  // 🚌 JOINVILLE BUS (Arrêt 39406)
  joinville_bus_77_201: {
    stopId: 'IDFM:39406',
    name: 'Joinville Bus 1',
    type: 'bus',
    lines: ['77', '201', 'N33']
  },

  // 🚌 JOINVILLE BUS (Arrêt 39407)
  joinville_bus_multi: {
    stopId: 'IDFM:39407',
    name: 'Joinville Bus 2',
    type: 'bus',
    lines: ['108', '110', '101', '281']
  },

  // 🌙 JOINVILLE NOCTILIEN (Arrêt 39408)
  joinville_n34: {
    stopId: 'IDFM:39408',
    name: 'Joinville N34',
    type: 'noctilien',
    lines: ['N34']
  },

  // 🚐 JOINVILLE NAVETTE (Arrêt 39409)
  joinville_navette: {
    stopId: 'IDFM:39409',
    name: 'Joinville Navette',
    type: 'navette',
    lines: ['520']
  },

  // 🌳 ÉCOLE DU BREUIL
  ecole_breuil: {
    stopId: 'IDFM:463644',
    name: 'École du Breuil / Pyramides',
    type: 'bus',
    lines: ['77', '201', 'N33']
  },

  // 🏇 HIPPODROME DE VINCENNES
  hippodrome: {
    stopId: 'IDFM:463641',
    name: 'Hippodrome de Vincennes',
    type: 'bus',
    lines: ['77', '112', 'N33', 'N71']
  }
};

// 📊 Groupement par localisation
export const STOPS_BY_LOCATION = {
  joinville: [
    'joinville_rer_paris',
    'joinville_rer_boissy',
    'joinville_bus_77_201',
    'joinville_bus_multi',
    'joinville_n34',
    'joinville_navette'
  ],
  breuil: ['ecole_breuil'],
  hippodrome: ['hippodrome']
};

// 🏷️ Codes couleur par type de transport
export const TRANSPORT_COLORS = {
  rer: '#0088ce',
  bus: '#82c91e',
  noctilien: '#1e293b',
  navette: '#ffa94d'
};
