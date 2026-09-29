import { BadgePercent, ChevronLeft, Clock } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import {
  TIERS,
  earningsStats,
  formatMiles,
  formatMinutes,
  initials,
  money,
  walletBalance,
} from "@/lib/rove/model";
import { useRove } from "@/lib/rove/store";
import { IconButton, PrimaryButton, SoftButton } from "./Bits";
import { RateList, TripList } from "./RiderPanel";

type Screen = "dash" | "rates" | "trips";

export function DriverPanel() {
  const phase = useRove((s) => s.driverPhase);
  const job = useRove((s) => s.driverJob);
  const history = useRove((s) => s.history);
  const goOnline = useRove((s) => s.goOnline);
  const goOffline = useRove((s) => s.goOffline);
  const acceptOffer = useRove((s) => s.acceptOffer);
  const passOffer = useRove((s) => s.passOffer);
  const releaseJob = useRove((s) => s.releaseJob);
  const arrivePickup = useRove((s) => s.arrivePickup);
  const startDriverTrip = useRove((s) => s.startDriverTrip);
  const completeDriver = useRove((s) => s.completeDriver);
  const finishDriver = useRove((s) => s.finishDriver);
  const cashed = useRove((s) => s.cashed);
  const [screen, setScreen] = useState<Screen>("dash");
  const [Chart, setChart] = useState<ComponentType<{
    data: { key: string; label: string; kept: number }[];
  }> | null>(null);

  useEffect(() => {
    let alive = true;
    void import("./WeekChart").then((mod) => {
      if (alive) setChart(() => mod.WeekChart);
    });
    return () => {
      alive = false;
    };
  }, []);

  const stats = earningsStats(history);
  const balance = walletBalance(history, cashed);
  const onTrip = phase === "toPickup" || phase === "atPickup" || phase === "toDropoff" || phase === "paid" || phase === "offer";

  if (screen === "rates" && !onTrip) {
    return (
      <div className="screen-in space-y-4">
        <button type="button" onClick={() => setScreen("dash")} className="press -ml-2 inline-flex h-11 items-center gap-1 pl-2 text-sm font-medium">
          <ChevronLeft className="size-5" />
          Back
        </button>
        <h2 className="font-display text-3xl">Fares</h2>
        <p className="text-muted">
          Price is a base plus miles. It locks when the rider requests. Demand does not change it, and minutes in traffic are free.
        </p>
        <RateList />
      </div>
    );
  }

  if (screen === "trips" && !onTrip) {
    return (
      <div className="screen-in space-y-3">
        <button type="button" onClick={() => setScreen("dash")} className="press -ml-2 inline-flex h-11 items-center gap-1 pl-2 text-sm font-medium">
          <ChevronLeft className="size-5" />
          Back
        </button>
        <h2 className="font-display text-3xl">Trips</h2>
        <TripList />
      </div>
    );
  }

  if (phase === "offer" && job) {
    return (
      <div className="screen-in space-y-4" aria-live="polite">
        <div className="h-1 overflow-hidden rounded-sm bg-linen" aria-hidden="true">
          {job.linkedTripId ? null : <div className="rove-timer h-full bg-jade" />}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-jade-deep">
            {job.linkedTripId ? "Your request" : `New ride · ${TIERS[job.tier].name}`}
          </p>
          {job.linkedTripId ? null : <OfferClock expiresAt={job.expiresAt} />}
        </div>
        <div>
          <p className="font-display text-5xl tabular-nums">{money(job.driver)}</p>
          <p className="text-sm text-muted">
            {money(job.total)} fare · {formatMiles(job.miles)} · about {formatMinutes(job.minutes)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-sm bg-mint font-medium text-jade-deep">
            {initials(job.rider.name)}
          </span>
          <span>
            <span className="block font-medium">{job.rider.name}</span>
            <span className="block text-sm text-muted">Rider rating {job.rider.rating.toFixed(2)}</span>
          </span>
        </div>
        <p className="text-sm">
          <span className="font-medium">{job.pickup.name}</span>
          <span className="text-muted"> to </span>
          <span className="font-medium">{job.dropoff.name}</span>
        </p>
        <p className="text-sm text-muted">
          Unpaid to pickup: {formatMiles(job.approach.miles)} · {formatMinutes(job.approach.minutes)}. The fare starts when the rider is in the car.
        </p>
        <PrimaryButton onClick={acceptOffer}>Accept · {money(job.driver)}</PrimaryButton>
        <SoftButton onClick={passOffer}>Pass</SoftButton>
        <button type="button" onClick={goOffline} className="press h-11 w-full text-sm font-medium text-muted">
          Go offline
        </button>
      </div>
    );
  }

  if (phase === "toPickup" && job) {
    return (
      <TripStage
        kicker="Heading to pickup"
        title={job.pickup.name}
        body={`${job.rider.name} is waiting. The fare is ${money(job.total)}.`}
        action="I've arrived"
        onAction={arrivePickup}
        secondary="Cancel"
        onSecondary={releaseJob}
      />
    );
  }

  if (phase === "atPickup" && job) {
    return (
      <TripStage
        kicker="Rider is here"
        title={`Start to ${job.dropoff.name}`}
        body={`${formatMiles(job.miles)} · about ${formatMinutes(job.minutes)}. The fare is already locked.`}
        action="Start trip"
        onAction={startDriverTrip}
        secondary="Cancel"
        onSecondary={releaseJob}
      />
    );
  }

  if (phase === "toDropoff" && job) {
    return (
      <TripStage
        kicker="On trip"
        title={job.dropoff.name}
        body="Traffic does not change the fare. The rider already agreed to it."
        action={`Complete · ${money(job.driver)}`}
        onAction={completeDriver}
      />
    );
  }

  if (phase === "paid" && job) {
    return (
      <div className="screen-in space-y-4">
        <p className="text-sm font-medium text-jade-deep">Paid to you</p>
        <h2 className="font-display text-5xl tabular-nums">{money(job.driver)}</h2>
        <p className="text-sm text-muted">
          {job.pickup.name} to {job.dropoff.name}.
        </p>
        <PrimaryButton onClick={finishDriver}>Find another ride</PrimaryButton>
        <SoftButton onClick={goOffline}>Go offline</SoftButton>
      </div>
    );
  }

  const online = phase !== "offline";

  return (
    <div className="screen-in space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-3xl">{online ? "You\u2019re online" : "Drive with 8020Ride"}</h2>
        </div>
        <div className="flex">
          <IconButton label="Fares" onClick={() => setScreen("rates")}>
            <BadgePercent className="size-5" />
          </IconButton>
          <IconButton label="Trips" onClick={() => setScreen("trips")}>
            <Clock className="size-5" />
          </IconButton>
        </div>
      </div>

      {online ? (
        <div className="flex items-center gap-3 rounded-sm bg-mint px-4 py-3 text-jade-deep">
          <span className="relative grid size-3 place-items-center">
            <span className="rove-ping absolute inline-flex size-3 rounded-sm bg-jade opacity-70" />
            <span className="relative size-2.5 rounded-sm bg-jade" />
          </span>
          <p className="text-sm font-medium">Online on this device. No requests come in from other phones yet.</p>
        </div>
      ) : null}

      <div className="border border-ink bg-paper px-4 py-4">
        <p className="text-sm text-muted">Recorded on this device</p>
        <p className="font-display text-5xl leading-none text-jade tabular-nums">{money(balance.available)}</p>
        <p className="mt-2 text-sm text-muted">
          This is not a bank balance. 8020Ride does not pay out.
          {balance.cashed > 0 ? ` Earlier figures marked paid on this device: ${money(balance.cashed)}.` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Today" value={money(stats.todayKept)} />
        <Stat label="This week" value={money(stats.week)} detail={`${stats.weekRides} rides`} />
      </div>
      {Chart ? <Chart data={stats.series} /> : <div className="h-32" />}
      <p className="text-sm text-muted">
        Lifetime kept {money(stats.lifetime)} across {stats.lifetimeRides} drives.
      </p>
      {online ? (
        <SoftButton onClick={goOffline}>Go offline</SoftButton>
      ) : (
        <PrimaryButton onClick={goOnline}>Go online</PrimaryButton>
      )}
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-sm bg-linen px-3 py-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display text-2xl tabular-nums">{value}</p>
      {detail ? <p className="text-xs text-muted">{detail}</p> : null}
    </div>
  );
}

function TripStage({
  kicker,
  title,
  body,
  action,
  onAction,
  secondary,
  onSecondary,
}: {
  kicker: string;
  title: string;
  body: string;
  action: string;
  onAction: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="screen-in space-y-4">
      <p className="text-sm font-medium text-jade-deep">{kicker}</p>
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="text-muted">{body}</p>
      <PrimaryButton onClick={onAction}>{action}</PrimaryButton>
      {secondary && onSecondary ? <SoftButton onClick={onSecondary}>{secondary}</SoftButton> : null}
    </div>
  );
}

function OfferClock({ expiresAt }: { expiresAt: number }) {
  const [left, setLeft] = useState(() => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    }, 250);
    return () => window.clearInterval(id);
  }, [expiresAt]);
  return <span className="tabular-nums text-sm text-muted">{left}s</span>;
}
