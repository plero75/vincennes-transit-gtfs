# 🚀 Guide de Déploiement

## 🔒 Étape 1: Déployer le Proxy Cloudflare Worker

### Pourquoi un proxy?

GitHub Pages utilise **HTTPS**, mais l'API GTFS-RT publique est en **HTTP**. Les navigateurs bloquent les requêtes HTTP depuis des pages HTTPS (Mixed Content). Le proxy Cloudflare règle ce problème.

### Déploiement:

1. **Aller sur Cloudflare Workers**
   - https://workers.cloudflare.com/
   - Se connecter avec ton compte Cloudflare

2. **Créer un nouveau Worker**
   - Clique sur "Create a Worker"
   - Nom suggéré: `gtfs-proxy`

3. **Copier le code**
   - Copie le contenu de `cloudflare-worker/gtfs-proxy.js`
   - Colle-le dans l'éditeur Cloudflare

4. **Déployer**
   - Clique sur "Save and Deploy"
   - Ton Worker sera disponible sur: `https://gtfs-proxy.VOTRE-SUBDOMAIN.workers.dev`

5. **Mettre à jour le code**
   - Édite `src/gtfs-client.js`
   - Change la ligne:
   ```javascript
   const PROXY_BASE = 'https://gtfs-proxy.hippodrome-proxy42.workers.dev';
   ```
   - Remplace par ton URL:
   ```javascript
   const PROXY_BASE = 'https://gtfs-proxy.VOTRE-SUBDOMAIN.workers.dev';
   ```

---

## 🌐 Étape 2: Déployer sur GitHub Pages

### Option A: Déploiement automatique via GitHub Actions

1. **Activer GitHub Pages**
   - Va dans Settings > Pages
   - Source: "GitHub Actions"

2. **Créer le workflow**
   - Le fichier `.github/workflows/deploy.yml` est déjà prêt
   - Il se déclenche automatiquement à chaque push sur `main`

3. **Vérifier le déploiement**
   - Va dans l'onglet "Actions"
   - Attends que le build soit vert ✅
   - Ton site sera sur: `https://plero75.github.io/vincennes-transit-gtfs/`

### Option B: Déploiement manuel

```bash
# Build le projet
npm run build

# Le dossier dist/ contient les fichiers à déployer
# Tu peux les uploader manuellement ou utiliser gh-pages:
npm install -g gh-pages
gh-pages -d dist
```

---

## 🧪 Test Local

Pour tester en local sans proxy (si l'API HTTP fonctionne):

```javascript
// Dans src/gtfs-client.js
const USE_PROXY = false; // Désactive le proxy pour dev local
```

Puis:

```bash
npm run dev
```

Ouvre http://localhost:5173

---

## ⚙️ Configuration Avancée

### Auto-héberger l'API GTFS-RT (Optionnel)

Si tu veux héberger ta propre API GTFS-RT:

```bash
git clone https://github.com/Jouca/IDFM_GTFS-RT
cd IDFM_GTFS-RT

# Configure la clé API PRIM
echo "IDFM_API_KEY=TA_CLE_ICI" > .env

# Lance avec Docker
docker run -d \
  --name gtfs_idfm \
  --env-file .env \
  -p 8507:8507 \
  ghcr.io/jouca/idfm_gtfs-rt:latest
```

Puis modifie `src/gtfs-client.js`:

```javascript
const DIRECT_API_BASE = 'http://localhost:8507';
```

---

## 🐛 Débogage

### Erreur CORS

```
Access to fetch has been blocked by CORS policy
```

**Solution:** Vérifie que ton Worker Cloudflare est bien déployé et que `PROXY_BASE` est correct.

### Erreur Mixed Content

```
Mixed Content: The page was loaded over HTTPS, but requested an insecure resource
```

**Solution:** Active `USE_PROXY = true` dans `gtfs-client.js`

### Aucune donnée affichée

1. Ouvre la console navigateur (F12)
2. Vérifie les erreurs dans l'onglet "Console"
3. Vérifie les requêtes dans l'onglet "Network"
4. Cherche les logs `✅ Trip updates loaded:` ou `❌ Erreur`

---

## 📊 Monitoring

### Cloudflare Worker Analytics

- Va sur https://workers.cloudflare.com/
- Sélectionne ton Worker `gtfs-proxy`
- Onglet "Metrics" pour voir:
  - Nombre de requêtes
  - Temps de réponse
  - Taux d'erreur

### GitHub Pages Analytics

- Va dans Settings > Pages
- Vérifie que le site est bien déployé
- L'URL sera affichée en vert

---

## ✅ Checklist de Déploiement

- [ ] Cloudflare Worker déployé
- [ ] URL du Worker mise à jour dans `gtfs-client.js`
- [ ] `USE_PROXY = true` activé
- [ ] GitHub Pages activé
- [ ] Build réussi (Actions > dernier workflow vert)
- [ ] Site accessible sur `https://plero75.github.io/vincennes-transit-gtfs/`
- [ ] Console navigateur sans erreur
- [ ] Horaires affichés

---

## 🆘 Aide

Si tu rencontres un problème:

1. Vérifie la console navigateur (F12)
2. Vérifie les logs du Worker Cloudflare
3. Ouvre une issue sur GitHub avec:
   - Le message d'erreur complet
   - Les logs de la console
   - L'URL du site
