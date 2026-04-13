/**
 * Resolve a shareable Google Maps URL from place name + city + state using
 * Places API (New) Text Search. Google OAuth client credentials used for user login
 * cannot be used here; create an API key with Places API enabled and set
 * GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY in the backend environment.
 */

function buildFallbackMapsSearchUrl(name, city, state) {
  const q = [name, city, state, 'India'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function formatLocationLine(city, state) {
  if (!city && !state) return null;
  if (!city) return state;
  if (!state) return city;
  return `${city}, ${state}`;
}

/**
 * @param {{ name: string, city: string, state: string }} params
 * @returns {Promise<string>}
 */
async function resolveGoogleMapsLink({ name, city, state }) {
  const n = (name && String(name).trim()) || '';
  const c = (city && String(city).trim()) || '';
  const s = (state && String(state).trim()) || '';
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('[googlePlacesMapsLink] No GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY — using fallback search URL');
    return buildFallbackMapsSearchUrl(n, c, s);
  }

  const textQuery = [n, c, s, 'India'].filter(Boolean).join(' ');

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.googleMapsUri,places.location,places.formattedAddress',
      },
      body: JSON.stringify({ textQuery }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.warn('[googlePlacesMapsLink] Places API HTTP', res.status, t.slice(0, 500));
      return buildFallbackMapsSearchUrl(n, c, s);
    }

    const data = await res.json();
    const place = data.places && data.places[0];
    if (place?.googleMapsUri && String(place.googleMapsUri).startsWith('http')) {
      return place.googleMapsUri;
    }
    if (
      place?.location &&
      place.location.latitude != null &&
      place.location.longitude != null
    ) {
      const lat = place.location.latitude;
      const lng = place.location.longitude;
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    return buildFallbackMapsSearchUrl(n, c, s);
  } catch (e) {
    console.warn('[googlePlacesMapsLink]', e.message || e);
    return buildFallbackMapsSearchUrl(n, c, s);
  }
}

module.exports = {
  resolveGoogleMapsLink,
  formatLocationLine,
  buildFallbackMapsSearchUrl,
};
