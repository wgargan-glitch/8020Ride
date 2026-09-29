import { create } from "zustand";
import {
  DRIVERS,
  HOME_PIN,
  TIERS,
  YOU,
  hashString,
  inValley,
  milesBetween,
  motionMs,
  quoteFare,
  type DriverPersona,
  type Leg,
  type Pin,
  type Receipt,
  type RiderPersona,
  type RouteInfo,
  type TierId,
  SEED_HISTORY,
} from "@/lib/rove/model";

export type RiderPhase = "plan" | "matching" | "pickup" | "riding" | "receipt";
export type DriverPhase =
  | "offline"
  | "idle"
  | "offer"
  | "toPickup"
  | "atPickup"
  | "toDropoff"
  | "paid";

export type Aim = "pickup" | "drop";

export type RiderTrip = {
  id: string;
  pickup: Pin;
  dropoff: Pin;
  tier: TierId;
  miles: number;
  minutes: number;
  geometry: { lat: number; lng: number }[];
  total: number;
  driver: number;
  platform: number;
  driverPersona: DriverPersona;
  approachMin: number;
  linked: boolean;
  selfDrive: boolean;
};

export type DriverJob = {
  id: string;
  rider: RiderPersona;
  pickup: Pin;
  dropoff: Pin;
  tier: TierId;
  miles: number;
  minutes: number;
  geometry: { lat: number; lng: number }[];
  total: number;
  driver: number;
  platform: number;
  approach: RouteInfo;
  expiresAt: number;
  linkedTripId: string | null;
};

type RoveState = {
  role: "rider" | "driver";
  aim: Aim;
  pickup: Pin;
  dropoff: Pin | null;
  tier: TierId;
  route: RouteInfo | null;
  routing: boolean;
  riderPhase: RiderPhase;
  riderTrip: RiderTrip | null;
  freshId: string | null;
  driverPhase: DriverPhase;
  driverJob: DriverJob | null;
  leg: Leg | null;
  history: Receipt[];
  home: Pin | null;
  work: Pin | null;
  saving: "home" | "work" | null;
  cashed: number;
  setRole: (role: "rider" | "driver") => void;
  setAim: (aim: Aim) => void;
  setPickup: (pin: Pin) => void;
  setDropoff: (pin: Pin | null) => void;
  setTier: (tier: TierId) => void;
  setRoute: (route: RouteInfo | null, routing: boolean) => void;
  requestRide: () => void;
  driveThisRide: () => void;
  arriveMatch: (approach: RouteInfo) => void;
  beginRide: () => void;
  completeRider: () => void;
  cancelRider: () => void;
  finishRider: () => void;
  rateRide: (id: string, stars: number) => void;
  goOnline: () => void;
  goOffline: () => void;
  presentOffer: (job: DriverJob) => void;
  passOffer: () => void;
  releaseJob: () => void;
  acceptOffer: () => void;
  arrivePickup: () => void;
  startDriverTrip: () => void;
  completeDriver: () => void;
  finishDriver: () => void;
  setPlace: (slot: "home" | "work", pin: Pin | null) => void;
  setSaving: (slot: "home" | "work" | null) => void;
  cashOut: () => void;
  hydrateLedger: (
    partial: Partial<Pick<RoveState, "role" | "pickup" | "dropoff" | "tier" | "history" | "home" | "work" | "cashed">>,
  ) => void;
};

function rideDuration(miles: number): number {
  return motionMs(Math.min(14000, Math.max(7000, miles * 2600)));
}

function approachDuration(miles: number): number {
  return motionMs(Math.min(9000, Math.max(4500, miles * 7000)));
}

