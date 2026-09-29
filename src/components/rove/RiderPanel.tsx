import { BadgePercent, ChevronLeft, Clock, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  SUGGESTED_IDS,
  TIERS,
  TIER_ORDER,
  formatMiles,
  formatMinutes,
  formatWhen,
  geocodePlaces,
  initials,
  inValley,
  money,
  pinFromReceipt,
  quoteFare,
  searchPlaces,
  tooClose,
  PLACES,
  type Pin,
  type Receipt,
} from "@/lib/rove/model";
import { useRove } from "@/lib/rove/store";
import { FareLines, IconButton, PrimaryButton, SoftButton, Stars, TierMark } from "./Bits";

type Screen = "home" | "search" | "quote" | "rates" | "trips";

function Back({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="press -ml-2 inline-flex h-11 items-center gap-1 rounded-sm pr-3 pl-2 text-sm font-medium text-ink">
      <ChevronLeft className="size-5" />
      {label}
    </button>
  );
}

function PlaceButton({ place, onPick }: { place: Pin; onPick: (place: Pin) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(place)}
      className="flex min-h-11 w-full items-center gap-3 rounded-sm px-2 py-2 text-left hover:bg-linen"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-linen text-jade-deep">
        <span className="size-2.5 rounded-sm bg-jade" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{place.name}</span>
        <span className="block truncate text-sm text-muted">{place.area}</span>
      </span>
    </button>
  );
}

