import { milesBetween, type Pin } from "@/lib/rove/model";

const US = { south: 24.4, north: 49.5, west: -125.0, east: -66.0 };

export const LA = { lat: 34.05223, lng: -118.24368 };

export const DEFAULT_PIN: Pin = {
  id: "la-downtown",
  name: "Downtown Los Angeles",
  area: "Los Angeles, California",
  lat: LA.lat,
  lng: LA.lng,
};

export function inServiceArea(lat: number, lng: number): boolean {
  return lat >= US.south && lat <= US.north && lng >= US.west && lng <= US.east;
}

type PhotonProps = {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countrycode?: string;
  osm_value?: string;
};

function cityOf(props: PhotonProps): string {
  return (
    props.city ||
    props.district ||
    (props.county ? props.county.replace(/ County$/i, "") : "") ||
    props.state ||
    "United States"
  );
}

function lineOf(props: PhotonProps): string {
  const street = (props.street || "").trim();
  if (props.housenumber && street) return `${props.housenumber} ${street}`;
  if (props.name && street && props.name.toLowerCase() !== street.toLowerCase()) {
    return props.name;
  }
  if (street) return street;
  return (props.name || "").trim();
}

function areaOf(props: PhotonProps): string {
  const city = cityOf(props);
  const state = props.state || "";
  const zip = props.postcode || "";
  return [city, state, zip].filter(Boolean).join(", ");
}

function pinFromProps(lat: number, lng: number, props: PhotonProps, prefix: string): Pin | null {
  const code = (props.countrycode || "US").toUpperCase();
  if (code && code !== "US") return null;
  if (!inServiceArea(lat, lng)) return null;
  const name = lineOf(props);
  if (!name) return null;
  return {
    id: `${prefix}-${lat.toFixed(5)}-${lng.toFixed(5)}-${name.toLowerCase().replace(/\s+/g, "-").slice(0, 24)}`,
    name,
    area: areaOf(props),
    lat,
    lng,
  };
}

async function photonSearch(query: string, near: { lat: number; lng: number }, signal?: AbortSignal): Promise<Pin[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${near.lat}&lon=${near.lng}&limit=10&lang=en`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    features?: { geometry?: { coordinates?: [number, number] }; properties?: PhotonProps }[];
  };
  const pins: Pin[] = [];
  const seen = new Set<string>();
  for (const feature of data.features ?? []) {
    const coords = feature.geometry?.coordinates;
    if (!coords || !feature.properties) continue;
    const [lng, lat] = coords;
    const pin = pinFromProps(lat, lng, feature.properties, "geo");
    if (!pin) continue;
    const key = `${pin.name}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pins.push(pin);
  }
  return pins;
}

async function nominatimSearch(query: string, signal?: AbortSignal): Promise<Pin[]> {
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=us&q=` +
    encodeURIComponent(query);
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json", "Accept-Language": "en" },
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as {
    lat: string;
    lon: string;
    display_name?: string;
    address?: {
      house_number?: string;
      road?: string;
      pedestrian?: string;
      neighbourhood?: string;
      suburb?: string;
      city?: string;
      town?: string;
      village?: string;
      county?: string;
      state?: string;
      postcode?: string;
      country_code?: string;
    };
  }[];
  const pins: Pin[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const a = row.address ?? {};
    const pin = pinFromProps(
      lat,
      lng,
      {
        housenumber: a.house_number,
        street: a.road || a.pedestrian,
        name: a.house_number && (a.road || a.pedestrian) ? `${a.house_number} ${a.road || a.pedestrian}` : row.display_name?.split(",")[0],
        city: a.city || a.town || a.village || a.suburb || a.neighbourhood,
        county: a.county,
        state: a.state,
        postcode: a.postcode,
        countrycode: a.country_code,
      },
      "nom",
    );
    if (!pin) continue;
    const key = `${pin.name}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pins.push(pin);
  }
  return pins;
}

export async function geocodePlaces(
  query: string,
  signal?: AbortSignal,
  near?: { lat: number; lng: number },
): Promise<Pin[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const bias = near ?? LA;
  const photon = await photonSearch(q, bias, signal);
  if (photon.length >= 4) return photon;
  try {
    const extra = await nominatimSearch(q, signal);
    const seen = new Set(photon.map((p) => `${p.name}|${p.lat.toFixed(4)}`));
    for (const pin of extra) {
      const key = `${pin.name}|${pin.lat.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      photon.push(pin);
    }
  } catch {
    /* Photon results are enough */
  }
  return photon.slice(0, 12);
}

export async function reverseLabel(lat: number, lng: number, signal?: AbortSignal): Promise<Pin | null> {
  const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    features?: { geometry?: { coordinates?: [number, number] }; properties?: PhotonProps }[];
  };
  const feature = data.features?.[0];
  const coords = feature?.geometry?.coordinates;
  if (!coords || !feature?.properties) return null;
  const pin = pinFromProps(lat, lng, feature.properties, "pin");
  return pin ? { ...pin, lat, lng } : null;
}
