import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { Minus, Plus } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { easeInOut, pointAt, type LatLng, type Leg, type Pin } from "@/lib/rove/model";

type Props = {
  pickup: Pin;
  dropoff: Pin | null;
  route: LatLng[] | null;
  leg: Leg | null;
  aiming: boolean;
  onMapClick: (lat: number, lng: number) => void;
};

const CAR_HTML = `<div class="rove-car-rot" style="width:36px;height:36px;transform-origin:center">
<svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
  <path class="rove-car-body" d="M18 2 L32 32 L18 25 L4 32 Z"/>
  <path class="rove-car-mark" d="M18 10 L26 26 L18 22 L10 26 Z"/>
</svg>
</div>`;

function cssColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function CityMap({ pickup, dropoff, route, leg, aiming, onMapClick }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const libRef = useRef<typeof Leaflet | null>(null);
  const lineRef = useRef<Leaflet.Polyline | null>(null);
  const pickupRef = useRef<Leaflet.CircleMarker | null>(null);
  const dropRef = useRef<Leaflet.CircleMarker | null>(null);
  const carRef = useRef<Leaflet.Marker | null>(null);
  const onClickRef = useRef(onMapClick);
  const legRef = useRef(leg);
  const [ready, setReady] = useState(false);
  onClickRef.current = onMapClick;
  legRef.current = leg;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let map: Leaflet.Map | null = null;

    void import("leaflet").then((mod) => {
      if (cancelled || !hostRef.current) return;
      const L = (mod.default ?? mod) as typeof Leaflet;
      libRef.current = L;
      map = L.map(hostRef.current, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 10,
        maxZoom: 18,
      }).setView([pickup.lat, pickup.lng], 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.attributionControl.setPosition("bottomleft");
      map.on("click", (event) => {
        onClickRef.current(event.latlng.lat, event.latlng.lng);
      });
      mapRef.current = map;
      setReady(true);
      requestAnimationFrame(() => map?.invalidateSize());
    });

    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      map?.remove();
      mapRef.current = null;
      lineRef.current = null;
      pickupRef.current = null;
      dropRef.current = null;
      carRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = libRef.current;
    if (!map || !L) return;
    const jade = cssColor("--color-jade", "#0c6a64");
    const ink = cssColor("--color-ink", "#1a2c30");
    const paper = cssColor("--color-paper", "#f4f7f6");

    lineRef.current?.remove();
    pickupRef.current?.remove();
    dropRef.current?.remove();
    lineRef.current = null;
    pickupRef.current = null;
    dropRef.current = null;

    if (route && route.length > 1) {
      lineRef.current = L.polyline(
        route.map((p) => [p.lat, p.lng] as [number, number]),
        { color: jade, weight: 4, opacity: 1, lineCap: "butt", lineJoin: "miter" },
      ).addTo(map);
    }

    pickupRef.current = L.circleMarker([pickup.lat, pickup.lng], {
      radius: 8,
      color: paper,
      weight: 3,
      fillColor: ink,
      fillOpacity: 1,
    }).addTo(map);

    if (dropoff) {
      dropRef.current = L.circleMarker([dropoff.lat, dropoff.lng], {
        radius: 8,
        color: paper,
        weight: 3,
        fillColor: jade,
        fillOpacity: 1,
      }).addTo(map);
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.innerWidth >= 768;
    const points: LatLng[] = route?.length ? [...route] : [pickup];
    if (dropoff) points.push(dropoff);
    if (!route?.length) points.push(pickup);
    if (leg && leg.path.length) {
      points.push(leg.path[0], leg.path[leg.path.length - 1]);
    }
    map.invalidateSize();
    if (!dropoff && !route?.length) {
      map.setView([pickup.lat, pickup.lng], 14, { animate: false });
      map.panBy(desktop ? [-220, 0] : [0, 190], { animate: false });
    } else {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, {
        paddingTopLeft: desktop ? [480, 96] : [28, 96],
        paddingBottomRight: desktop ? [40, 48] : [28, 280],
        maxZoom: 15,
        animate: !reduce,
      });
    }
    carRef.current?.setZIndexOffset(1000);
  }, [ready, pickup, dropoff, route, leg?.id, leg]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getContainer().classList.toggle("rove-crosshair", aiming);
  }, [aiming, ready]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const map = mapRef.current;
      const L = libRef.current;
      const current = legRef.current;
      if (map && L) {
        if (!current || current.path.length === 0) {
          carRef.current?.remove();
          carRef.current = null;
        } else {
          const raw = Math.min(1, (performance.now() - current.startedAt) / current.durationMs);
          const spot = pointAt(current.path, easeInOut(raw));
          if (!carRef.current) {
            const icon = L.divIcon({
              className: "rove-pin-wrap",
              html: CAR_HTML,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            });
            carRef.current = L.marker([spot.lat, spot.lng], { icon, interactive: false }).addTo(map);
          } else {
            carRef.current.setLatLng([spot.lat, spot.lng]);
          }
          const rot = carRef.current.getElement()?.querySelector(".rove-car-rot");
          if (rot instanceof HTMLElement) rot.style.transform = `rotate(${spot.bearing}deg)`;
          carRef.current.setZIndexOffset(1000);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={hostRef} className="absolute inset-0" />
      <div className="absolute top-32 right-3 z-10 hidden flex-col gap-2 md:flex">
        <button
          type="button"
          aria-label="Zoom in"
          className="press grid size-11 place-items-center border border-line bg-paper text-ink"
          onClick={() => mapRef.current?.zoomIn()}
        >
          <Plus className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          className="press grid size-11 place-items-center border border-line bg-paper text-ink"
          onClick={() => mapRef.current?.zoomOut()}
        >
          <Minus className="size-5" />
        </button>
      </div>
    </div>
  );
}
