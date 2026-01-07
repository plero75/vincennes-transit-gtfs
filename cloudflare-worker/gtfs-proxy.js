/**
 * 🔒 Cloudflare Worker - HTTPS Proxy pour GTFS-RT IDFM
 * 
 * Déploiement:
 * 1. Aller sur https://workers.cloudflare.com/
 * 2. Créer un nouveau Worker
 * 3. Coller ce code
 * 4. Déployer sur gtfs-proxy.VOTRE-SUBDOMAIN.workers.dev
 * 5. Mettre à jour GTFS_RT_API_BASE dans gtfs-client.js
 */

const GTFS_API_BASE = 'http://gtfsidfm.clarifygdps.com';

const ALLOWED_ORIGINS = [
  'https://plero75.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

function getCorsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (ALLOWED_ORIGINS.includes(origin) || origin?.endsWith('.github.io')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin)
    });
  }

  // Support des endpoints GTFS-RT
  const endpoint = url.pathname.replace('/', '');
  const validEndpoints = ['gtfs-rt-trips-idfm', 'gtfs-rt-alerts-idfm'];

  if (!validEndpoints.includes(endpoint)) {
    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) }
    });
  }

  try {
    // Proxier la requête vers l'API GTFS-RT
    const apiUrl = `${GTFS_API_BASE}/${endpoint}`;
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vincennes-Transit-Dashboard/1.0'
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`API returned ${apiResponse.status}`);
    }

    // Retourner les données Protocol Buffer avec CORS
    const data = await apiResponse.arrayBuffer();
    
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-protobuf',
        'Cache-Control': 'public, max-age=30',
        ...getCorsHeaders(origin)
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) }
    });
  }
}

export default {
  async fetch(request) {
    return handleRequest(request);
  }
};