export const useRove = create<RoveState>((set, get) => ({
  role: "rider",
  aim: "drop",
  pickup: HOME_PIN,
  dropoff: null,
  tier: "go",
  route: null,
  routing: false,
  riderPhase: "plan",
  riderTrip: null,
  freshId: null,
  driverPhase: "offline",
  driverJob: null,
  leg: null,
  history: SEED_HISTORY,
  home: null,
  work: null,
  saving: null,
  cashed: 0,

  setRole: (role) => set({ role }),
  setAim: (aim) => set({ aim }),
  setPickup: (pin) => set({ pickup: pin }),
  setDropoff: (pin) => set({ dropoff: pin, route: pin ? get().route : null }),
  setTier: (tier) => set({ tier }),
  setRoute: (route, routing) => set({ route, routing }),

  requestRide: () => {
    const { dropoff, pickup, tier, route, riderPhase } = get();
    if (!dropoff || !route || riderPhase !== "plan") return;
    if (milesBetween(pickup, dropoff) < 0.08) return;
    if (!inValley(pickup.lat, pickup.lng) || !inValley(dropoff.lat, dropoff.lng)) return;
    const id = crypto.randomUUID();
    const price = quoteFare(route.miles, TIERS[tier]);
    const driverPersona = DRIVERS[hashString(id) % DRIVERS.length] ?? DRIVERS[0];
    set({
      riderPhase: "matching",
      freshId: null,
      leg: null,
      riderTrip: {
        id,
        pickup,
        dropoff,
        tier,
        miles: route.miles,
        minutes: route.minutes,
        geometry: route.geometry,
        driverPersona,
        approachMin: 4,
        linked: true,
        selfDrive: false,
        ...price,
      },
    });
  },

  driveThisRide: () => {
    const trip = get().riderTrip;
    if (!trip?.linked || get().riderPhase !== "matching") return;
    set({ role: "driver", driverPhase: "idle", driverJob: null, leg: null });
  },

  arriveMatch: (approach) => {
    const trip = get().riderTrip;
    if (!trip || trip.selfDrive || get().riderPhase !== "matching") return;
    if (get().role === "driver" && trip.linked) return;
    if (get().driverJob?.linkedTripId === trip.id) return;
    set({
      riderPhase: "pickup",
      riderTrip: {
        ...trip,
        approachMin: Math.max(1, Math.round(approach.minutes)),
      },
      leg: {
        id: `${trip.id}:approach`,
        path: approach.geometry,
        durationMs: approachDuration(approach.miles),
        startedAt: performance.now(),
      },
    });
  },

  beginRide: () => {
    const trip = get().riderTrip;
    const phase = get().riderPhase;
    if (!trip || trip.selfDrive || phase === "riding" || phase === "receipt" || phase === "plan") return;
    set({
      riderPhase: "riding",
      leg: {
        id: `${trip.id}:ride`,
        path: trip.geometry,
        durationMs: rideDuration(trip.miles),
        startedAt: performance.now(),
      },
    });
  },

  completeRider: () => {
    const trip = get().riderTrip;
    const phase = get().riderPhase;
    if (!trip || trip.selfDrive || phase === "receipt" || phase === "plan") return;
    const receipt: Receipt = {
      id: trip.id,
      at: new Date().toISOString(),
      role: "rider",
      pickupName: trip.pickup.name,
      dropoffName: trip.dropoff.name,
      tier: trip.tier,
      miles: trip.miles,
      minutes: trip.minutes,
      total: trip.total,
      driver: trip.driver,
      platform: trip.platform,
      withName: trip.driverPersona.name,
      stars: null,
      from: { lat: trip.pickup.lat, lng: trip.pickup.lng },
      to: { lat: trip.dropoff.lat, lng: trip.dropoff.lng },
    };
    set({
      riderPhase: "receipt",
      leg: null,
      freshId: trip.id,
      history: [receipt, ...get().history].slice(0, 60),
    });
  },

  cancelRider: () => {
    const phase = get().riderPhase;
    if (phase === "riding" || phase === "receipt") return;
    const trip = get().riderTrip;
    const job = get().driverJob;
    const linked = Boolean(job && trip && job.linkedTripId === trip.id);
    set({
      riderPhase: "plan",
      riderTrip: null,
      leg: null,
      ...(linked
        ? {
            driverJob: null,
            driverPhase: get().driverPhase === "offline" ? ("offline" as const) : ("idle" as const),
          }
        : {}),
    });
  },

  finishRider: () => {
    set({ riderPhase: "plan", riderTrip: null, leg: null, dropoff: null, route: null });
  },

  rateRide: (id, stars) => {
    set({
      history: get().history.map((ride) => (ride.id === id ? { ...ride, stars } : ride)),
    });
  },

  goOnline: () => set({ driverPhase: "idle", driverJob: null, leg: null }),
  goOffline: () => set({ driverPhase: "offline", driverJob: null, leg: null }),

  presentOffer: (job) => {
    if (get().driverPhase !== "idle" || get().role !== "driver") return;
    if (job.linkedTripId) {
      const trip = get().riderTrip;
      if (!trip || trip.id !== job.linkedTripId || trip.selfDrive || get().riderPhase !== "matching") return;
    }
    set({ driverPhase: "offer", driverJob: job, leg: null });
  },

  passOffer: () => {
    if (get().driverPhase !== "offer") return;
    const job = get().driverJob;
    const trip = get().riderTrip;
    const declineOwn = Boolean(job?.linkedTripId && trip && trip.id === job.linkedTripId && !trip.selfDrive);
    set({
      driverPhase: "idle",
      driverJob: null,
      leg: null,
      ...(declineOwn && trip ? { riderTrip: { ...trip, linked: false } } : {}),
    });
  },

  releaseJob: () => {
    const phase = get().driverPhase;
    if (phase !== "toPickup" && phase !== "atPickup" && phase !== "offer") return;
    const job = get().driverJob;
    const trip = get().riderTrip;
    const relink = Boolean(job?.linkedTripId && trip && trip.id === job.linkedTripId);
    set({
      driverPhase: "idle",
      driverJob: null,
      leg: null,
      ...(relink && trip
        ? {
            riderPhase: "matching" as const,
            riderTrip: { ...trip, selfDrive: false, linked: true },
          }
        : {}),
    });
  },

  acceptOffer: () => {
    const job = get().driverJob;
    if (!job || get().driverPhase !== "offer") return;
    const leg: Leg = {
      id: `${job.id}:pickup`,
      path: job.approach.geometry,
      durationMs: approachDuration(job.approach.miles),
      startedAt: performance.now(),
    };
    const trip = get().riderTrip;
    if (job.linkedTripId && trip && trip.id === job.linkedTripId) {
      set({
        driverPhase: "toPickup",
        leg,
        riderPhase: "pickup",
        riderTrip: {
          ...trip,
          selfDrive: true,
          linked: false,
          approachMin: Math.max(1, Math.round(job.approach.minutes)),
          driverPersona: YOU,
        },
      });
      return;
    }
    set({ driverPhase: "toPickup", leg });
  },

  arrivePickup: () => {
    if (get().driverPhase !== "toPickup") return;
    set({ driverPhase: "atPickup", leg: null });
  },

  startDriverTrip: () => {
    const job = get().driverJob;
    if (!job || (get().driverPhase !== "atPickup" && get().driverPhase !== "toPickup")) return;
    set({
      driverPhase: "toDropoff",
      leg: {
        id: `${job.id}:drop`,
        path: job.geometry,
        durationMs: rideDuration(job.miles),
        startedAt: performance.now(),
      },
      ...(get().riderTrip?.selfDrive ? { riderPhase: "riding" as const } : {}),
    });
  },

  completeDriver: () => {
    const job = get().driverJob;
    const phase = get().driverPhase;
    if (!job || phase === "paid" || phase === "offline" || phase === "idle" || phase === "offer") return;
    const receipt: Receipt = {
      id: `${job.id}:drv`,
      at: new Date().toISOString(),
      role: "driver",
      pickupName: job.pickup.name,
      dropoffName: job.dropoff.name,
      tier: job.tier,
      miles: job.miles,
      minutes: job.minutes,
      total: job.total,
      driver: job.driver,
      platform: job.platform,
      withName: job.rider.name,
      stars: null,
      from: { lat: job.pickup.lat, lng: job.pickup.lng },
      to: { lat: job.dropoff.lat, lng: job.dropoff.lng },
    };
    const trip = get().riderTrip;
    const tookOwn = Boolean(trip?.selfDrive && job.linkedTripId === trip.id);
    let history = [receipt, ...get().history];
    if (tookOwn && trip && !history.some((ride) => ride.id === trip.id)) {
      const paid: Receipt = {
        id: trip.id,
        at: receipt.at,
        role: "rider",
        pickupName: trip.pickup.name,
        dropoffName: trip.dropoff.name,
        tier: trip.tier,
        miles: trip.miles,
        minutes: trip.minutes,
        total: trip.total,
        driver: trip.driver,
        platform: trip.platform,
        withName: "You",
        stars: null,
        from: { lat: trip.pickup.lat, lng: trip.pickup.lng },
        to: { lat: trip.dropoff.lat, lng: trip.dropoff.lng },
      };
      history = [paid, ...history];
    }
    set({
      driverPhase: "paid",
      leg: null,
      freshId: tookOwn && trip ? trip.id : job.id,
      history: history.slice(0, 60),
      ...(tookOwn ? { riderPhase: "receipt" as const } : {}),
    });
  },

  finishDriver: () => set({ driverPhase: "idle", driverJob: null, leg: null }),

  setPlace: (slot, pin) => set(slot === "home" ? { home: pin } : { work: pin }),
  setSaving: (saving) => set({ saving }),

  cashOut: () => {
    const kept = get().history.reduce((sum, ride) => (ride.role === "driver" ? sum + ride.driver : sum), 0);
    set({ cashed: Math.round(kept * 100) / 100 });
  },

  hydrateLedger: (partial) => set(partial),
}));
