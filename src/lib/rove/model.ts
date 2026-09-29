export type LatLng = { lat: number; lng: number };

export type Pin = {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
};

export type TierId = "go" | "plus" | "van";

export type Tier = {
  id: TierId;
  name: string;
  blurb: string;
  seats: number;
  base: number;
  perMile: number;
  minimum: number;
};

export const DRIVER_SHARE = 0.8;
export const PLATFORM_SHARE = 0.2;

export const TIERS: Record<TierId, Tier> = {
  go: {
    id: "go",
    name: "Go",
    blurb: "Everyday seat",
    seats: 4,
    base: 2.5,
    perMile: 1.5,
    minimum: 6,
  },
  plus: {
    id: "plus",
    name: "Plus",
    blurb: "Quieter, more room",
    seats: 4,
    base: 4,
    perMile: 2,
    minimum: 9,
  },
  van: {
    id: "van",
    name: "Van",
    blurb: "Up to six",
    seats: 6,
    base: 6,
    perMile: 2.5,
    minimum: 12,
  },
};

export const TIER_ORDER: TierId[] = ["go", "plus", "van"];

export type RouteInfo = {
  miles: number;
  minutes: number;
  geometry: LatLng[];
  estimated: boolean;
};

export type DriverPersona = {
  id: string;
  name: string;
  rating: number;
  trips: number;
  car: string;
  color: string;
  plate: string;
};

export const YOU: DriverPersona = {
  id: "you",
  name: "You",
  rating: 5,
  trips: 0,
  car: "Your car",
  color: "Yours",
  plate: "8020",
};

export type RiderPersona = {
  name: string;
  rating: number;
};

export type Receipt = {
  id: string;
  at: string;
  role: "rider" | "driver";
  pickupName: string;
  dropoffName: string;
  tier: TierId;
  miles: number;
  minutes: number;
  total: number;
  driver: number;
  platform: number;
  withName: string;
  stars: number | null;
  from?: LatLng;
  to?: LatLng;
};

export type Leg = {
  id: string;
  path: LatLng[];
  durationMs: number;
  startedAt: number;
};

export const PLACES: Pin[] = [
  { id: "main", name: "Main Street", area: "Downtown Porterville", lat: 36.06478, lng: -119.016 },
  { id: "library", name: "Public Library", area: "Downtown Porterville", lat: 36.06574, lng: -119.01758 },
  { id: "city-hall", name: "City Hall", area: "Downtown Porterville", lat: 36.07097, lng: -119.01658 },
  { id: "zalud", name: "Zalud House", area: "Downtown", lat: 36.07288, lng: -119.01759 },
  { id: "college", name: "Porterville College", area: "College Avenue", lat: 36.0472, lng: -119.01549 },
  { id: "hospital", name: "Sierra View Hospital", area: "West Putnam", lat: 36.06847, lng: -119.02581 },
  { id: "phs", name: "Porterville High", area: "West Olive", lat: 36.0634, lng: -119.02804 },
  { id: "murry", name: "Murry Park", area: "East Porterville", lat: 36.06741, lng: -119.00287 },
  { id: "lake", name: "Lake Success", area: "East of town", lat: 36.08244, lng: -118.91015 },
  { id: "veterans", name: "Veterans Park", area: "West Henderson", lat: 36.07437, lng: -119.05239 },
  { id: "target", name: "Target", area: "Henderson Avenue", lat: 36.07805, lng: -119.04721 },
  { id: "walmart", name: "Walmart", area: "Henderson Avenue", lat: 36.08336, lng: -119.04527 },
  { id: "monache", name: "Monache High", area: "North Porterville", lat: 36.08175, lng: -119.04988 },
  { id: "airport", name: "Municipal Airport", area: "West Porterville", lat: 36.02959, lng: -119.06113 },
  { id: "casino", name: "Eagle Mountain Casino", area: "South Porterville", lat: 36.0315, lng: -119.07613 },
  { id: "fair", name: "Fairgrounds", area: "South Porterville", lat: 36.02332, lng: -119.07403 },
  { id: "springville", name: "Springville", area: "Foothills", lat: 36.12308, lng: -118.83974 },
  { id: "lindsay", name: "Lindsay", area: "Orange belt", lat: 36.20301, lng: -119.08816 },
  { id: "exeter", name: "Downtown Exeter", area: "Exeter", lat: 36.29617, lng: -119.1421 },
  { id: "tulare", name: "Downtown Tulare", area: "Tulare", lat: 36.2077, lng: -119.3473 },
  { id: "visalia", name: "Visalia Transit", area: "Visalia", lat: 36.33143, lng: -119.28877 },
];

