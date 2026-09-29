import { useEffect } from "react";
import {
  RIDERS,
  TIERS,
  TIER_ORDER,
  fetchRoute,
  milesBetween,
  offsetPoint,
  quoteFare,
  PLACES,
  type TierId,
} from "@/lib/rove/model";
import { useRove, type DriverJob } from "@/lib/rove/store";

async function claimOpenRide(): Promise<DriverJob | null> {
  const trip = useRove.getState().riderTrip;
  if (!trip?.linked || trip.selfDrive || useRove.getState().riderPhase !== "matching") return null;
  const start = offsetPoint(trip.pickup, 0.55, 300);
  const approach = await fetchRoute(start, trip.pickup);
  const current = useRove.getState();
  if (current.riderPhase !== "matching" || current.riderTrip?.id !== trip.id || !current.riderTrip.linked) {
    return null;
  }
  return {
    id: trip.id,
    linkedTripId: trip.id,
    rider: { name: "You requested this", rating: 5 },
    pickup: trip.pickup,
    dropoff: trip.dropoff,
    tier: trip.tier,
    miles: trip.miles,
    minutes: trip.minutes,
    geometry: trip.geometry,
    total: trip.total,
    driver: trip.driver,
    platform: trip.platform,
    approach,
    expiresAt: Date.now() + 45_000,
  };
}

async function buildOffer(): Promise<DriverJob> {
  let pickup = PLACES[Math.floor(Math.random() * PLACES.length)] ?? PLACES[0];
  let dropoff = PLACES[Math.floor(Math.random() * PLACES.length)] ?? PLACES[1];
  for (let i = 0; i < 10 && (pickup.id === dropoff.id || milesBetween(pickup, dropoff) < 0.6); i++) {
    dropoff = PLACES[Math.floor(Math.random() * PLACES.length)] ?? dropoff;
  }
  const route = await fetchRoute(pickup, dropoff);
  const tier = TIER_ORDER[Math.floor(Math.random() * TIER_ORDER.length)] ?? "go";
  const price = quoteFare(route.miles, TIERS[tier]);
  const rider = RIDERS[Math.floor(Math.random() * RIDERS.length)] ?? RIDERS[0];
  const start = offsetPoint(pickup, 0.45 + Math.random() * 0.7, Math.random() * 360);
  const approach = await fetchRoute(start, pickup);
  const id = crypto.randomUUID();
  return {
    id,
    rider,
    pickup,
    dropoff,
    tier: tier as TierId,
    miles: route.miles,
    minutes: route.minutes,
    geometry: route.geometry,
    approach,
    expiresAt: Date.now() + 20_000,
    linkedTripId: null,
    ...price,
  };
}

export function RiderSim() {
  const riderPhase = useRove((s) => s.riderPhase);
  const tripId = useRove((s) => s.riderTrip?.id ?? "");
  const linked = useRove((s) => s.riderTrip?.linked ?? false);
  const selfDrive = useRove((s) => s.riderTrip?.selfDrive ?? false);
  const legId = useRove((s) => s.leg?.id ?? "");

  useEffect(() => {
    if (riderPhase !== "matching" || !tripId || selfDrive) return;
    const trip = useRove.getState().riderTrip;
    if (!trip) return;
    let cancel = false;
    const wait = window.setTimeout(() => {
      void (async () => {
        const start = offsetPoint(trip.pickup, 0.7, 308);
        const approach = await fetchRoute(start, trip.pickup);
        if (cancel) return;
        const state = useRove.getState();
        if (state.role === "driver" && state.riderTrip?.linked) return;
        state.arriveMatch(approach);
      })();
    }, linked ? 9000 : 1100);
    return () => {
      cancel = true;
      window.clearTimeout(wait);
    };
  }, [riderPhase, tripId, linked, selfDrive]);

  useEffect(() => {
    if (riderPhase !== "pickup" || !legId || selfDrive) return;
    const leg = useRove.getState().leg;
    if (!leg) return;
    const wait = window.setTimeout(() => {
      useRove.getState().beginRide();
    }, leg.durationMs + 600);
    return () => window.clearTimeout(wait);
  }, [riderPhase, legId, selfDrive]);

  useEffect(() => {
    if (riderPhase !== "riding" || !legId || selfDrive) return;
    const leg = useRove.getState().leg;
    if (!leg) return;
    const wait = window.setTimeout(() => {
      useRove.getState().completeRider();
    }, leg.durationMs + 280);
    return () => window.clearTimeout(wait);
  }, [riderPhase, legId, selfDrive]);

  return null;
}

export function DriverSim() {
  const role = useRove((s) => s.role);
  const phase = useRove((s) => s.driverPhase);
  const jobId = useRove((s) => s.driverJob?.id ?? "");

  useEffect(() => {
    if (role !== "driver" || phase !== "idle") return;
    let cancel = false;
    const wait = window.setTimeout(() => {
      void (async () => {
        const own = await claimOpenRide();
        if (cancel) return;
        if (own) {
          useRove.getState().presentOffer(own);
          return;
        }
        const offer = await buildOffer();
        if (cancel) return;
        useRove.getState().presentOffer(offer);
      })();
    }, 900);
    return () => {
      cancel = true;
      window.clearTimeout(wait);
    };
  }, [role, phase, jobId]);

  useEffect(() => {
    if (phase !== "offer") return;
    const job = useRove.getState().driverJob;
    if (!job || job.linkedTripId) return;
    const delay = Math.max(0, job.expiresAt - Date.now());
    const wait = window.setTimeout(() => useRove.getState().passOffer(), delay);
    return () => window.clearTimeout(wait);
  }, [phase, jobId]);

  return null;
}
