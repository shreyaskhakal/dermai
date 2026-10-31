// ============================================================
//  LOCATION ROUTE — Dynamic Geocoding & Reverse Geocoding
// ============================================================
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Helper to extract city/state/country from Google Geocoding address components
function parseGoogleAddressComponents(components = []) {
  let city = '';
  let state = '';
  let country = '';
  let locality = '';
  let sublocality = '';

  for (const c of components) {
    if (c.types.includes('locality')) locality = c.long_name;
    if (c.types.includes('sublocality') || c.types.includes('sublocality_level_1')) sublocality = c.long_name;
    if (c.types.includes('administrative_area_level_2')) city = city || c.long_name;
    if (c.types.includes('administrative_area_level_1')) state = c.long_name;
    if (c.types.includes('country')) country = c.long_name;
  }

  const primaryName = sublocality || locality || city || 'Unknown Location';
  return { name: primaryName, city: locality || city, state, country };
}

// Known preset coordinates for high-reliability fallback when APIs are offline
const PRESET_GEOLOCATIONS = [
  { match: 'talegaon', name: 'Talegaon Dabhade', address: 'Talegaon Dabhade, Pune, Maharashtra, India', city: 'Talegaon Dabhade', state: 'Maharashtra', country: 'India', lat: 18.7337, lng: 73.6728 },
  { match: 'pune', name: 'Pune', address: 'Pune, Maharashtra, India', city: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lng: 73.8567 },
  { match: 'mumbai', name: 'Mumbai', address: 'Mumbai, Maharashtra, India', city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lng: 72.8777 },
  { match: 'bengaluru', name: 'Bengaluru', address: 'Bengaluru, Karnataka, India', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lng: 77.5946 },
  { match: 'bangalore', name: 'Bengaluru', address: 'Bengaluru, Karnataka, India', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lng: 77.5946 },
  { match: 'delhi', name: 'New Delhi', address: 'New Delhi, Delhi, India', city: 'New Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lng: 77.2090 },
  { match: 'hyderabad', name: 'Hyderabad', address: 'Hyderabad, Telangana, India', city: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lng: 78.4867 }
];

// GET /api/location/reverse-geocode?lat=...&lng=...
router.get('/reverse-geocode', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, error: 'Invalid latitude or longitude coordinates' });
    }

    const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

    // 1. Try Google Geocoding API if key is available
    if (GMAPS_KEY && GMAPS_KEY !== 'your_google_maps_api_key_here') {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GMAPS_KEY}`;
        const gRes = await fetch(gUrl, { timeout: 7000 });
        const gData = await gRes.json();

        if (gData.status === 'OK' && gData.results && gData.results.length > 0) {
          const top = gData.results[0];
          const parsed = parseGoogleAddressComponents(top.address_components);

          return res.json({
            success: true,
            source: 'google_geocoding',
            location: {
              name: parsed.name,
              address: top.formatted_address,
              formattedAddress: top.formatted_address,
              city: parsed.city,
              state: parsed.state,
              country: parsed.country,
              lat,
              lng
            }
          });
        }
      } catch (err) {
        console.warn('Google reverse geocode failed, falling back to OSM:', err.message);
      }
    }

    // 2. Fallback: OpenStreetMap Nominatim reverse geocoder
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const osmRes = await fetch(osmUrl, {
        headers: { 'User-Agent': 'DermAI-HealthPlatform/1.0 (contact@dermai.health)' },
        timeout: 7000
      });
      const osmData = await osmRes.json();

      if (osmData && osmData.address) {
        const addr = osmData.address;
        const name = addr.suburb || addr.town || addr.city || addr.village || addr.municipality || 'Current Location';
        const city = addr.city || addr.town || addr.district || addr.county || '';
        const state = addr.state || '';
        const country = addr.country || '';
        const formatted = osmData.display_name || `${name}, ${city}, ${state}, ${country}`.replace(/,\s*,/g, ',');

        return res.json({
          success: true,
          source: 'osm_nominatim',
          location: {
            name,
            address: formatted,
            formattedAddress: formatted,
            city,
            state,
            country,
            lat,
            lng
          }
        });
      }
    } catch (osmErr) {
      console.warn('OSM reverse geocode failed:', osmErr.message);
    }

    // 3. Fallback: Coordinate checking against preset locations
    for (const p of PRESET_GEOLOCATIONS) {
      const dLat = Math.abs(lat - p.lat);
      const dLng = Math.abs(lng - p.lng);
      if (dLat < 0.1 && dLng < 0.1) {
        return res.json({
          success: true,
          source: 'preset_directory',
          location: {
            ...p,
            formattedAddress: p.address,
            lat,
            lng
          }
        });
      }
    }

    // Default coordinate representation
    return res.json({
      success: true,
      source: 'coordinates',
      location: {
        name: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
        address: `Coordinates: ${lat.toFixed(4)} N, ${lng.toFixed(4)} E`,
        formattedAddress: `Coordinates: ${lat.toFixed(4)} N, ${lng.toFixed(4)} E`,
        city: '',
        state: '',
        country: '',
        lat,
        lng
      }
    });
  } catch (err) {
    console.error('Reverse geocode error:', err);
    res.status(500).json({ success: false, error: 'Server error resolving location coordinates' });
  }
});

// GET /api/location/search?query=... or ?q=...
router.get('/search', async (req, res) => {
  try {
    const query = (req.query.query || req.query.q || '').trim();
    if (!query || query.length < 2) {
      return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
    }

    const qLower = query.toLowerCase();

    // 1. Check presets for instantaneous exact match (ensures offline reliability)
    const exactPreset = PRESET_GEOLOCATIONS.find(p => qLower.includes(p.match));
    if (exactPreset) {
      const loc = {
        name: exactPreset.name,
        address: exactPreset.address,
        formattedAddress: exactPreset.address,
        city: exactPreset.city,
        state: exactPreset.state,
        country: exactPreset.country,
        lat: exactPreset.lat,
        lng: exactPreset.lng
      };
      return res.json({
        success: true,
        source: 'preset_directory',
        location: loc,
        results: [loc]
      });
    }

    const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

    // 2. Try Google Geocoding API if key is available
    if (GMAPS_KEY && GMAPS_KEY !== 'your_google_maps_api_key_here') {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GMAPS_KEY}`;
        const gRes = await fetch(gUrl, { timeout: 7000 });
        const gData = await gRes.json();

        if (gData.status === 'OK' && gData.results && gData.results.length > 0) {
          const results = gData.results.slice(0, 5).map(r => {
            const parsed = parseGoogleAddressComponents(r.address_components);
            return {
              name: parsed.name,
              address: r.formatted_address,
              formattedAddress: r.formatted_address,
              city: parsed.city,
              state: parsed.state,
              country: parsed.country,
              lat: r.geometry.location.lat,
              lng: r.geometry.location.lng
            };
          });

          return res.json({
            success: true,
            source: 'google_geocoding',
            location: results[0],
            results
          });
        }
      } catch (err) {
        console.warn('Google geocoding search failed, falling back to OSM:', err.message);
      }
    }

    // 3. Fallback: OpenStreetMap Nominatim search
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
      const osmRes = await fetch(osmUrl, {
        headers: { 'User-Agent': 'DermAI-HealthPlatform/1.0 (contact@dermai.health)' },
        timeout: 7000
      });
      const osmData = await osmRes.json();

      if (Array.isArray(osmData) && osmData.length > 0) {
        const results = osmData.map(item => ({
          name: item.name || item.display_name.split(',')[0],
          address: item.display_name,
          formattedAddress: item.display_name,
          city: item.address?.city || item.address?.town || item.address?.state_district || '',
          state: item.address?.state || '',
          country: item.address?.country || '',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }));

        return res.json({
          success: true,
          source: 'osm_nominatim',
          location: results[0],
          results
        });
      }
    } catch (osmErr) {
      console.warn('OSM search failed:', osmErr.message);
    }

    // No results found
    return res.json({
      success: true,
      source: 'none',
      location: null,
      results: [],
      message: `No locations matching "${query}"`
    });
  } catch (err) {
    console.error('Location search error:', err);
    res.status(500).json({ success: false, error: 'Server error searching location' });
  }
});

module.exports = router;
