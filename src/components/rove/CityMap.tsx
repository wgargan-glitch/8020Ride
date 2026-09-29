import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
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

const EMPTY_LINE = { type: "Feature" as const, geometry: { type: "LineString" as const, coordinates: [] as [number, number][] }, properties: {} };

function cssColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function dot(fill: string, ring: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "16px";
  el.style.height = "16px";
  el.style.borderRadius = "999px";
  el.style.background = fill;
  el.style.border = `3px solid ${ring}`;
  el.style.boxSizing = "border-box";
  return el;
}

export function CityMap({ pickup, dropoff, route, leg, aiming, onMapClick }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const lineReady = useRef(false);
  const pickupRef = useRef<Marker | null>(null);
  const dropRef = useRef<Marker | null>(null);
  const carRef = useRef<Marker | null>(null);
  const onClickRef = useRef(onMapClick);
  const legRef = useRef(leg);
  const [ready, setReady] = useState(false);
  onClickRef.current = onMapClick;
  legRef.current = leg;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let map: MlMap | null = null;

    void import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !hostRef.current) return;
      map = new maplibregl.Map({
        container: hostRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [pickup.lng, pickup.lat],
        zoom: 13,
        minZoom: 10,
        maxZoom: 18,
        attributionControl: { compact: false },
      });
      map.on("load", () => {
        if (cancelled || !map) return;
        map.addSource("route", { type: "geojson", data: EMPTY_LINE });
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          paint: {
            "line-color": cssColor("--color-jade", "#0c6a64"),
            "line-width": 4,
            "line-opacity": 1,
          },
          layout: { "line-cap": "butt", "line-join": "miter" },
        });
        lineReady.current = true;
        mapRef.current = map;
        setReady(true);
        map.resize();
      });
      map.on("click", (event) => {
        onClickRef.current(event.lngLat.lat, event.lngLat.lng);
      });
      mapRef.current = map;
    });

    const onResize = () => mapRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      pickupRef.current?.remove();
      dropRef.current?.remove();
      carRef.current?.remove();
      map?.remove();
      mapRef.current = null;
      lineReady.current = false;
      pickupRef.current = null;
      dropRef.current = null;
      carRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !lineReady.current) return;
    void import("maplibre-gl").then((maplibregl) => {
      const jade = cssColor("--color-jade", "#0c6a64");
      const ink = cssColor("--color-ink", "#1a2c30");
      const paper = cssColor("--color-paper", "#f4f7f6");
      const source = map.getSource("route") as GeoJSONSource | undefined;
      source?.setData(
        route && route.length > 1
          ? {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: route.map((p) => [p.lng, p.lat]),
              },
            }
          : EMPTY_LINE,
      );

      pickupRef.current?.remove();
      dropRef.current?.remove();
      pickupRef.current = new maplibregl.Marker({ element: dot(ink, paper), anchor: "center" })
        .setLngLat([pickup.lng, pickup.lat])
        .addTo(map);
      dropRef.current = dropoff
        ? new maplibregl.Marker({ element: dot(jade, paper), anchor: "center" })
          .setLngLat([dropoff.lng, dropoff.lat])
          .addTo(map)
        : null;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const desktop = window.innerWidth >= 768;
      const points: LatLng[] = route?.length ? [...route] : [pickup];
      if (dropoff) points.push(dropoff);
      if (leg && leg.path.length) points.push(leg.path[0], leg.path[leg.path.length - 1]);
      map.resize();
      if (!dropoff && !route?.length) {
        map.jumpTo({ center: [pickup.lng, pickup.lat], zoom: 14 });
        map.panBy(desktop ? [-220, 0] : [0, 190], { duration: 0 });
      } else {
        const lngs = points.map((p) => p.lng);
        const lats = points.map((p) => p.lat);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          {
            padding: desktop
              ? { top: 96, bottom: 48, left: 480, right: 40 }
              : { top: 96, bottom: 280, left: 28, right: 28 },
            maxZoom: 15,
            duration: reduce ? 0 : 400,
          },
        );
      }
    });
  }, [ready, pickup, dropoff, route, leg?.id, leg]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getContainer().classList.toggle("rove-crosshair", aiming);
  }, [aiming, ready]);

  useEffect(() => {
    let frame = 0;
    let lib: typeof import("maplibre-gl") | null = null;
    void import("maplibre-gl").then((mod) => {
      lib = mod;
    });
    const tick = () => {
      const map = mapRef.current;
      const current = legRef.current;
      if (map && lib) {
        if (!current || current.path.length === 0) {
          carRef.current?.remove();
          carRef.current = null;
        } else {
          const raw = Math.min(1, (performance.now() - current.startedAt) / current.durationMs);
          const spot = pointAt(current.path, easeInOut(raw));
          if (!carRef.current) {
            const el = document.createElement("div");
            el.className = "rove-pin-wrap";
            el.innerHTML = CAR_HTML;
            carRef.current = new lib.Marker({ element: el, anchor: "center" })
              .setLngLat([spot.lng, spot.lat])
              .addTo(map);
          } else {
            carRef.current.setLngLat([spot.lng, spot.lat]);
          }
          const rot = carRef.current?.getElement()?.querySelector(".rove-car-rot");
          if (rot instanceof HTMLElement) rot.style.transform = `rotate(${spot.bearing}deg)`;
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
