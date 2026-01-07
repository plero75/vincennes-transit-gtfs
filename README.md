# 🚍 Vincennes Transit Dashboard - GTFS-Realtime

> **Dashboard temps réel des transports en commun** pour Joinville-le-Pont, École du Breuil et Hippodrome de Vincennes utilisant **GTFS-Realtime** d'Île-de-France Mobilités.

![GTFS-RT](https://img.shields.io/badge/GTFS--RT-Realtime-blue)
![IDFM](https://img.shields.io/badge/IDFM-Île--de--France-green)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## ✨ Fonctionnalités

✅ **Horaires temps réel** via GTFS-Realtime Protocol Buffers  
✅ **8 arrêts** couverts (RER A + Bus + Noctilien + Navette)  
✅ **Auto-refresh** toutes les 30 secondes  
✅ **API publique** (pas de clé API nécessaire)  
✅ **Zero configuration** - Prêt à l'emploi  
✅ **Responsive design** - Mobile & Desktop  

---

## 📍 Arrêts Couverts

### 🚉 **Joinville-le-Pont RER** (6 arrêts)
- **RER A** (2 directions)
  - `IDFM:22452` - Direction Paris
  - `IDFM:22453` - Direction Boissy-Saint-Léger
- **Bus** 
  - `IDFM:39406` - Lignes 77, 201, N33
  - `IDFM:39407` - Lignes 108, 110, 101, 281
  - `IDFM:39408` - Ligne N34 (Noctilien)
  - `IDFM:39409` - Navette 520

### 🌳 **École du Breuil / Pyramides** (1 arrêt)
- `IDFM:463644` - Lignes 77, 201, N33

### 🏇 **Hippodrome de Vincennes** (1 arrêt)
- `IDFM:463641` - Lignes 77, 112, N33, N71

---

## 🚀 Installation

### Option 1: Clone & Install

```bash
# Clone le repository
git clone https://github.com/plero75/vincennes-transit-gtfs.git
cd vincennes-transit-gtfs

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173)

### Option 2: Build pour Production

```bash
npm run build
npm run preview
```

---

## 💻 Utilisation Programmatique

### Récupérer les horaires d'un arrêt

```javascript
import { getStopSchedule } from './src/index.js';

// Récupérer les prochains RER A vers Paris
const schedule = await getStopSchedule('joinville_rer_paris');

console.log(schedule.arrivals);
// [
//   {
//     routeId: 'IDFM:C01742',
//     formattedTime: '14:23',
//     waitingMinutes: 5
//   },
//   ...
// ]
```

### Récupérer tous les horaires d'une localisation

```javascript
import { getLocationSchedules } from './src/index.js';

// Tous les transports à Joinville
const joinville = await getLocationSchedules('joinville');

// Tous les transports à l'Hippodrome
const hippodrome = await getLocationSchedules('hippodrome');
```

### Récupérer les alertes

```javascript
import { getLocationAlerts } from './src/index.js';

const alerts = await getLocationAlerts('joinville');
alerts.forEach(alert => {
  console.log(alert.alert.headerText);
});
```

---

## 🛠️ Architecture

```
vincennes-transit-gtfs/
├── src/
│   ├── config/
│   │   └── stops.js           # Configuration des 8 arrêts GTFS
│   ├── gtfs-client.js        # Client GTFS-Realtime
│   └── index.js              # API principale
├── index.html                # Dashboard web
├── package.json
└── README.md
```

### 📦 Dépendances

- **`gtfs-realtime-bindings`** - Décodage Protocol Buffer
- **`vite`** - Bundler moderne (dev only)

---

## 🎯 API Publique Utilisée

Ce projet utilise l'API GTFS-RT publique de [@Jouca](https://github.com/Jouca/IDFM_GTFS-RT):

- **Trip Updates**: `http://gtfsidfm.clarifygdps.com/gtfs-rt-trips-idfm`
- **Alerts**: `http://gtfsidfm.clarifygdps.com/gtfs-rt-alerts-idfm`

⚠️ **Pas de garantie de disponibilité** - Pour une utilisation en production, considérer l'auto-hébergement.

---

## 🔄 Auto-hébergement (Optionnel)

Pour héberger votre propre serveur GTFS-RT:

```bash
# Clone le projet Jouca
git clone https://github.com/Jouca/IDFM_GTFS-RT
cd IDFM_GTFS-RT

# Configure la clé API PRIM
echo "IDFM_API_KEY=VOTRE_CLE_ICI" > .env

# Lance avec Docker
docker run -d \
  --name gtfs_idfm \
  --env-file .env \
  -p 8507:8507 \
  ghcr.io/jouca/idfm_gtfs-rt:latest
```

Puis modifier `src/gtfs-client.js`:

```javascript
const GTFS_RT_API = {
  trips: 'http://localhost:8507/gtfs-rt-trips-idfm',
  alerts: 'http://localhost:8507/gtfs-rt-alerts-idfm'
};
```

---

## 📊 Exemples de Données

### Trip Update (Horaire)

```json
{
  "tripId": "IDFM:123456",
  "routeId": "IDFM:C01742",
  "vehicleId": "12345",
  "arrivals": [
    {
      "arrivalTime": 1704643380,
      "arrivalDelay": 120,
      "formattedTime": "14:23",
      "waitingMinutes": 5
    }
  ]
}
```

### Service Alert (Perturbation)

```json
{
  "alert": {
    "headerText": "Trafic perturbé sur RER A",
    "descriptionText": "Incident technique",
    "cause": "TECHNICAL_PROBLEM",
    "effect": "SIGNIFICANT_DELAYS"
  }
}
```

---

## 🔧 Configuration

### Ajouter un nouvel arrêt

Éditer `src/config/stops.js`:

```javascript
export const GTFS_STOPS = {
  // ... arrêts existants
  
  mon_nouvel_arret: {
    stopId: 'IDFM:XXXXX',  // Trouver sur data.iledefrance-mobilites.fr
    name: 'Nom de l\'arrêt',
    type: 'bus',
    lines: ['77', '201']
  }
};
```

### Changer l'intervalle de rafraîchissement

Dans `index.html`:

```javascript
startAutoRefresh(updateDashboard, 15000); // 15 secondes
```

---

## 🐛 Débogage

### Tester un arrêt spécifique

```bash
node src/index.js
```

### Activer les logs détaillés

Dans `src/gtfs-client.js`, décommenter les `console.log`:

```javascript
export async function fetchTripUpdates() {
  const feed = FeedMessage.decode(new Uint8Array(buffer));
  console.log('Feed timestamp:', feed.header.timestamp);
  console.log('Entities count:', feed.entity.length);
  return feed;
}
```

---

## 📚 Ressources

- [GTFS Realtime Specification](https://gtfs.org/documentation/realtime/)
- [IDFM Open Data](https://data.iledefrance-mobilites.fr/)
- [PRIM API Documentation](https://prim.iledefrance-mobilites.fr/)
- [Jouca/IDFM_GTFS-RT](https://github.com/Jouca/IDFM_GTFS-RT)

---

## 📝 License

MIT License - Voir [LICENSE](LICENSE)

---

## 👤 Auteur

**plero75** - [GitHub](https://github.com/plero75)

---

## 🚀 Roadmap

- [ ] Carte interactive avec positions des véhicules
- [ ] Historique des retards
- [ ] Notifications push pour les alertes
- [ ] Mode sombre
- [ ] Export des données CSV
- [ ] API REST pour intégration externe

---

⭐ **N'oubliez pas de star le projet si vous le trouvez utile!**
