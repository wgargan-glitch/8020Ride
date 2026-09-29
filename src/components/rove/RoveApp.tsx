import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import {
  HOME_PIN,
  fetchRoute,
  isPin,
  isReceipt,
  pinAt,
  reverseLabel,
  tooClose,
  type TierId,
} from "@/lib/rove/model";
import { useRove } from "@/lib/rove/store";
import { CityMap } from "./CityMap";
import { DriverPanel } from "./DriverPanel";
import { RiderPanel } from "./RiderPanel";
import { DriverSim, RiderSim } from "./Sims";

const LEDGER_KEY = "8020ride-ledger-v1";

export function RoveApp() {
  const role = useRove((s) => s.role);
  const aim = useRove((s) => s.aim);
  const pickup = useRove((s) => s.pickup);
  const dropoff = useRove((s) => s.dropoff);
  const riderPhase = useRove((s) => s.riderPhase);
  const riderTrip = useRove((s) => s.riderTrip);
  const driverPhase = useRove((s) => s.driverPhase);
  const driverJob = useRove((s) => s.driverJob);
  const route = useRove((s) => s.route);
  const leg = useRove((s) => s.leg);
  const setRole = useRove((s) => s.setRole);
  const setPickup = useRove((s) => s.setPickup);
  const setDropoff = useRove((s) => s.setDropoff);
  const setRoute = useRove((s) => s.setRoute);
  const setPlace = useRove((s) => s.setPlace);
  const saving = useRove((s) => s.saving);
  const labelSeq = useRef(0);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(LEDGER_KEY) ??
        localStorage.getItem("rove-ledger-v2") ??
        localStorage.getItem("rove-ledger-v1");
      if (raw) {
        const data = JSON.parse(raw) as {
          role?: unknown;
          pickup?: unknown;
          dropoff?: unknown;
          tier?: unknown;
          history?: unknown;
          home?: unknown;
          work?: unknown;
          cashed?: unknown;
        };
        const partial: {
          role?: "rider" | "driver";
          pickup?: ReturnType<typeof useRove.getState>["pickup"];
          dropoff?: ReturnType<typeof useRove.getState>["dropoff"];
          tier?: TierId;
          history?: ReturnType<typeof useRove.getState>["history"];
          home?: ReturnType<typeof useRove.getState>["home"];
          work?: ReturnType<typeof useRove.getState>["work"];
          cashed?: number;
        } = {};
        if (data.role === "driver" || data.role === "rider") partial.role = data.role;
        if (isPin(data.pickup)) partial.pickup = data.pickup;
        if (data.dropoff === null) partial.dropoff = null;
        else if (isPin(data.dropoff)) partial.dropoff = data.dropoff;
        if (data.tier === "go" || data.tier === "plus" || data.tier === "van") partial.tier = data.tier;
        if (Array.isArray(data.history)) {
          const history = data.history.filter(isReceipt);
          if (history.length) partial.history = history;
        }
        if (data.home === null) partial.home = null;
        else if (isPin(data.home)) partial.home = data.home;
        if (data.work === null) partial.work = null;
        else if (isPin(data.work)) partial.work = data.work;
        if (typeof data.cashed === "number" && Number.isFinite(data.cashed)) partial.cashed = data.cashed;
        if (
          partial.role ||
          partial.pickup ||
          partial.dropoff !== undefined ||
          partial.tier ||
          partial.history ||
          partial.home !== undefined ||
          partial.work !== undefined ||
          partial.cashed !== undefined
        ) {
          useRove.getState().hydrateLedger(partial);
        }
      }
    } catch {
      /* keep the seeded ledger */
    }
    return useRove.subscribe((state) => {
      const payload = {
        role: state.role,
        pickup: state.pickup,
        dropoff: state.dropoff,
        tier: state.tier,
        history: state.history,
        home: state.home,
        work: state.work,
        cashed: state.cashed,
      };
      localStorage.setItem(LEDGER_KEY, JSON.stringify(payload));
    });
  }, []);

  const dropLat = dropoff?.lat;
  const dropLng = dropoff?.lng;

  useEffect(() => {
    if (role !== "rider" || riderPhase !== "plan") return;
    if (dropLat == null || dropLng == null || !dropoff || tooClose(pickup, dropoff)) {
      setRoute(null, false);
      return;
    }
    let alive = true;
    setRoute(null, true);
    void fetchRoute(pickup, dropoff).then((next) => {
      if (!alive) return;
      setRoute(next, false);
    });
    return () => {
      alive = false;
    };
  }, [role, riderPhase, pickup.lat, pickup.lng, dropLat, dropLng, setRoute]);

  const riderActive = role === "rider" && riderTrip && riderPhase !== "plan";
  const driverActive = role === "driver" && driverJob && driverPhase !== "offline" && driverPhase !== "idle";

  const mapPickup = riderActive ? riderTrip.pickup : driverActive ? driverJob.pickup : pickup;
  const mapDropoff = riderActive ? riderTrip.dropoff : driverActive ? driverJob.dropoff : role === "rider" ? dropoff : null;
  const mapRoute = riderActive ? riderTrip.geometry : driverActive ? driverJob.geometry : route?.geometry ?? null;
  const aiming = role === "rider" && riderPhase === "plan";

  function onMapClick(lat: number, lng: number) {
    if (role !== "rider" || riderPhase !== "plan") return;
    const pin = pinAt(lat, lng);
    const seq = ++labelSeq.current;
    const slot = saving;
    if (slot) setPlace(slot, pin);
    else if (aim === "pickup") setPickup(pin);
    else setDropoff(pin);
    void reverseLabel(lat, lng).then((named) => {
      if (!named || seq !== labelSeq.current) return;
      const state = useRove.getState();
      if (slot === "home" && state.home?.id === pin.id) setPlace("home", named);
      else if (slot === "work" && state.work?.id === pin.id) setPlace("work", named);
      else if (!slot && aim === "pickup" && state.pickup.id === pin.id) setPickup(named);
      else if (!slot && aim === "drop" && state.dropoff?.id === pin.id) setDropoff(named);
    });
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-linen text-ink">
      <h1 className="sr-only">8020Ride</h1>
      <CityMap
        pickup={mapPickup ?? HOME_PIN}
        dropoff={mapDropoff}
        route={mapRoute}
        leg={leg}
        aiming={aiming}
        onMapClick={onMapClick}
      />
      <RiderSim />
      <DriverSim />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-paper px-3 py-1 md:top-4 md:left-4 md:w-panel md:border">
        <div className="flex items-end gap-2 pl-1">
          <span className="font-display text-2xl leading-none tracking-tight text-ink md:text-3xl">8020Ride</span>
          <span className="mb-1 border border-jade bg-mint px-1.5 font-display text-lg leading-none text-jade-deep">80%</span>
        </div>
        <div className="flex" role="radiogroup" aria-label="Use 8020Ride as">
          {(
            [
              ["rider", "Ride"],
              ["driver", "Drive"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={role === id}
              onClick={() => setRole(id)}
              className={cn(
                "press h-11 border-b-2 px-3 text-base font-medium",
                role === id ? "border-jade text-ink" : "border-transparent text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {aiming && saving ? (
        <p className="pointer-events-none absolute top-36 left-1/2 z-10 max-w-xs -translate-x-1/2 border border-ink bg-paper px-3 py-2 text-center text-sm text-ink md:top-24">
          Tap the map to save {saving}
        </p>
      ) : aiming && !dropoff ? (
        <p className="pointer-events-none absolute top-36 left-1/2 z-10 max-w-xs -translate-x-1/2 border border-ink bg-paper px-3 py-2 text-center text-sm text-ink md:top-24">
          Tap the map to drop a pin
        </p>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 md:top-20 md:bottom-4 md:left-4 md:w-panel">
        <section className="pointer-events-auto max-h-sheet min-w-0 overflow-y-auto overscroll-contain border-t border-line bg-paper px-4 pt-3 pb-6 md:h-full md:max-h-none md:border">
          <div className="mx-auto mb-3 h-1 w-8 bg-ink md:hidden" />
          {role === "rider" ? <RiderPanel /> : <DriverPanel />}
        </section>
      </div>
    </main>
  );
}