export const HOME_PIN = PLACES[0];

export const SUGGESTED_IDS = ["college", "hospital", "lake", "visalia", "target", "springville"];

export const DRIVERS: DriverPersona[] = [
  { id: "maya", name: "Maya Chen", rating: 4.98, trips: 2410, car: "Toyota Camry", color: "Pearl", plate: "8PCA421" },
  { id: "luis", name: "Luis Ortega", rating: 4.96, trips: 1884, car: "Honda Accord", color: "Graphite", plate: "7KRD118" },
  { id: "amina", name: "Amina Hassan", rating: 4.99, trips: 3102, car: "Hyundai Ioniq", color: "White", plate: "9LMT330" },
  { id: "chris", name: "Chris Dalton", rating: 4.95, trips: 1260, car: "Subaru Outback", color: "Green", plate: "6BHF774" },
  { id: "priya", name: "Priya Shah", rating: 4.97, trips: 2044, car: "Kia EV6", color: "Silver", plate: "5NVE902" },
];

export const UNASSIGNED: DriverPersona = {
  id: "none",
  name: "Not assigned",
  rating: 0,
  trips: 0,
  car: "",
  color: "",
  plate: "",
};

export const RIDERS: RiderPersona[] = [
  { name: "Jordan Hale", rating: 4.92 },
  { name: "Elena Vasquez", rating: 4.88 },
  { name: "Sam Okonkwo", rating: 4.95 },
  { name: "Noah Brooks", rating: 4.9 },
  { name: "Riley Nguyen", rating: 4.97 },
  { name: "Camila Rocha", rating: 4.93 },
];

function cents(n: number): number {
  return Math.round(n * 100) / 100;
}

export function quoteFare(miles: number, tier: Tier) {
  const raw = tier.base + miles * tier.perMile;
  const total = cents(Math.max(tier.minimum, raw));
  const driver = cents(total * DRIVER_SHARE);
  const platform = cents(total - driver);
  return { total, driver, platform };
}