export function RiderPanel() {
  const pickup = useRove((s) => s.pickup);
  const dropoff = useRove((s) => s.dropoff);
  const aim = useRove((s) => s.aim);
  const tier = useRove((s) => s.tier);
  const route = useRove((s) => s.route);
  const routing = useRove((s) => s.routing);
  const phase = useRove((s) => s.riderPhase);
  const trip = useRove((s) => s.riderTrip);
  const history = useRove((s) => s.history);
  const setAim = useRove((s) => s.setAim);
  const setPickup = useRove((s) => s.setPickup);
  const setDropoff = useRove((s) => s.setDropoff);
  const setTier = useRove((s) => s.setTier);
  const requestRide = useRove((s) => s.requestRide);
  const beginRide = useRove((s) => s.beginRide);
  const cancelRider = useRove((s) => s.cancelRider);
  const finishRider = useRove((s) => s.finishRider);
  const completeRider = useRove((s) => s.completeRider);
  const rateRide = useRove((s) => s.rateRide);
  const setRole = useRove((s) => s.setRole);
  const home = useRove((s) => s.home);
  const work = useRove((s) => s.work);
  const saving = useRove((s) => s.saving);
  const setPlace = useRove((s) => s.setPlace);
  const setSaving = useRove((s) => s.setSaving);

  const [screen, setScreen] = useState<Screen>("home");
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<Pin[]>([]);
  const [looking, setLooking] = useState(false);
  const dropId = dropoff?.id ?? "";
  const prevDrop = useRef(dropId);
  const prevPick = useRef(pickup.id);
  const saveBaseline = useRef("");

  useEffect(() => {
    if (dropId && dropId !== prevDrop.current && (screen === "home" || screen === "search")) {
      setScreen("quote");
    }
    prevDrop.current = dropId;
  }, [dropId, screen]);

  useEffect(() => {
    if (pickup.id !== prevPick.current && screen === "search" && aim === "pickup" && !saving) {
      setScreen(dropoff ? "quote" : "home");
      setAim("drop");
    }
    prevPick.current = pickup.id;
  }, [pickup.id, screen, aim, dropoff, setAim, saving]);

  useEffect(() => {
    if (screen !== "search") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSaving(null);
      setScreen(saving ? "home" : dropoff ? "quote" : "home");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, dropoff, saving, setSaving]);

  useEffect(() => {
    if (screen !== "search" || !saving) return;
    const id = saving === "home" ? (home?.id ?? "") : (work?.id ?? "");
    if (id && id !== saveBaseline.current) {
      setSaving(null);
      setScreen("home");
    }
  }, [screen, saving, home?.id, work?.id, setSaving]);

  useEffect(() => {
    if (screen !== "search") return;
    const q = query.trim();
    if (q.length < 3) {
      setRemote([]);
      setLooking(false);
      return;
    }
    const ctrl = new AbortController();
    const wait = window.setTimeout(() => {
      setLooking(true);
      void geocodePlaces(q, ctrl.signal)
        .then((pins) => {
          setRemote(pins);
          setLooking(false);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setRemote([]);
          setLooking(false);
        });
    }, 280);
    return () => {
      ctrl.abort();
      window.clearTimeout(wait);
    };
  }, [query, screen]);

  const results = useMemo(() => searchPlaces(query), [query]);
  const suggestions = SUGGESTED_IDS.map((id) => PLACES.find((p) => p.id === id)).filter((p): p is Pin => Boolean(p));
  const fresh = history.find((ride) => ride.id === trip?.id);
  const stars = fresh?.stars ?? 0;
  const near = dropoff ? tooClose(pickup, dropoff) : false;
  const price = route && !near ? quoteFare(route.miles, TIERS[tier]) : null;
  const streets = remote.filter(
    (place) => !results.some((local) => Math.abs(local.lat - place.lat) < 0.002 && Math.abs(local.lng - place.lng) < 0.002),
  );
  const outside = Boolean(dropoff && (!inValley(pickup.lat, pickup.lng) || !inValley(dropoff.lat, dropoff.lng)));

  function openSearch(which: "pickup" | "drop") {
    setSaving(null);
    setAim(which);
    setQuery("");
    setScreen("search");
  }

  function closeSearch() {
    const wasSaving = Boolean(saving);
    setSaving(null);
    setScreen(wasSaving ? "home" : dropoff ? "quote" : "home");
  }

  function openSave(slot: "home" | "work") {
    saveBaseline.current = slot === "home" ? (home?.id ?? "") : (work?.id ?? "");
    setSaving(slot);
    setAim("drop");
    setQuery("");
    setScreen("search");
  }

  function choose(place: Pin) {
    if (saving) {
      setPlace(saving, place);
      setSaving(null);
      setScreen("home");
      return;
    }
    if (aim === "pickup") {
      setPickup(place);
      setAim("drop");
      setScreen(dropoff && place.id !== dropoff.id ? "quote" : "home");
      return;
    }
    setDropoff(place);
    setScreen("quote");
  }

  function bookRide(ride: Parameters<typeof pinFromReceipt>[0]) {
    const from = pinFromReceipt(ride, "from");
    const to = pinFromReceipt(ride, "to");
    if (!from || !to) return;
    setPickup(from);
    setAim("drop");
    setDropoff(to);
    setScreen("quote");
  }

  if (phase !== "plan" && trip) {
    return (
      <div className="screen-in" aria-live="polite">
        {phase === "matching" ? (
          <div className="space-y-4">
            <h2 className="font-display text-3xl text-ink">Fare locked</h2>
            <p className="text-muted">
              No driver is assigned. This release does not send a car and does not charge you. The request stays on this device until you cancel it.
            </p>
            <div className="rounded-sm bg-linen px-4 py-4">
              <p className="text-sm text-muted">{TIERS[trip.tier].name}</p>
              <p className="font-display text-4xl tabular-nums">{money(trip.total)}</p>
            </div>
            <SoftButton onClick={cancelRider}>Cancel request</SoftButton>
          </div>
        ) : null}

        {phase === "pickup" && trip.selfDrive ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-jade-deep">You took this ride</p>
            <h2 className="font-display text-3xl">Finish it in Drive</h2>
            <p className="text-muted">
              Head to {trip.pickup.name}, then to {trip.dropoff.name}. The fare is {money(trip.total)}.
            </p>
            <PrimaryButton onClick={() => setRole("driver")}>Open Drive</PrimaryButton>
          </div>
        ) : null}

        {phase === "pickup" && !trip.selfDrive ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-jade-deep">On the way</p>
            <h2 className="font-display text-3xl">{trip.driverPersona.name}</h2>
            <DriverCard tripName={trip.driverPersona.name} car={`${trip.driverPersona.color} ${trip.driverPersona.car}`} plate={trip.driverPersona.plate} rating={trip.driverPersona.rating} />
            <p className="text-sm text-muted">
              About {trip.approachMin} min to {trip.pickup.name}. Fare stays {money(trip.total)}.
            </p>
            <PrimaryButton onClick={beginRide}>I'm in the car</PrimaryButton>
            <SoftButton onClick={cancelRider}>Cancel · no fee</SoftButton>
          </div>
        ) : null}

        {phase === "riding" && trip.selfDrive ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-jade-deep">You're on the trip</p>
            <h2 className="font-display text-3xl">To {trip.dropoff.name}</h2>
            <p className="text-muted">Complete it from Drive. The fare stays {money(trip.total)}.</p>
            <PrimaryButton onClick={() => setRole("driver")}>Open Drive</PrimaryButton>
          </div>
        ) : null}

        {phase === "riding" && !trip.selfDrive ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-jade-deep">Flat fare locked</p>
            <h2 className="font-display text-3xl">Heading to {trip.dropoff.name}</h2>
            <p className="text-muted">
              {formatMiles(trip.miles)} · about {formatMinutes(trip.minutes)}. Traffic does not add a cent.
            </p>
            <div className="rounded-sm bg-mint px-4 py-4">
              <p className="font-display text-4xl tabular-nums text-jade-deep">{money(trip.total)}</p>
            </div>
            <SoftButton onClick={completeRider}>End ride</SoftButton>
          </div>
        ) : null}

        {phase === "receipt" ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-jade-deep">Ride complete</p>
            <h2 className="font-display text-3xl">
              {trip.selfDrive ? `You kept ${money(trip.driver)}` : `You paid ${money(trip.total)}`}
            </h2>
            <p className="text-sm text-muted">
              {trip.pickup.name} to {trip.dropoff.name}
            </p>
            {fresh ? <FareLines ride={fresh} emphasis="paid" /> : null}
            <div>
              <p className="mb-1 text-sm font-medium">
                {trip.selfDrive ? "How was the trip?" : `Rate ${trip.driverPersona.name}`}
              </p>
              <Stars value={stars} onChange={(n) => rateRide(trip.id, n)} />
            </div>
            <PrimaryButton onClick={finishRider}>Done</PrimaryButton>
          </div>
        ) : null}
      </div>
    );
  }

  if (screen === "rates") {
    return (
      <div className="screen-in space-y-4">
        <Back label="Back" onClick={() => setScreen(dropoff ? "quote" : "home")} />
        <h2 className="font-display text-3xl">The fare is the fare</h2>
        <p className="text-muted">
          Price is a base plus miles. It locks when you request. Demand never changes it, and minutes stuck in traffic are free.
        </p>
        <RateList />
        <p className="text-sm text-muted">Cancel any time before the trip starts. No fee.</p>
      </div>
    );
  }

  if (screen === "trips") {
    return (
      <div className="screen-in space-y-3">
        <Back label="Back" onClick={() => setScreen("home")} />
        <h2 className="font-display text-3xl">Trips</h2>
        <TripList onBook={(ride) => bookRide(ride)} />
      </div>
    );
  }

  if (screen === "search") {
    const listed = [...results, ...streets];
    return (
      <div className="screen-in space-y-3">
        <Back label={saving === "home" ? "Save home" : saving === "work" ? "Save work" : aim === "pickup" ? "Pickup" : "Where to"} onClick={closeSearch} />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && listed[0]) choose(listed[0]);
          }}
          placeholder={saving ? "Search a saved place" : aim === "pickup" ? "Search pickup" : "Search a destination"}
          aria-label={saving ? "Search a saved place" : aim === "pickup" ? "Search pickup" : "Search destination"}
          className="h-12 w-full rounded-sm bg-linen px-4 text-base text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-jade"
        />
        <p className="text-sm text-muted">
          {saving ? "Or tap the map. We’ll name the pin." : "Places in town, plus any street in the valley. Or tap the map."}
        </p>
        <div className="space-y-1">
          {results.length === 0 && streets.length === 0 && !looking ? (
            <p className="py-6 text-sm text-muted">
              {query.trim().length >= 3
                ? "Nothing in the Porterville valley under that name. Drop a pin on the map."
                : "Type at least 3 letters, or pick a place below."}
            </p>
          ) : null}
          {results.map((place) => (
            <PlaceButton key={place.id} place={place} onPick={choose} />
          ))}
          {streets.length > 0 ? <p className="px-2 pt-2 text-xs font-medium text-muted">Streets</p> : null}
          {streets.map((place) => (
            <PlaceButton key={place.id} place={place} onPick={choose} />
          ))}
          {looking ? <p className="px-2 py-2 text-sm text-muted">Checking streets…</p> : null}
        </div>
      </div>
    );
  }

  if (screen === "quote" && dropoff) {
    const ready = Boolean(price && route && !near && !outside && !routing);
    return (
      <div className="screen-in flex min-h-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <Back label="Trip" onClick={() => { setDropoff(null); setScreen("home"); }} />
          <IconButton label="How fares work" onClick={() => setScreen("rates")}>
            <BadgePercent className="size-5" />
          </IconButton>
        </div>
        <div className="space-y-2">
          <Endpoint label="Pickup" name={pickup.name} detail={pickup.area} onClick={() => openSearch("pickup")} />
          <Endpoint label="Dropoff" name={dropoff.name} detail={dropoff.area} jade onClick={() => openSearch("drop")} />
        </div>
        {near ? (
          <p className="text-sm text-muted">That stop is the same as pickup. Choose another place.</p>
        ) : outside ? (
          <p className="text-sm text-muted">8020Ride quotes Porterville and the valley — Visalia, Tulare, Lindsay, Exeter, and the foothills. This pin is outside that area.</p>
        ) : routing || !price || !route ? (
          <p className="text-sm text-muted">Locking a flat fare…</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              {formatMiles(route.miles)} · about {formatMinutes(route.minutes)}
              {route.estimated ? " · straight-line estimate" : ""} · the price will not change
            </p>
            <div className="space-y-2">
              {TIER_ORDER.map((id) => {
                const option = quoteFare(route.miles, TIERS[id]);
                const selected = tier === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTier(id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-sm border px-3 py-2 text-left",
                      selected ? "border-jade bg-mint" : "border-line bg-paper hover:bg-linen",
                    )}
                  >
                    <span>
                      <span className="block font-medium">{TIERS[id].name}</span>
                      <span className="block text-sm text-muted">
                        {TIERS[id].blurb} · {TIERS[id].seats} seats
                      </span>
                    </span>
                    <span className="font-display text-2xl tabular-nums">{money(option.total)}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button type="button" className="press h-10 flex-1 rounded-sm bg-linen px-3 text-sm font-medium" onClick={() => setPlace("home", home?.id === pickup.id ? null : pickup)}>
                {home?.id === pickup.id ? "Clear home" : "Save pickup as home"}
              </button>
              <button type="button" className="press h-10 flex-1 rounded-sm bg-linen px-3 text-sm font-medium" onClick={() => setPlace("work", work?.id === dropoff.id ? null : dropoff)}>
                {work?.id === dropoff.id ? "Clear work" : "Save stop as work"}
              </button>
            </div>
          </>
        )}
        {ready && price ? (
          <div className="sticky bottom-0 mt-auto -mx-4 border-t border-line bg-paper px-4 py-3">
            <PrimaryButton onClick={requestRide}>
              Lock {TIERS[tier].name} · {money(price.total)}
            </PrimaryButton>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="screen-in space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-3xl">Where to?</h2>
          <p className="text-sm text-muted">Porterville and the valley. A locked price. No car is sent yet.</p>
        </div>
        <div className="flex">
          <IconButton label="How fares work" onClick={() => setScreen("rates")}>
            <BadgePercent className="size-5" />
          </IconButton>
          <IconButton label="Your trips" onClick={() => setScreen("trips")}>
            <Clock className="size-5" />
          </IconButton>
        </div>
      </div>
      <Endpoint label="Pickup" name={pickup.name} detail={pickup.area} onClick={() => openSearch("pickup")} />
      <div className="grid grid-cols-2 gap-2">
        <div className="flex min-h-11 items-stretch rounded-sm bg-linen">
          <button
            type="button"
            onClick={() => {
              if (!home) {
                openSave("home");
                return;
              }
              if (tooClose(pickup, home)) return;
              setAim("drop");
              setDropoff(home);
              setScreen("quote");
            }}
            className="press min-w-0 flex-1 px-3 py-2 text-left"
          >
            <span className="block text-xs text-muted">{!home ? "Set home" : tooClose(pickup, home) ? "You're here" : "Home"}</span>
            <span className="block truncate text-sm font-medium">{home ? home.name : "Pick a place"}</span>
          </button>
          {home ? (
            <button type="button" aria-label="Edit home" onClick={() => openSave("home")} className="press px-3 text-xs font-medium text-jade-deep">
              Edit
            </button>
          ) : null}
        </div>
        <div className="flex min-h-11 items-stretch rounded-sm bg-linen">
          <button
            type="button"
            onClick={() => {
              if (!work) {
                openSave("work");
                return;
              }
              if (tooClose(pickup, work)) return;
              setAim("drop");
              setDropoff(work);
              setScreen("quote");
            }}
            className="press min-w-0 flex-1 px-3 py-2 text-left"
          >
            <span className="block text-xs text-muted">{!work ? "Set work" : tooClose(pickup, work) ? "You're here" : "Work"}</span>
            <span className="block truncate text-sm font-medium">{work ? work.name : "Pick a place"}</span>
          </button>
          {work ? (
            <button type="button" aria-label="Edit work" onClick={() => openSave("work")} className="press px-3 text-xs font-medium text-jade-deep">
              Edit
            </button>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => openSearch("drop")}
        className="flex h-12 w-full items-center rounded-sm bg-linen px-4 text-left text-muted"
      >
        Where to?
      </button>
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
        {suggestions.map((place) => (
          <button
            key={place.id}
            type="button"
            onClick={() => {
              setAim("drop");
              setDropoff(place);
              setScreen("quote");
            }}
            className="press h-10 shrink-0 rounded-sm bg-linen px-3 text-sm font-medium text-ink"
          >
            {place.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Endpoint({
  label,
  name,
  detail,
  onClick,
  jade,
}: {
  label: string;
  name: string;
  detail: string;
  onClick: () => void;
  jade?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 w-full items-center gap-3 rounded-sm bg-linen px-3 py-2 text-left">
      <span className={cn("size-2.5 shrink-0 rounded-sm", jade ? "bg-jade" : "bg-ink")} />
      <span className="min-w-0">
        <span className="block text-xs text-muted">{label}</span>
        <span className="block truncate font-medium">{name}</span>
        <span className="block truncate text-sm text-muted">{detail}</span>
      </span>
    </button>
  );
}

function DriverCard({
  tripName,
  car,
  plate,
  rating,
}: {
  tripName: string;
  car: string;
  plate: string;
  rating: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-sm bg-linen p-3">
      <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-mint font-medium text-jade-deep">
        {initials(tripName)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-sm text-muted">
          <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
          <span className="tabular-nums">{rating.toFixed(2)}</span>
        </span>
        <span className="block truncate text-sm">{car}</span>
      </span>
      <span className="border border-ink bg-paper px-2 py-1 font-display tracking-wide text-ink">{plate}</span>
    </div>
  );
}

export function RateList() {
  return (
    <div className="space-y-3">
      {TIER_ORDER.map((id) => {
        const tier = TIERS[id];
        return (
          <div key={id} className="rounded-sm border border-line px-3 py-3">
            <div className="flex items-baseline justify-between">
              <p className="font-medium">{tier.name}</p>
              <p className="text-sm text-muted">{tier.blurb} · {tier.seats} seats</p>
            </div>
            <p className="mt-1 text-sm text-muted">
              {money(tier.base)} to start · {money(tier.perMile)} per mile · {money(tier.minimum)} minimum
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function TripList({ onBook }: { onBook?: (ride: Receipt) => void }) {
  const history = useRove((s) => s.history);
  const rateRide = useRove((s) => s.rateRide);
  if (history.length === 0) {
    return <p className="text-sm text-muted">No trips yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {history.map((ride) => {
        const canBook = Boolean(onBook && pinFromReceipt(ride, "from") && pinFromReceipt(ride, "to"));
        return (
        <li key={ride.id} className="rounded-sm bg-linen px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {ride.pickupName} → {ride.dropoffName}
              </p>
              <p className="text-sm text-muted">
                {formatWhen(ride.at)} · {ride.role === "driver" ? "You drove" : "You rode"} · {ride.withName}
              </p>
            </div>
            <div className="text-right">
              <p className="tabular-nums font-medium">
                {ride.role === "driver" ? money(ride.driver) : money(ride.total)}
              </p>
              <TierMark tier={ride.tier} />
            </div>
          </div>
          {ride.stars == null && ride.role === "rider" ? (
            <Stars value={0} onChange={(n) => rateRide(ride.id, n)} />
          ) : ride.stars != null ? (
            <div className="mt-1">
              <Stars value={ride.stars} />
            </div>
          ) : null}
          {canBook ? (
            <button type="button" className="press mt-2 h-10 rounded-sm bg-paper px-3 text-sm font-medium" onClick={() => onBook?.(ride)}>
              Book again
            </button>
          ) : null}
        </li>
        );
      })}
    </ul>
  );
}