export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function formatMiles(miles: number): string {
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function formatMinutes(min: number): string {
  const m = Math.max(1, Math.round(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} hr ${r} min` : `${h} hr`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rad(n: number): number {
  return (n * Math.PI) / 180;
}

export function milesBetween(a: LatLng, b: LatLng): number {
  const R = 3958.7613;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function tooClose(a: LatLng, b: LatLng): boolean {
  return milesBetween(a, b) < 0.08;
}

export function offsetPoint(p: LatLng, miles: number, bearing: number): LatLng {
  const R = 3958.7613;
  const δ = miles / R;
  const θ = rad(bearing);
  const φ1 = rad(p.lat);
  const λ1 = rad(p.lng);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
    );
  return { lat: (φ2 * 180) / Math.PI, lng: (((λ2 * 180) / Math.PI + 540) % 360) - 180 };
}

export function lineGeometry(a: LatLng, b: LatLng, steps = 28): LatLng[] {
  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
    });
  }
  return pts;
}

export function bearingDeg(a: LatLng, b: LatLng): number {
  const φ1 = rad(a.lat);
  const φ2 = rad(b.lat);
  const Δλ = rad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function pointAt(pts: LatLng[], t: number): LatLng & { bearing: number } {
  if (pts.length === 0) return { lat: HOME_PIN.lat, lng: HOME_PIN.lng, bearing: 0 };
  if (pts.length === 1) return { ...pts[0], bearing: 0 };
  const goal = Math.min(1, Math.max(0, t));
  let total = 0;
  const seg: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const d = milesBetween(pts[i - 1], pts[i]);
    seg.push(d);
    total += d;
  }
  let remain = total * goal;
  for (let i = 1; i < pts.length; i++) {
    const d = seg[i - 1] ?? 0;
    if (remain <= d || i === pts.length - 1) {
      const u = d === 0 ? 0 : Math.min(1, remain / d);
      const prev = pts[i - 1];
      const next = pts[i];
      return {
        lat: prev.lat + (next.lat - prev.lat) * u,
        lng: prev.lng + (next.lng - prev.lng) * u,
        bearing: bearingDeg(prev, next),
      };
    }
    remain -= d;
  }
  const last = pts[pts.length - 1];
  return { ...last, bearing: bearingDeg(pts[pts.length - 2], last) };
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

export function motionMs(ms: number): number {
  if (typeof window === "undefined") return ms;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Math.min(450, ms);
  return ms;
}

export function pinAt(lat: number, lng: number): Pin {
  return {
    id: `pin-${lat.toFixed(5)}-${lng.toFixed(5)}`,
    name: "Dropped pin",
    area: "Chosen on the map",
    lat,
    lng,
  };
}

export function searchPlaces(query: string): Pin[] {
  const s = query.trim().toLowerCase();
  if (!s) return PLACES;
  return PLACES.filter((p) => `${p.name} ${p.area}`.toLowerCase().includes(s));
}

const VALLEY = { south: 35.9, north: 36.55, west: -119.55, east: -118.72 };

export function inValley(lat: number, lng: number): boolean {
  return lat >= VALLEY.south && lat <= VALLEY.north && lng >= VALLEY.west && lng <= VALLEY.east;
}

type PhotonProps = {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  county?: string;
  countrycode?: string;
};

function pinFromPhoton(lat: number, lng: number, props: PhotonProps, prefix: string): Pin | null {
  if (props.countrycode && props.countrycode !== "US") return null;
  const street = props.street || "";
  const named = props.housenumber && street ? `${props.housenumber} ${street}` : (props.name || street).trim();
  if (!named) return null;
  const city = props.city || (props.county ? props.county.replace(/ County$/, "") : "Tulare County");
  return {
    id: `${prefix}-${lat.toFixed(5)}-${lng.toFixed(5)}`,
    name: named,
    area: city,
    lat,
    lng,
  };
}

export async function geocodePlaces(query: string, signal?: AbortSignal): Promise<Pin[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=36.0652&lon=-119.0168&limit=8&lang=en`;
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
    if (!inValley(lat, lng)) continue;
    const pin = pinFromPhoton(lat, lng, feature.properties, "geo");
    if (!pin) continue;
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pins.push(pin);
  }
  return pins;
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
  const [rlng, rlat] = coords;
  if (milesBetween({ lat, lng }, { lat: rlat, lng: rlng }) > 0.45) return null;
  const pin = pinFromPhoton(lat, lng, feature.properties, "pin");
  if (!pin) return null;
  return { ...pin, id: `pin-${lat.toFixed(5)}-${lng.toFixed(5)}`, lat, lng };
}

export async function fetchRoute(a: LatLng, b: LatLng): Promise<RouteInfo> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error("route");
    const data = (await res.json()) as {
      routes?: {
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
      }[];
    };
    const route = data.routes?.[0];
    if (!route?.geometry?.coordinates?.length) throw new Error("empty");
    const geometry = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    return {
      miles: route.distance / 1609.344,
      minutes: route.duration / 60,
      geometry: geometry.length >= 2 ? geometry : lineGeometry(a, b),
      estimated: false,
    };
  } catch {
    const miles = Math.max(0.2, milesBetween(a, b) * 1.28);
    return {
      miles,
      minutes: (miles / 26) * 60,
      geometry: lineGeometry(a, b),
      estimated: true,
    };
  } finally {
    clearTimeout(timer);
  }
}

const LA: Intl.DateTimeFormatOptions = { timeZone: "America/Los_Angeles" };

export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    ...LA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    ...LA,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function weekday(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { ...LA, weekday: "short" }).format(new Date(iso));
}

export function recentDays(now = new Date()): { key: string; label: string }[] {
  const days: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const iso = d.toISOString();
    days.push({ key: dayKey(iso), label: weekday(iso) });
  }
  return days;
}

export function earningsStats(history: Receipt[], now = new Date()) {
  const days = recentDays(now);
  const today = days[days.length - 1]?.key ?? "";
  const keys = new Set(days.map((d) => d.key));
  const byDay = new Map(days.map((d) => [d.key, 0]));
  let week = 0;
  let todayKept = 0;
  let weekRides = 0;
  let lifetime = 0;
  let lifetimeRides = 0;
  for (const ride of history) {
    if (ride.role !== "driver") continue;
    lifetime += ride.driver;
    lifetimeRides += 1;
    const key = dayKey(ride.at);
    if (!keys.has(key)) continue;
    week += ride.driver;
    weekRides += 1;
    byDay.set(key, (byDay.get(key) ?? 0) + ride.driver);
    if (key === today) todayKept += ride.driver;
  }
  return {
    week: cents(week),
    todayKept: cents(todayKept),
    weekRides,
    lifetime: cents(lifetime),
    lifetimeRides,
    series: days.map((d) => ({
      key: d.key,
      label: d.label,
      kept: cents(byDay.get(d.key) ?? 0),
    })),
  };
}

function placeById(id: string): Pin {
  return PLACES.find((p) => p.id === id) ?? HOME_PIN;
}

type SeedSpec = {
  id: string;
  at: string;
  role: "rider" | "driver";
  from: string;
  to: string;
  tier: TierId;
  withName: string;
  stars: number | null;
};

const SEED_SPECS: SeedSpec[] = [
  { id: "s1", at: "2026-09-28T08:10:00-07:00", role: "driver", from: "main", to: "college", tier: "go", withName: "Elena Vasquez", stars: 5 },
  { id: "s2", at: "2026-09-28T09:40:00-07:00", role: "driver", from: "hospital", to: "walmart", tier: "plus", withName: "Jordan Hale", stars: 5 },
  { id: "s3", at: "2026-09-28T12:15:00-07:00", role: "driver", from: "library", to: "lake", tier: "go", withName: "Sam Okonkwo", stars: 5 },
  { id: "s4", at: "2026-09-28T14:05:00-07:00", role: "rider", from: "main", to: "target", tier: "go", withName: "Maya Chen", stars: 5 },
  { id: "s5", at: "2026-09-27T16:20:00-07:00", role: "driver", from: "airport", to: "city-hall", tier: "van", withName: "Noah Brooks", stars: 4 },
  { id: "s6", at: "2026-09-27T18:50:00-07:00", role: "driver", from: "lindsay", to: "college", tier: "go", withName: "Riley Nguyen", stars: 5 },
  { id: "s7", at: "2026-09-26T11:05:00-07:00", role: "driver", from: "visalia", to: "main", tier: "plus", withName: "Camila Rocha", stars: 5 },
  { id: "s8", at: "2026-09-26T15:30:00-07:00", role: "rider", from: "college", to: "library", tier: "go", withName: "Luis Ortega", stars: 5 },
  { id: "s9", at: "2026-09-25T17:10:00-07:00", role: "driver", from: "fair", to: "murry", tier: "go", withName: "Elena Vasquez", stars: 5 },
  { id: "s10", at: "2026-09-24T13:25:00-07:00", role: "driver", from: "springville", to: "hospital", tier: "plus", withName: "Jordan Hale", stars: 5 },
  { id: "s11", at: "2026-09-23T09:15:00-07:00", role: "driver", from: "exeter", to: "college", tier: "go", withName: "Sam Okonkwo", stars: 4 },
  { id: "s12", at: "2026-09-22T17:40:00-07:00", role: "driver", from: "casino", to: "main", tier: "go", withName: "Noah Brooks", stars: 5 },
];

function seedReceipt(spec: SeedSpec): Receipt {
  const from = placeById(spec.from);
  const to = placeById(spec.to);
  const miles = Math.round(milesBetween(from, to) * 1.25 * 10) / 10;
  const minutes = Math.max(4, Math.round((miles / 28) * 60));
  const price = quoteFare(miles, TIERS[spec.tier]);
  return {
    id: spec.id,
    at: spec.at,
    role: spec.role,
    pickupName: from.name,
    dropoffName: to.name,
    tier: spec.tier,
    miles,
    minutes,
    withName: spec.withName,
    stars: spec.stars,
    from: { lat: from.lat, lng: from.lng },
    to: { lat: to.lat, lng: to.lng },
    ...price,
  };
}

export const SEED_HISTORY: Receipt[] = SEED_SPECS.map(seedReceipt);

export function pinFromReceipt(ride: Receipt, end: "from" | "to"): Pin | null {
  const point = end === "from" ? ride.from : ride.to;
  const name = end === "from" ? ride.pickupName : ride.dropoffName;
  if (point) {
    return { id: `again-${end}-${name}`, name, area: "Previous trip", lat: point.lat, lng: point.lng };
  }
  return PLACES.find((place) => place.name === name) ?? null;
}

export function walletBalance(history: Receipt[], cashed: number) {
  const kept = history.reduce((sum, ride) => (ride.role === "driver" ? sum + ride.driver : sum), 0);
  const paid = Math.round(cashed * 100) / 100;
  const available = Math.round(Math.max(0, kept - paid) * 100) / 100;
  return { kept: Math.round(kept * 100) / 100, available, cashed: paid };
}

export function isPin(value: unknown): value is Pin {
  if (!value || typeof value !== "object") return false;
  const pin = value as Pin;
  return (
    typeof pin.id === "string" &&
    typeof pin.name === "string" &&
    typeof pin.area === "string" &&
    typeof pin.lat === "number" &&
    typeof pin.lng === "number"
  );
}

export function isReceipt(value: unknown): value is Receipt {
  if (!value || typeof value !== "object") return false;
  const ride = value as Receipt;
  return (
    typeof ride.id === "string" &&
    (ride.role === "rider" || ride.role === "driver") &&
    typeof ride.total === "number" &&
    typeof ride.driver === "number" &&
    typeof ride.platform === "number" &&
    typeof ride.at === "string" &&
    (ride.tier === "go" || ride.tier === "plus" || ride.tier === "van")
  );
}
